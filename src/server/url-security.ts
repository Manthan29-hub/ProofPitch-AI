import dns from "node:dns/promises";
import net from "node:net";

export class UnsafeUrlError extends Error { constructor(message: string) { super(message); this.name = "UnsafeUrlError"; } }

function privateIp(ip: string): boolean {
  const normalized = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (net.isIPv4(normalized)) { const [a, b] = normalized.split(".").map(Number); return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168); }
  if (net.isIPv6(normalized)) {
    const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+|[0-9a-f]{1,4}:[0-9a-f]{1,4})$/i);
    if (mapped) { const dotted = mapped[1].includes(".") ? mapped[1] : `${parseInt(mapped[1].split(":")[0], 16) >> 8}.${parseInt(mapped[1].split(":")[0], 16) & 255}.${parseInt(mapped[1].split(":")[1], 16) >> 8}.${parseInt(mapped[1].split(":")[1], 16) & 255}`; return privateIp(dotted); }
    return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:") || normalized.startsWith("fec0:");
  }
  return net.isIP(normalized) !== 0;
}

export async function validatePublicUrl(input: string): Promise<URL> {
  let url: URL; try { url = new URL(input); } catch { throw new UnsafeUrlError("A valid URL is required"); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || !url.hostname) throw new UnsafeUrlError("Only public HTTP(S) URLs are allowed");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host === "metadata.google.internal" || privateIp(host)) throw new UnsafeUrlError("Private or local hosts are not allowed");
  try { const records = await dns.lookup(host, { all: true }); if (!records.length || records.some(r => privateIp(r.address))) throw new UnsafeUrlError("URL resolves to a private or local address"); }
  catch (e) { if (e instanceof UnsafeUrlError) throw e; throw new UnsafeUrlError("Host could not be resolved"); }
  return url;
}

export async function safeFetch(input: string, options: { timeoutMs?: number; maxBytes?: number; fetchImpl?: typeof fetch } = {}) {
  const fetchImpl = options.fetchImpl ?? fetch, maxBytes = options.maxBytes ?? 1_000_000;
  let url = await validatePublicUrl(input);
  for (let redirects = 0; redirects <= 3; redirects++) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);
    try {
      const response = await fetchImpl(url, { redirect: "manual", signal: controller.signal, headers: { accept: "text/html,application/xhtml+xml" } });
      if ([301, 302, 303, 307, 308].includes(response.status)) { const location = response.headers.get("location"); if (!location) throw new Error("Redirect has no destination"); url = await validatePublicUrl(new URL(location, url).toString()); continue; }
      if (response.status < 200 || response.status >= 300) throw new Error(`Audit target returned HTTP ${response.status}`);
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) throw new Error("Audit target did not return HTML");
      const reader = response.body?.getReader();
      if (!reader) { const body = await response.text(); if (new TextEncoder().encode(body).byteLength > maxBytes) throw new Error("Response exceeded size limit"); return { url, status: response.status, body }; }
      const chunks: Uint8Array[] = []; let size = 0;
      while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > maxBytes) throw new Error("Response exceeded size limit"); chunks.push(part.value); }
      return { url, status: response.status, body: new TextDecoder().decode(Buffer.concat(chunks)) };
    } finally { clearTimeout(timer); }
  }
  throw new Error("Too many redirects");
}
