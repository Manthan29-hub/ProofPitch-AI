import type { Audit } from "./audit.js";
import type { Prospect } from "./database.js";

export type QuotationLine = { description: string; quantity: number; unitAmountMinor: number };
export type Quotation = { currency: string; lines: QuotationLine[]; subtotalMinor: number; deliverables: string; exclusions: string; timeline: string; nextStep: string };
export type ImprovementConcept = { eyebrow: string; headline: string; summary: string; primaryCta: string; supportingPoints: string[]; conceptLabel: "LOCAL IMPROVEMENT CONCEPT"; auditId?: string; provenance: "live" | "demo" | "unknown" };
export type Proposal = { subject: string; greeting: string; painPoints: string[]; recommendations: string[]; evidence: { finding: string; source: string }[]; scope: string; nextStep: string; callToAction: string; context?: { role?: string; goal?: string }; auditId?: string; revision?: number; auditProvenance?: "live" | "demo" | "unknown"; concept?: ImprovementConcept; quotation?: Quotation };

const boundedText = (value: unknown, name: string, max: number, required = true) => { if (value == null && !required) return ""; if (typeof value !== "string" || (required && !value.trim()) || value.length > max) throw Error(`${name} must be ${required ? "1-" : "0-"}${max} characters`); return value.trim(); };
export function validateQuotation(input: unknown): Quotation {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("quotation must be an object");
  const raw = input as Record<string, unknown>, currency = boundedText(raw.currency, "currency", 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw Error("currency must be a three-letter code");
  if (!Array.isArray(raw.lines) || raw.lines.length < 1 || raw.lines.length > 10) throw Error("quotation must contain 1-10 line items");
  let subtotalMinor = 0;
  const lines = raw.lines.map((line, index) => {
    if (!line || typeof line !== "object" || Array.isArray(line)) throw Error(`line ${index + 1} is invalid`);
    const item = line as Record<string, unknown>, description = boundedText(item.description, `line ${index + 1} description`, 160), quantity = item.quantity, unitAmountMinor = item.unitAmountMinor;
    if (!Number.isSafeInteger(quantity) || (quantity as number) < 1 || (quantity as number) > 10000) throw Error(`line ${index + 1} quantity must be an integer from 1-10000`);
    if (!Number.isSafeInteger(unitAmountMinor) || (unitAmountMinor as number) < 0 || (unitAmountMinor as number) > 100_000_000) throw Error(`line ${index + 1} amount must be a non-negative integer minor-unit amount`);
    const lineTotal = (quantity as number) * (unitAmountMinor as number); if (!Number.isSafeInteger(lineTotal) || subtotalMinor + lineTotal > 1_000_000_000_000) throw Error("quotation total is outside the supported safe range"); subtotalMinor += lineTotal;
    return { description, quantity: quantity as number, unitAmountMinor: unitAmountMinor as number };
  });
  return { currency, lines, subtotalMinor, deliverables: boundedText(raw.deliverables, "deliverables", 1000), exclusions: boundedText(raw.exclusions, "exclusions", 1000, false), timeline: boundedText(raw.timeline, "timeline", 200), nextStep: boundedText(raw.nextStep, "quotation nextStep", 500) };
}

export function validateConcept(input: unknown): ImprovementConcept {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("concept must be an object");
  const raw = input as Record<string, unknown>, points = raw.supportingPoints;
  if (!Array.isArray(points) || points.length < 1 || points.length > 6) throw Error("concept must contain 1-6 supporting points");
  return { eyebrow: boundedText(raw.eyebrow, "concept eyebrow", 120), headline: boundedText(raw.headline, "concept headline", 240), summary: boundedText(raw.summary, "concept summary", 600), primaryCta: boundedText(raw.primaryCta, "concept CTA", 120), supportingPoints: points.map((point, index) => boundedText(point, `concept point ${index + 1}`, 240)), conceptLabel: "LOCAL IMPROVEMENT CONCEPT", auditId: typeof raw.auditId === "string" ? raw.auditId.slice(0, 80) : undefined, provenance: raw.provenance === "live" ? "live" : raw.provenance === "demo" ? "demo" : "unknown" };
}

export function generateImprovementConcept(a: Audit & { id?: string }): ImprovementConcept {
  const missingDescription = a.recommendations.some(item => item.key === "missing-description");
  const first = a.recommendations[0]?.title || "Clarify the primary visitor action";
  return { eyebrow: "A clearer first impression", headline: a.title ? `Make ${a.title} easier to understand` : "Make the first impression easier to understand", summary: "A local, editable landing-page concept that pairs a clear value statement with a focused service summary and one primary action.", primaryCta: "Review the opportunity", supportingPoints: [first, missingDescription ? "Add a concise search and social summary" : "Keep the strongest observed message prominent", "Keep the concept bounded to one hero section"], conceptLabel: "LOCAL IMPROVEMENT CONCEPT", auditId: a.id, provenance: a.isDemo ? "demo" : "live" };
}

export function generateProposal(p: Prospect, a: Audit & { id?: string; fetchedUrl?: string }, options: { quotation?: Quotation; concept?: ImprovementConcept } = {}): Proposal {
  const role = a.role ? ` for the ${a.role}` : "", goal = a.goal ? ` focused on ${a.goal.toLowerCase()}` : "";
  const result: Proposal = { subject: `A few ideas for ${p.name}`, greeting: `Hi ${p.name},`, painPoints: a.recommendations.slice(0, 3).map(x => x.title), recommendations: a.recommendations.map(x => x.detail), evidence: a.recommendations.slice(0, 3).map(x => ({ finding: x.title, source: a.fetchedUrl || p.website })), scope: "A bounded review of the observed page signals listed above; no website changes are included.", nextStep: "Review the findings together and agree on which improvements belong in a follow-up scope.", callToAction: `Would you be open to a 15-minute call${role}${goal} to review these opportunities?`, auditId: a.id, auditProvenance: a.isDemo ? "demo" : "live", concept: options.concept || generateImprovementConcept(a) };
  if (options.quotation) result.quotation = options.quotation;
  if (a.role || a.goal) result.context = { role: a.role, goal: a.goal };
  return result;
}
