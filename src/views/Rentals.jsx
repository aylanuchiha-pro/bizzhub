import { useState, useMemo } from "react";
import { uid, today, active, diffDays, pct, BOOKING_STATUS } from "../utils";
import { euro } from "../utils";
import { Btn, Lbl, F, Bdg, Card, THead, Empty, Confirm, Modal, KPI, SectionTitle } from "../components/ui";

// ─── Badge statut réservation ─────────────────────────────────────
const StatusColors = { confirmee: "#0ea5e9", en_cours: "#d97706", terminee: "#16a34a", annulee: "#9ca3af" };
const StatusBdg = ({ id }) => {
  const s = BOOKING_STATUS.find(x => x.id === id) ?? { l: id };
  return <span style={{ background: StatusColors[id] + "22", color: StatusColors[id], border: `1px solid ${StatusColors[id]}38`, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>{s.l}</span>;
};

// ─── Modal ajout réservation ──────────────────────────────────────
const BookingModal = ({ asset, onConfirm, onClose }) => {
  const [form, setForm] = useState({ sellPrice: "", startDate: today(), endDate: "", status: "confirmee", notes: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const days = diffDays(form.startDate, form.endDate);
  const pN = parseFloat(form.sellPrice) || 0;
  // Coût proportionnel au nombre de jours
  const propCost = days ? (asset.monthlyCost / 30) * days : 0;
  const profit = pN - propCost;

  return (
    <Modal title={`Nouvelle réservation — ${asset.name}`} onClose={onClose} width={440}>
      <div style={{ padding: "10px 14px", background: "var(--surf)", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid var(--brd)" }}>
        Coût mensuel du véhicule : <strong style={{ color: "var(--warn)" }}>{euro(asset.monthlyCost)}</strong>
        {days ? <span style={{ color: "var(--mut)" }}> → coût proportionnel ({days}j) : <strong>{euro(propCost)}</strong></span> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <F label="Prix facturé au client (€)">
          <input type="number" value={form.sellPrice} onChange={e => set("sellPrice", e.target.value)} placeholder="0.00" autoFocus />
        </F>
        <div className="fg2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <F label="Date de début"><input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} /></F>
          <F label="Date de fin"><input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} /></F>
        </div>
        <F label="Statut">
          <select value={form.status} onChange={e => set("status", e.target.value)}>
            {BOOKING_STATUS.map(s => <option key={s.id} value={s.id}>{s.l}</option>)}
          </select>
        </F>
        <F label="Notes (client, remise, remarques…)">
          <input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Nom du client, remarques…" />
        </F>
        {pN > 0 && (
          <div style={{ padding: "12px 14px", background: "var(--acb)", borderRadius: 8, border: "1px solid rgba(79,70,229,.2)", display: "flex", gap: 20 }}>
            {[
              { l: "Revenu", v: euro(pN), c: "var(--ac)" },
              { l: days ? `Coût (${days}j)` : "Coût", v: euro(propCost), c: "var(--warn)" },
              { l: "Bénéfice", v: euro(profit), c: profit >= 0 ? "var(--ok)" : "var(--err)" },
            ].map(x => (
              <div key={x.l}><p style={{ fontSize: 11, color: "var(--mut)" }}>{x.l}</p><p style={{ fontWeight: 700, fontSize: 15, color: x.c }}>{x.v}</p></div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn onClick={onClose}>Annuler</Btn>
          <Btn variant="pri" onClick={() => pN > 0 && form.startDate && onConfirm(form)} disabled={!pN || !form.startDate}>
            Enregistrer
          </Btn>
        </div>
      </div>
    </Modal>
  );
};

// ─── Modal édition asset ──────────────────────────────────────────
const AssetModal = ({ initial, onConfirm, onClose, biz }) => {
  const [form, setForm] = useState(initial ?? { bizId: biz[0]?.id ?? "", name: "", monthlyCost: "", notes: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const aBiz = active(biz);
  return (
    <Modal title={initial ? "Modifier l'actif" : "Nouveau véhicule / actif"} onClose={onClose} width={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <F label="Nom du véhicule ou du bien">
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="ex: Renault Clio, Appartement Paris, Remorque…" autoFocus />
        </F>
        <F label="Coût mensuel que vous payez (€)">
          <input type="number" value={form.monthlyCost} onChange={e => set("monthlyCost", e.target.value)} placeholder="600" />
        </F>
        {aBiz.length > 0 && (
          <F label="Activité liée (optionnel)">
            <select value={form.bizId} onChange={e => set("bizId", e.target.value)}>
              <option value="">— Aucune —</option>
              {aBiz.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </F>
        )}
        <F label="Notes (optionnel)">
          <input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Immatriculation, lieu de départ, infos…" />
        </F>
        {parseFloat(form.monthlyCost) > 0 && (
          <div style={{ padding: "10px 14px", background: "var(--surf)", borderRadius: 8, fontSize: 12, border: "1px solid var(--brd)" }}>
            Coût journalier estimé : <strong style={{ color: "var(--warn)" }}>{euro(parseFloat(form.monthlyCost) / 30)}</strong>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn onClick={onClose}>Annuler</Btn>
          <Btn variant="pri" onClick={() => form.name.trim() && onConfirm({ ...form, monthlyCost: parseFloat(form.monthlyCost) || 0 })} disabled={!form.name.trim()}>
            Enregistrer
          </Btn>
        </div>
      </div>
    </Modal>
  );
};

// ─── Main view ────────────────────────────────────────────────────
export default function Rentals({ rentalAssets, rentalBookings, assetA, bookingA, biz }) {
  const [bookingModal, setBookingModal] = useState(null); // asset obj
  const [assetModal, setAssetModal] = useState(null);     // null | "add" | asset obj
  const [confirm, setConfirm] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null); // filter bookings by asset
  const [editBooking, setEditBooking] = useState(null);

  const aBiz = active(biz);
  const aAssets = active(rentalAssets);
  const aBookings = active(rentalBookings);
  const bizName = id => aBiz.find(b => b.id === id)?.name;
  const bizColor = id => aBiz.find(b => b.id === id)?.color ?? "var(--mut)";

  // Per-asset stats
  const assetStats = useMemo(() => {
    const map = {};
    for (const a of aAssets) {
      const bs = aBookings.filter(b => b.assetId === a.id);
      const revenue = bs.reduce((s, b) => s + b.sellPrice, 0);
      const totalDays = bs.reduce((s, b) => s + (diffDays(b.startDate, b.endDate) || 0), 0);
      const propCost = (a.monthlyCost / 30) * totalDays;
      map[a.id] = { revenue, propCost, profit: revenue - propCost, count: bs.length, totalDays };
    }
    return map;
  }, [aAssets, aBookings]);

  // Global KPIs
  const globalRevenue = Object.values(assetStats).reduce((s, x) => s + x.revenue, 0);
  const globalCost = Object.values(assetStats).reduce((s, x) => s + x.propCost, 0);
  const globalProfit = globalRevenue - globalCost;

  const handleAddBooking = (asset, form) => {
    bookingA.add({ id: uid(), assetId: asset.id, sellPrice: parseFloat(form.sellPrice) || 0, startDate: form.startDate, endDate: form.endDate || null, status: form.status, notes: form.notes, deletedAt: null });
    setBookingModal(null);
  };

  const handleAssetSave = (form) => {
    if (assetModal === "add") assetA.add({ id: uid(), ...form, deletedAt: null });
    else assetA.update({ ...assetModal, ...form });
    setAssetModal(null);
  };

  const softDelAsset = a => setConfirm({
    msg: `Supprimer "${a.name}" ?`,
    sub: `${aBookings.filter(b => b.assetId === a.id).length} réservation(s) liée(s) seront aussi supprimées.`,
    onOk: () => {
      assetA.softDel(a.id);
      aBookings.filter(b => b.assetId === a.id).forEach(b => bookingA.softDel(b.id));
      setConfirm(null);
      if (selectedAsset?.id === a.id) setSelectedAsset(null);
    }
  });

  const softDelBooking = b => setConfirm({
    msg: "Supprimer cette réservation ?",
    onOk: () => { bookingA.softDel(b.id); setConfirm(null); }
  });

  const updateBookingStatus = (b, status) => bookingA.update({ ...b, status });

  const displayedBookings = aBookings
    .filter(b => !selectedAsset || b.assetId === selectedAsset.id)
    .sort((a, b_) => (b_.startDate || "").localeCompare(a.startDate || ""));

  return (
    <div>
      {/* KPIs */}
      <div className="kpis" style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <KPI label="Revenus totaux (locations)" value={euro(globalRevenue)} color="var(--ac)" top />
        <KPI label="Coûts proportionnels" value={euro(globalCost)} color="var(--warn)" sub="basé sur les jours loués" />
        <KPI label="Bénéfice net locations" value={euro(globalProfit)} color={globalProfit >= 0 ? "var(--ok)" : "var(--err)"} />
        <KPI label="Véhicules / actifs" value={aAssets.length} sub={`${aBookings.length} réservation(s) au total`} />
      </div>

      {/* Explainer */}
      <div style={{ padding: "12px 16px", background: "var(--acb)", border: "1px solid rgba(79,70,229,.2)", borderRadius: 10, marginBottom: 20, fontSize: 12, color: "var(--sub)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--ac)" }}>Comment ça marche :</strong> Ajoutez d'abord un actif (ex: Renault Clio — 600€/mois). Ensuite créez autant de réservations que vous voulez dessus (un weekend à 60€, une semaine à 400€…). Le bénéfice est calculé au prorata des jours : <em>revenu − (coût mensuel / 30 × jours)</em>.
      </div>

      {/* Assets section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <SectionTitle>Mes véhicules & actifs ({aAssets.length})</SectionTitle>
        <Btn variant="pri" onClick={() => setAssetModal("add")}>+ Ajouter un actif</Btn>
      </div>

      {aAssets.length === 0 ? (
        <Empty icon="🚗" text="Aucun actif locatif. Commencez par ajouter votre véhicule ou bien." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 28 }}>
          {aAssets.map(a => {
            const s = assetStats[a.id] || {};
            const isSelected = selectedAsset?.id === a.id;
            const bn = bizName(a.bizId);
            return (
              <Card key={a.id} style={{ padding: "18px 20px", cursor: "pointer", borderTop: `3px solid ${isSelected ? "var(--ac)" : "var(--brd)"}`, transition: "border-top-color .15s" }}
                onClick={() => setSelectedAsset(isSelected ? null : a)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</p>
                    {bn && <Bdg label={bn} color={bizColor(a.bizId)} sm />}
                    {a.notes && <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 4 }}>{a.notes}</p>}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--warn)", fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{euro(a.monthlyCost)}<span style={{ fontSize: 10, fontWeight: 400, color: "var(--mut)" }}>/mois</span></p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  {[
                    { l: "Revenus", v: euro(s.revenue || 0), c: "var(--ac)" },
                    { l: "Bénéfice", v: euro(s.profit || 0), c: (s.profit || 0) >= 0 ? "var(--ok)" : "var(--err)" },
                    { l: "Réservations", v: s.count || 0, c: "var(--txt)" },
                    { l: "Jours loués", v: `${s.totalDays || 0}j`, c: "var(--sub)" },
                  ].map(x => (
                    <div key={x.l} style={{ background: "var(--surf)", borderRadius: 8, padding: "8px 10px" }}>
                      <p style={{ fontSize: 10, color: "var(--mut)", marginBottom: 2 }}>{x.l}</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: x.c }}>{x.v}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn sm variant="success" onClick={e => { e.stopPropagation(); setBookingModal(a); }}>+ Réservation</Btn>
                  <Btn sm variant="ghost" onClick={e => { e.stopPropagation(); setAssetModal(a); }}>Éditer</Btn>
                  <Btn sm variant="err" onClick={e => { e.stopPropagation(); softDelAsset(a); }}>Suppr.</Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bookings table */}
      {aAssets.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <SectionTitle>
              Réservations
              {selectedAsset ? ` — ${selectedAsset.name}` : ` (toutes)`}
            </SectionTitle>
            {selectedAsset && (
              <Btn sm variant="ghost" onClick={() => setSelectedAsset(null)}>Voir tout ✕</Btn>
            )}
          </div>

          {displayedBookings.length === 0 ? (
            <Empty text={selectedAsset ? `Aucune réservation pour ${selectedAsset.name}.` : "Aucune réservation enregistrée."} />
          ) : (
            <Card style={{ overflow: "hidden" }}>
              <div className="tbl-wrap">
                <table style={{ width: "100%", fontSize: 13, minWidth: 760 }}>
                  <THead cols={["Actif", "Période", "Durée", "Prix client", "Coût prop.", "Bénéfice", "Statut", ""]} />
                  <tbody>
                    {displayedBookings.map(b => {
                      const asset = aAssets.find(a => a.id === b.assetId);
                      const days = diffDays(b.startDate, b.endDate);
                      const propCost = days && asset ? (asset.monthlyCost / 30) * days : 0;
                      const profit = b.sellPrice - propCost;
                      return (
                        <tr key={b.id} style={{ borderTop: "1px solid var(--brd)" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <p style={{ fontWeight: 500 }}>{asset?.name ?? "—"}</p>
                            {b.notes && <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 2 }}>{b.notes}</p>}
                          </td>
                          <td style={{ padding: "12px 16px", color: "var(--sub)", fontSize: 12, whiteSpace: "nowrap" }}>
                            {b.startDate ? new Date(b.startDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—"}
                            {b.endDate ? <><br /><span style={{ color: "var(--mut)" }}>→ {new Date(b.endDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span></> : null}
                          </td>
                          <td style={{ padding: "12px 16px", color: "var(--sub)" }}>{days !== null ? `${days}j` : "—"}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 500, whiteSpace: "nowrap" }}>{euro(b.sellPrice)}</td>
                          <td style={{ padding: "12px 16px", color: "var(--warn)", whiteSpace: "nowrap" }}>{days ? euro(propCost) : "—"}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 600, color: profit >= 0 ? "var(--ok)" : "var(--err)", whiteSpace: "nowrap" }}>
                            {days ? euro(profit) : <span style={{ color: "var(--mut)", fontWeight: 400 }}>Ajoutez date fin</span>}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <select value={b.status} onChange={e => updateBookingStatus(b, e.target.value)}
                              style={{ width: "auto", padding: "4px 8px", fontSize: 11, borderRadius: 6, background: "var(--surf)", border: "1px solid var(--brd)", color: "var(--txt)", cursor: "pointer" }}>
                              {BOOKING_STATUS.map(s => <option key={s.id} value={s.id}>{s.l}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <Btn sm variant="err" onClick={() => softDelBooking(b)}>Suppr.</Btn>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "10px 18px", borderTop: "1px solid var(--brd)", fontSize: 12, color: "var(--mut)" }}>
                {displayedBookings.length} réservation(s) ·{" "}
                Revenus : <strong style={{ color: "var(--ac)" }}>{euro(displayedBookings.reduce((s, b) => s + b.sellPrice, 0))}</strong>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Modals */}
      {confirm && <Confirm {...confirm} onCancel={() => setConfirm(null)} />}
      {bookingModal && <BookingModal asset={bookingModal} onConfirm={form => handleAddBooking(bookingModal, form)} onClose={() => setBookingModal(null)} />}
      {assetModal && <AssetModal initial={assetModal === "add" ? null : assetModal} onConfirm={handleAssetSave} onClose={() => setAssetModal(null)} biz={biz} />}
    </div>
  );
}
