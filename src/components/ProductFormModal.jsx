import { useState } from "react";
import { uid, CATS, UNITS, SIZES } from "../utils";
import { supabase } from "../supabase";
import { Btn, Lbl, F, Modal } from "./ui";

// ── Image helpers ─────────────────────────────────────────────────
const compressToBlob = (file, maxDim = 1200, quality = 0.82) => new Promise(res => {
  const img = new Image();
  const r = new FileReader();
  r.onload = e => {
    img.src = e.target.result;
    img.onload = () => {
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(blob => res(blob), "image/jpeg", quality);
    };
  };
  r.readAsDataURL(file);
});

const uploadImg = async file => {
  const blob = await compressToBlob(file);
  const path = `${uid()}.jpg`;
  const { error } = await supabase.storage.from("product-images").upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
};

export const deleteStorageImage = async url => {
  const marker = "/product-images/";
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  await supabase.storage.from("product-images").remove([url.slice(idx + marker.length)]);
};

// ── Vehicle ───────────────────────────────────────────────────────
export const VEHICLE_FUELS = ["Essence", "Diesel", "Hybride", "Électrique", "GPL"];
export const VEHICLE_TRANSMISSIONS = ["Manuelle", "Automatique"];
export const VEHICLE_CONDITIONS = ["Très bon état", "Bon état", "État correct", "À rénover"];
const CAR_BRANDS = ["Audi", "BMW", "Citroën", "Dacia", "Fiat", "Ford", "Honda", "Hyundai", "Kia", "Mazda", "Mercedes", "Mitsubishi", "Nissan", "Opel", "Peugeot", "Renault", "Seat", "Skoda", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo"];

export const emptyVehicleFields = { isVehicle: false, vBrand: "", vYear: "", vMileage: "", vFuel: "Essence", vTransmission: "Manuelle", vColor: "", vCondition: "Bon état", vCt: "", vFreeDesc: "", available: false };

export function parseVehicleDesc(desc) {
  if (!desc || !/^\d{4}\s*\|/.test(desc)) return null;
  const parts = desc.split("|").map(s => s.trim());
  return { isVehicle: true, vYear: parts[0] || "", vMileage: parts[1] || "", vFuel: parts[2] || "Essence", vTransmission: parts[3] || "Manuelle", vColor: parts[4] || "", vCondition: parts[5] || "Bon état", vCt: parts[6] || "", vBrand: parts[7] || "", vFreeDesc: parts.slice(8).join(" | ").trim() };
}

export function encodeVehicleDesc(form) {
  return [form.vYear, form.vMileage, form.vFuel, form.vTransmission, form.vColor, form.vCondition, form.vCt, form.vBrand, form.vFreeDesc].map(v => String(v || "").trim()).join(" | ");
}

export const emptyProd = { name: "", bizId: "", category: "physical", buyPrice: "", sellPrice: "", stock: "0", unit: "unité(s)", description: "", image: null, images: [], size: "", sizes: null, ...emptyVehicleFields };

export const hasSizes = p => p.sizes && typeof p.sizes === "object" && SIZES.some(s => (p.sizes[s] || 0) > 0);
export const totalSzStock = p => hasSizes(p) ? SIZES.reduce((a, s) => a + (p.sizes[s] || 0), 0) : (p.stock || 0);

// ── Shared sub-components ─────────────────────────────────────────
export const SizesBadges = ({ p }) => {
  if (hasSizes(p)) return SIZES.filter(s => (p.sizes[s] || 0) > 0).map(s => (
    <span key={s} style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", background: "var(--acb)", border: "1px solid rgba(79,70,229,.25)", borderRadius: 5, color: "var(--ac)" }}>{s}:{p.sizes[s]}</span>
  ));
  if (p.size) return <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", background: "var(--acb)", border: "1px solid rgba(79,70,229,.25)", borderRadius: 5, color: "var(--ac)" }}>{p.size}</span>;
  return null;
};

export const PhotosField = ({ images, onAdd, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState(null);
  const handleFileChange = async e => {
    const files = Array.from(e.target.files); e.target.value = "";
    if (!files.length) return;
    const slots = 5 - images.length;
    const toUpload = files.slice(0, slots);
    setUploading(true); setUploadErr(null);
    try {
      const urls = await Promise.all(toUpload.map(uploadImg));
      urls.forEach(url => onAdd(url));
    } catch (err) { setUploadErr(`Erreur : ${err?.message || "inconnue"}`); }
    finally { setUploading(false); }
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {images.map(url => (
          <div key={url} style={{ position: "relative", flexShrink: 0 }}>
            <img src={url} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", border: "1px solid var(--brd)", display: "block" }} />
            <button onClick={() => onRemove(url)} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "var(--err)", border: "none", color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        ))}
        {uploading && <div style={{ width: 64, height: 64, borderRadius: 10, border: "1px dashed var(--brd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, color: "var(--mut)" }}>⏳</div>}
        {images.length < 5 && !uploading && (
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "var(--surf)", border: "1px dashed var(--brd)", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--sub)", flexShrink: 0 }}>
            <span>📷</span><span>{images.length === 0 ? "Ajouter des photos" : "Ajouter"}</span>
            <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFileChange} />
          </label>
        )}
      </div>
      {uploadErr && <p style={{ fontSize: 11, color: "var(--err)", marginTop: 6 }}>{uploadErr}</p>}
      {images.length > 0 && <p style={{ fontSize: 10, color: "var(--mut)", marginTop: 5 }}>{images.length}/5 — La 1ère photo est la photo principale</p>}
    </div>
  );
};

export const VehicleToggle = ({ form, set }) => (
  <div style={{ gridColumn: "1/-1" }}>
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, userSelect: "none" }}>
      <input type="checkbox" checked={!!form.isVehicle} onChange={e => set("isVehicle", e.target.checked)} style={{ width: 15, height: 15, cursor: "pointer" }} />
      <span style={{ color: form.isVehicle ? "var(--ac)" : "var(--sub)", fontWeight: form.isVehicle ? 600 : 400 }}>🚗 C'est un véhicule (Tixycars)</span>
    </label>
  </div>
);

export const VehicleFields = ({ form, set }) => {
  const isCustom = !!form.vBrand && !CAR_BRANDS.includes(form.vBrand);
  const [showCustom, setShowCustom] = useState(isCustom);
  const selectValue = showCustom ? "Autre" : (form.vBrand || "");
  const handleBrandSelect = e => {
    if (e.target.value === "Autre") { setShowCustom(true); set("vBrand", ""); }
    else { setShowCustom(false); set("vBrand", e.target.value); }
  };
  return (
    <>
      <div style={{ gridColumn: "1/-1", padding: "8px 12px", background: "rgba(79,70,229,.06)", border: "1px solid rgba(79,70,229,.2)", borderRadius: 8, fontSize: 12, color: "var(--ac)" }}>Ces champs seront affichés sur le site Tixycars</div>
      <F label="Marque" col="1/-1">
        <select value={selectValue} onChange={handleBrandSelect}>
          <option value="">— Choisir une marque —</option>
          {CAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          <option value="Autre">Autre</option>
        </select>
        {showCustom && <input autoFocus value={form.vBrand} onChange={e => set("vBrand", e.target.value)} placeholder="Ex: Lamborghini, Ferrari…" style={{ marginTop: 8 }} />}
      </F>
      <F label="Année"><input type="number" value={form.vYear} onChange={e => set("vYear", e.target.value)} placeholder="2010" /></F>
      <F label="Kilométrage (km)"><input type="number" value={form.vMileage} onChange={e => set("vMileage", e.target.value)} placeholder="112000" /></F>
      <F label="Carburant"><select value={form.vFuel} onChange={e => set("vFuel", e.target.value)}>{VEHICLE_FUELS.map(f => <option key={f}>{f}</option>)}</select></F>
      <F label="Boîte"><select value={form.vTransmission} onChange={e => set("vTransmission", e.target.value)}>{VEHICLE_TRANSMISSIONS.map(t => <option key={t}>{t}</option>)}</select></F>
      <F label="Couleur"><input value={form.vColor} onChange={e => set("vColor", e.target.value)} placeholder="Rouge, Blanc métallisé…" /></F>
      <F label="État"><select value={form.vCondition} onChange={e => set("vCondition", e.target.value)}>{VEHICLE_CONDITIONS.map(c => <option key={c}>{c}</option>)}</select></F>
      <F label="Contrôle technique" col="1/-1"><input value={form.vCt} onChange={e => set("vCt", e.target.value)} placeholder="Valable 03/2026 · Non fait · À refaire" /></F>
      <F label="Description (travaux, options…)" col="1/-1"><textarea value={form.vFreeDesc} onChange={e => set("vFreeDesc", e.target.value)} rows={3} style={{ resize: "vertical", width: "100%", boxSizing: "border-box" }} placeholder="Révision faite jan 2025, 4 pneus neufs…" /></F>
      <div style={{ gridColumn: "1/-1", padding: "12px 14px", background: form.available ? "rgba(22,163,74,.07)" : "var(--surf)", border: `1px solid ${form.available ? "rgba(22,163,74,.35)" : "var(--brd)"}`, borderRadius: 10, transition: "all .15s" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
          <input type="checkbox" checked={!!form.available} onChange={e => set("available", e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#16a34a" }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: form.available ? "var(--ok)" : "var(--sub)" }}>{form.available ? "✓ Disponible sur Tixycars" : "Marquer comme disponible sur Tixycars"}</p>
            <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 1 }}>{form.available ? "Ce véhicule est visible sur le site vitrine" : "Le véhicule ne sera pas affiché sur le site vitrine"}</p>
          </div>
        </label>
      </div>
    </>
  );
};

export const SizesGrid = ({ sizes, onChange }) => (
  <div style={{ gridColumn: "1/-1" }}>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
      {SIZES.map(s => (
        <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ac)", letterSpacing: ".04em" }}>{s}</label>
          <input type="number" min="0" value={sizes[s] ?? 0} onChange={e => onChange({ ...sizes, [s]: Math.max(0, parseInt(e.target.value) || 0) })} style={{ width: 58, textAlign: "center", padding: "6px 4px" }} />
        </div>
      ))}
    </div>
    <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 8 }}>Total : <strong style={{ color: "var(--ac)" }}>{SIZES.reduce((a, s) => a + (sizes[s] || 0), 0)}</strong></p>
  </div>
);

export const SizesToggle = ({ form, set, setForm }) => {
  const enabled = !!form.sizes;
  return (
    <div style={{ gridColumn: "1/-1" }}>
      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, userSelect: "none" }}>
        <input type="checkbox" checked={enabled} onChange={e => {
          if (e.target.checked) {
            const initSizes = Object.fromEntries(SIZES.map(s => [s, s === form.size && form.size ? parseInt(form.stock) || 0 : 0]));
            setForm(f => ({ ...f, sizes: initSizes, size: "" }));
          } else {
            const total = SIZES.reduce((a, s) => a + (form.sizes?.[s] || 0), 0);
            setForm(f => ({ ...f, sizes: null, stock: String(total) }));
          }
        }} style={{ width: 15, height: 15, cursor: "pointer" }} />
        <span style={{ color: enabled ? "var(--ac)" : "var(--sub)", fontWeight: enabled ? 600 : 400 }}>Gérer le stock par taille (S / M / L…)</span>
      </label>
    </div>
  );
};

