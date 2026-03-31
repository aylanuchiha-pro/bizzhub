import { useState } from "react";
import { uid, today, active, pct } from "../utils";
import { euro } from "../utils";
import { Btn, Lbl, F, Bdg, Card, THead, Empty, Confirm, Preview } from "../components/ui";

const emptySale = { bizId: "", productId: "", name: "", qty: "1", sellPrice: "", costPrice: "", date: today(), notes: "", withPartner: false, partnerId: "", sharePct: "50" };

export default function Sales({ sales, saleA, prods, prodA, biz, partners, spA }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptySale);
  const [filterBiz, setFilterBiz] = useState("all");
  const [errors, setErrors] = useState({});
  const [ok, setOk] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const aBiz = active(biz);
  const aPartners = active(partners);
  const bN = id => aBiz.find(b => b.id === id)?.name ?? "—";
  const bC = id => aBiz.find(b => b.id === id)?.color ?? "var(--mut)";
  const pN_ = id => aPartners.find(p => p.id === id)?.name ?? "—";
  const bizProds = active(prods).filter(p => p.bizId === form.bizId);

  const handleProd = id => {
    set("productId", id);
    if (!id) return;
    const p = active(prods).find(x => x.id === id);
    if (p) { set("name", p.name); set("sellPrice", String(p.sellPrice)); set("costPrice", String(p.buyPrice)); }
  };
  const handleBiz = id => { set("bizId", id); set("productId", ""); set("name", ""); set("sellPrice", ""); set("costPrice", ""); };

  const submit = () => {
    const e = {};
    if (!form.bizId) e.bizId = true;
    if (!form.name.trim()) e.name = true;
    if (!form.sellPrice || isNaN(parseFloat(form.sellPrice))) e.sellPrice = true;
    setErrors(e);
    if (Object.keys(e).length) return;

    const sN = parseFloat(form.sellPrice), cN = parseFloat(form.costPrice) || 0, qN = parseInt(form.qty) || 1;
    const saleId = uid();
    saleA.add({ id: saleId, bizId: form.bizId, productId: form.productId || null, name: form.name.trim(), qty: qN, sellPrice: sN, costPrice: cN, date: form.date, notes: form.notes.trim(), deletedAt: null });
    
    if (form.productId) {
	  const prod = active(prods).find(p => p.id === form.productId);
	  if (prod && prod.category === "physical") {
	    prodA.update({ ...prod, stock: Math.max(0, prod.stock - qN) });
	  }
	}

    if (form.withPartner && form.partnerId) {
      const profit = (sN - cN) * qN;
      const pct_ = parseFloat(form.sharePct) || 50;
      spA.add({ id: uid(), saleId, partnerId: form.partnerId, sharePct: pct_, amountDue: profit * pct_ / 100 });
    }

    setForm({ ...emptySale, bizId: form.bizId, date: form.date });
    setErrors({}); setOk(true); setTimeout(() => setOk(false), 3000);
  };

  const softDel = id => setConfirm({
    msg: "Supprimer cette vente ?",
    sub: "Elle sera déplacée dans la corbeille pendant 30 jours.",
    onOk: () => { saleA.softDel(id); setConfirm(null); }
  });

  const aSales = active(sales);
  const filtered = [...aSales].filter(s => filterBiz === "all" || s.bizId === filterBiz).sort((a, b) => b.date.localeCompare(a.date));
  const totCa = filtered.reduce((a, s) => a + s.sellPrice * s.qty, 0);
  const totP = filtered.reduce((a, s) => a + (s.sellPrice - s.costPrice) * s.qty, 0);
  const sN = parseFloat(form.sellPrice) || 0, cN = parseFloat(form.costPrice) || 0, qN = parseInt(form.qty) || 1;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {[{ id: "all", l: "Toutes" }, ...aBiz.map(b => ({ id: b.id, l: b.name }))].map(f => (
            <button key={f.id} onClick={() => setFilterBiz(f.id)} style={{ background: filterBiz === f.id ? "var(--acb)" : "transparent", border: `1px solid ${filterBiz === f.id ? "var(--ac)" : "var(--brd)"}`, color: filterBiz === f.id ? "var(--ac)" : "var(--sub)", borderRadius: 8, padding: "6px 13px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: filterBiz === f.id ? 600 : 400 }}>{f.l}</button>
          ))}
        </div>
        <Btn variant="pri" onClick={() => setShowForm(v => !v)}>{showForm ? "↑ Masquer" : "+ Nouvelle vente"}</Btn>
      </div>

      {showForm && (
        <Card style={{ padding: 22, marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Nouvelle vente</p>
          <div className="fg3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 16px" }}>
            <F label="Activité">
              <select value={form.bizId} onChange={e => handleBiz(e.target.value)} style={errors.bizId ? { borderColor: "var(--err)" } : {}}>
                <option value="">— Choisir —</option>
                {aBiz.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </F>
            {form.bizId && bizProds.length > 0 && (
              <F label="Produit existant (opt.)">
                <select value={form.productId} onChange={e => handleProd(e.target.value)}>
                  <option value="">— Saisie manuelle —</option>
                  {bizProds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </F>
            )}
            <F label="Désignation">
              <input value={form.name} onChange={e => { set("name", e.target.value); setErrors(r => ({ ...r, name: false })); }} placeholder="Nom du produit ou service" style={errors.name ? { borderColor: "var(--err)" } : {}} />
            </F>
            <F label="Prix de vente (€)">
              <input type="number" value={form.sellPrice} onChange={e => { set("sellPrice", e.target.value); setErrors(r => ({ ...r, sellPrice: false })); }} placeholder="0.00" style={errors.sellPrice ? { borderColor: "var(--err)" } : {}} />
            </F>
            <F label="Coût / Prix d'achat (€)">
              <input type="number" value={form.costPrice} onChange={e => set("costPrice", e.target.value)} placeholder="0.00" />
            </F>
            <F label="Quantité"><input type="number" value={form.qty} onChange={e => set("qty", e.target.value)} min="1" /></F>
            <F label="Date"><input type="date" value={form.date} onChange={e => set("date", e.target.value)} /></F>
            <F label="Notes"><input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Remarques…" /></F>
          </div>

          {/* Partner section */}
          {aPartners.length > 0 && (
            <div style={{ marginTop: 14, padding: "14px 16px", background: "var(--surf)", borderRadius: 8, border: "1px solid var(--brd)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                <input type="checkbox" checked={form.withPartner} onChange={e => set("withPartner", e.target.checked)} style={{ width: "auto", cursor: "pointer" }} />
                Impliquer un partenaire dans cette vente
              </label>
              {form.withPartner && (
                <div className="fg2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                  <F label="Partenaire">
                    <select value={form.partnerId} onChange={e => set("partnerId", e.target.value)}>
                      <option value="">— Choisir —</option>
                      {aPartners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </F>
                  <F label="Sa part du bénéfice (%)">
                    <input type="number" value={form.sharePct} onChange={e => set("sharePct", e.target.value)} min="1" max="100" placeholder="50" />
                  </F>
                  {form.partnerId && sN > 0 && (
                    <div style={{ gridColumn: "1/-1", fontSize: 12, color: "var(--warn)" }}>
                      À verser à {pN_(form.partnerId)} : {euro((sN - cN) * qN * (parseFloat(form.sharePct) || 50) / 100)} ({form.sharePct}% du bénéfice)
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {form.sellPrice && form.costPrice && <Preview ca={sN * qN} profit={(sN - cN) * qN} margin={pct(sN - cN, sN)} />}
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <Btn variant="pri" onClick={submit}>Enregistrer la vente</Btn>
            {ok && <span style={{ color: "var(--ok)", fontSize: 13 }}>✓ Vente enregistrée</span>}
            {Object.values(errors).some(Boolean) && <span style={{ color: "var(--err)", fontSize: 13 }}>Champs requis manquants</span>}
          </div>
        </Card>
      )}

      {filtered.length === 0 ? <Empty text="Aucune vente enregistrée." /> : (
        <Card style={{ overflow: "hidden" }}>
          <div className="tbl-wrap">
            <table style={{ width: "100%", fontSize: 13, minWidth: 700 }}>
              <THead cols={["Date", "Désignation", "Activité", "Qté", "P. vente", "Coût", "Bénéfice", ""]} />
              <tbody>
                {filtered.map(s => {
                  const profit = (s.sellPrice - s.costPrice) * s.qty;
                  return (
                    <tr key={s.id} style={{ borderTop: "1px solid var(--brd)" }}>
                      <td style={{ padding: "12px 16px", color: "var(--mut)", whiteSpace: "nowrap" }}>{new Date(s.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                        {s.name}
                        {s.notes && <span style={{ display: "block", fontSize: 11, color: "var(--mut)", fontWeight: 400, marginTop: 1 }}>{s.notes}</span>}
                      </td>
                      <td style={{ padding: "12px 16px" }}><Bdg label={bN(s.bizId)} color={bC(s.bizId)} sm /></td>
                      <td style={{ padding: "12px 16px", color: "var(--sub)" }}>{s.qty}</td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>{euro(s.sellPrice)}</td>
                      <td style={{ padding: "12px 16px", color: "var(--mut)", whiteSpace: "nowrap" }}>{euro(s.costPrice)}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: profit >= 0 ? "var(--ok)" : "var(--err)", whiteSpace: "nowrap" }}>{euro(profit)}</td>
                      <td style={{ padding: "12px 14px" }}><Btn sm variant="err" onClick={() => softDel(s.id)}>Suppr.</Btn></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 18px", borderTop: "1px solid var(--brd)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 12 }}>
            <span style={{ color: "var(--mut)" }}>{filtered.length} vente(s)</span>
            <span style={{ color: "var(--mut)" }}>
              CA : <strong style={{ color: "var(--ac)" }}>{euro(totCa)}</strong>{" · "}
              Bénéfice : <strong style={{ color: totP >= 0 ? "var(--ok)" : "var(--err)" }}>{euro(totP)}</strong>{" · "}
              Marge : <strong style={{ color: "var(--txt)" }}>{pct(totP, totCa)}</strong>
            </span>
          </div>
        </Card>
      )}
      {confirm && <Confirm {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
