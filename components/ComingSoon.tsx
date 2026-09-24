export default function ComingSoon({
  kicker,
  title,
  caps,
  note,
}: {
  kicker: string;
  title: string;
  caps: string[];
  note: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#cfd2e4", fontWeight: 600 }}>{kicker}</span>
        <span className="serif" style={{ fontSize: 27, lineHeight: 1.1, fontWeight: 500, color: "#fbfaff" }}>{title}</span>
      </header>

      <section className="glass" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#f1d6b8" }}>Muy pronto</span>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#e7e7f0" }}>{note}</p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
          {caps.map((c) => (
            <li key={c} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#f5f3fb" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#f0be86", flexShrink: 0 }} />
              {c}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
