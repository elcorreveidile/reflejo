import type { Decision } from "./types";

export interface CalibrationBucket {
  conf: number; // 1..5
  total: number;
  well: number;
}

export interface Calibration {
  reviewed: number;
  overallWellPct: number | null;
  buckets: CalibrationBucket[];
  insight: string | null;
}

function wentWell(d: Decision): boolean {
  return d.outcome === "Mejor" || d.outcome === "Como esperaba";
}

/**
 * Calibración: ¿tu nivel de confianza predice cómo salen tus decisiones?
 * Compara la confianza declarada con el resultado real de las decisiones revisadas.
 */
export function computeCalibration(decisions: Decision[]): Calibration {
  const reviewedD = decisions.filter((d) => d.outcome);
  const reviewed = reviewedD.length;
  const buckets: CalibrationBucket[] = [1, 2, 3, 4, 5].map((c) => {
    const xs = reviewedD.filter((d) => d.confidence === c);
    return { conf: c, total: xs.length, well: xs.filter(wentWell).length };
  });
  const overallWellPct = reviewed ? Math.round((reviewedD.filter(wentWell).length / reviewed) * 100) : null;

  let insight: string | null = null;
  const hi = reviewedD.filter((d) => d.confidence >= 4);
  const lo = reviewedD.filter((d) => d.confidence <= 2);
  if (hi.length >= 2 && lo.length >= 2) {
    const hiPct = hi.filter(wentWell).length / hi.length;
    const loPct = lo.filter(wentWell).length / lo.length;
    if (hiPct - loPct >= 0.2) insight = "Tu confianza está bien calibrada: aciertas más cuando estás más seguro.";
    else if (loPct - hiPct >= 0.2) insight = "Cuidado con el exceso de confianza: tus decisiones más seguras no salen mejor.";
    else insight = "Tu confianza aún no predice el resultado; sigue registrando y revisando.";
  } else if (reviewed >= 3) {
    insight = "Revisa unas cuantas decisiones más para ver si tu confianza acierta.";
  }

  return { reviewed, overallWellPct, buckets, insight };
}
