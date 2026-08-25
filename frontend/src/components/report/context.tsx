"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { EvidenceMeta, IncidentCategory, Incident, Transaction } from "@/lib/types";

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
        ...(incident.financial_transactions?.[0] && !incident.financial_transactions[0].verifiedByCitizen
          ? { aiTransactionHints: incident.financial_transactions[0] }
          : {}),
      });
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
