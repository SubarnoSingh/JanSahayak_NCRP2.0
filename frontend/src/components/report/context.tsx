"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { EvidenceMeta, IncidentCategory, Incident, Transaction, EvidenceExtraction } from "@/lib/types";

export interface ComplaintState {
  incidentId: string | null;
  narrative: string;
  language: string;
  category: IncidentCategory | null;
  categorySource: string | null;
  categoryConfidence: number | null;
  transaction: {
    utr: string;
    amount: string;
    timestamp: string;
    senderBank: string;
    beneficiaryVpa: string;
  };
  aiTransactionHints: Partial<Transaction> | null;
  suspectIdentifiers: { type: string; value: string; context?: string }[];
  evidence: EvidenceMeta[];
  evidenceExtractions: EvidenceExtraction[];
  extractedFields: Partial<Record<string, { value: string; source: string }>>;
  anonymousMode: boolean;
  contact: { fullName: string; phone: string; email: string; state: string; district: string };
  readinessScore: number;
  readinessBreakdown: { field: string; label: string; present: boolean }[];
  signed: boolean;
  acknowledgementNumber: string | null;
  goldenHourActive: boolean;
}

const initialState: ComplaintState = {
  incidentId: null,
  narrative: "",
  language: "en",
  category: null,
  categorySource: null,
  categoryConfidence: null,
  transaction: { utr: "", amount: "", timestamp: "", senderBank: "", beneficiaryVpa: "" },
  aiTransactionHints: null,
  suspectIdentifiers: [],
  evidence: [],
  evidenceExtractions: [],
  extractedFields: {},
  anonymousMode: false,
  contact: { fullName: "", phone: "", email: "", state: "", district: "" },
  readinessScore: 0,
  readinessBreakdown: [],
  signed: false,
  acknowledgementNumber: null,
  goldenHourActive: false,
};

interface ComplaintContextValue extends ComplaintState {
  update: (patch: Partial<ComplaintState>) => void;
  applyIncident: (incident: Incident) => void;
  reset: () => void;
}

const ComplaintContext = createContext<ComplaintContextValue>({
  ...initialState,
  update: () => undefined,
  applyIncident: () => undefined,
  reset: () => undefined,
});

const STORAGE_KEY = "ncrp.complaint.draft";

export function ComplaintProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ComplaintState>(initialState);

  // Restore draft after refresh (mid-demo resilience)
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved) setState((prev) => ({ ...prev, ...JSON.parse(saved) }));
    } catch {
      /* ignore */
    }
  }, []);

  const update = useCallback((patch: Partial<ComplaintState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const applyIncident = useCallback(
    (incident: Incident) => {
      const txn = incident.financial_transactions?.[0];
      if (process.env.NODE_ENV !== "production") {
        console.log("[pipeline:4] applyIncident — first txn:", JSON.stringify(txn));
      }
      update({
        incidentId: incident.id,
        narrative: incident.narrative_raw ?? "",
        category: incident.incident_category,
        categorySource: incident.categorySource ?? null,
        categoryConfidence: incident.categoryConfidence ?? null,
        readinessScore: incident.statutory_readiness_score,
        readinessBreakdown: incident.readiness_breakdown,
        evidence: incident.evidence,
        anonymousMode: incident.anonymousMode,
        ...(txn && !txn.verifiedByCitizen && txn.source !== "citizen"
          ? { aiTransactionHints: txn }
          : {}),
        ...(txn
          ? {
              transaction: {
                utr: txn.utr ?? "",
                amount: txn.amount != null ? String(txn.amount) : "",
                timestamp: txn.timestamp ?? "",
                senderBank: txn.senderBank ?? "",
                beneficiaryVpa: txn.beneficiaryVpa ?? "",
              },
            }
          : {}),
        ...(incident.citizenContact
          ? {
              contact: {
                fullName: incident.citizenContact.fullName ?? "",
                phone: incident.citizenContact.phone ?? "",
                email: incident.citizenContact.email ?? "",
                state: incident.citizenContact.state ?? "",
                district: incident.citizenContact.district ?? "",
              },
            }
          : {}),
      });
      // Rebuild evidence extractions from stored aiExtraction data
      if (incident.evidence?.length) {
        const extractions: EvidenceExtraction[] = incident.evidence
          .filter((e) => e.hasAiExtraction)
          .map((e) => ({
            evidenceId: e.evidenceId,
            originalName: e.originalName,
          }));
        if (extractions.length) update({ evidenceExtractions: extractions });
      }
    },
    [update]
  );

  const reset = useCallback(() => {
    setState(initialState);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem("ncrp.launcher.text");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ ...state, update, applyIncident, reset }), [state, update, applyIncident, reset]);
  return <ComplaintContext.Provider value={value}>{children}</ComplaintContext.Provider>;
}

export function useComplaint() {
  return useContext(ComplaintContext);
}
