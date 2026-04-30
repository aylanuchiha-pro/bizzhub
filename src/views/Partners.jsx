import { useState } from "react";
import { uid, today, active } from "../utils";
import { euro } from "../utils";
import { Btn, Lbl, F, Card, THead, Empty, Confirm, Modal, SectionTitle } from "../components/ui";

export default function Partners({ partners, partnerA, sales, salePartners, spA, payments, paymentA }) {
  const [addName, setAddName] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [err, setErr] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [payModal, setPayModal] = useState(null); // partner obj
  const [payAmt, setPayAmt] = useState("");
  const [payDate, setPayDate] = useState(today());
  const [payNotes, setPayNotes] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null); // for detail view

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
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Partners list */}
          <div style={{ flex: "1 1 320px" }}>
            <SectionTitle>Partenaires & balances</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {aPartners.map(p => {
                const s = getStats(p.id);
                const isSelected = selectedPartner?.id === p.id;
                return (
                  <Card key={p.id} style={{ padding: "16px 20px", cursor: "pointer", borderLeft: isSelected ? "3px solid var(--ac)" : "3px solid transparent" }}
                    onClick={() => setSelectedPartner(isSelected ? null : p)}>
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
                      <Btn sm variant="success" onClick={e => { e.stopPropagation(); openPayModal(p); }}>Enregistrer un paiement</Btn>
                      <Btn sm variant="err" onClick={e => { e.stopPropagation(); softDel(p); }}>Supprimer</Btn>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          {selectedPartner && (
            <div style={{ flex: "1 1 320px" }}>
              <SectionTitle>Détail — {selectedPartner.name}</SectionTitle>

              {/* Sales linked */}
              {getPartnerSales(selectedPartner.id).length > 0 && (
                <Card style={{ overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--brd)" }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>Ventes impliquées</p>
                  </div>
                  <div className="tbl-wrap">
                    <table style={{ width: "100%", fontSize: 12, minWidth: 380 }}>
                      <THead cols={["Vente", "Date", "Part", "Montant dû"]} />
                      <tbody>
                        {getPartnerSales(selectedPartner.id).map((sp, i) => (
                          <tr key={i} style={{ borderTop: "1px solid var(--brd)" }}>
                            <td style={{ padding: "10px 14px", fontWeight: 500 }}>{sp.sale.name}</td>
                            <td style={{ padding: "10px 14px", color: "var(--mut)", whiteSpace: "nowrap" }}>
                              {new Date(sp.sale.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}
                            </td>
                            <td style={{ padding: "10px 14px", color: "var(--sub)" }}>{sp.sharePct}%</td>
                            <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--warn)" }}>{euro(sp.amountDue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Payments made */}
              {partnerPayments(selectedPartner.id).length > 0 && (
                <Card style={{ overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--brd)" }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>Paiements versés</p>
                  </div>
                  <table style={{ width: "100%", fontSize: 12 }}>
                    <THead cols={["Date", "Montant", "Notes"]} />
                    <tbody>
                      {partnerPayments(selectedPartner.id).map(pm => (
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
                </Card>
              )}

              {getPartnerSales(selectedPartner.id).length === 0 && partnerPayments(selectedPartner.id).length === 0 && (
                <Empty text="Aucune vente ou paiement lié à ce partenaire." />
              )}
            </div>
          )}
        </div>
      )}

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
