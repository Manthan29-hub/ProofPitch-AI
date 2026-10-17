import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const value = (name: string) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const command = args[0], source = resolve(value("--source") || process.env.DATABASE_PATH || "proofpitch.sqlite"), destination = resolve(value("--destination") || "");
if (!["backup", "restore"].includes(command || "") || !destination) throw Error("Usage: db-tool backup|restore --destination <path> [--source <path>]");
mkdirSync(dirname(destination), { recursive: true });
const sourceDb = new Database(source, { readonly: true, fileMustExist: true });
try {
  await sourceDb.backup(destination);
} finally { sourceDb.close(); }
const check = new Database(destination, { readonly: true, fileMustExist: true });
try {
  const integrity = check.pragma("integrity_check", { simple: true }) as string, foreignKeys = check.prepare("PRAGMA foreign_key_check").all();
  if (integrity !== "ok" || foreignKeys.length) throw Error(`Database verification failed: integrity=${integrity}, foreignKeys=${foreignKeys.length}`);
  console.log(`${command} complete: ${destination}`);
} finally { check.close(); }
