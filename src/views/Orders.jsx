import { useState, Fragment } from "react";
import { uid, today, fmtDate, active, euro, SIZES } from "../utils";
import { Btn, F, Card, THead, Empty, Confirm, Modal, Bdg } from "../components/ui";
import ProductFormModal from "../components/ProductFormModal";

const ORDER_STATUS = [
  { id: "en_attente",   l: "En attente",   color: "#f59e0b" },
  { id: "recu_partiel", l: "Reçu partiel", color: "#0ea5e9" },
  { id: "recu",         l: "Reçu",         color: "#10b981" },
  { id: "annule",       l: "Annulé",       color: "#ef4444" },
];

const StatusBadge = ({ status }) => {
  const s = ORDER_STATUS.find(x => x.id === status);
  if (!s) return null;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: s.color + "20", border: `1px solid ${s.color}40`, borderRadius: 20, color: s.color, whiteSpace: "nowrap" }}>
      {s.l}
    </span>
  );
};

// ─── Modal commande ───────────────────────────────────────────────
const OrderModal = ({ order, aBiz, onSave, onClose }) => {
  const [form, setForm] = useState(
    order
      ? { ...order, expectedDate: order.expectedDate || "" }
      : { bizId: aBiz[0]?.id || "", reference: "", supplier: "", date: today(), expectedDate: "", status: "en_attente", notes: "" }
  );
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.reference.trim()) return;
    onSave({ ...form, reference: form.reference.trim(), supplier: form.supplier.trim(), notes: form.notes.trim() });
    onClose();
  };

  return (
    <Modal title={order ? "Modifier la commande" : "Nouvelle commande"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="fg2">
        <F label="Référence" col="1/-1">
          <input value={form.reference} onChange={e => set("reference", e.target.value)} placeholder="ex: CMD-001, Réassort été…" />
        </F>
        <F label="Activité">
          <select value={form.bizId} onChange={e => set("bizId", e.target.value)}>
            <option value="">— Choisir —</option>
            {aBiz.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </F>
        <F label="Statut">
          <select value={form.status} onChange={e => set("status", e.target.value)}>
            {ORDER_STATUS.map(s => <option key={s.id} value={s.id}>{s.l}</option>)}
          </select>
        </F>
        <F label="Fournisseur">
          <input value={form.supplier} onChange={e => set("supplier", e.target.value)} placeholder="Nom du fournisseur" />
        </F>
        <F label="Date commande">
          <input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
        </F>
        <F label="Livraison prévue">
          <input type="date" value={form.expectedDate} onChange={e => set("expectedDate", e.target.value)} />
        </F>
        <F label="Notes" col="1/-1">
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Conditions, remarques…" style={{ resize: "vertical", minHeight: 60 }} />
        </F>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
        <Btn onClick={onClose}>Annuler</Btn>
        <Btn variant="pri" onClick={save} disabled={!form.reference.trim()}>Enregistrer</Btn>
      </div>
    </Modal>
  );
};

// ─── Modal article ────────────────────────────────────────────────
const ItemModal = ({ item, order, prods, onSave, onCreateProd, onClose, prefill }) => {
  const bizProds = active(prods).filter(p => !order.bizId || p.bizId === order.bizId);

  const [form, setForm] = useState(
    item
      ? { ...item, qty: String(item.qty), unitPrice: String(item.unitPrice) }
      : prefill
        ? { orderId: order.id, productId: prefill.productId || "", name: prefill.name || "", unitPrice: prefill.unitPrice || "", qty: "1", size: "", notes: "" }
        : { orderId: order.id, productId: "", name: "", qty: "1", unitPrice: "", size: "", notes: "" }
  );
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selProd = bizProds.find(p => p.id === form.productId);
  const hasSizes = selProd?.sizes && SIZES.some(s => (selProd.sizes[s] ?? 0) > 0);

  const pickProd = id => {
    if (!id) { set("productId", ""); return; }
    const p = bizProds.find(x => x.id === id);
    if (!p) return;
    setForm(f => ({ ...f, productId: id, name: p.name, unitPrice: String(p.buyPrice || ""), size: "" }));
  };

  const save = () => {
    const q = parseInt(form.qty, 10);
    if (!form.name.trim() || !(q > 0)) return;
    onSave({ ...form, qty: q, unitPrice: parseFloat(form.unitPrice) || 0, name: form.name.trim(), notes: form.notes.trim() });
    onClose();
  };

  return (
    <Modal title={item ? "Modifier l'article" : "Ajouter un article"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="fg2">
        <F label="Produit lié (optionnel)" col="1/-1">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={form.productId} onChange={e => pickProd(e.target.value)} style={{ flex: 1 }}>
              <option value="">— Saisie manuelle —</option>
              {bizProds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {onCreateProd && (
              <Btn sm variant="ghost" onClick={onCreateProd} style={{ whiteSpace: "nowrap" }}>+ Créer</Btn>
            )}
          </div>
        </F>
        <F label="Désignation" col="1/-1">
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Nom de l'article" />
        </F>
        {hasSizes && (
          <F label="Taille" col="1/-1">
            <select value={form.size || ""} onChange={e => set("size", e.target.value)}>
              <option value="">— Taille —</option>
              {SIZES.filter(s => (selProd.sizes[s] ?? 0) >= 0).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </F>
        )}
        <F label="Quantité">
          <input type="number" min="1" value={form.qty} onChange={e => set("qty", e.target.value)} onFocus={e => e.target.select()} />
        </F>
        <F label="Prix unitaire (€)">
          <input type="number" min="0" value={form.unitPrice} onChange={e => set("unitPrice", e.target.value)} onFocus={e => e.target.select()} placeholder="0.00" />
        </F>
        <F label="Notes" col="1/-1">
          <input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Remarque sur cet article…" />
        </F>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
        <Btn onClick={onClose}>Annuler</Btn>
        <Btn variant="pri" onClick={save} disabled={!form.name.trim() || !(parseInt(form.qty) > 0)}>
          {item ? "Enregistrer" : "Ajouter"}
        </Btn>
      </div>
    </Modal>
  );
};

// ─── Vue principale ───────────────────────────────────────────────
export default function Orders({ orders, orderItems, orderA, orderItemA, biz, prods, prodA, onNavigateToProduct }) {
  const [expandedId, setExpandedId] = useState(null);
  const [orderModal, setOrderModal] = useState(null); // null | "add" | orderObj
  const [itemModal, setItemModal] = useState(null);   // null | { order, item?, prefill? }
  const [newProdFor, setNewProdFor] = useState(null); // null | { order }
  const [confirm, setConfirm] = useState(null);
  const [filterBiz, setFilterBiz] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQ, setSearchQ] = useState("");

  const aBiz = active(biz);
  const bN = id => aBiz.find(b => b.id === id)?.name ?? "—";
  const bC = id => aBiz.find(b => b.id === id)?.color ?? "var(--mut)";

  const aOrders = active(orders).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const filtered = aOrders.filter(o => {
    if (filterBiz !== "all" && o.bizId !== filterBiz) return false;
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!o.reference.toLowerCase().includes(q) && !(o.supplier || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const receiveOrder = async order => {
    const items = orderItems.filter(i => i.orderId === order.id && i.productId);
    for (const item of items) {
      const prod = prods.find(p => p.id === item.productId);
      if (!prod || prod.category !== "physical") continue;
      const prevStock = prod.stock || 0;
      const newStock = prevStock + item.qty;
      // CMUP : coût moyen unitaire pondéré pour garder buyPrice cohérent
      const newBuyPrice = newStock > 0
        ? Math.round(((prevStock * (prod.buyPrice || 0)) + (item.qty * item.unitPrice)) / newStock * 100) / 100
        : prod.buyPrice;
      if (prod.sizes && item.size && SIZES.includes(item.size)) {
        const newSizes = { ...prod.sizes, [item.size]: (prod.sizes[item.size] || 0) + item.qty };
        await prodA.update({ ...prod, sizes: newSizes, stock: newStock, buyPrice: newBuyPrice });
      } else {
        await prodA.update({ ...prod, stock: newStock, buyPrice: newBuyPrice });
      }
    }
    await orderA.update({ ...order, status: "recu" });
  };

  const addOrder = form => orderA.add({ ...form, id: uid() });
  const editOrder = form => {
    const prev = orders.find(o => o.id === form.id);
    if (prev && prev.status !== "recu" && form.status === "recu") {
      receiveOrder(form);
    } else {
      orderA.update(form);
    }
  };
  const addItem = form => orderItemA.add({ ...form, id: uid() });
  const editItem = form => orderItemA.update(form);

  const delOrder = o => setConfirm({
    msg: `Supprimer "${o.reference}" ?`,
    sub: "La commande sera déplacée dans la corbeille pendant 30 jours.",
    onOk: () => { orderA.softDel(o.id); setExpandedId(null); setConfirm(null); },
  });

  const delItem = item => setConfirm({
    msg: `Supprimer "${item.name}" de la commande ?`,
    onOk: () => { orderItemA.hardDel(item.id); setConfirm(null); },
  });

  // ── Contenu déplié d'une commande (articles) ──────────────────
  const ExpandedContent = ({ o }) => {
    const items = orderItems.filter(i => i.orderId === o.id);
    const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

    return (
      <>
        {(o.expectedDate || o.notes) && (
          <div style={{ display: "flex", gap: 20, marginBottom: 14, flexWrap: "wrap" }}>
            {o.expectedDate && (
              <div>
                <p style={{ fontSize: 10, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Livraison prévue</p>
                <p style={{ fontSize: 13, fontWeight: 500 }}>{fmtDate(o.expectedDate)}</p>
              </div>
            )}
            {o.notes && (
              <div>
                <p style={{ fontSize: 10, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Notes</p>
                <p style={{ fontSize: 13, color: "var(--sub)" }}>{o.notes}</p>
              </div>
            )}
          </div>
        )}

        {items.length > 0 && (
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", marginBottom: 12, background: "var(--w)", borderRadius: 8, overflow: "hidden", border: "1px solid var(--brd)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--brd)", background: "var(--surf)" }}>
                {["Désignation", "Taille", "Qté", "Prix unit.", "Total", ""].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--mut)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const linked = prods.find(p => p.id === item.productId);
                return (
                  <tr key={item.id} style={{ borderTop: "1px solid var(--brd)" }}>
                    <td style={{ padding: "9px 12px" }}>
                      {linked ? (
                        <button
                          onClick={() => onNavigateToProduct(item.productId)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ac)", fontWeight: 600, fontSize: 12, padding: 0, fontFamily: "inherit", textDecoration: "underline" }}
                        >{item.name}</button>
                      ) : (
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                      )}
                      {item.notes && <p style={{ fontSize: 10, color: "var(--mut)", marginTop: 1 }}>{item.notes}</p>}
                    </td>
                    <td style={{ padding: "9px 12px", color: "var(--sub)" }}>{item.size || "—"}</td>
                    <td style={{ padding: "9px 12px", color: "var(--sub)" }}>{item.qty}</td>
                    <td style={{ padding: "9px 12px", color: "var(--sub)" }}>{euro(item.unitPrice)}</td>
                    <td style={{ padding: "9px 12px", fontWeight: 600 }}>{euro(item.qty * item.unitPrice)}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                        <Btn sm variant="ghost" onClick={() => setItemModal({ order: o, item })}>Éditer</Btn>
                        <Btn sm variant="err" onClick={() => delItem(item)}>×</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--brd)", background: "var(--surf)" }}>
                <td colSpan={4} style={{ padding: "9px 12px", fontWeight: 600, color: "var(--mut)", fontSize: 11, textAlign: "right" }}>Total commande</td>
                <td style={{ padding: "9px 12px", fontWeight: 700, fontSize: 14 }}>{euro(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}

        <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
          <Btn variant="pri" sm onClick={() => setItemModal({ order: o })}>+ Article</Btn>
          {o.status !== "recu" && o.status !== "annule" && (
            <Btn variant="success" sm onClick={() => setConfirm({
              msg: `Valider la réception de "${o.reference}" ?`,
              sub: "Le stock des produits liés sera mis à jour.",
              onOk: () => { receiveOrder(o); setConfirm(null); },
            })}>✓ Reçu</Btn>
          )}
          <Btn variant="ghost" sm onClick={() => setOrderModal(o)}>Éditer</Btn>
          <Btn variant="err" sm onClick={() => delOrder(o)}>Supprimer</Btn>
        </div>
      </>
    );
  };

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
          <select value={filterBiz} onChange={e => setFilterBiz(e.target.value)} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--brd)", background: "var(--surf)", color: "var(--txt)", fontFamily: "inherit" }}>
            <option value="all">Toutes activités</option>
            {aBiz.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--brd)", background: "var(--surf)", color: "var(--txt)", fontFamily: "inherit" }}>
            <option value="all">Tous statuts</option>
            {ORDER_STATUS.map(s => <option key={s.id} value={s.id}>{s.l}</option>)}
          </select>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Rechercher…" style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--brd)", background: "var(--surf)", color: "var(--txt)", fontFamily: "inherit", minWidth: 140 }} />
        </div>
        <Btn variant="pri" onClick={() => setOrderModal("add")}>+ Nouvelle commande</Btn>
      </div>

      {aBiz.length === 0 ? (
        <Empty icon="↙" text="Créez d'abord une activité dans l'onglet Activités." />
      ) : filtered.length === 0 ? (
        <Empty icon="↙" text={aOrders.length === 0 ? 'Aucune commande. Cliquez sur « + Nouvelle commande » pour commencer.' : "Aucune commande correspondant aux filtres."} />
      ) : (
        <>
          {/* ══ Desktop ══ */}
          <div className="mhide">
            <Card style={{ overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <THead cols={["", "Référence", "Activité", "Fournisseur", "Date", "Articles", "Total", "Statut", ""]} />
                <tbody>
                  {filtered.map(o => {
                    const expanded = expandedId === o.id;
                    const items = orderItems.filter(i => i.orderId === o.id);
                    const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
                    const statusColor = ORDER_STATUS.find(s => s.id === o.status)?.color ?? "#888";
                    return (
                      <Fragment key={o.id}>
                        <tr
                          onClick={() => setExpandedId(prev => prev === o.id ? null : o.id)}
                          style={{ borderTop: "1px solid var(--brd)", cursor: "pointer", background: expanded ? "var(--surf)" : undefined, transition: "background .1s" }}
                          onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = "var(--surf)"; }}
                          onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = ""; }}
                        >
                          <td style={{ padding: "10px 10px 10px 16px", width: 28 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: statusColor }} />
                          </td>
                          <td style={{ padding: "11px 16px", fontWeight: 600 }}>{o.reference}</td>
                          <td style={{ padding: "11px 16px" }}><Bdg label={bN(o.bizId)} color={bC(o.bizId)} sm /></td>
                          <td style={{ padding: "11px 16px", color: "var(--sub)" }}>{o.supplier || "—"}</td>
                          <td style={{ padding: "11px 16px", color: "var(--sub)" }}>{fmtDate(o.date)}</td>
                          <td style={{ padding: "11px 16px", color: "var(--sub)" }}>{items.length}</td>
                          <td style={{ padding: "11px 16px", fontWeight: 600 }}>{euro(total)}</td>
                          <td style={{ padding: "11px 16px" }}><StatusBadge status={o.status} /></td>
                          <td style={{ padding: "11px 16px", textAlign: "right", width: 32 }}>
                            <span style={{ fontSize: 10, color: "var(--mut)", display: "inline-block", transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span>
                          </td>
                        </tr>
                        {expanded && (
                          <tr style={{ background: "var(--surf)", borderTop: "1px solid var(--brd)" }}>
                            <td colSpan={9} style={{ padding: "14px 16px 16px" }}>
                              <ExpandedContent o={o} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          {/* ══ Mobile ══ */}
          <div className="mshow" style={{ display: "none", flexDirection: "column", gap: 10 }}>
            {filtered.map(o => {
              const expanded = expandedId === o.id;
              const items = orderItems.filter(i => i.orderId === o.id);
              const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
              const statusColor = ORDER_STATUS.find(s => s.id === o.status)?.color ?? "#888";
              return (
                <div key={o.id} style={{ background: "var(--w)", border: `1px solid ${expanded ? "var(--ac)" : "var(--brd)"}`, borderRadius: 14, overflow: "hidden", boxShadow: "var(--sh)", transition: "border-color .15s" }}>
                  <button
                    onClick={() => setExpandedId(prev => prev === o.id ? null : o.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "12px 13px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: "var(--txt)" }}>{o.reference}</p>
                        <StatusBadge status={o.status} />
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                        {o.bizId && <Bdg label={bN(o.bizId)} color={bC(o.bizId)} sm />}
                        {o.supplier && <span style={{ fontSize: 11, color: "var(--mut)" }}>{o.supplier}</span>}
                        <span style={{ fontSize: 11, color: "var(--mut)" }}>{items.length} article(s)</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginRight: 4 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "var(--ac)" }}>{euro(total)}</p>
                      <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 1 }}>{fmtDate(o.date)}</p>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--mut)", display: "inline-block", transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>▼</span>
                  </button>

                  {expanded && (
                    <>
                      {(o.expectedDate || o.notes) && (
                        <div style={{ padding: "8px 13px", borderTop: "1px solid var(--brd)", display: "flex", gap: 14, flexWrap: "wrap" }}>
                          {o.expectedDate && <span style={{ fontSize: 12, color: "var(--sub)" }}>Livraison prévue : <strong>{fmtDate(o.expectedDate)}</strong></span>}
                          {o.notes && <span style={{ fontSize: 12, color: "var(--sub)" }}>{o.notes}</span>}
                        </div>
                      )}

                      {items.length > 0 && (
                        <div style={{ borderTop: "1px solid var(--brd)" }}>
                          {items.map(item => {
                            const linked = prods.find(p => p.id === item.productId);
                            return (
                              <div key={item.id} style={{ padding: "10px 13px", borderBottom: "1px solid var(--brd)", display: "flex", alignItems: "flex-start", gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                  {linked ? (
                                    <button onClick={() => onNavigateToProduct(item.productId)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ac)", fontWeight: 600, fontSize: 13, padding: 0, fontFamily: "inherit", textAlign: "left", textDecoration: "underline" }}>
                                      {item.name}
                                    </button>
                                  ) : (
                                    <p style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</p>
                                  )}
                                  <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 2 }}>
                                    {item.size ? `${item.size} · ` : ""}{item.qty} × {euro(item.unitPrice)} = <strong>{euro(item.qty * item.unitPrice)}</strong>
                                  </p>
                                  {item.notes && <p style={{ fontSize: 10, color: "var(--mut)", marginTop: 1 }}>{item.notes}</p>}
                                </div>
                                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                                  <Btn sm variant="ghost" onClick={() => setItemModal({ order: o, item })}>Éditer</Btn>
                                  <Btn sm variant="err" onClick={() => delItem(item)}>×</Btn>
                                </div>
                              </div>
                            );
                          })}
                          <div style={{ padding: "8px 13px", background: "var(--surf)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "var(--mut)", fontWeight: 600 }}>Total</span>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{euro(total)}</span>
                          </div>
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: o.status !== "recu" && o.status !== "annule" ? "1fr 1fr" : "1fr 1fr 1fr", gap: 8, padding: 12, borderTop: "1px solid var(--brd)" }}>
                        <Btn variant="pri" onClick={() => setItemModal({ order: o })} full>+ Article</Btn>
                        {o.status !== "recu" && o.status !== "annule" && (
                          <Btn variant="success" onClick={() => setConfirm({
                            msg: `Valider la réception de "${o.reference}" ?`,
                            sub: "Le stock des produits liés sera mis à jour.",
                            onOk: () => { receiveOrder(o); setConfirm(null); },
                          })} full>✓ Reçu</Btn>
                        )}
                        <Btn variant="ghost" onClick={() => setOrderModal(o)} full>Éditer</Btn>
                        <Btn variant="err" onClick={() => delOrder(o)} full>Supprimer</Btn>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: 12, color: "var(--mut)", textAlign: "center", paddingTop: 6 }}>{filtered.length} commande(s)</p>
        </>
      )}

      {/* ── Modals ── */}
      {confirm && <Confirm {...confirm} onCancel={() => setConfirm(null)} />}
      {orderModal && (
        <OrderModal
          order={orderModal === "add" ? null : orderModal}
          aBiz={aBiz}
          onSave={orderModal === "add" ? addOrder : editOrder}
          onClose={() => setOrderModal(null)}
        />
      )}
      {itemModal && (
        <ItemModal
          item={itemModal.item ?? null}
          order={itemModal.order}
          prods={prods}
          prefill={itemModal.prefill ?? null}
          onSave={itemModal.item ? editItem : addItem}
          onCreateProd={itemModal.item ? null : () => {
            const order = itemModal.order;
            setItemModal(null);
            setNewProdFor({ order });
          }}
          onClose={() => setItemModal(null)}
        />
      )}
      {newProdFor && (
        <ProductFormModal
          aBiz={aBiz}
          prodA={prodA}
          defaultBizId={newProdFor.order.bizId}
          onCreated={prod => {
            setNewProdFor(null);
            setItemModal({
              order: newProdFor.order,
              prefill: { productId: prod.id, name: prod.name, unitPrice: String(prod.buyPrice || "") },
            });
          }}
          onClose={() => {
            setNewProdFor(null);
            setItemModal({ order: newProdFor.order });
          }}
        />
      )}
    </div>
  );
}