// ── Main exported modal ───────────────────────────────────────────
// product=null → création, product=obj → édition
// onCreated(product) → appelé uniquement à la création (pour lier à une commande, etc.)
export default function ProductFormModal({ product, aBiz, prodA, defaultBizId, onCreated, onClose, fromOrder, onSaveItem }) {
  const vehicleInit = product ? (parseVehicleDesc(product.description) || emptyVehicleFields) : emptyVehicleFields;

  const [form, setForm] = useState(product ? {
    ...product,
    buyPrice: String(product.buyPrice),
    sellPrice: String(product.sellPrice),
    stock: String(product.stock),
    sizes: product.sizes || null,
    images: product.images || [],
    ...vehicleInit,
  } : {
    ...emptyProd,
    bizId: defaultBizId || aBiz[0]?.id || "",
  });
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Champs quantité (uniquement quand fromOrder + onSaveItem)
  const [itemQty, setItemQty] = useState("1");
  const [itemUseSizes, setItemUseSizes] = useState(false);
  const [itemSizeQtys, setItemSizeQtys] = useState(SIZES.reduce((a, s) => ({ ...a, [s]: 0 }), {}));
  const itemTotalSizeQty = SIZES.reduce((a, s) => a + (itemSizeQtys[s] || 0), 0);

  const save = async () => {
    if (!form.name.trim() || !form.bizId) return;
    const computedStock = fromOrder ? 0 : (form.sizes ? SIZES.reduce((a, s) => a + (form.sizes[s] || 0), 0) : parseInt(form.stock) || 0);
    const description = form.isVehicle ? encodeVehicleDesc(form) : form.description;
    const built = { ...form, description, buyPrice: parseFloat(form.buyPrice) || 0, sellPrice: parseFloat(form.sellPrice) || 0, stock: computedStock, sizes: fromOrder ? null : (form.sizes || null) };
    pendingDeletes.forEach(deleteStorageImage);
    if (product) {
      prodA.update(built);
      onClose();
    } else {
      const withId = { ...built, id: uid(), deletedAt: null };
      // Attendre que le produit soit en DB avant d'insérer les articles (évite l'erreur FK)
      await prodA.add(withId);
      if (fromOrder && onSaveItem) {
        if (itemUseSizes) {
          const items = SIZES.filter(s => (itemSizeQtys[s] || 0) > 0)
            .map(s => ({ productId: withId.id, name: withId.name, qty: itemSizeQtys[s], unitPrice: withId.buyPrice || 0, size: s, notes: "" }));
          if (items.length === 0) return;
          onSaveItem(items);
        } else {
          const q = Math.max(1, parseInt(itemQty) || 1);
          onSaveItem([{ productId: withId.id, name: withId.name, qty: q, unitPrice: withId.buyPrice || 0, size: "", notes: "" }]);
        }
      } else if (onCreated) {
        onCreated(withId);
      } else {
        onClose();
      }
    }
  };

  return (
    <Modal title={product ? `Modifier — ${product.name}` : "Nouveau produit"} onClose={onClose}>
      <div className="fg2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <F label="Nom" col="1/-1">
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="ex: Peugeot 308, Prestation…" />
        </F>
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
        <F label="Prix d'achat (€)">
          <input type="number" value={form.buyPrice} onChange={e => set("buyPrice", e.target.value)} onFocus={e => e.target.select()} placeholder="0.00" />
        </F>
        <F label="Prix de vente (€)">
          <input type="number" value={form.sellPrice} onChange={e => set("sellPrice", e.target.value)} onFocus={e => e.target.select()} placeholder="0.00" />
        </F>
        {form.category === "physical" && !fromOrder && <>
          {!form.sizes && (<>
            <F label="Stock"><input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} onFocus={e => e.target.select()} min="0" /></F>
            <F label="Unité"><select value={form.unit} onChange={e => set("unit", e.target.value)}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></F>
          </>)}
          <SizesToggle form={form} set={set} setForm={setForm} />
          {form.sizes && <SizesGrid sizes={form.sizes} onChange={v => set("sizes", v)} />}
        </>}
        {form.category === "physical" && fromOrder && (
          <div style={{ gridColumn: "1/-1", fontSize: 12, color: "var(--mut)", padding: "8px 12px", background: "var(--surf)", borderRadius: 8, border: "1px solid var(--brd)" }}>
            Stock : 0 — sera mis à jour lors de la réception de la commande
          </div>
        )}
        <VehicleToggle form={form} set={set} />
        {form.isVehicle
          ? <VehicleFields form={form} set={set} />
          : <F label="Description" col="1/-1"><textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Variante, couleur…" rows={3} style={{ resize: "vertical", width: "100%", boxSizing: "border-box" }} /></F>
        }
      </div>

      {fromOrder && onSaveItem && (
        <div style={{ marginTop: 4 }}>
          <div style={{ height: 1, background: "var(--brd)", margin: "14px 0" }} />
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>Quantité pour cette commande</p>
          {form.category === "physical" && (
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, userSelect: "none", marginBottom: 12 }}>
              <input type="checkbox" checked={itemUseSizes} onChange={e => { setItemUseSizes(e.target.checked); setItemSizeQtys(SIZES.reduce((a, s) => ({ ...a, [s]: 0 }), {})); }} style={{ width: 15, height: 15, cursor: "pointer" }} />
              <span style={{ color: itemUseSizes ? "var(--ac)" : "var(--sub)", fontWeight: itemUseSizes ? 600 : 400 }}>Gérer par taille (S / M / L…)</span>
            </label>
          )}
          {itemUseSizes ? (
            <>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {SIZES.map(s => (
                  <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ac)", letterSpacing: ".04em" }}>{s}</label>
                    <input type="number" min="0" value={itemSizeQtys[s] || 0}
                      onChange={e => setItemSizeQtys(q => ({ ...q, [s]: Math.max(0, parseInt(e.target.value) || 0) }))}
                      onFocus={e => e.target.select()}
                      style={{ width: 58, textAlign: "center", padding: "6px 4px" }} />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 8 }}>Total : <strong style={{ color: "var(--ac)" }}>{itemTotalSizeQty}</strong></p>
            </>
          ) : (
            <div style={{ maxWidth: 140 }}>
              <Lbl>Quantité</Lbl>
              <input type="number" min="1" value={itemQty} onChange={e => setItemQty(e.target.value)} onFocus={e => e.target.select()} />
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <Lbl>Photos (max 5)</Lbl>
        <PhotosField
          images={form.images || []}
          onAdd={url => set("images", [...(form.images || []), url])}
          onRemove={url => { set("images", (form.images || []).filter(u => u !== url)); setPendingDeletes(p => [...p, url]); }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
        <Btn onClick={onClose}>Annuler</Btn>
        <Btn variant="pri" onClick={save}
          disabled={!form.name.trim() || !form.bizId || (fromOrder && onSaveItem && itemUseSizes && itemTotalSizeQty === 0)}>
          {fromOrder && onSaveItem ? "Créer et ajouter à la commande" : (product ? "Enregistrer" : "Créer le produit")}
        </Btn>
      </div>
    </Modal>
  );
}
