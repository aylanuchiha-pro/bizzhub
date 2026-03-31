import { Btn, Divider } from "./ui";

export const NAV = [
  { id: "dashboard",     l: "Dashboard",         ic: "⬛" },
  { id: "products",      l: "Produits & Stock",   ic: "▦" },
  { id: "sales",         l: "Ventes",             ic: "↗" },
  { id: "rentals",       l: "Locations",          ic: "🚗" },
  { id: "partners",      l: "Partenaires",        ic: "◈" },
  { id: "subscriptions", l: "Abonnements",        ic: "↻" },
  { id: "businesses",    l: "Activités",          ic: "◇" },
  { id: "trash",         l: "Corbeille",          ic: "◌" },
];

const NavBtn = ({ item, active, onClick, badge }) => (
  <button onClick={onClick}
    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: active ? "var(--acb)" : "transparent", border: "none", borderRadius: 8, padding: "9px 11px", cursor: "pointer", color: active ? "var(--ac)" : "var(--sub)", fontFamily: "inherit", fontSize: 13, fontWeight: active ? 600 : 400, marginBottom: 2, transition: "all .15s" }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--surf)"; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
    <span style={{ fontSize: 12, opacity: .8, flexShrink: 0 }}>{item.ic}</span>
    <span style={{ flex: 1, textAlign: "left" }}>{item.l}</span>
    {badge > 0 && <span style={{ background: "var(--warn)", color: "#fff", borderRadius: 10, fontSize: 9, padding: "1px 6px", fontWeight: 700 }}>{badge}</span>}
  </button>
);

export function Sidebar({ tab, setTab, businesses, username, onLogout, dark, onToggleDark, trashCount }) {
  return (
    <div className="sb" style={{ width: 215, background: "var(--sdbar)", borderRight: "1px solid var(--brd)", display: "flex", flexDirection: "column", flexShrink: 0, minHeight: "100vh" }}>
      <div style={{ padding: "22px 18px 16px" }}>
        <p style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-.01em" }}>Business<span style={{ color: "var(--ac)" }}>Hub</span></p>
        <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 2 }}>@{username}</p>
      </div>
      <Divider />
      <nav style={{ padding: "10px 8px", flex: 1 }}>
        {NAV.map(n => (
          <NavBtn key={n.id} item={n} active={tab === n.id} onClick={() => setTab(n.id)} badge={n.id === "trash" ? trashCount : 0} />
        ))}
      </nav>
      {businesses.length > 0 && (
        <div style={{ padding: "8px 16px 12px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Activités</p>
          {businesses.map(b => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: b.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--sub)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
            </div>
          ))}
        </div>
      )}
      <Divider />
      <div style={{ padding: "10px 8px", display: "flex", gap: 6 }}>
        <button onClick={onToggleDark} title="Thème" style={{ background: "var(--surf)", border: "1px solid var(--brd)", borderRadius: 8, padding: "7px 11px", cursor: "pointer", fontSize: 14, color: "var(--sub)", fontFamily: "inherit", flexShrink: 0 }}>
          {dark ? "☀" : "🌙"}
        </button>
        <Btn variant="ghost" onClick={onLogout} sm style={{ flex: 1 }}>Déconnexion</Btn>
      </div>
    </div>
  );
}

export function TopTabs({ tab, setTab, trashCount, dark, onToggleDark, onLogout }) {
  return (
    <div className="top-tabs" style={{ display: "none", overflowX: "auto", borderBottom: "1px solid var(--brd)", background: "var(--sdbar)", padding: "0 12px", gap: 2, flexShrink: 0, alignItems: "center" }}>
      {NAV.map(n => {
        const act = tab === n.id;
        return (
          <button key={n.id} onClick={() => setTab(n.id)}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", borderBottom: `2px solid ${act ? "var(--ac)" : "transparent"}`, color: act ? "var(--ac)" : "var(--sub)", padding: "11px 9px", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: act ? 600 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>
            {n.l.split(" ")[0]}
            {n.id === "trash" && trashCount > 0 && <span style={{ background: "var(--warn)", color: "#fff", borderRadius: 10, fontSize: 9, padding: "0 5px", fontWeight: 700 }}>{trashCount}</span>}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <button onClick={onToggleDark} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: "8px 6px", color: "var(--sub)", flexShrink: 0 }}>{dark ? "☀" : "🌙"}</button>
      <Btn sm variant="ghost" onClick={onLogout}>✕</Btn>
    </div>
  );
}
