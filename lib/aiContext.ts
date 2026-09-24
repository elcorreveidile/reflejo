import type { AppData } from "./types";
import { computeStreak } from "./store";

function avg(xs: Array<number | undefined>): number | null {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export interface AiContext {
  entries: Array<{ date: string; prompt: string; text: string; emotion: string | null }>;
  moodAvg: number | null;
  energiaAvg: number | null;
  focoAvg: number | null;
  practices: number;
  decisions: number;
  streak: number;
  period?: string;
}

/** Construye el contexto del diario que se manda a la IA. `sinceDays` acota la ventana. */
export function buildAiContext(data: AppData, opts: { sinceDays?: number; maxEntries?: number; period?: string } = {}): AiContext {
  const { sinceDays, maxEntries = 40, period } = opts;
  const cutoff = sinceDays ? Date.now() - sinceDays * 86400000 : 0;
  const inWindow = <T extends { date: string }>(x: T) =>
    !cutoff || new Date(x.date + "T00:00:00").getTime() >= cutoff - 86400000;

  const entries = data.entries
    .filter(inWindow)
    .slice(-maxEntries)
    .map((e) => ({ date: e.date, prompt: e.prompt, text: e.text, emotion: e.emotion }));
  const logs = data.logs.filter(inWindow);

  return {
    entries,
    moodAvg: avg(logs.map((l) => l.animo)),
    energiaAvg: avg(logs.map((l) => l.energia)),
    focoAvg: avg(logs.map((l) => l.foco)),
    practices: data.practices.filter(inWindow).length,
    decisions: data.decisions.filter(inWindow).length,
    streak: computeStreak(data),
    period,
  };
}
