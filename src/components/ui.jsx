// ─── Shared UI primitives ─────────────────────────────────────────

export const Lbl = ({ children }) => (
  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--sub)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>{children}</p>
);

export const F = ({ label, children, col }) => (
  <div style={{ gridColumn: col }}>
    <Lbl>{label}</Lbl>
    {children}
  </div>
);

export const Btn = ({ children, onClick, variant = "def", sm, full, disabled, style: sx = {} }) => {
  const v = {
    def: { bg: "var(--w)", brd: "1px solid var(--brd)", c: "var(--txt)" },
    pri: { bg: "var(--ac)", brd: "none", c: "#fff" },
    ghost: { bg: "transparent", brd: "none", c: "var(--sub)" },
    err: { bg: "rgba(220,38,38,.1)", brd: "1px solid rgba(220,38,38,.3)", c: "var(--err)" },
    warn: { bg: "rgba(217,119,6,.1)", brd: "1px solid rgba(217,119,6,.3)", c: "var(--warn)" },
    success: { bg: "rgba(22,163,74,.1)", brd: "1px solid rgba(22,163,74,.3)", c: "var(--ok)" },
  }[variant];
  return (
    <button onClick={disabled ? undefined : onClick}
      style={{ background: v.bg, border: v.brd, color: v.c, borderRadius: 8, padding: sm ? "5px 11px" : "8px 18px", fontSize: sm ? 11 : 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, width: full ? "100%" : "auto", justifyContent: full ? "center" : "flex-start", opacity: disabled ? .45 : 1, transition: "opacity .15s", ...sx }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = ".72"; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = "1"; }}>
      {children}
    </button>
  );
};

export const Bdg = ({ label, color, sm }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}38`, borderRadius: 20, padding: sm ? "2px 8px" : "3px 11px", fontSize: sm ? 10 : 11, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
);

const CatMap = { physical: { l: "Physique", c: "#0ea5e9" }, service: { l: "Service", c: "#10b981" }, digital: { l: "Digital", c: "#8b5cf6" } };
export const CatBdg = ({ id }) => { const x = CatMap[id] ?? { l: id, c: "var(--mut)" }; return <Bdg label={x.l} color={x.c} sm />; };

const StatusMap = { disponible: { l: "Disponible", c: "#16a34a" }, en_location: { l: "En location", c: "#d97706" }, termine: { l: "Terminé", c: "#6b7280" } };
export const StatusBdg = ({ id }) => { const x = StatusMap[id] ?? { l: id, c: "var(--mut)" }; return <Bdg label={x.l} color={x.c} sm />; };

export const KPI = ({ label, value, color, sub: s, top }) => (
  <div style={{ background: "var(--w)", border: "1px solid var(--brd)", borderRadius: 12, padding: "18px 22px", flex: 1, minWidth: 0, boxShadow: "var(--sh)", borderTop: top ? "3px solid var(--ac)" : undefined }}>
    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".07em" }}>{label}</p>
    <p style={{ marginTop: 6, fontSize: 22, fontWeight: 700, color: color ?? "var(--txt)", letterSpacing: "-.02em" }}>{value}</p>
    {s && <p style={{ marginTop: 3, fontSize: 11, color: "var(--mut)" }}>{s}</p>}
  </div>
);

export const Empty = ({ icon = "◇", text }) => (
  <div style={{ textAlign: "center", padding: "56px 20px", color: "var(--mut)" }}>
    <p style={{ fontSize: 26, marginBottom: 10, opacity: .3 }}>{icon}</p>
    <p style={{ fontSize: 13 }}>{text}</p>
  </div>
);

export const Card = ({ children, style: sx = {} }) => (
  <div style={{ background: "var(--w)", border: "1px solid var(--brd)", borderRadius: 12, boxShadow: "var(--sh)", ...sx }}>{children}</div>
);

export const THead = ({ cols }) => (
  <thead><tr style={{ background: "var(--surf)" }}>
    {cols.map(c => <th key={c} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap" }}>{c}</th>)}
  </tr></thead>
);

export const Divider = () => <div style={{ height: 1, background: "var(--brd)" }} />;

export const StockBar = ({ v, warn = 5 }) => {
  const max = Math.max(v * 2, 20);
  const w = Math.min(100, Math.max(0, (v / max) * 100));
  const c = v <= 0 ? "var(--err)" : v <= warn ? "var(--warn)" : "var(--ok)";
  return <div style={{ height: 3, background: "var(--brd)", borderRadius: 4, overflow: "hidden", width: 72, marginTop: 4 }}><div style={{ height: "100%", width: w + "%", background: c, borderRadius: 4 }} /></div>;
};

export const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--w)", border: "1px solid var(--brd)", borderRadius: 8, padding: "10px 14px", fontSize: 12, boxShadow: "var(--sh)" }}>
      <p style={{ fontWeight: 600, marginBottom: 6, color: "var(--sub)" }}>{label}</p>
      {payload.map((p, i) => {
        const fmt = p.name === "Jours" ? `${p.value}j` : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(p.value);
        return <p key={i} style={{ color: p.color, marginTop: 2 }}>{p.name} : {fmt}</p>;
      })}
    </div>
  );
};

export const Confirm = ({ msg, sub, onOk, onCancel }) => (
  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.52)", zIndex: 500, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "80px 20px" }}>
    <div style={{ background: "var(--w)", borderRadius: 14, padding: 28, maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Confirmer la suppression</p>
      <p style={{ fontSize: 13, color: "var(--sub)", marginBottom: sub ? 4 : 22 }}>{msg}</p>
      {sub && <p style={{ fontSize: 12, color: "var(--warn)", marginBottom: 22, padding: "8px 12px", background: "rgba(217,119,6,.08)", borderRadius: 8, border: "1px solid rgba(217,119,6,.2)" }}>{sub}</p>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn onClick={onCancel}>Annuler</Btn>
        <Btn variant="err" onClick={onOk}>Supprimer</Btn>
      </div>
    </div>
  </div>
);

export const Modal = ({ title, onClose, children, width = 520 }) => (
  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.48)", zIndex: 400, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }}>
    <div style={{ background: "var(--w)", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,.25)", width: "100%", maxWidth: width, maxHeight: "82vh", overflowY: "auto", margin: "auto" }}>
      <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--brd)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--w)", zIndex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 700 }}>{title}</p>
        <Btn variant="ghost" onClick={onClose} sm>✕</Btn>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

export const SectionTitle = ({ children }) => (
  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>{children}</p>
);

export const Preview = ({ ca, profit, margin }) => {
  const euro = n => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n ?? 0);
  return (
    <div style={{ marginTop: 14, display: "flex", gap: 24, padding: "12px 14px", background: "var(--acb)", borderRadius: 8, border: "1px solid rgba(79,70,229,.2)" }}>
      {[{ l: "CA", v: euro(ca), c: "var(--ac)" }, { l: "Bénéfice", v: euro(profit), c: profit >= 0 ? "var(--ok)" : "var(--err)" }, { l: "Marge", v: margin, c: "var(--sub)" }].map(x => (
        <div key={x.l}><p style={{ fontSize: 11, color: "var(--mut)" }}>{x.l}</p><p style={{ fontWeight: 700, fontSize: 15, color: x.c }}>{x.v}</p></div>
      ))}
    </div>
  );
};
