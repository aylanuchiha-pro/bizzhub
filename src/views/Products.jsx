import { useState } from "react";
import { uid, today, active, CATS, UNITS, LOW, compressImg, pct } from "../utils";
import { euro } from "../utils";
import { Btn, Lbl, F, Bdg, CatBdg, Card, THead, Empty, Confirm, Modal, StockBar, Preview } from "../components/ui";

const emptyProd = { name: "", bizId: "", category: "physical", buyPrice: "", sellPrice: "", stock: "0", unit: "unité(s)", description: "", image: null };

const SellModal = ({ product, onConfirm, onClose }) => {
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState(String(product.sellPrice));
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const qN = Math.max(1, parseInt(qty) || 1);
  const pN = parseFloat(price) || 0;
  const profit = (pN - product.buyPrice) * qN;
  const over = product.category === "physical" && qN > product.stock;

  return (
    <Modal title={`Vendre — ${product.name}`} onClose={onClose} width={420}>
      {product.category === "physical" && (
        <div style={{ padding: "10px 14px", background: "var(--surf)", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid var(--brd)" }}>
          Stock disponible : <strong style={{ color: product.stock <= LOW ? "var(--warn)" : "var(--ok)" }}>{product.stock} {product.unit}</strong>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <F label="Quantité"><input type="number" value={qty} min="1" onChange={e => setQty(e.target.value)} /></F>
        {over && <p style={{ fontSize: 11, color: "var(--err)", marginTop: -10 }}>⚠ Stock insuffisant</p>}
        <F label="Prix de vente unitaire (€)"><input type="number" value={price} onChange={e => setPrice(e.target.value)} /></F>
        <F label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} /></F>
        <F label="Notes"><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Client, référence…" /></F>
        {pN > 0 && <Preview ca={pN * qN} profit={profit} margin={pct(profit, pN * qN)} />}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn onClick={onClose}>Annuler</Btn>
          <Btn variant="pri" onClick={() => !over && onConfirm({ qty: qN, sellPrice: pN, date, notes })} disabled={over || pN <= 0}>Enregistrer</Btn>
        </div>
      </div>
    </Modal>
  );
};

export default function Products({ prods, prodA, biz, sales, saleA }) {
  const [prodModal, setProdModal] = useState(null);
  const [sellModal, setSellModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState(emptyProd);
  const [filterBiz, setFilterBiz] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const aBiz = active(biz);
  const bN = id => aBiz.find(b => b.id === id)?.name ?? "—";
  const bC = id => aBiz.find(b => b.id === id)?.color ?? "var(--mut)";

  const openAdd = () => { setForm({ ...emptyProd, bizId: aBiz[0]?.id ?? "" }); setProdModal("add"); };
  const openEdit = p => { setForm({ ...p, buyPrice: String(p.buyPrice), sellPrice: String(p.sellPrice), stock: String(p.stock) }); setProdModal(p); };

  const saveProd = () => {
    if (!form.name.trim() || !form.bizId) return;
    const prod = { ...form, id: typeof prodModal === "string" ? uid() : prodModal.id, buyPrice: parseFloat(form.buyPrice) || 0, sellPrice: parseFloat(form.sellPrice) || 0, stock: parseInt(form.stock) || 0, deletedAt: null };
    if (typeof prodModal === "string") prodA.add(prod);
    else prodA.update(prod);
    setProdModal(null);
  };

  const softDel = p => setConfirm({
    msg: `Supprimer "${p.name}" ?`,
    sub: "Ce produit sera déplacé dans la corbeille pendant 30 jours.",
    onOk: () => { prodA.softDel(p.id); setConfirm(null); }
  });

  const adj = (id, delta) => {
    const p = active(prods).find(x => x.id === id);
    if (p) prodA.update({ ...p, stock: Math.max(0, p.stock + delta) });
  };

  const handleSell = (product, { qty, sellPrice, date, notes }) => {
    if (product.category === "physical") {
      prodA.update({ ...product, stock: Math.max(0, product.stock - qty) });
    }
    saleA.add({ id: uid(), bizId: product.bizId, productId: product.id, name: product.name, qty, sellPrice, costPrice: product.buyPrice, date, notes, deletedAt: null });
    setSellModal(null);
  };

  const filtered = active(prods).filter(p => filterBiz === "all" || p.bizId === filterBiz).filter(p => filterCat === "all" || p.category === filterCat);

  const FBtn = ({ id, label, act, onClick }) => (
    <button onClick={onClick} style={{ background: act ? "var(--acb)" : "transparent", border: `1px solid ${act ? "var(--ac)" : "var(--brd)"}`, color: act ? "var(--ac)" : "var(--sub)", borderRadius: 8, padding: "6px 13px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: act ? 600 : 400 }}>
      {label}
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 5, flex: 1, flexWrap: "wrap" }}>
          {[{ id: "all", l: "Tous" }, ...aBiz.map(b => ({ id: b.id, l: b.name }))].map(f => (
            <FBtn key={f.id} id={f.id} label={f.l} act={filterBiz === f.id} onClick={() => setFilterBiz(f.id)} />
          ))}
          {aBiz.length > 0 && <>
            <span style={{ color: "var(--brd)", alignSelf: "center" }}>|</span>
            {[{ id: "all", l: "Tous types" }, ...CATS].map(f => (
              <FBtn key={f.id} id={f.id} label={f.l || "Tous types"} act={filterCat === f.id} onClick={() => setFilterCat(f.id)} />
            ))}
          </>}
        </div>
        {aBiz.length > 0 && <Btn variant="pri" onClick={openAdd}>+ Ajouter</Btn>}
      </div>

      {aBiz.length === 0 ? <Empty icon="◈" text="Créez d'abord une activité dans l'onglet Activités." /> :
        filtered.length === 0 ? <Empty text="Aucun produit trouvé." /> : (
          <Card style={{ overflow: "hidden" }}>
            <div className="tbl-wrap">
              <table style={{ width: "100%", fontSize: 13, minWidth: 780 }}>
                <THead cols={["", "Produit", "Activité", "Type", "Achat", "Vente", "Marge", "Stock", "Actions"]} />
                <tbody>
                  {filtered.map(p => {
                    const margin = p.sellPrice - p.buyPrice;
                    const mPct = p.sellPrice ? ((margin / p.sellPrice) * 100).toFixed(0) + "%" : "—";
                    const isLow = p.category === "physical" && p.stock <= LOW;
                    return (
                      <tr key={p.id} style={{ borderTop: "1px solid var(--brd)" }}>
                        <td style={{ padding: "10px 10px 10px 16px", width: 52 }}>
                          {p.image
                            ? <img src={p.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: "1px solid var(--brd)", display: "block" }} />
                            : <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--surf)", border: "1px solid var(--brd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "var(--mut)" }}>◻</div>
                          }
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <p style={{ fontWeight: 600 }}>{p.name}</p>
                          {p.description && <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 2 }}>{p.description}</p>}
                        </td>
                        <td style={{ padding: "13px 16px" }}><Bdg label={bN(p.bizId)} color={bC(p.bizId)} sm /></td>
                        <td style={{ padding: "13px 16px" }}><CatBdg id={p.category} /></td>
                        <td style={{ padding: "13px 16px", color: "var(--sub)", whiteSpace: "nowrap" }}>{euro(p.buyPrice)}</td>
                        <td style={{ padding: "13px 16px", fontWeight: 500, whiteSpace: "nowrap" }}>{euro(p.sellPrice)}</td>
                        <td style={{ padding: "13px 16px", color: margin >= 0 ? "var(--ok)" : "var(--err)", fontWeight: 500 }}>{mPct}</td>
                        <td style={{ padding: "13px 16px" }}>
                          {p.category === "service" || p.category === "digital" ? <span style={{ fontSize: 11, color: "var(--mut)" }}>—</span> : (
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <button onClick={() => adj(p.id, -1)} style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid var(--brd)", background: "var(--w)", cursor: "pointer", fontSize: 15, color: "var(--sub)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", lineHeight: 1 }}>−</button>
                                <span style={{ fontSize: 13, fontWeight: 600, color: isLow ? "var(--warn)" : "var(--txt)", minWidth: 26, textAlign: "center" }}>{p.stock}</span>
                                <button onClick={() => adj(p.id, 1)} style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid var(--brd)", background: "var(--w)", cursor: "pointer", fontSize: 15, color: "var(--sub)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", lineHeight: 1 }}>+</button>
                                <span style={{ fontSize: 11, color: "var(--mut)" }}>{p.unit}</span>
                              </div>
                              <StockBar v={p.stock} />
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            <Btn sm variant="success" onClick={() => setSellModal(p)}>Vendre</Btn>
                            <Btn sm variant="ghost" onClick={() => openEdit(p)}>Éditer</Btn>
                            <Btn sm variant="err" onClick={() => softDel(p)}>Suppr.</Btn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "10px 16px", borderTop: "1px solid var(--brd)", fontSize: 12, color: "var(--mut)" }}>{filtered.length} produit(s)</div>
          </Card>
        )}

      {confirm && <Confirm {...confirm} onCancel={() => setConfirm(null)} />}
      {sellModal && <SellModal product={sellModal} onConfirm={d => handleSell(sellModal, d)} onClose={() => setSellModal(null)} />}

      {prodModal && (
        <Modal title={typeof prodModal === "string" ? "Nouveau produit" : "Modifier le produit"} onClose={() => setProdModal(null)}>
          <div className="fg2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <F label="Nom" col="1/-1"><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="ex: Veste cuir M, Prestation SEO, Ebook marketing…" /></F>
            <F label="Activité">
              <select value={form.bizId} onChange={e => set("bizId", e.target.value)}>
                <option value="">— Choisir —</option>
                {aBiz.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </F>
            <F label="Catégorie">
              <select value={form.category} onChange={e => set("category", e.target.value)}>
                {CATS.map(c => <option key={c.id} value={c.id}>{c.l}</option>)}
              </select>
            </F>
            <F label="Prix d'achat / Coût (€)"><input type="number" value={form.buyPrice} onChange={e => set("buyPrice", e.target.value)} placeholder="0.00" /></F>
            <F label="Prix de vente (€)"><input type="number" value={form.sellPrice} onChange={e => set("sellPrice", e.target.value)} placeholder="0.00" /></F>
            {form.category === "physical" && <>
              <F label="Stock initial"><input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} min="0" /></F>
              <F label="Unité"><select value={form.unit} onChange={e => set("unit", e.target.value)}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></F>
            </>}
            <F label="Description (optionnel)" col="1/-1"><input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Variante, taille, couleur…" /></F>
            <div style={{ gridColumn: "1/-1" }}>
              <Lbl>Photo (optionnel)</Lbl>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                {form.image && (
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={form.image} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: "1px solid var(--brd)", display: "block" }} />
                    <button onClick={() => set("image", null)} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "var(--err)", border: "none", color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>×</button>
                  </div>
                )}
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "var(--surf)", border: "1px dashed var(--brd)", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--sub)" }}>
                  <span>📷</span><span>{form.image ? "Changer" : "Ajouter une photo"}</span>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                    const f = e.target.files[0];
                    if (f) { const b64 = await compressImg(f); set("image", b64); }
                    e.target.value = "";
                  }} />
                </label>
              </div>
            </div>
          </div>
          {parseFloat(form.sellPrice) > 0 && parseFloat(form.buyPrice) >= 0 && (
            <div style={{ marginTop: 14, padding: "11px 14px", background: "var(--acb)", borderRadius: 8, fontSize: 12, color: "var(--ac)", fontWeight: 500 }}>
              Marge unitaire : {euro(parseFloat(form.sellPrice) - parseFloat(form.buyPrice))}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <Btn onClick={() => setProdModal(null)}>Annuler</Btn>
            <Btn variant="pri" onClick={saveProd} disabled={!form.name.trim() || !form.bizId}>Enregistrer</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
