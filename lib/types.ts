export type BackgroundId = "cafe" | "noche" | "bosque" | "arena" | "custom";

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD (local)
  prompt: string;
  text: string;
  emotion: string | null;
  createdAt: number;
}

export interface StateLog {
  id: string;
  date: string; // YYYY-MM-DD (local)
  animo?: number; // 1..5
  energia?: number; // 1..5
  foco?: number; // 1..5
  moment?: number; // 0 mañana, 1 tarde, 2 noche
  createdAt: number;
}

export type Capacity = "critico" | "creatividad" | "liderazgo" | "autoconocimiento";

export interface PracticeLog {
  id: string;
  date: string; // YYYY-MM-DD (local)
  exercise: string; // id del ejercicio
  capacity: Capacity;
  title: string;
  fields: Record<string, string>;
  createdAt: number;
}

export interface Decision {
  id: string;
  date: string; // YYYY-MM-DD (creación)
  title: string;
  confidence: number; // 1..5
  reviewInDays: number;
  reviewAt: string; // YYYY-MM-DD en que toca revisar
  outcome: string | null; // null = pendiente
  learning: string;
  reviewedAt: number | null;
  createdAt: number;
}

export const OUTCOMES = ["Mejor", "Como esperaba", "Peor"];

export const PLAZOS: { label: string; days: number }[] = [
  { label: "3 días", days: 3 },
  { label: "1 semana", days: 7 },
  { label: "1 mes", days: 30 },
];

export interface Settings {
  name: string;
  background: BackgroundId;
  customBg?: string; // data URL when background === "custom"
  habitLabels: string[]; // 4 etiquetas de hábitos (vacío = oculto)
}

export interface AppData {
  version: 1;
  entries: JournalEntry[];
  logs: StateLog[];
  practices: PracticeLog[];
  decisions: Decision[];
  habits: Record<string, boolean[]>; // date -> [meditar, leer, diario, caminar]
  settings: Settings;
}

export const LENSES = [
  "Una prueba real que lo respalde",
  "Otra explicación posible",
  "El punto de vista del otro",
  "Un dato que lo contradiga",
];

export const HABIT_LABELS = ["Meditar 10 min", "Leer", "Escribir diario", "Caminar 30 min"];
