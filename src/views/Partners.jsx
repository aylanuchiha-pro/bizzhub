import { useState } from "react";
import { uid, today, active } from "../utils";
import { euro } from "../utils";
import { Btn, Lbl, F, Card, THead, Empty, Confirm, Modal, SectionTitle } from "../components/ui";

export default function Partners({ partners, partnerA, sales, salePartners, spA, payments, paymentA, biz }) {
  const [addName, setAddName] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [err, setErr] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [payModal, setPayModal] = useState(null); // partner obj
  const [payAmt, setPayAmt] = useState("");
  const [payDate, setPayDate] = useState(today());
  const [payNotes, setPayNotes] = useState("");
  const [detailModal, setDetailModal] = useState(null);

  const aPartners = active(partners);
  const aSales = active(sales);

  const addPartner = () => {
    if (!addName.trim()) { setErr(true); return; }
    partnerA.add({ id: uid(), name: addName.trim(), notes: addNotes.trim(), deletedAt: null });
    setAddName(""); setAddNotes(""); setErr(false);
  };

  const softDel = p => setConfirm({
    msg: `Supprimer le partenaire "${p.name}" ?`,
    sub: "Ses données de commission seront aussi supprimées.",
    onOk: () => { partnerA.softDel(p.id); setConfirm(null); }
  });

  const getStats = partnerId => {
    const activeSaleIds = new Set(aSales.map(s => s.id));
    const pSales = salePartners.filter(sp => sp.partnerId === partnerId && activeSaleIds.has(sp.saleId));
    const totalDue = pSales.reduce((a, sp) => a + sp.amountDue, 0);
    const totalPaid = (payments || []).filter(p => p.partnerId === partnerId).reduce((a, p) => a + p.amount, 0);
    return { totalDue, totalPaid, balance: totalDue - totalPaid, count: pSales.length };
  };

  const openPayModal = p => {
    setPayModal(p); setPayAmt(""); setPayDate(today()); setPayNotes("");
  };

  const submitPayment = () => {
    if (!payAmt || isNaN(parseFloat(payAmt))) return;
    paymentA.add({ id: uid(), partnerId: payModal.id, amount: parseFloat(payAmt), date: payDate, notes: payNotes.trim() });
    setPayModal(null);
  };

  // Detail: sales linked to a partner
  const getPartnerSales = partnerId => {
    const pSales = salePartners.filter(sp => sp.partnerId === partnerId);
    return pSales.map(sp => {
      const sale = aSales.find(s => s.id === sp.saleId);
      return sale ? { ...sp, sale } : null;
    }).filter(Boolean);
  };

  const partnerPayments = partnerId => (payments || []).filter(p => p.partnerId === partnerId).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      {/* Add partner */}
      <Card style={{ padding: 22, marginBottom: 18, maxWidth: 560 }}>
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Ajouter un partenaire</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Lbl>Nom du partenaire</Lbl>
            <input value={addName} onChange={e => { setAddName(e.target.value); setErr(false); }}
              placeholder="Prénom ou nom de l'associé…"
              style={err ? { borderColor: "var(--err)" } : {}}
              onKeyDown={e => e.key === "Enter" && addPartner()} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Lbl>Notes (optionnel)</Lbl>
            <input value={addNotes} onChange={e => setAddNotes(e.target.value)} placeholder="Rôle, contact…" onKeyDown={e => e.key === "Enter" && addPartner()} />
          </div>
          <Btn variant="pri" onClick={addPartner}>Ajouter</Btn>
        </div>
      </Card>

      {aPartners.length === 0 ? (
        <Empty icon="◈" text="Aucun partenaire. Ajoutez votre premier associé ci-dessus." />
      ) : (
        <div>
          <SectionTitle>Partenaires & balances</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {aPartners.map(p => {
              const s = getStats(p.id);
              return (
                <Card key={p.id} style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--acb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "var(--ac)", flexShrink: 0 }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600 }}>{p.name}</p>
                      {p.notes && <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 1 }}>{p.notes}</p>}
                      <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 3 }}>{s.count} vente(s) impliquée(s)</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 12, color: "var(--mut)" }}>Total dû</p>
                      <p style={{ fontWeight: 700, fontSize: 16, color: "var(--warn)" }}>{euro(s.totalDue)}</p>
                      <p style={{ fontSize: 11, color: s.balance > 0 ? "var(--err)" : "var(--ok)", marginTop: 2 }}>
                        Solde : {euro(s.balance)}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    <Btn sm onClick={() => setDetailModal(p)}>Voir les ventes</Btn>
                    <Btn sm variant="success" onClick={() => openPayModal(p)}>Enregistrer un paiement</Btn>
                    <Btn sm variant="err" onClick={() => softDel(p)}>Supprimer</Btn>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {detailModal && (() => {
        const ps = getPartnerSales(detailModal.id);
        const pmts = partnerPayments(detailModal.id);
        const stats = getStats(detailModal.id);
        const bN = id => (biz || []).find(b => b.id === id)?.name ?? "—";
        return (
          <Modal title={`Ventes — ${detailModal.name}`} onClose={() => setDetailModal(null)} width={660}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
              {[
                { l: "Total dû", v: euro(stats.totalDue), c: "var(--warn)" },
                { l: "Déjà versé", v: euro(stats.totalPaid), c: "var(--ok)" },
                { l: "Solde restant", v: euro(stats.balance), c: stats.balance > 0 ? "var(--err)" : "var(--ok)" },
              ].map((x, i) => (
                <div key={i} style={{ padding: "10px 14px", background: "var(--surf)", borderRadius: 8, border: "1px solid var(--brd)", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "var(--mut)", marginBottom: 4 }}>{x.l}</p>
                  <p style={{ fontWeight: 700, color: x.c, fontSize: 15 }}>{x.v}</p>
                </div>
              ))}
            </div>
            {ps.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Ventes impliquées ({ps.length})</p>
                <div className="tbl-wrap">
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 440 }}>
                    <THead cols={["Désignation", "Activité", "Date", "CA", "Part", "Montant dû"]} />
                    <tbody>
                      {ps.map((sp, i) => (
                        <tr key={i} style={{ borderTop: "1px solid var(--brd)" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 500 }}>{sp.sale.name}</td>
                          <td style={{ padding: "10px 14px", color: "var(--sub)" }}>{bN(sp.sale.bizId)}</td>
                          <td style={{ padding: "10px 14px", color: "var(--mut)", whiteSpace: "nowrap" }}>
                            {new Date(sp.sale.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}
                          </td>
                          <td style={{ padding: "10px 14px", color: "var(--ac)", fontWeight: 500 }}>{euro(sp.sale.sellPrice * sp.sale.qty)}</td>
                          <td style={{ padding: "10px 14px", color: "var(--sub)" }}>{sp.sharePct}%</td>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--warn)" }}>{euro(sp.amountDue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "var(--mut)", textAlign: "center", padding: "20px 0" }}>Aucune vente liée à ce partenaire.</p>
            )}
            {pmts.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Paiements versés ({pmts.length})</p>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <THead cols={["Date", "Montant", "Notes"]} />
                  <tbody>
                    {pmts.map(pm => (
                      <tr key={pm.id} style={{ borderTop: "1px solid var(--brd)" }}>
                        <td style={{ padding: "10px 14px", color: "var(--mut)", whiteSpace: "nowrap" }}>
                          {new Date(pm.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--ok)" }}>{euro(pm.amount)}</td>
                        <td style={{ padding: "10px 14px", color: "var(--mut)" }}>{pm.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <Btn variant="success" onClick={() => { setDetailModal(null); openPayModal(detailModal); }}>Enregistrer un paiement</Btn>
              <Btn onClick={() => setDetailModal(null)}>Fermer</Btn>
            </div>
          </Modal>
        );
      })()}

      {confirm && <Confirm {...confirm} onCancel={() => setConfirm(null)} />}

      {payModal && (
        <Modal title={`Paiement à ${payModal.name}`} onClose={() => setPayModal(null)} width={400}>
          {(() => { const s = getStats(payModal.id); return (
            <div style={{ padding: "12px 14px", background: "var(--surf)", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid var(--brd)" }}>
              Solde actuel : <strong style={{ color: s.balance > 0 ? "var(--err)" : "var(--ok)" }}>{euro(s.balance)}</strong>
            </div>
          );})()}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <F label="Montant versé (€)">
              <input type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)} placeholder="0.00" autoFocus />
            </F>
            <F label="Date du paiement">
              <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
            </F>
            <F label="Notes (optionnel)">
              <input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="Virement, espèces, PayPal…" />
            </F>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Btn onClick={() => setPayModal(null)}>Annuler</Btn>
              <Btn variant="pri" onClick={submitPayment} disabled={!payAmt || isNaN(parseFloat(payAmt))}>Enregistrer</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
