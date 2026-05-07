import { useState } from "react";
import { uid, today, active, PALETTE, euro, fmtDate } from "../utils";
import { Btn, Lbl, F, Card, Empty, Confirm, Divider, Modal } from "../components/ui";

const ExpModal = ({ biz, bizExpenses, bizExpenseA, onClose }) => {
  const [label,  setLabel]  = useState("");
  const [amount, setAmount] = useState("");
  const [date,   setDate]   = useState(today());
  const [notes,  setNotes]  = useState("");

  const bizExp    = active(bizExpenses || []).filter(e => e.bizId === biz.id).sort((a, b) => b.date.localeCompare(a.date));
  const totalExp  = bizExp.reduce((a, e) => a + (e.amount || 0), 0);

  const add = () => {
    const a = parseFloat(amount);
    if (!label.trim() || !a || a <= 0) return;
    bizExpenseA.add({ id: uid(), bizId: biz.id, productId: null, label: label.trim(), amount: a, date, notes, deletedAt: null });
    setLabel(""); setAmount(""); setDate(today()); setNotes("");
  };

  return (
    <Modal title={`Frais — ${biz.name}`} onClose={onClose} width={520}>
      <div style={{ display: "flex", gap: 0, background: "var(--acb)", borderRadius: 12, marginBottom: 20, border: "1px solid rgba(79,70,229,.15)", overflow: "hidden" }}>
        {[
          { l: "Total des frais", v: euro(totalExp), c: totalExp > 0 ? "var(--err)" : "var(--mut)" },
          { l: "Nombre de frais",  v: bizExp.length, c: "var(--sub)" },
        ].map((x, i) => (
          <div key={i} style={{ flex: 1, padding: "14px 18px", borderRight: i < 1 ? "1px solid rgba(79,70,229,.15)" : "none" }}>
            <p style={{ fontSize: 10, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>{x.l}</p>
            <p style={{ fontWeight: 700, fontSize: 15, color: x.c }}>{x.v}</p>
          </div>
        ))}
      </div>

      {bizExp.length === 0
        ? <p style={{ fontSize: 13, color: "var(--mut)", textAlign: "center", padding: "18px 0 22px" }}>Aucun frais enregistré pour cette activité.</p>
        : (
          <div style={{ marginBottom: 20, border: "1px solid var(--brd)", borderRadius: 10, overflow: "hidden" }}>
            {bizExp.map((e, i) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderTop: i > 0 ? "1px solid var(--brd)" : "none" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>{e.label}</p>
                  <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 1 }}>{fmtDate(e.date)}{e.notes ? ` · ${e.notes}` : ""}</p>
                </div>
                <p style={{ fontWeight: 600, color: "var(--err)", whiteSpace: "nowrap" }}>−{euro(e.amount)}</p>
                <Btn sm variant="err" onClick={() => bizExpenseA.softDel(e.id)}>×</Btn>
              </div>
            ))}
          </div>
        )
      }

      <div style={{ background: "var(--surf)", borderRadius: 10, border: "1px solid var(--brd)", padding: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--sub)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>Ajouter un frais</p>
        <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="ex: Essence, Emballages, Transport…" style={{ flex: "1 1 160px" }} />
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant (€)" style={{ width: 130, flex: "0 0 130px" }} onKeyDown={e => e.key === "Enter" && add()} />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: "0 0 150px" }} />
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optionnel)" style={{ flex: 1 }} />
          <Btn variant="pri" onClick={add} disabled={!label.trim() || !amount || parseFloat(amount) <= 0}>+ Ajouter</Btn>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <Btn onClick={onClose}>Fermer</Btn>
      </div>
    </Modal>
  );
};

