"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { AppData, BackgroundId } from "@/lib/types";
import { DEFAULT_DATA, loadData, saveData, newEntry, newLog, newPractice, todayISO } from "@/lib/store";

interface StoreValue {
  data: AppData;
  ready: boolean;
  addEntry: (prompt: string, text: string, emotion: string | null) => void;
  addLog: (fields: { animo?: number; energia?: number; foco?: number; moment?: number }) => void;
  addPractice: (fields: { type: "reframe"; thought: string; lens: string; reframe: string }) => void;
  setTodayMood: (animo: number) => void;
  toggleHabit: (index: number) => void;
  setBackground: (bg: BackgroundId, customBg?: string) => void;
  setName: (name: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [ready, setReady] = useState(false);

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

  return (
    <StoreContext.Provider
      value={{ data, ready, addEntry, addLog, addPractice, setTodayMood, toggleHabit, setBackground, setName }}
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
