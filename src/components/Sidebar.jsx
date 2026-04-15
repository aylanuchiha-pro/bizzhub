import { useState } from "react";
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
        <p onClick={() => setTab("dashboard")} style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-.01em", cursor: "pointer" }}>Business<span style={{ color: "var(--ac)" }}>Hub</span></p>
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

export function MobileNav({ open, onClose, tab, setTab, businesses, username, dark, onToggleDark, onLogout, trashCount }) {
  const pick = id => { setTab(id); onClose(); };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.48)", zIndex: 300,
          opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
          transition: "opacity .22s",
        }}
      />
      {/* Drawer latéral */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 272,
        background: "var(--w)", zIndex: 301,
        display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform .25s cubic-bezier(.4,0,.2,1)",
        boxShadow: "6px 0 32px rgba(0,0,0,.18)",
      }}>
        {/* En-tête */}
        <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid var(--brd)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p onClick={() => { setTab("dashboard"); onClose(); }} style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-.01em", cursor: "pointer" }}>Business<span style={{ color: "var(--ac)" }}>Hub</span></p>
            <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 2 }}>@{username}</p>
          </div>
          <button onClick={onClose} style={{ background: "var(--surf)", border: "1px solid var(--brd)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "var(--mut)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", flexShrink: 0 }}>×</button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
          {NAV.map(n => {
            const act = tab === n.id;
            return (
              <button key={n.id} onClick={() => pick(n.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: act ? "var(--acb)" : "transparent", border: "none", borderRadius: 10, padding: "12px 14px", cursor: "pointer", color: act ? "var(--ac)" : "var(--txt)", fontFamily: "inherit", fontSize: 14, fontWeight: act ? 600 : 400, marginBottom: 2 }}>
                <span style={{ fontSize: 15, flexShrink: 0, opacity: .85 }}>{n.ic}</span>
                <span style={{ flex: 1, textAlign: "left" }}>{n.l}</span>
                {n.id === "trash" && trashCount > 0 &&
                  <span style={{ background: "var(--warn)", color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 7px", fontWeight: 700 }}>{trashCount}</span>
                }
              </button>
            );
          })}
        </nav>

        {/* Activités */}
        {businesses.length > 0 && (
          <div style={{ padding: "8px 16px 10px", borderTop: "1px solid var(--brd)" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 7 }}>Activités</p>
            {businesses.map(b => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: b.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--sub)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Pied */}
        <div style={{ padding: "10px 8px", borderTop: "1px solid var(--brd)", display: "flex", gap: 6 }}>
          <button onClick={onToggleDark} style={{ background: "var(--surf)", border: "1px solid var(--brd)", borderRadius: 8, padding: "7px 11px", cursor: "pointer", fontSize: 14, color: "var(--sub)", fontFamily: "inherit", flexShrink: 0 }}>
            {dark ? "☀" : "🌙"}
          </button>
          <Btn variant="ghost" onClick={onLogout} sm style={{ flex: 1 }}>Déconnexion</Btn>
        </div>
      </div>
    </>
  );
}
