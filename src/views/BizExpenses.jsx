import { useState, useMemo } from "react";
import { uid, today, active, euro } from "../utils";
import { Btn, F, Bdg, Card, THead, Empty, Confirm, Modal, KPI } from "../components/ui";

const emptyForm = { bizId: "", productId: "", label: "", amount: "", date: today(), notes: "", linkType: "biz" };

export default function BizExpenses({ bizExpenses, bizExpenseA, biz, prods, expenses, expenseA }) {
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(emptyForm);
  const [confirm, setConfirm] = useState(null);
  const [selBiz,  setSelBiz]  = useState("all");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const aBiz   = active(biz);
  const aProds = active(prods);
  const bName  = id => aBiz.find(b => b.id === id)?.name ?? "—";
  const bColor = id => aBiz.find(b => b.id === id)?.color ?? "var(--mut)";
  const pName  = id => aProds.find(p => p.id === id)?.name ?? "—";
  const pBizId = id => aProds.find(p => p.id === id)?.bizId ?? null;

  // biz_expenses (full managed)
  const aBizExp = active(bizExpenses || []);
  // product_expenses (readonly in this view - managed from Products)
  const aProdExp = (expenses || []).map(e => ({
    ...e,
    _source: "product",
    bizId: pBizId(e.productId),
  }));

  // Merge and filter
  const allExp = useMemo(() => {
    const biz_ = aBizExp.map(e => ({ ...e, _source: "biz" }));
    return [...biz_, ...aProdExp].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [aBizExp, aProdExp]);

  const filtered = useMemo(() => {
    if (selBiz === "all") return allExp;
    return allExp.filter(e => e.bizId === selBiz || pBizId(e.productId) === selBiz);
  }, [allExp, selBiz]);

  const now = new Date();
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const totalAll   = allExp.reduce((a, e) => a + (e.amount || 0), 0);
  const totalMonth = allExp.filter(e => (e.date || "").startsWith(curMonth)).reduce((a, e) => a + (e.amount || 0), 0);

  const openAdd = () => { setForm(emptyForm); setModal("add"); };
  const openEdit = e => { setForm({ ...e, amount: String(e.amount), linkType: e.productId ? "product" : "biz" }); setModal(e); };

  const save = () => {
    if (!form.label.trim() || !form.date) return;
    const obj = {
      id: typeof modal === "string" ? uid() : modal.id,
      bizId: form.linkType === "biz" ? (form.bizId || null) : null,
      productId: form.linkType === "product" ? (form.productId || null) : null,
      label: form.label.trim(),
      amount: parseFloat(form.amount) || 0,
      date: form.date,
      notes: form.notes,
      deletedAt: null,
    };
    if (typeof modal === "string") bizExpenseA.add(obj);
    else bizExpenseA.update(obj);
    setModal(null);
  };

  const del = e => setConfirm({
    msg: `Supprimer le frais "${e.label}" ?`,
    onOk: () => {
      if (e._source === "product") expenseA.hardDel(e.id);
      else bizExpenseA.softDel(e.id);
      setConfirm(null);
    },
  });

  const btnPill = (act, color) => ({
    padding: "5px 13px", borderRadius: 20,
    border: `1px solid ${act ? (color || "var(--ac)") : "var(--brd)"}`,
    background: act ? (color ? color + "22" : "var(--acb)") : "transparent",
    color: act ? (color || "var(--ac)") : "var(--sub)",
    fontSize: 12, fontWeight: act ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap",
  });

  return (
    <div>
      <div className="kpis" style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPI label="Total des frais" value={euro(totalAll)} color="var(--err)" sub={`${allExp.length} frais enregistré(s)`} />
        <KPI label="Ce mois" value={euro(totalMonth)} color="var(--warn)" sub={new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <button style={btnPill(selBiz === "all")} onClick={() => setSelBiz("all")}>Toutes les activités</button>
          {aBiz.map(b => (
            <button key={b.id} style={btnPill(selBiz === b.id, b.color)} onClick={() => setSelBiz(selBiz === b.id ? "all" : b.id)}>
              {b.name}
            </button>
          ))}
        </div>
        <Btn variant="pri" onClick={openAdd}>+ Ajouter un frais</Btn>
      </div>

      {filtered.length === 0 ? (
        <Empty icon="⊖" text="Aucun frais enregistré. Ajoutez vos dépenses liées à vos activités (essence, matériel, transport…)." />
      ) : (
        <Card style={{ overflow: "hidden" }}>
          <div className="tbl-wrap">
            <table style={{ width: "100%", fontSize: 13, minWidth: 600 }}>
              <THead cols={["Date", "Libellé", "Lié à", "Montant", "Notes", ""]} />
              <tbody>
                {filtered.map(e => {
                  const linkedBizId = e.bizId || pBizId(e.productId);
                  const linkedName  = e.productId ? pName(e.productId) : (e.bizId ? bName(e.bizId) : null);
                  const linkedColor = linkedBizId ? bColor(linkedBizId) : "var(--mut)";
                  const isProduct   = !!e.productId;
                  return (
                    <tr key={e.id + e._source} style={{ borderTop: "1px solid var(--brd)" }}>
                      <td style={{ padding: "12px 16px", color: "var(--mut)", whiteSpace: "nowrap" }}>
                        {e.date ? new Date(e.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>{e.label}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {linkedName ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <Bdg label={linkedName} color={isProduct ? "var(--sub)" : linkedColor} sm />
                            {isProduct && linkedBizId && <Bdg label={bName(linkedBizId)} color={linkedColor} sm />}
                          </div>
                        ) : <span style={{ color: "var(--mut)", fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--err)", whiteSpace: "nowrap" }}>{euro(e.amount)}</td>
                      <td style={{ padding: "12px 16px", color: "var(--mut)", fontSize: 12 }}>{e.notes || "—"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {e._source === "biz" && <Btn sm variant="ghost" onClick={() => openEdit(e)}>Éditer</Btn>}
                          <Btn sm variant="err" onClick={() => del(e)}>Suppr.</Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 18px", borderTop: "1px solid var(--brd)", fontSize: 12, color: "var(--mut)" }}>
            Total affiché : <strong style={{ color: "var(--err)" }}>{euro(filtered.reduce((a, e) => a + (e.amount || 0), 0))}</strong>
            {" · "}{filtered.length} frais
          </div>
        </Card>
      )}

      {confirm && <Confirm {...confirm} onCancel={() => setConfirm(null)} />}

      {modal && (
        <Modal title={typeof modal === "string" ? "Nouveau frais" : "Modifier le frais"} onClose={() => setModal(null)} width={460}>
          <div className="fg2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <F label="Libellé" col="1/-1">
              <input value={form.label} onChange={e => set("label", e.target.value)} placeholder="ex: Essence livraison, Emballages, Transport…" autoFocus />
            </F>
            <F label="Montant (€)">
              <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" />
            </F>
            <F label="Date">
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </F>
            <F label="Lié à" col="1/-1">
              <div style={{ display: "flex", gap: 8 }}>
                {[{ id: "biz", l: "Une activité" }, { id: "product", l: "Un produit" }].map(t => (
                  <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, padding: "7px 14px", border: `1px solid ${form.linkType === t.id ? "var(--ac)" : "var(--brd)"}`, borderRadius: 8, background: form.linkType === t.id ? "var(--acb)" : "transparent", color: form.linkType === t.id ? "var(--ac)" : "var(--sub)", fontWeight: form.linkType === t.id ? 600 : 400 }}>
                    <input type="radio" name="linkType" value={t.id} checked={form.linkType === t.id} onChange={() => set("linkType", t.id)} style={{ display: "none" }} />
                    {t.l}
                  </label>
                ))}
              </div>
            </F>
            {form.linkType === "biz" ? (
              <F label="Activité" col="1/-1">
                <select value={form.bizId} onChange={e => set("bizId", e.target.value)}>
                  <option value="">— Aucune (frais général) —</option>
                  {aBiz.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </F>
            ) : (
              <F label="Produit" col="1/-1">
                <select value={form.productId} onChange={e => set("productId", e.target.value)}>
                  <option value="">— Sélectionner un produit —</option>
                  {aProds.map(p => <option key={p.id} value={p.id}>{p.name}{p.bizId ? ` (${bName(p.bizId)})` : ""}</option>)}
                </select>
              </F>
            )}
            <F label="Notes (optionnel)" col="1/-1">
              <input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Détails, justificatif…" />
            </F>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <Btn onClick={() => setModal(null)}>Annuler</Btn>
            <Btn variant="pri" onClick={save} disabled={!form.label.trim() || !form.date}>Enregistrer</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
