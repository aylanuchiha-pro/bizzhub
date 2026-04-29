import { useState } from "react";
import { uid, active, PALETTE } from "../utils";
import { Btn, Lbl, Card, Empty, Confirm, Divider } from "../components/ui";

export default function Businesses({ biz, bizA, prods, sales, rentalAssets, deleteBiz }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [err, setErr] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const aBiz = active(biz);

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
            return (
              <Card key={b.id} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: b.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: 13, height: 13, borderRadius: "50%", background: b.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600 }}>{b.name}</p>
                  <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 2 }}>{pCount} produit(s) · {sCount} vente(s) · {rCount} location(s)</p>
                </div>
                <Btn sm variant="err" onClick={() => askDel(b)}>Supprimer</Btn>
              </Card>
            );
          })}
        </div>
      )}
      {confirm && <Confirm {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
