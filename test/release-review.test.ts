import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { Store } from "../src/server/database.js";
import { createApp } from "../src/server/app.js";
import { demoAudit } from "../src/server/audit.js";
import { parseCookies } from "../src/server/auth.js";
import { generateProposal, validateQuotation } from "../src/server/proposal.js";

async function withServer(fn: (base: string, store: Store, server: http.Server) => Promise<void>, options?: Parameters<typeof createApp>[1]) {
  const store = new Store();
  const server = http.createServer(createApp(store, options));
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw Error("No port");
  try { await fn("http://127.0.0.1:" + address.port, store, server); }
  finally { await new Promise<void>(resolve => server.close(() => resolve())); store.close(); }
}
async function bootstrap(base: string) {
  const response = await fetch(base + "/api/auth/bootstrap", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "owner@example.test", displayName: "Owner", password: "correct horse battery" }) });
  assert.equal(response.status, 201);
  return response.headers.get("set-cookie")!.split(";", 1)[0];
}
function post(base: string, path: string, cookie: string, body: unknown) {
  return fetch(base + path, { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify(body) });
}

test("malformed unrelated cookies cannot break a valid session cookie", () => {
  assert.equal(parseCookies("unrelated=%ZZ; proofpitch_session=valid_token").proofpitch_session, "valid_token");
});

test("only one concurrent first-owner request can claim the database", async () => withServer(async (base, store, server) => {
  let arrivals = 0;
  let release!: () => void;
  const bothArrived = new Promise<void>(resolve => { release = resolve; });
  server.on("request", req => { if (req.url === "/api/auth/bootstrap" && ++arrivals === 2) release(); });
  const requests = ["first", "second"].map(name => {
    const body = JSON.stringify({ email: name + "@example.test", displayName: name, password: "correct horse battery" });
    let request!: http.ClientRequest;
    const response = new Promise<number>((resolve, reject) => {
      request = http.request(base + "/api/auth/bootstrap", { method: "POST", headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body) } }, res => { res.resume(); res.on("end", () => resolve(res.statusCode!)); });
      request.on("error", reject); request.flushHeaders();
    });
    return { request, body, response };
  });
  await bothArrived;
  for (const entry of requests) entry.request.end(entry.body);
  assert.deepEqual((await Promise.all(requests.map(entry => entry.response))).sort(), [201, 409]);
  assert.equal(store.countUsers(), 1);
}));

test("varying account names does not bypass the login IP limit", async () => withServer(async base => {
  for (let i = 0; i < 3; i++) {
    const response = await post(base, "/api/auth/login", "", { email: "account" + i + "@example.test", password: "incorrect password" });
    await response.text();
    assert.equal(response.status, i < 2 ? 401 : 429);
  }
}, { loginRateLimit: { max: 2, windowMs: 60_000 } }));

test("proof detail remains available beyond the latest 200 proof records", () => {
  const store = new Store();
  try {
    const p = store.createProspect({ name: "Demo", website: "https://demo.proofpitch.local/" });
    store.saveAudit(p.id, p.website, demoAudit());
    const proof = store.listProofs()[0];
    store.db.prepare("UPDATE proofs SET created_at='2000-01-01T00:00:00.000Z'").run();
    for (let i = 0; i < 100; i++) store.saveAudit(p.id, p.website, demoAudit());
    assert.ok(!store.listProofs().some(item => item.id === proof.id));
    assert.equal(store.getProof(proof.id)?.id, proof.id);
    assert.equal(store.getProof(proof.id, { workspaceId: "other-workspace" }), undefined);
  } finally { store.close(); }
});

test("local meta recheck updates only its finding in the authenticated workspace", () => {
  const store = new Store();
  try {
    const p = store.createProspect({ name: "Demo", website: "https://demo.proofpitch.local/" });
    const audit = demoAudit();
    const auditId = store.saveAudit(p.id, p.website, audit);
    store.savePreviewRecheck(p.id, auditId, { recheck: true }, { workspaceId: "other-workspace" });
    assert.ok(store.listProofs().every(proof => proof.localRecheck === null));
    store.savePreviewRecheck(p.id, auditId, { recheck: true });
    const changed = store.listProofs().filter(proof => proof.localRecheck !== null);
    assert.equal(changed.length, 1);
    assert.equal(changed[0].observedFinding, audit.recommendations.find(finding => finding.key === "missing-description")!.title);
  } finally { store.close(); }
});

