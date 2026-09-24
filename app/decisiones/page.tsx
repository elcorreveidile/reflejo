import ComingSoon from "@/components/ComingSoon";

export default function DecisionesPage() {
  return (
    <ComingSoon
      kicker="Decisiones"
      title="Decide y hazte cargo"
      caps={["Registrar una decisión", "Tu nivel de confianza", "Revisar la consecuencia"]}
      note="Anota una decisión y sus razones, y la app te la devuelve días después para revisar cómo salió: cerrar el círculo y aprender de verdad. Muy pronto."
    />
  );
}
