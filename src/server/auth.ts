import { createHash, randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import type http from "node:http";
import { sha256, type Session, type Store, type User, type WorkspaceRole } from "./database.js";

export const SESSION_COOKIE = "proofpitch_session";
const SESSION_DAYS = 7;
const passwordHash = (password: string, salt: string) => scryptSync(password, salt, 64).toString("hex");
export const validatePassword = (password: unknown) => { if (typeof password !== "string" || password.length < 10 || password.length > 200) throw Error("Password must be 10-200 characters"); return password; };
export const hashPassword = (password: string, salt = randomBytes(16).toString("hex")) => ({ salt, hash: passwordHash(validatePassword(password), salt) });
export const verifyPassword = (password: string, hash: string, salt: string) => { const actual = Buffer.from(passwordHash(password, salt), "hex"), expected = Buffer.from(hash, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); };
const passwordHashAsync = (password: string, salt: string) => new Promise<string>((resolve, reject) => scrypt(password, salt, 64, (error, derived) => error ? reject(error) : resolve(derived.toString("hex"))));
export const hashPasswordAsync = async (password: string, salt = randomBytes(16).toString("hex")) => ({ salt, hash: await passwordHashAsync(validatePassword(password), salt) });
export const verifyPasswordAsync = async (password: string, hash: string, salt: string) => { const actual = Buffer.from(await passwordHashAsync(validatePassword(password), salt), "hex"), expected = Buffer.from(hash, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); };
export const newSessionToken = () => randomBytes(32).toString("base64url");
export const parseCookies = (header: string | undefined): Record<string, string> => {
  const cookies: Record<string, string> = Object.create(null);
  for (const entry of (header || "").split(";")) {
    const separator = entry.indexOf("=");
    if (separator < 1) continue;
    const name = entry.slice(0, separator).trim();
    if (Object.hasOwn(cookies, name)) continue;
    try { cookies[name] = decodeURIComponent(entry.slice(separator + 1).trim()); } catch { /* Ignore a malformed cookie instead of breaking every authenticated endpoint. */ }
  }
  return cookies;
};
export const sessionCookie = (token: string, secure: boolean) => `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure ? "; Secure" : ""}`;
export const clearSessionCookie = (secure: boolean) => `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
export type AuthContext = { session: Session; user: User; workspaceId: string; role: WorkspaceRole };

export function resolveAuth(store: Store, req: http.IncomingMessage): AuthContext | undefined {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE]; if (!token) return undefined;
  const session = store.getSession(sha256(token)); if (!session) return undefined;
  const user = store.getUser(session.userId), membership = user && store.membership(user.id, session.workspaceId); if (!user || user.disabled || !membership) return undefined;
  return { session, user, workspaceId: session.workspaceId, role: membership.role };
}

export function codespacesForwardedOrigin(env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (env.NODE_ENV === "production" || env.CODESPACES !== "true") return undefined;
  const name = env.CODESPACE_NAME;
  const domain = env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  const port = Number(env.PORT ?? "3000");
  const validLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  if (
    !name ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(name) ||
    !domain ||
    domain.length > 253 ||
    !domain.split(".").every((label) => validLabel.test(label)) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) return undefined;

  const host = `${name}-${port}.${domain}`;
  if (host.length > 253) return undefined;
  return `https://${host}`;
}

export function checkOrigin(
  req: http.IncomingMessage,
  configuredOrigin?: string,
  required = false,
  env: NodeJS.ProcessEnv = process.env,
) {
  const origin = req.headers.origin;
  if (!origin) return !required;
  try {
    const parsed = new URL(origin);
    const candidates = configuredOrigin
      ? [configuredOrigin]
      : [`http://${req.headers.host || "localhost"}`];
    const forwardedOrigin = codespacesForwardedOrigin(env);
    if (forwardedOrigin) candidates.push(forwardedOrigin);
    return candidates.some((candidate) => {
      try {
        return new URL(candidate).origin === parsed.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}
export function secureCookies() { return process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true"; }
