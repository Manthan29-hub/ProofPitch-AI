import dns from "node:dns/promises";
import net from "node:net"; import http from "node:http"; import https from "node:https";

export type DnsRecord = { address: string; family: number };
export type DnsLookup = (hostname: string, options: { all: true }) => Promise<DnsRecord[]>;
export type SecurityEvidence = { rule: "scheme" | "credentials" | "hostname" | "ip" | "dns" | "redirect" | "timeout" | "content-type" | "status" | "size" | "connection"; value: string; url: string };
export class UnsafeUrlError extends Error { readonly evidence: SecurityEvidence; constructor(message: string, evidence: SecurityEvidence) { super(message); this.name = "UnsafeUrlError"; this.evidence = evidence; } }
const safeValue = (value: string) => value.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 180);
const evidence = (rule: SecurityEvidence["rule"], value: string, url: URL): SecurityEvidence => ({ rule, value: safeValue(value), url: `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}` });
export function isPrivateIp(ip: string): boolean {
  const normalized = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (net.isIPv4(normalized)) { const [a, b, c] = normalized.split(".").map(Number); return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 0 && c === 0) || (a === 192 && b === 0 && (c === 0 || c === 2)) || (a === 192 && b === 88 && c === 99) || (a === 192 && b === 168) || (a === 198 && b >= 18 && b <= 19) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113) || a >= 224; }
  if (net.isIPv6(normalized)) { if (normalized.startsWith("::ffff:")) { const tail = normalized.slice(7); if (net.isIPv4(tail)) return isPrivateIp(tail); const mapped = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(tail); if (mapped) { const a = parseInt(mapped[1], 16), b = parseInt(mapped[2], 16); return isPrivateIp(`${a >> 8}.${a & 255}.${b >> 8}.${b & 255}`); } } const halves = normalized.split("::"), left = halves[0] ? halves[0].split(":") : [], right = halves[1] ? halves[1].split(":") : [], groups = [...left, ...Array(8 - left.length - right.length).fill("0"), ...right]; if ((groups[0] === "2001" && groups[1] === "db8") || (groups[0] === "64" && groups[1] === "ff9b") || (groups[0] === "100" && groups.slice(1, 4).every(group => group === "0"))) return true; return normalized === "::" || normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb") || normalized.startsWith("fec") || normalized.startsWith("fed") || normalized.startsWith("fee") || normalized.startsWith("fef") || normalized.startsWith("ff"); }
  return true;
}
const defaultLookup: DnsLookup = (hostname, options) => dns.lookup(hostname, options);
async function resolvePublicUrl(input: string, options: { lookup?: DnsLookup } = {}): Promise<{ url: URL; records: DnsRecord[] }> {
  let url: URL; try { url = new URL(input); } catch { throw new UnsafeUrlError("A valid URL is required", { rule: "hostname", value: "invalid URL", url: "about:blank" }); }
  const base = evidence("scheme", input, url);
  if (!["http:", "https:"].includes(url.protocol)) throw new UnsafeUrlError("Only public HTTP(S) URLs are allowed", { ...base, rule: "scheme", value: url.protocol });
  if (url.username || url.password) throw new UnsafeUrlError("URL credentials are not allowed", { ...base, rule: "credentials", value: "credentials present" });
  const host = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host === "metadata.google.internal" || (net.isIP(host) !== 0 && isPrivateIp(host))) throw new UnsafeUrlError("Private or local hosts are not allowed", { ...base, rule: "hostname", value: host || "missing hostname" });
  try { const records = await (options.lookup ?? defaultLookup)(host, { all: true }); if (!records.length || records.some(r => isPrivateIp(r.address))) throw new UnsafeUrlError("URL resolves to a private or local address", { ...base, rule: "ip", value: records.map(r => r.address).join(", ") || "no addresses" }); return { url, records }; }
  catch (error) { if (error instanceof UnsafeUrlError) throw error; throw new UnsafeUrlError("Host could not be resolved", { ...base, rule: "dns", value: "resolution failed" }); }
}
export async function validatePublicUrl(input: string, options: { lookup?: DnsLookup } = {}): Promise<URL> { return (await resolvePublicUrl(input, options)).url; }

