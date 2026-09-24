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

export interface Settings {
  name: string;
  background: BackgroundId;
  customBg?: string; // data URL when background === "custom"
}

export interface AppData {
  version: 1;
  entries: JournalEntry[];
  logs: StateLog[];
  habits: Record<string, boolean[]>; // date -> [meditar, leer, diario, caminar]
  settings: Settings;
}

export const HABIT_LABELS = ["Meditar 10 min", "Leer", "Escribir diario", "Caminar 30 min"];