test("proposal GET uses the latest audit without mutating the saved revision", async () => withServer(async (base, store) => {
  const cookie = await bootstrap(base);
  const first = await (await post(base, "/api/audits", cookie, { demo: true, role: "Founder", goal: "Book a meeting" })).json() as any;
  const saved = await (await post(base, "/api/prospects/" + first.prospect.id + "/proposal", cookie, {})).json() as any;
  const second = await (await post(base, "/api/audits", cookie, { demo: true, role: "Marketing lead", goal: "Review the plan" })).json() as any;
  const response = await fetch(base + "/api/prospects/" + first.prospect.id + "/proposal", { headers: { cookie } });
  const current = await response.json() as any;
  assert.equal(current.auditId, second.audit.id);
  assert.equal(current.context.role, "Marketing lead");
  assert.equal(store.getProposal(first.prospect.id, { workspaceId: store.firstWorkspace((store.getUserByEmail("owner@example.test") as any).id)! })!.auditId, saved.auditId);
}));

test("named demo data cannot be attached to an existing real website prospect", async () => withServer(async (base, store) => {
  const cookie = await bootstrap(base);
  const user = store.getUserByEmail("owner@example.test") as any;
  const scope = { workspaceId: store.firstWorkspace(user.id)! };
  const p = store.createProspect({ name: "Real business", website: "https://example.com/" }, scope);
  const response = await post(base, "/api/prospects/" + p.id + "/audit", cookie, { demo: true });
  await response.text();
  assert.equal(response.status, 409);
  assert.equal(store.latestAudit(p.id, scope), undefined);
}));

import { WindowRateLimiter } from "../src/server/rate-limit.js";

test("rate limiter bounds active keys and reclaims expired capacity", () => {
  let now = 0;
  const limiter = new WindowRateLimiter({ max: 1, windowMs: 10 }, 2, () => now);
  assert.equal(limiter.allow("a"), true);
  assert.equal(limiter.allow("b"), true);
  assert.equal(limiter.allow("c"), false);
  assert.equal(limiter.allow("a"), false);
  now = 11;
  assert.equal(limiter.allow("c"), true);
  assert.equal(limiter.allow("a"), true);
});

test("proposal saves preserve immutable revisions and quotation arithmetic", () => {
  const store = new Store();
  try {
    const prospect = store.createProspect({ name: "Quote demo", website: "https://demo.proofpitch.local/" });
    const auditId = store.saveAudit(prospect.id, prospect.website, demoAudit());
    const quotation = validateQuotation({ currency: "USD", lines: [{ description: "Landing page concept", quantity: 2, unitAmountMinor: 12500 }], deliverables: "One concept and one review", exclusions: "Copywriting", timeline: "5 working days", nextStep: "Review scope" });
    const first = store.saveProposal(prospect.id, generateProposal(prospect, { ...demoAudit(), id: auditId }, { quotation }), undefined, auditId);
    const second = store.saveProposal(prospect.id, generateProposal(prospect, { ...demoAudit(), id: auditId }, { quotation: { ...quotation, lines: [{ ...quotation.lines[0], unitAmountMinor: 15000 }], subtotalMinor: 30000 } }), undefined, auditId);
    assert.equal(first.revision, 1);
    assert.equal(second.revision, 2);
    assert.equal(store.listProposalRevisions(prospect.id).length, 2);
    assert.equal(store.getProposalRevision(prospect.id, 1)?.proposal.quotation.lines[0].unitAmountMinor, 12500);
    assert.equal(store.getProposal(prospect.id)?.proposal.quotation.lines[0].unitAmountMinor, 15000);
  } finally { store.close(); }
});

test("quotation validation rejects unsafe values and analytics rejects unsupported ranges", () => {
  assert.throws(() => validateQuotation({ currency: "USD", lines: [{ description: "Bad", quantity: -1, unitAmountMinor: 5 }], deliverables: "x", exclusions: "", timeline: "x", nextStep: "x" }), /quantity/);
  assert.throws(() => validateQuotation({ currency: "USD", lines: [], deliverables: "x", exclusions: "", timeline: "x", nextStep: "x" }), /1-10/);
  const store = new Store(); try { assert.throws(() => store.analytics(undefined, "999"), /range/); assert.throws(() => store.analytics(undefined, "Infinity"), /range/); } finally { store.close(); }
});

test("production mode disables HTTP bootstrap and private responses are not cacheable", async () => withServer(async (base, _store, _server) => {
  const blocked = await fetch(base + "/api/auth/bootstrap", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "owner@example.test", displayName: "Owner", password: "correct horse battery" }) });
  assert.equal(blocked.status, 403);
  const status = await fetch(base + "/api/auth/bootstrap/status");
  assert.equal((await status.json() as any).operatorProvisioningRequired, true);
}, { allowHttpBootstrap: false }));

test("unexpected store failures return a generic 500", async () => withServer(async (base, store) => {
  const cookie = await bootstrap(base);
  store.db.close();
  const response = await fetch(base + "/api/prospects", { headers: { cookie } });
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Internal server error" });
}));
