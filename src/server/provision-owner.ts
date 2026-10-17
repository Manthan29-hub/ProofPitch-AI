import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Store } from "./database.js";
import { hashPassword, validatePassword } from "./auth.js";

async function promptSecret(label: string) {
  if (!input.isTTY || !input.setRawMode) return process.env.PROOFPITCH_BOOTSTRAP_PASSWORD || "";
  output.write(label);
  input.setRawMode(true);
  let value = "";
  for await (const chunk of input) { const text = String(chunk); if (text.includes("\u0003")) process.exit(130); for (const char of text) { if (char === "\r" || char === "\n") { input.setRawMode(false); output.write("\n"); return value; } if (char === "\u007f") value = value.slice(0, -1); else value += char; } }
  input.setRawMode(false); return value;
}

const rl = createInterface({ input, output });
try {
  const databasePath = process.env.DATABASE_PATH || "proofpitch.sqlite";
  mkdirSync(dirname(databasePath), { recursive: true });
  const store = new Store(databasePath);
  try {
    if (store.countUsers() > 0) throw Error("Owner provisioning is already complete");
    if (store.legacyDataPresent()) throw Error("Legacy records require an explicit operator migration before provisioning");
    const email = (process.env.PROOFPITCH_BOOTSTRAP_EMAIL || await rl.question("Owner email: ")).trim();
    const displayName = (process.env.PROOFPITCH_BOOTSTRAP_NAME || await rl.question("Owner name: ")).trim();
    const password = validatePassword(await promptSecret("Owner password: "));
    const credentials = hashPassword(password);
    const created = store.bootstrapOwner({ email, displayName, passwordHash: credentials.hash, passwordSalt: credentials.salt });
    output.write(`Provisioned ${created.user.email} for workspace ${created.workspaceId}.\n`);
  } finally { store.close(); }
} finally { rl.close(); }