export default function Businesses({ biz, bizA, prods, sales, rentalAssets, deleteBiz, bizExpenses, bizExpenseA }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [err, setErr] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [editBiz, setEditBiz] = useState(null);
  const [expBiz, setExpBiz] = useState(null);
  const aBiz = active(biz);

  const saveEdit = () => {
    if (!editBiz.name.trim()) return;
    bizA.update({ ...editBiz, name: editBiz.name.trim() });
    setEditBiz(null);
  };

  const add = () => {
    if (!name.trim()) { setErr(true); return; }
    bizA.add({ id: uid(), name: name.trim(), color, deletedAt: null });
    setName(""); setColor(PALETTE[aBiz.length % PALETTE.length]); setErr(false);
  };

  const askDel = b => {
    const pCount = active(prods).filter(p => p.bizId === b.id).length;
    const sCount = active(sales).filter(s => s.bizId === b.id).length;
    const rCount = active(rentalAssets).filter(r => r.bizId === b.id).length;
    setConfirm({
      msg: `Supprimer l'activité "${b.name}" ?`,
      sub: `${pCount} produit(s), ${sCount} vente(s) et ${rCount} location(s) associés seront aussi déplacés dans la corbeille.`,
      onOk: () => { deleteBiz(b.id); setConfirm(null); }
    });
  };

  const bizExpCount = id => active(bizExpenses || []).filter(e => e.bizId === id).length;

  return (
    <div style={{ maxWidth: 640 }}>
      <Card style={{ padding: 24, marginBottom: 18 }}>
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Ajouter une activité</p>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Lbl>Nom de l'activité</Lbl>
            <input value={name} onChange={e => { setName(e.target.value); setErr(false); }}
              placeholder="ex: Vente de vêtements, Développement web, Ebooks…"
              style={err ? { borderColor: "var(--err)" } : {}}
              onKeyDown={e => e.key === "Enter" && add()} />
          </div>
          <div>
            <Lbl>Couleur</Lbl>
            <div style={{ display: "flex", gap: 5 }}>
              {PALETTE.slice(0, 9).map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: 6, background: c, border: `2.5px solid ${color === c ? "#000" : "transparent"}`, cursor: "pointer", transition: "border .1s" }} />
              ))}
            </div>
          </div>
          <Btn variant="pri" onClick={add}>Ajouter</Btn>
        </div>
      </Card>

      {aBiz.length === 0 ? <Empty icon="◇" text="Aucune activité. Ajoutez votre première activité ci-dessus." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {aBiz.map(b => {
            const pCount = active(prods).filter(p => p.bizId === b.id).length;
            const sCount = active(sales).filter(s => s.bizId === b.id).length;
            const rCount = active(rentalAssets).filter(r => r.bizId === b.id).length;
            const eCount = bizExpCount(b.id);
            return (
              <Card key={b.id} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: b.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: 13, height: 13, borderRadius: "50%", background: b.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600 }}>{b.name}</p>
                  <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 2 }}>
                    {pCount} produit(s) · {sCount} vente(s) · {rCount} location(s)
                    {eCount > 0 && <span style={{ color: "var(--err)" }}> · {eCount} frais</span>}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn sm variant="warn" onClick={() => setExpBiz(b)}>Frais{eCount > 0 ? ` (${eCount})` : ""}</Btn>
                  <Btn sm variant="ghost" onClick={() => setEditBiz({ id: b.id, name: b.name, color: b.color })}>Éditer</Btn>
                  <Btn sm variant="err" onClick={() => askDel(b)}>Supprimer</Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {confirm && <Confirm {...confirm} onCancel={() => setConfirm(null)} />}

      {expBiz && (
        <ExpModal
          biz={expBiz}
          bizExpenses={bizExpenses}
          bizExpenseA={bizExpenseA}
          onClose={() => setExpBiz(null)}
        />
      )}

      {editBiz && (
        <Modal title="Modifier l'activité" onClose={() => setEditBiz(null)} width={400}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <F label="Nom">
              <input value={editBiz.name} onChange={e => setEditBiz(b => ({ ...b, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && saveEdit()} autoFocus />
            </F>
            <div>
              <Lbl>Couleur</Lbl>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {PALETTE.map(c => (
                  <button key={c} onClick={() => setEditBiz(b => ({ ...b, color: c }))} style={{ width: 26, height: 26, borderRadius: 6, background: c, border: `2.5px solid ${editBiz.color === c ? "#000" : "transparent"}`, cursor: "pointer", transition: "border .1s" }} />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Btn onClick={() => setEditBiz(null)}>Annuler</Btn>
              <Btn variant="pri" onClick={saveEdit} disabled={!editBiz.name.trim()}>Enregistrer</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
