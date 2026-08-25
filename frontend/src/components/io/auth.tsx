"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const TOKEN_KEY = "ncrp.hq.token";
const OFFICER_KEY = "ncrp.hq.officer";

export interface Officer {
  email: string;
  name: string;
  rank: string;
  unit: string;
}

interface HqAuthValue {
  token: string | null;
  officer: Officer | null;
  login: (token: string, officer: Officer) => void;
  logout: () => void;
}

const HqAuthContext = createContext<HqAuthValue>({ token: null, officer: null, login: () => undefined, logout: () => undefined });

export function HqAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [officer, setOfficer] = useState<Officer | null>(null);

  useEffect(() => {
    setToken(window.localStorage.getItem(TOKEN_KEY));
    try {
      const raw = window.localStorage.getItem(OFFICER_KEY);
      if (raw) setOfficer(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <HqAuthContext.Provider
      value={{
        token,
        officer,
        login: (t, o) => {
          window.localStorage.setItem(TOKEN_KEY, t);
          window.localStorage.setItem(OFFICER_KEY, JSON.stringify(o));
          setToken(t);
          setOfficer(o);
        },
        logout: () => {
          window.localStorage.removeItem(TOKEN_KEY);
          window.localStorage.removeItem(OFFICER_KEY);
          setToken(null);
          setOfficer(null);
        },
      }}
    >
      {children}
    </HqAuthContext.Provider>
  );
}

export function useHqAuth() {
  return useContext(HqAuthContext);
}
