import type { Capacity } from "./types";
import { LENSES } from "./types";

export interface ExerciseStep {
  key: string;
  prompt: string;
  placeholder?: string;
  kind?: "text" | "choice";
  choices?: string[];
}

export interface Exercise {
  id: string;
  capacity: Capacity;
  title: string;
  intro: string;
  plus: boolean;
  steps: ExerciseStep[];
}

export const CAPACITIES: { key: Capacity; name: string; desc: string; color: string }[] = [
  { key: "critico", name: "Pensamiento crítico", desc: "Cuestiona lo que das por hecho", color: "#9aa6e0" },
  { key: "creatividad", name: "Creatividad", desc: "Genera ideas sin filtro", color: "#f0be86" },
  { key: "liderazgo", name: "Liderazgo", desc: "Influye en otros para bien", color: "#8fd0b8" },
  { key: "autoconocimiento", name: "Autoconocimiento", desc: "Observa cómo piensas", color: "#c6b9ea" },
];

export const EXERCISES: Exercise[] = [
  {
    id: "reframe",
    capacity: "critico",
    title: "Cuestiona un pensamiento",
    intro: "Coge un pensamiento y míralo con más matices.",
    plus: false,
    steps: [
      { key: "thought", prompt: "Escribe algo que estás dando por cierto ahora mismo.", placeholder: "Ej.: si subo los precios, perderé a la mitad de mis clientes." },
      { key: "lens", prompt: "¿Qué le falta para sostenerse?", kind: "choice", choices: LENSES },
      { key: "reframe", prompt: "Reescríbelo con más matices.", placeholder: "Reescribe el pensamiento de forma más justa y comprobable." },
    ],
  },
  {
    id: "creencia",
    capacity: "critico",
    title: "Pon a prueba una creencia",
    intro: "Separa lo que crees de lo que puedes comprobar.",
    plus: false,
    steps: [
      { key: "creencia", prompt: "¿Qué creencia quieres examinar?", placeholder: "Algo que asumes como verdad sobre ti, alguien o el mundo." },
      { key: "aFavor", prompt: "¿Qué pruebas reales la respaldan?", placeholder: "Hechos, no impresiones." },
      { key: "enContra", prompt: "¿Qué pruebas la contradicen?", placeholder: "Busca al menos una." },
      { key: "conclusion", prompt: "¿Cómo la dirías ahora, más ajustada?", placeholder: "Una versión más precisa." },
    ],
  },
  {
    id: "diez-ideas",
    capacity: "creatividad",
    title: "Diez ideas en dos minutos",
    intro: "Cantidad antes que calidad: llena la página sin juzgar.",
    plus: true,
    steps: [
      { key: "reto", prompt: "¿Para qué necesitas ideas?", placeholder: "Un problema, un proyecto, un regalo…" },
      { key: "ideas", prompt: "Escribe diez ideas, rápido y sin filtrar.", placeholder: "1. …\n2. …\n3. …" },
    ],
  },
  {
    id: "combina",
    capacity: "creatividad",
    title: "Cruza dos mundos",
    intro: "Las mejores ideas nacen de uniones inesperadas.",
    plus: true,
    steps: [
      { key: "a", prompt: "Un tema o problema tuyo.", placeholder: "En lo que estás trabajando." },
      { key: "b", prompt: "Algo sin relación: un objeto, un oficio, un animal.", placeholder: "Lo primero que se te ocurra." },
      { key: "idea", prompt: "¿Qué idea nace al cruzarlos?", placeholder: "Fuerza la conexión, aunque suene absurda." },
    ],
  },
  {
    id: "convencer",
    capacity: "liderazgo",
    title: "Influir es invitar, no imponer",
    intro: "Mueve a alguien hacia algo bueno, desde su interés.",
    plus: true,
    steps: [
      { key: "cambio", prompt: "¿Qué te gustaría que alguien hiciera?", placeholder: "Una persona o un equipo." },
      { key: "beneficio", prompt: "¿Por qué es bueno para esa persona, no solo para ti?", placeholder: "Ponte en su lugar." },
      { key: "invitacion", prompt: "¿Cómo se lo propondrías para que quiera hacerlo?", placeholder: "Una invitación, no una orden." },
    ],
  },
  {
    id: "feedback",
    capacity: "liderazgo",
    title: "Feedback que ayuda",
    intro: "Situación, efecto y una petición concreta.",
    plus: true,
    steps: [
      { key: "situacion", prompt: "La situación concreta (qué pasó).", placeholder: "Sin generalizar." },
      { key: "efecto", prompt: "El efecto que tuvo.", placeholder: "En ti, en el trabajo, en el equipo." },
      { key: "peticion", prompt: "¿Qué pedirías para la próxima?", placeholder: "Algo observable y alcanzable." },
    ],
  },
  {
    id: "valores",
    capacity: "autoconocimiento",
    title: "Tus valores en acción",
    intro: "Debajo de lo que te importa hay un valor tuyo.",
    plus: true,
    steps: [
      { key: "momento", prompt: "Un momento reciente que te importó.", placeholder: "Bueno o difícil." },
      { key: "valor", prompt: "¿Qué valor tuyo había detrás?", placeholder: "Honestidad, cuidado, libertad…" },
      { key: "paso", prompt: "Un paso pequeño para honrarlo esta semana.", placeholder: "Concreto y realista." },
    ],
  },
  {
    id: "yo-futuro",
    capacity: "autoconocimiento",
    title: "Habla con tu yo de dentro de un año",
    intro: "A veces sabes la respuesta; solo hay que preguntársela.",
    plus: true,
    steps: [
      { key: "pregunta", prompt: "¿Qué le preguntarías a tu yo de dentro de un año?", placeholder: "Sobre una duda de ahora." },
      { key: "respuesta", prompt: "Contéstate como crees que respondería.", placeholder: "Con calma y honestidad." },
    ],
  },
];

export function exercisesFor(cap: Capacity): Exercise[] {
  return EXERCISES.filter((e) => e.capacity === cap);
}

export function capacityMeta(cap: Capacity) {
  return CAPACITIES.find((c) => c.key === cap) ?? CAPACITIES[0];
}
