import assert from "node:assert/strict";
import test from "node:test";
import type { IncomingMessage } from "node:http";
import http from "node:http";
import { checkOrigin, codespacesForwardedOrigin } from "../src/server/auth.js";
import { createApp } from "../src/server/app.js";
import { Store } from "../src/server/database.js";

const codespacesEnv = {
  NODE_ENV: "development",
  CODESPACES: "true",
  CODESPACE_NAME: "cautious-space-robot-r4p477xx45p4cj7r",
  GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: "app.github.dev",
  PORT: "3000",
};

const forwardedOrigin = "https://cautious-space-robot-r4p477xx45p4cj7r-3000.app.github.dev";

function request(origin: string, host = "127.0.0.1:3000") {
  return { headers: { origin, host } } as unknown as IncomingMessage;
}

test("derives the active Codespaces forwarded origin from trusted environment values", () => {
  assert.equal(codespacesForwardedOrigin(codespacesEnv), forwardedOrigin);
});

test("accepts only the exact development Codespaces origin, even with a stale APP_ORIGIN", () => {
  assert.equal(checkOrigin(request(forwardedOrigin), "https://stale-space-3000.app.github.dev", false, codespacesEnv), true);
  assert.equal(checkOrigin(request("https://attacker-3000.app.github.dev"), undefined, false, codespacesEnv), false);
});

test("does not derive Codespaces origins locally or in production", () => {
  assert.equal(codespacesForwardedOrigin({ ...codespacesEnv, CODESPACES: undefined }), undefined);
  const production = { ...codespacesEnv, NODE_ENV: "production" };
  assert.equal(codespacesForwardedOrigin(production), undefined);
  assert.equal(checkOrigin(request(forwardedOrigin), undefined, false, production), false);
});

test("rejects malformed Codespaces names, domains, and ports", () => {
  assert.equal(codespacesForwardedOrigin({ ...codespacesEnv, CODESPACE_NAME: "bad/name" }), undefined);
  assert.equal(codespacesForwardedOrigin({ ...codespacesEnv, GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: "https://app.github.dev" }), undefined);
  assert.equal(codespacesForwardedOrigin({ ...codespacesEnv, PORT: "70000" }), undefined);
});

test("the application routes use the same trusted Codespaces origin policy", async () => {
  const store = new Store();
  const server = http.createServer(createApp(store, { allowHttpBootstrap: true, originEnv: codespacesEnv }));
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw Error("server did not bind");
  const base = `http://127.0.0.1:${address.port}`;
  const headers = { "content-type": "application/json", origin: forwardedOrigin };
  try {
    const bootstrap = await fetch(base + "/api/auth/bootstrap", { method: "POST", headers, body: JSON.stringify({ email: "codespaces@example.test", displayName: "Codespaces", password: "correct horse battery" }) });
    assert.equal(bootstrap.status, 201);
    const cookie = bootstrap.headers.get("set-cookie")!.split(";", 1)[0];
    const accepted = await fetch(base + "/api/prospects", { method: "POST", headers: { ...headers, cookie }, body: JSON.stringify({ name: "Origin test", website: "https://example.com" }) });
    assert.equal(accepted.status, 201);
    const rejected = await fetch(base + "/api/prospects", { method: "POST", headers: { ...headers, origin: "https://attacker.example", cookie }, body: JSON.stringify({ name: "Should fail", website: "https://another.example" }) });
    assert.equal(rejected.status, 403);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    store.close();
  }
});
