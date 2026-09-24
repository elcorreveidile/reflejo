"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import type { AppData, BackgroundId } from "@/lib/types";
import { DEFAULT_DATA, loadData, saveData, newEntry, newLog, newPractice, newDecision, normalize, todayISO } from "@/lib/store";

interface StoreValue {
  data: AppData;
  ready: boolean;
  addEntry: (prompt: string, text: string, emotion: string | null) => void;
  addLog: (fields: { animo?: number; energia?: number; foco?: number; moment?: number }) => void;
  addPractice: (fields: { type: "reframe"; thought: string; lens: string; reframe: string }) => void;
  addDecision: (fields: { title: string; confidence: number; reviewInDays: number }) => void;
  reviewDecision: (id: string, outcome: string, learning: string) => void;
  setTodayMood: (animo: number) => void;
  toggleHabit: (index: number) => void;
  setBackground: (bg: BackgroundId, customBg?: string) => void;
  setName: (name: string) => void;
  setHabitLabels: (labels: string[]) => void;
  importData: (parsed: Partial<AppData>) => void;
  resetData: () => void;
  email: string | null;
  syncing: boolean;
  requestLink: (email: string) => Promise<{ ok?: boolean; devLink?: string; error?: string }>;
  logout: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const lastSyncRef = useRef<string>("");

  useEffect(() => {
    setData(loadData());
    setReady(true);
  }, []);

  const mutate = useCallback((fn: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(prev);
      saveData(next);
      return next;
    });
  }, []);

  const addEntry = useCallback((prompt: string, text: string, emotion: string | null) => {
    if (!text.trim()) return;
    mutate((prev) => ({ ...prev, entries: [...prev.entries, newEntry(prompt, text.trim(), emotion)] }));
  }, [mutate]);

  const addLog = useCallback((fields: { animo?: number; energia?: number; foco?: number; moment?: number }) => {
    mutate((prev) => ({ ...prev, logs: [...prev.logs, newLog(fields)] }));
  }, [mutate]);

  const addPractice = useCallback((fields: { type: "reframe"; thought: string; lens: string; reframe: string }) => {
    mutate((prev) => ({ ...prev, practices: [...prev.practices, newPractice(fields)] }));
  }, [mutate]);

  const addDecision = useCallback((fields: { title: string; confidence: number; reviewInDays: number }) => {
    if (!fields.title.trim()) return;
    mutate((prev) => ({ ...prev, decisions: [...prev.decisions, newDecision({ ...fields, title: fields.title.trim() })] }));
  }, [mutate]);

  const reviewDecision = useCallback((id: string, outcome: string, learning: string) => {
    mutate((prev) => ({
      ...prev,
      decisions: prev.decisions.map((d) =>
        d.id === id ? { ...d, outcome, learning: learning.trim(), reviewedAt: Date.now() } : d
      ),
    }));
  }, [mutate]);

  const setTodayMood = useCallback((animo: number) => {
    mutate((prev) => {
      const today = todayISO();
      const idx = [...prev.logs].reverse().findIndex((l) => l.date === today);
      if (idx === -1) return { ...prev, logs: [...prev.logs, newLog({ animo })] };
      const realIdx = prev.logs.length - 1 - idx;
      const logs = prev.logs.slice();
      logs[realIdx] = { ...logs[realIdx], animo };
      return { ...prev, logs };
    });
  }, [mutate]);

  const toggleHabit = useCallback((index: number) => {
    mutate((prev) => {
      const today = todayISO();
      const current = prev.habits[today] ?? [false, false, false, false];
      const next = current.slice();
      next[index] = !next[index];
      return { ...prev, habits: { ...prev.habits, [today]: next } };
    });
  }, [mutate]);

  const setBackground = useCallback((bg: BackgroundId, customBg?: string) => {
    mutate((prev) => ({
      ...prev,
      settings: { ...prev.settings, background: bg, ...(customBg !== undefined ? { customBg } : {}) },
    }));
  }, [mutate]);

  const setName = useCallback((name: string) => {
    mutate((prev) => ({ ...prev, settings: { ...prev.settings, name } }));
  }, [mutate]);

  const setHabitLabels = useCallback((labels: string[]) => {
    mutate((prev) => ({ ...prev, settings: { ...prev.settings, habitLabels: labels } }));
  }, [mutate]);

  const importData = useCallback((parsed: Partial<AppData>) => {
    mutate(() => normalize(parsed));
  }, [mutate]);

  const resetData = useCallback(() => {
    mutate(() => ({ ...DEFAULT_DATA, settings: { ...DEFAULT_DATA.settings, habitLabels: [...DEFAULT_DATA.settings.habitLabels] } }));
  }, [mutate]);

  // --- Sincronización en la nube (local-first: se fusiona, nunca pisa) ---
  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: dataRef.current }),
      });
      if (res.ok) {
        const j = await res.json();
        const merged = normalize(j.data);
        lastSyncRef.current = JSON.stringify(merged);
        saveData(merged);
        setData(merged);
      }
    } catch {
      /* sin conexión: la app sigue en local */
    } finally {
      setSyncing(false);
    }
  }, []);

  const requestLink = useCallback(async (em: string) => {
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      return (await res.json()) as { ok?: boolean; devLink?: string; error?: string };
    } catch {
      return { error: "network" };
    }
  }, []);

  const logout = useCallback(async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    setEmail(null);
  }, []);

  // ¿Hay sesión?
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => setEmail(j.email ?? null))
      .catch(() => {});
  }, []);

  // Sincroniza (con rebote) cuando cambian los datos y hay sesión.
  useEffect(() => {
    if (!email || !ready) return;
    if (JSON.stringify(data) === lastSyncRef.current) return;
    const t = setTimeout(() => { syncNow(); }, 1500);
    return () => clearTimeout(t);
  }, [data, email, ready, syncNow]);

  return (
    <StoreContext.Provider
      value={{ data, ready, addEntry, addLog, addPractice, addDecision, reviewDecision, setTodayMood, toggleHabit, setBackground, setName, setHabitLabels, importData, resetData, email, syncing, requestLink, logout, syncNow }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}
