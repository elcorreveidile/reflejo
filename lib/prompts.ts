export const PROMPTS = [
  "¿Qué evité hoy sin darme cuenta del todo?",
  "¿Qué decisión tomaste hoy casi sin pensarla?",
  "¿Qué te dio energía hoy, y qué te la quitó?",
  "¿Qué creencia tuya se puso a prueba hoy?",
  "¿A quién influiste hoy, y hacia qué?",
  "¿Qué idea se te ocurrió y no llegaste a anotar?",
  "¿Qué harías distinto si repitieras el día?",
  "¿Qué te costó más de lo normal, y por qué?",
  "¿De qué te sientes responsable hoy?",
  "¿Qué diste por cierto sin comprobarlo?",
];

function dayOfYear(d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function promptForToday(offset = 0): string {
  return PROMPTS[(dayOfYear() + offset) % PROMPTS.length];
}

export const EMOTIONS = ["Miedo", "Alivio", "Culpa", "Calma", "Frustración", "Claridad"];
