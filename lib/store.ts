import type { AppData, JournalEntry, StateLog, PracticeLog, Decision, Capacity } from "./types";
import { HABIT_LABELS } from "./types";

const KEY = "reflejo:v1";

export const DEFAULT_DATA: AppData = {
  version: 1,
  entries: [],
  logs: [],
  practices: [],
  decisions: [],
  habits: {},
  settings: { name: "", background: "cafe", habitLabels: [...HABIT_LABELS] },
};

export function normalize(parsed: Partial<AppData>): AppData {
  const settings = { ...DEFAULT_DATA.settings, ...(parsed.settings ?? {}) };
  if (!Array.isArray(settings.habitLabels) || settings.habitLabels.length !== 4) {
    settings.habitLabels = [...HABIT_LABELS];
  }
  return {
    ...DEFAULT_DATA,
    ...parsed,
    version: 1,
    settings,
    entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    practices: Array.isArray(parsed.practices) ? parsed.practices : [],
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    habits: parsed.habits && typeof parsed.habits === "object" ? parsed.habits : {},
  };
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function todayISO(d: Date = new Date()): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDays(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return todayISO(d);
}

export function loadData(): AppData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_DATA;
    return normalize(JSON.parse(raw) as Partial<AppData>);
  } catch {
    return DEFAULT_DATA;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* almacenamiento no disponible (modo privado, cuota); la app sigue en memoria */
  }
}

/** Días consecutivos con actividad (diario o estado), contando hasta hoy o ayer. */
export function computeStreak(data: AppData): number {
  const active = new Set<string>();
  for (const e of data.entries) active.add(e.date);
  for (const l of data.logs) active.add(l.date);
  for (const p of data.practices) active.add(p.date);
  for (const d of data.decisions) {
    active.add(d.date);
    if (d.reviewedAt) active.add(todayISO(new Date(d.reviewedAt)));
  }
  const today = todayISO();
  let cursor = active.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (active.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export interface DayPoint {
  date: string;
  animo: number | null;
  energia: number | null;
  foco: number | null;
}

/** Media por día de los últimos `days` días para el gráfico semanal. */
export function recentSeries(data: AppData, days = 7): DayPoint[] {
  const today = todayISO();
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const dayLogs = data.logs.filter((l) => l.date === date);
    out.push({
      date,
      animo: avg(dayLogs.map((l) => l.animo)),
      energia: avg(dayLogs.map((l) => l.energia)),
      foco: avg(dayLogs.map((l) => l.foco)),
    });
  }
  return out;
}

function avg(xs: Array<number | undefined>): number | null {
  const vals = xs.filter((x): x is number => typeof x === "number");
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function sortByNewest<T extends { createdAt: number }>(xs: T[]): T[] {
  return [...xs].sort((a, b) => b.createdAt - a.createdAt);
}

export function newEntry(prompt: string, text: string, emotion: string | null): JournalEntry {
  return { id: uid(), date: todayISO(), prompt, text, emotion, createdAt: Date.now() };
}

export function newLog(fields: Partial<StateLog>): StateLog {
  return { id: uid(), date: todayISO(), createdAt: Date.now(), ...fields };
}

export function newPractice(fields: { exercise: string; capacity: Capacity; title: string; fields: Record<string, string> }): PracticeLog {
  return { id: uid(), date: todayISO(), createdAt: Date.now(), ...fields };
}

export function isoInDays(days: number): string {
  return addDays(todayISO(), days);
}

export function daysSince(iso: string): number {
  const then = new Date(iso + "T00:00:00").getTime();
  const now = new Date(todayISO() + "T00:00:00").getTime();
  return Math.max(0, Math.round((now - then) / 86400000));
}

export function newDecision(fields: { title: string; confidence: number; reviewInDays: number }): Decision {
  return {
    id: uid(),
    date: todayISO(),
    title: fields.title,
    confidence: fields.confidence,
    reviewInDays: fields.reviewInDays,
    reviewAt: isoInDays(fields.reviewInDays),
    outcome: null,
    learning: "",
    reviewedAt: null,
    createdAt: Date.now(),
  };
}
