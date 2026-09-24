import type { AppData, Decision } from "./types";
import { normalize } from "./store";

interface Ided {
  id: string;
  createdAt: number;
}

function unionById<T extends Ided>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const it of a) map.set(it.id, it);
  for (const it of b) {
    const ex = map.get(it.id);
    if (!ex || it.createdAt >= ex.createdAt) map.set(it.id, it);
  }
  return Array.from(map.values()).sort((p, q) => p.createdAt - q.createdAt);
}

function mergeDecisions(a: Decision[], b: Decision[]): Decision[] {
  const map = new Map<string, Decision>();
  for (const it of a) map.set(it.id, it);
  for (const it of b) {
    const ex = map.get(it.id);
    if (!ex) { map.set(it.id, it); continue; }
    // Gana la versión revisada más reciente (cerrar el círculo no se pierde)
    const ra = ex.reviewedAt ?? 0;
    const rb = it.reviewedAt ?? 0;
    map.set(it.id, rb > ra ? it : ra > rb ? ex : (it.outcome ? it : ex));
  }
  return Array.from(map.values()).sort((p, q) => p.createdAt - q.createdAt);
}

function mergeHabits(a: Record<string, boolean[]>, b: Record<string, boolean[]>): Record<string, boolean[]> {
  const out: Record<string, boolean[]> = { ...a };
  for (const [date, bv] of Object.entries(b)) {
    const av = out[date];
    out[date] = av ? av.map((x, i) => x || (bv[i] ?? false)) : bv;
  }
  return out;
}

/**
 * Fusiona dos estados sin perder datos. Colecciones de solo-añadir se unen por id;
 * las decisiones conservan su revisión; los hábitos se combinan por día.
 * Los ajustes del lado `b` (el dispositivo que acaba de sincronizar) mandan.
 */
export function mergeAppData(a: AppData, b: AppData): AppData {
  return normalize({
    version: 1,
    entries: unionById(a.entries, b.entries),
    logs: unionById(a.logs, b.logs),
    practices: unionById(a.practices, b.practices),
    decisions: mergeDecisions(a.decisions, b.decisions),
    habits: mergeHabits(a.habits, b.habits),
    settings: b.settings ?? a.settings,
  });
}
