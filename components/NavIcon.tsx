import type { ReactNode } from "react";

export type IconName = "hoy" | "diario" | "estados" | "practicas" | "decisiones";

const PATHS: Record<IconName, ReactNode> = {
  hoy: (
    <>
      <path d="M4 13.5 12 6l8 7.5" />
      <path d="M6 12v7h12v-7" />
    </>
  ),
  diario: (
    <>
      <path d="M14 4l6 6" />
      <path d="M5 20l1-4L16 5l3 3L9 19z" />
    </>
  ),
  estados: <path d="M3 12h4l3 7 4-14 3 7h4" />,
  practicas: <path d="M12 4l1.7 4.6L18 10l-4.3 1.4L12 16l-1.7-4.6L6 10l4.3-1.4z" />,
  decisiones: (
    <>
      <circle cx="12" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="M12 7v2.5M12 10 7.2 16.8M12 10l4.8 6.8" />
    </>
  ),
};

export default function NavIcon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