export function pinnedRequest(url: URL, record: DnsRecord, signal: AbortSignal, maxBytes: number): Promise<Response> {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request({ hostname: url.hostname, port: url.port || undefined, path: `${url.pathname}${url.search}`, method: "GET", headers: { accept: "text/html,application/xhtml+xml" }, servername: url.hostname, lookup: (_hostname, lookupOptions, callback) => { if (lookupOptions && lookupOptions.all) return callback(null, [{ address: record.address, family: record.family }]); callback(null, record.address, record.family); } }, response => {
      const declared = Number(response.headers["content-length"] ?? 0); if (declared > maxBytes) { response.resume(); request.destroy(new Error("Response exceeded size limit")); return; }
      const chunks: Buffer[] = []; let size = 0; response.on("data", chunk => { size += Buffer.byteLength(chunk); if (size > maxBytes) { response.destroy(new Error("Response exceeded size limit")); request.destroy(); return; } chunks.push(Buffer.from(chunk)); }); response.on("end", () => resolve(new Response(Buffer.concat(chunks), { status: response.statusCode ?? 0, headers: response.headers as Record<string, string> }))); response.on("error", reject);
    });
    const abort = () => request.destroy(new Error("Audit request timed out"));
    if (signal.aborted) return abort(); signal.addEventListener("abort", abort, { once: true }); request.on("error", reject); request.end();
  });
}
export async function safeFetch(input: string, options: { timeoutMs?: number; maxBytes?: number; fetchImpl?: typeof fetch; lookup?: DnsLookup } = {}) {
  const maxBytes = options.maxBytes ?? 1_000_000; const deadline = Date.now() + (options.timeoutMs ?? 8000); const resolveBeforeDeadline = async (value: string) => { let timer: ReturnType<typeof setTimeout> | undefined; try { return await Promise.race([resolvePublicUrl(value, { lookup: options.lookup }), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Audit request timed out")), Math.max(1, deadline - Date.now())); })]); } finally { if (timer) clearTimeout(timer); } }; let resolved = await resolveBeforeDeadline(input); let url = resolved.url;
  for (let redirects = 0; redirects <= 3; redirects++) {
    const remaining = Math.max(1, deadline - Date.now()), controller = new AbortController(), timer = setTimeout(() => controller.abort(), remaining);
    try { const response = options.fetchImpl ? await options.fetchImpl(url, { redirect: "manual", signal: controller.signal, headers: { accept: "text/html,application/xhtml+xml" } }) : await pinnedRequest(url, resolved.records[0], controller.signal, maxBytes);
      if ([301, 302, 303, 307, 308].includes(response.status)) { const location = response.headers.get("location"); if (!location) throw new Error("Redirect has no destination"); resolved = await resolveBeforeDeadline(new URL(location, url).toString()); url = resolved.url; continue; }
      if (response.status < 200 || response.status >= 300) throw new Error(`Audit target returned HTTP ${response.status}`);
      const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase(); if (!contentType || !["text/html", "application/xhtml+xml"].includes(contentType)) throw new Error("Audit target did not return HTML");
      const declared = Number(response.headers.get("content-length") ?? 0); if (declared > maxBytes) throw new Error("Response exceeded size limit");
      const reader = response.body?.getReader(); if (!reader) { const body = await response.text(); if (Buffer.byteLength(body) > maxBytes) throw new Error("Response exceeded size limit"); return { url, status: response.status, body }; }
      const chunks: Uint8Array[] = []; let size = 0; while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new Error("Response exceeded size limit"); } chunks.push(part.value); } return { url, status: response.status, body: new TextDecoder().decode(Buffer.concat(chunks)) };
    } catch (error) { if ((error as Error).name === "AbortError" || (error as Error).message === "Audit request timed out") throw new Error("Audit request timed out"); throw error; } finally { clearTimeout(timer); }
  }
  throw new Error("Too many redirects");
}
