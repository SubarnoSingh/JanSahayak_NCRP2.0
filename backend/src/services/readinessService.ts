import type { IncidentCategory } from "../models/Incident";

export interface ReadinessField {
  field: string;
  label: string;
  present: boolean;
}

export interface ReadinessResult {
  score: number;
  breakdown: ReadinessField[];
}

/**
 * Statutory readiness — how complete the complaint is for legal processing.
 * Presented to citizens as friendly "Complaint readiness", never as a threat.
 */
export function computeReadiness(input: {
  category: IncidentCategory;
  narrative: string;
  categoryConfirmedByCitizen: boolean;
  transactionDetails?: { utr?: string; amount?: number; timestamp?: string } | null;
  suspectIdentifiers?: { type: string }[];
  evidenceCount: number;
  hasContact: boolean;
}): ReadinessResult {
  const breakdown: ReadinessField[] = [];
  const financial = input.category === "financial_fraud";
  const harassment = input.category === "harassment_extortion" || input.category === "women_child_safety";

  breakdown.push({ field: "narrative", label: "Incident description", present: input.narrative.trim().length >= 30 });
  breakdown.push({
    field: "category",
    label: input.categoryConfirmedByCitizen ? "Incident type confirmed" : "Incident type identified",
    present: Boolean(input.category),
  });

  if (financial && input.transactionDetails) {
    breakdown.push({ field: "txn_amount", label: "Transaction amount", present: Boolean(input.transactionDetails.amount) });
    breakdown.push({ field: "txn_utr", label: "Transaction reference (UTR)", present: Boolean(input.transactionDetails.utr) });
    breakdown.push({ field: "txn_time", label: "Transaction timestamp", present: Boolean(input.transactionDetails.timestamp) });
  }
  if (harassment) {
    breakdown.push({
      field: "suspects",
      label: "Suspect identifier (number / handle / link)",
      present: (input.suspectIdentifiers?.length ?? 0) > 0,
    });
  }
  if (!financial && !harassment) {
    breakdown.push({
      field: "suspects",
      label: "Suspect / source identifier",
      present: (input.suspectIdentifiers?.length ?? 0) > 0,
    });
  }

  breakdown.push({ field: "evidence", label: "Evidence attached", present: input.evidenceCount > 0 });
  breakdown.push({ field: "contact", label: "Contact details or anonymous mode", present: input.hasContact });

  const weights: Record<string, number> = {
    narrative: 24,
    category: 8,
    txn_amount: 12,
    txn_utr: 12,
    txn_time: 6,
    suspects: 22,
    evidence: 22,
    contact: 16,
  };
  let earned = 0;
  let possible = 0;
  for (const f of breakdown) {
    const w = weights[f.field] ?? 10;
    possible += w;
    if (f.present) earned += w;
  }
  return { score: Math.round((earned / possible) * 100), breakdown };
}
