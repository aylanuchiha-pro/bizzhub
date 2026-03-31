import { useState } from "react";
import { uid, today, active, CYCLES, cycleMonthly } from "../utils";
import { euro } from "../utils";
import { Btn, F, Bdg, Card, THead, Empty, Confirm, Modal, KPI } from "../components/ui";

const emptyForm = { bizId: "", name: "", amount: "", cycle: "monthly", nextDate: "", active: true, notes: "" };

export default function Subscriptions({ subs, subA, biz }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirm, setConfirm] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const aBiz = active(biz);
  const bN = id => aBiz.find(b => b.id === id)?.name;
  const bC = id => aBiz.find(b => b.id === id)?.color ?? "var(--mut)";

  const aSubs = active(subs);
  const activeSubs = aSubs.filter(s => s.active);

  const monthlyTotal = activeSubs.reduce((a, s) => a + cycleMonthly(s.amount, s.cycle), 0);
  const annualTotal = monthlyTotal * 12;

  const openAdd = () => { setForm(emptyForm); setModal("add"); };
  const openEdit = s => { setForm({ ...s, amount: String(s.amount) }); setModal(s); };

  const save = () => {
    if (!form.name.trim()) return;
    const obj = { ...form, id: typeof modal === "string" ? uid() : modal.id, amount: parseFloat(form.amount) || 0, deletedAt: null };
    if (typeof modal === "string") subA.add(obj);
    else subA.update(obj);
    setModal(null);
  };

  const softDel = s => setConfirm({
    msg: `Supprimer l'abonnement "${s.name}" ?`,
    onOk: () => { subA.softDel(s.id); setConfirm(null); }
  });

  const toggleActive = s => subA.update({ ...s, active: !s.active });

  const cycleLabel = c => CYCLES.find(x => x.id === c)?.l ?? c;

  // Alert: billing in next 7 days
  const today_ = today();
  const upcoming = aSubs.filter(s => s.active && s.nextDate && s.nextDate >= today_ && s.nextDate <= new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0]);

  return (
    <div>
      <div className="kpis" style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPI label="Charges mensuelles" value={euro(monthlyTotal)} color="var(--warn)" sub={`${activeSubs.length} abonnement(s) actif(s)`} />
        <KPI label="Charges annuelles" value={euro(annualTotal)} sub="projection annuelle" />
        {upcoming.length > 0 && <KPI label="Prélèvements à venir (7j)" value={upcoming.length} color="var(--err)" sub={upcoming.map(s => s.name).join(", ")} />}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <Btn variant="pri" onClick={openAdd}>+ Ajouter un abonnement</Btn>
      </div>

      {aSubs.length === 0 ? (
        <Empty icon="↻" text="Aucun abonnement enregistré. Ajoutez vos charges récurrentes (ChatGPT, Claude, outils, logiciels…)." />
      ) : (
        <Card style={{ overflow: "hidden" }}>
          <div className="tbl-wrap">
            <table style={{ width: "100%", fontSize: 13, minWidth: 640 }}>
              <THead cols={["Abonnement", "Activité liée", "Montant", "Fréquence", "Mensuel", "Prochain prélèvement", "Statut", ""]} />
              <tbody>
                {aSubs.map(s => {
                  const monthly = cycleMonthly(s.amount, s.cycle);
                  const isUpcoming = s.active && s.nextDate && s.nextDate >= today_ && s.nextDate <= new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
                  const bizN = bN(s.bizId);
                  return (
                    <tr key={s.id} style={{ borderTop: "1px solid var(--brd)", opacity: s.active ? 1 : .5 }}>
                      <td style={{ padding: "13px 16px" }}>
                        <p style={{ fontWeight: 600 }}>{s.name}</p>
                        {s.notes && <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 2 }}>{s.notes}</p>}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        {bizN ? <Bdg label={bizN} color={bC(s.bizId)} sm /> : <span style={{ fontSize: 11, color: "var(--mut)" }}>Général</span>}
                      </td>
                      <td style={{ padding: "13px 16px", fontWeight: 500, whiteSpace: "nowrap" }}>{euro(s.amount)}</td>
                      <td style={{ padding: "13px 16px", color: "var(--sub)" }}>{cycleLabel(s.cycle)}</td>
                      <td style={{ padding: "13px 16px", color: "var(--warn)", fontWeight: 500, whiteSpace: "nowrap" }}>{euro(monthly)}</td>
                      <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                        {s.nextDate ? (
                          <span style={{ color: isUpcoming ? "var(--err)" : "var(--sub)", fontWeight: isUpcoming ? 600 : 400 }}>
                            {isUpcoming ? "⚠ " : ""}{new Date(s.nextDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}
                          </span>
                        ) : <span style={{ color: "var(--mut)" }}>—</span>}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                          <input type="checkbox" checked={s.active} onChange={() => toggleActive(s)} style={{ width: "auto", cursor: "pointer" }} />
                          {s.active ? <span style={{ color: "var(--ok)" }}>Actif</span> : <span style={{ color: "var(--mut)" }}>Inactif</span>}
                        </label>
                      </td>
                      <td style={{ padding: "13px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <Btn sm variant="ghost" onClick={() => openEdit(s)}>Éditer</Btn>
                          <Btn sm variant="err" onClick={() => softDel(s)}>Suppr.</Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 18px", borderTop: "1px solid var(--brd)", fontSize: 12, color: "var(--mut)" }}>
            Total mensuel : <strong style={{ color: "var(--warn)" }}>{euro(monthlyTotal)}</strong>
            {" · "}Total annuel : <strong style={{ color: "var(--warn)" }}>{euro(annualTotal)}</strong>
          </div>
        </Card>
      )}

      {confirm && <Confirm {...confirm} onCancel={() => setConfirm(null)} />}

      {modal && (
        <Modal title={typeof modal === "string" ? "Nouvel abonnement" : "Modifier l'abonnement"} onClose={() => setModal(null)} width={460}>
          <div className="fg2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <F label="Nom de l'abonnement" col="1/-1">
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="ex: ChatGPT Plus, Claude Pro, Shopify, Adobe…" />
            </F>
            <F label="Montant (€)">
              <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" />
            </F>
            <F label="Fréquence">
              <select value={form.cycle} onChange={e => set("cycle", e.target.value)}>
                {CYCLES.map(c => <option key={c.id} value={c.id}>{c.l}</option>)}
              </select>
            </F>
            <F label="Activité liée (optionnel)">
              <select value={form.bizId} onChange={e => set("bizId", e.target.value)}>
                <option value="">— Général —</option>
                {aBiz.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </F>
            <F label="Prochain prélèvement">
              <input type="date" value={form.nextDate} onChange={e => set("nextDate", e.target.value)} />
            </F>
            <F label="Notes (optionnel)" col="1/-1">
              <input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Compte associé, carte, remarques…" />
            </F>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={form.active} onChange={e => set("active", e.target.checked)} style={{ width: "auto", cursor: "pointer" }} />
                Abonnement actif
              </label>
            </div>
          </div>
          {parseFloat(form.amount) > 0 && (
            <div style={{ marginTop: 14, padding: "11px 14px", background: "var(--surf)", borderRadius: 8, fontSize: 12, border: "1px solid var(--brd)" }}>
              Équivalent mensuel : <strong style={{ color: "var(--warn)" }}>{euro(cycleMonthly(parseFloat(form.amount), form.cycle))}</strong>
              {" · "}Annuel : <strong style={{ color: "var(--warn)" }}>{euro(cycleMonthly(parseFloat(form.amount), form.cycle) * 12)}</strong>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <Btn onClick={() => setModal(null)}>Annuler</Btn>
            <Btn variant="pri" onClick={save} disabled={!form.name.trim()}>Enregistrer</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
