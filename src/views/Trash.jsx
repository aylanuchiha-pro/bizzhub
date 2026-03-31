import { trashed, daysLeft, active } from "../utils";
import { euro } from "../utils";
import { Btn, Card, Empty, Confirm, SectionTitle, CatBdg } from "../components/ui";
import { useState } from "react";
import { BOOKING_STATUS } from "../utils";

export default function Trash({ biz, bizA, prods, prodA, sales, saleA, rentalAssets, assetA, rentalBookings, bookingA, subs, subA }) {
  const [confirm, setConfirm] = useState(null);

  const tBiz       = trashed(biz);
  const tProd      = trashed(prods);
  const tSales     = trashed(sales);
  const tAssets    = trashed(rentalAssets);
  const tBookings  = trashed(rentalBookings);
  const tSubs      = trashed(subs);
  const total      = tBiz.length + tProd.length + tSales.length + tAssets.length + tBookings.length + tSubs.length;

  const purgeAll = () => setConfirm({
    msg: "Vider la corbeille définitivement ?",
    sub: "Tous les éléments seront effacés de façon permanente. Irréversible.",
    onOk: async () => {
      for (const x of tBiz)      await bizA.hardDel(x.id);
      for (const x of tProd)     await prodA.hardDel(x.id);
      for (const x of tSales)    await saleA.hardDel(x.id);
      for (const x of tAssets)   await assetA.hardDel(x.id);
      for (const x of tBookings) await bookingA.hardDel(x.id);
      for (const x of tSubs)     await subA.hardDel(x.id);
      setConfirm(null);
    }
  });

  const Row = ({ item, onRestore, onHardDel, children }) => (
    <div style={{ borderTop: "1px solid var(--brd)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--warn)", whiteSpace: "nowrap" }}>
          {daysLeft(item.deletedAt)}j restant{daysLeft(item.deletedAt) > 1 ? "s" : ""}
        </span>
        <Btn sm variant="warn" onClick={() => onRestore(item.id)}>Restaurer</Btn>
        <Btn sm variant="err" onClick={() => setConfirm({ msg: "Supprimer définitivement ?", onOk: () => { onHardDel(item.id); setConfirm(null); } })}>Purger</Btn>
      </div>
    </div>
  );

  const Section = ({ title, items, onRestore, onHardDel, renderRow }) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: 20 }}>
        <SectionTitle>{title} ({items.length})</SectionTitle>
        <Card style={{ overflow: "hidden" }}>
          {items.map(item => (
            <Row key={item.id} item={item} onRestore={onRestore} onHardDel={onHardDel}>
              {renderRow(item)}
            </Row>
          ))}
        </Card>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <p style={{ fontSize: 13, color: "var(--sub)" }}>{total} élément(s) — suppression automatique après 30 jours</p>
        {total > 0 && <Btn variant="err" onClick={purgeAll}>Vider la corbeille</Btn>}
      </div>

      {total === 0 ? <Empty icon="◌" text="La corbeille est vide." /> : (
        <>
          <Section title="Activités" items={tBiz}
            onRestore={id => bizA.restore(id)} onHardDel={id => bizA.hardDel(id)}
            renderRow={b => (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: b.color, flexShrink: 0 }} />
                <p style={{ fontWeight: 500 }}>{b.name}</p>
              </div>
            )}
          />
          <Section title="Produits" items={tProd}
            onRestore={id => prodA.restore(id)} onHardDel={id => prodA.hardDel(id)}
            renderRow={p => (
              <>
                <p style={{ fontWeight: 500 }}>{p.name}</p>
                <div style={{ marginTop: 4, display: "flex", gap: 6 }}>
                  <CatBdg id={p.category} />
                  {p.category === "physical" && <span style={{ fontSize: 11, color: "var(--mut)" }}>{p.stock} {p.unit}</span>}
                </div>
              </>
            )}
          />
          <Section title="Ventes" items={tSales}
            onRestore={id => saleA.restore(id)} onHardDel={id => saleA.hardDel(id)}
            renderRow={s => (
              <>
                <p style={{ fontWeight: 500 }}>{s.name}</p>
                <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 2 }}>
                  {s.date ? new Date(s.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" }) : ""}
                  {" · "}{s.qty} × {euro(s.sellPrice)}
                </p>
              </>
            )}
          />
          <Section title="Actifs locatifs" items={tAssets}
            onRestore={id => assetA.restore(id)} onHardDel={id => assetA.hardDel(id)}
            renderRow={a => (
              <>
                <p style={{ fontWeight: 500 }}>{a.name}</p>
                <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 2 }}>{euro(a.monthlyCost)}/mois</p>
              </>
            )}
          />
          <Section title="Réservations" items={tBookings}
            onRestore={id => bookingA.restore(id)} onHardDel={id => bookingA.hardDel(id)}
            renderRow={b => {
              const s = BOOKING_STATUS.find(x => x.id === b.status)?.l ?? b.status;
              return (
                <>
                  <p style={{ fontWeight: 500 }}>{euro(b.sellPrice)}</p>
                  <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 2 }}>{b.startDate} → {b.endDate || "?"} · {s}</p>
                </>
              );
            }}
          />
          <Section title="Abonnements" items={tSubs}
            onRestore={id => subA.restore(id)} onHardDel={id => subA.hardDel(id)}
            renderRow={s => (
              <>
                <p style={{ fontWeight: 500 }}>{s.name}</p>
                <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 2 }}>{euro(s.amount)} / {s.cycle}</p>
              </>
            )}
          />
        </>
      )}

      {confirm && <Confirm {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
