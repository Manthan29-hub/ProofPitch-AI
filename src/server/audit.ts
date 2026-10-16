import { safeFetch } from "./url-security.js";
export type Recommendation = { key: string; priority: "high" | "medium" | "low"; title: string; detail: string };
export type Audit = { title: string; description: string; h1s: string[]; links: number; images: number; imagesMissingAlt: number; wordCount: number; recommendations: Recommendation[]; fetchedUrl?: string; statusCode?: number; isDemo?: boolean };
const decode = (v: string) => v.replace(/<!--([\s\S]*?)-->/g, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;|&#38;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;|&#34;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, " ").trim();
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? tag.match(new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, "i"))?.[1] ?? "";
export function parseAudit(html: string): Audit {
  const title = decode(html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] ?? "");
  const description = decode([...html.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]).map(t => ({ name: attr(t, "name"), content: attr(t, "content") })).find(x => x.name.toLowerCase() === "description")?.content ?? "");
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi)].map(m => decode(m[1]));
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]); const hasAlt = (tag: string) => /(?:^|\s)alt\s*=\s*(?:["'][^"']*["']|[^\s>]+)/i.test(tag); const words = decode(html.replace(/<(script|style|template)\b[\s\S]*?<\/\1\s*>/gi, " ")).split(/\s+/).filter(Boolean).length;
  const recommendations: Recommendation[] = [];
  if (!title) recommendations.push({ key: "missing-title", priority: "high", title: "Add a page title", detail: "Give this page a concise, search-friendly title." });
  if (!description) recommendations.push({ key: "missing-description", priority: "high", title: "Add a meta description", detail: "Summarize the page for search results and social previews." });
  if (h1s.length !== 1) recommendations.push({ key: "h1-count", priority: "medium", title: "Use one clear H1", detail: h1s.length ? "Combine or revise headings so the page has one primary heading." : "Add one primary heading describing the page." });
  if (images.some(i => !hasAlt(i))) recommendations.push({ key: "image-alt", priority: "medium", title: "Describe images with alt text", detail: "Add useful alt attributes to improve accessibility and image search." });
  if (words < 150) recommendations.push({ key: "thin-content", priority: "low", title: "Expand useful content", detail: "Add clear proof, benefits, and calls to action for visitors." });
  return { title, description, h1s, links: (html.match(/<a\b/gi) ?? []).length, images: images.length, imagesMissingAlt: images.filter(i => !hasAlt(i)).length, wordCount: words, recommendations };
}
export async function auditUrl(url: string, options?: Parameters<typeof safeFetch>[1]) { const r = await safeFetch(url, options); return { ...parseAudit(r.body), fetchedUrl: r.url.toString(), statusCode: r.status, isDemo: false }; }
export const DEMO_HTML = '<html><head><title>Demo business</title></head><body><h1>Grow your business</h1><img src="hero.jpg"><p>We help teams grow.</p></body></html>';
export function demoAudit(): Audit { return { ...parseAudit(DEMO_HTML), isDemo: true }; }
