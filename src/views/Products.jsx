import { useState, Fragment } from "react";
import { uid, today, fmtDate, active, CATS, UNITS, SIZES, LOW, pct } from "../utils";
import { euro } from "../utils";
import { supabase } from "../supabase";
import { Btn, Lbl, F, Bdg, CatBdg, Card, THead, Empty, Confirm, Modal, StockBar, Preview } from "../components/ui";

// ─── Supabase Storage helpers ────────────────────────────────────
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

const uploadImage = async (file) => {
  const blob = await compressToBlob(file);
  const path = `${uid()}.jpg`;
  const { error } = await supabase.storage.from("product-images").upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
};

const deleteStorageImage = async (url) => {
  const marker = "/product-images/";
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  await supabase.storage.from("product-images").remove([path]);
};

// ─── Sélecteur de photos ─────────────────────────────────────────
const PhotosField = ({ images, onAdd, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadErr(null);
    try {
      const url = await uploadImage(file);
      onAdd(url);
    } catch (err) {
      console.error("[upload]", err);
      setUploadErr(`Erreur : ${err?.message || "inconnue"}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {images.map((url) => (
          <div key={url} style={{ position: "relative", flexShrink: 0 }}>
            <img src={url} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", border: "1px solid var(--brd)", display: "block" }} />
            <button onClick={() => onRemove(url)} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "var(--err)", border: "none", color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        ))}
        {uploading && (
          <div style={{ width: 64, height: 64, borderRadius: 10, border: "1px dashed var(--brd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, color: "var(--mut)" }}>⏳</div>
        )}
        {images.length < 5 && !uploading && (
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "var(--surf)", border: "1px dashed var(--brd)", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--sub)", flexShrink: 0 }}>
            <span>📷</span><span>{images.length === 0 ? "Ajouter des photos" : "Ajouter"}</span>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
          </label>
        )}
      </div>
      {uploadErr && <p style={{ fontSize: 11, color: "var(--err)", marginTop: 6 }}>{uploadErr}</p>}
      {images.length > 0 && <p style={{ fontSize: 10, color: "var(--mut)", marginTop: 5 }}>{images.length}/5 — La 1ère photo est la photo principale</p>}
    </div>
  );
};

// ─── Constantes véhicule ─────────────────────────────────────────
const VEHICLE_FUELS = ["Essence", "Diesel", "Hybride", "Électrique", "GPL"];
const VEHICLE_TRANSMISSIONS = ["Manuelle", "Automatique"];
const VEHICLE_CONDITIONS = ["Très bon état", "Bon état", "État correct", "À rénover"];

const emptyVehicleFields = { isVehicle: false, vBrand: "", vYear: "", vMileage: "", vFuel: "Essence", vTransmission: "Manuelle", vColor: "", vCondition: "Bon état", vCt: "", vFreeDesc: "" };

// Détecte et parse une description au format véhicule "2010 | 112000 | Essence | …"
function parseVehicleDesc(desc) {
  if (!desc || !/^\d{4}\s*\|/.test(desc)) return null;
  const parts = desc.split("|").map(s => s.trim());
  return {
    isVehicle: true,
    vYear: parts[0] || "",
    vMileage: parts[1] || "",
    vFuel: parts[2] || "Essence",
    vTransmission: parts[3] || "Manuelle",
    vColor: parts[4] || "",
    vCondition: parts[5] || "Bon état",
    vCt: parts[6] || "",
    vBrand: parts[7] || "",
    vFreeDesc: parts.slice(8).join(" | ").trim(),
  };
}

// Encode les champs véhicule vers la description pipe-séparée
function encodeVehicleDesc(form) {
  return [form.vYear, form.vMileage, form.vFuel, form.vTransmission, form.vColor, form.vCondition, form.vCt, form.vBrand, form.vFreeDesc]
    .map(v => String(v || "").trim())
    .join(" | ");
}

const CAR_BRANDS = [
  "Audi", "BMW", "Citroën", "Dacia", "Fiat", "Ford", "Honda",
  "Hyundai", "Kia", "Mazda", "Mercedes", "Mitsubishi", "Nissan",
  "Opel", "Peugeot", "Renault", "Seat", "Skoda", "Suzuki",
  "Tesla", "Toyota", "Volkswagen", "Volvo",
];

// ─── UI véhicule partagé ─────────────────────────────────────────
const VehicleToggle = ({ form, set }) => (
  <div style={{ gridColumn: "1/-1" }}>
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, userSelect: "none" }}>
      <input
        type="checkbox"
        checked={!!form.isVehicle}
        onChange={e => set("isVehicle", e.target.checked)}
        style={{ width: 15, height: 15, cursor: "pointer" }}
      />
      <span style={{ color: form.isVehicle ? "var(--ac)" : "var(--sub)", fontWeight: form.isVehicle ? 600 : 400 }}>
        🚗 C'est un véhicule (Tixycars)
      </span>
    </label>
  </div>
);

const VehicleFields = ({ form, set }) => {
  const isCustom = !!form.vBrand && !CAR_BRANDS.includes(form.vBrand);
  const [showCustom, setShowCustom] = useState(isCustom);
  const selectValue = showCustom ? "Autre" : (form.vBrand || "");

  const handleBrandSelect = e => {
    if (e.target.value === "Autre") {
      setShowCustom(true);
      set("vBrand", "");
    } else {
      setShowCustom(false);
      set("vBrand", e.target.value);
    }
  };

  return (
  <>
    <div style={{ gridColumn: "1/-1", padding: "8px 12px", background: "rgba(79,70,229,.06)", border: "1px solid rgba(79,70,229,.2)", borderRadius: 8, fontSize: 12, color: "var(--ac)" }}>
      Ces champs seront affichés sur le site Tixycars
    </div>
    <F label="Marque" col="1/-1">
      <select value={selectValue} onChange={handleBrandSelect}>
        <option value="">— Choisir une marque —</option>
        {CAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        <option value="Autre">Autre</option>
      </select>
      {showCustom && (
        <input
          autoFocus
          value={form.vBrand}
          onChange={e => set("vBrand", e.target.value)}
          placeholder="Ex: Lamborghini, Ferrari…"
          style={{ marginTop: 8 }}
        />
      )}
    </F>
    <F label="Année"><input type="number" value={form.vYear} onChange={e => set("vYear", e.target.value)} placeholder="2010" /></F>
    <F label="Kilométrage (km)"><input type="number" value={form.vMileage} onChange={e => set("vMileage", e.target.value)} placeholder="112000" /></F>
    <F label="Carburant">
      <select value={form.vFuel} onChange={e => set("vFuel", e.target.value)}>
        {VEHICLE_FUELS.map(f => <option key={f}>{f}</option>)}
      </select>
    </F>
    <F label="Boîte">
      <select value={form.vTransmission} onChange={e => set("vTransmission", e.target.value)}>
        {VEHICLE_TRANSMISSIONS.map(t => <option key={t}>{t}</option>)}
      </select>
    </F>
    <F label="Couleur"><input value={form.vColor} onChange={e => set("vColor", e.target.value)} placeholder="Rouge, Blanc métallisé…" /></F>
    <F label="État">
      <select value={form.vCondition} onChange={e => set("vCondition", e.target.value)}>
        {VEHICLE_CONDITIONS.map(c => <option key={c}>{c}</option>)}
      </select>
    </F>
    <F label="Contrôle technique" col="1/-1">
      <input value={form.vCt} onChange={e => set("vCt", e.target.value)} placeholder="Valable 03/2026 · Non fait · À refaire" />
    </F>
    <F label="Description (travaux, options…)" col="1/-1">
      <textarea value={form.vFreeDesc} onChange={e => set("vFreeDesc", e.target.value)} rows={3} style={{ resize: "vertical", width: "100%", boxSizing: "border-box" }} placeholder="Révision faite jan 2025, 4 pneus neufs, carnet d'entretien complet…" />
    </F>
  </>
  );
};

const emptyProd = { name: "", bizId: "", category: "physical", buyPrice: "", sellPrice: "", stock: "0", unit: "unité(s)", description: "", image: null, images: [], size: "", sizes: null, ...emptyVehicleFields };

const hasSizes = p => p.sizes && typeof p.sizes === "object" && SIZES.some(s => (p.sizes[s] || 0) > 0);
const totalSzStock = p => hasSizes(p) ? SIZES.reduce((a, s) => a + (p.sizes[s] || 0), 0) : (p.stock || 0);

// ─── Sélecteur de tailles dans un formulaire ──────────────────────
const SizesGrid = ({ sizes, onChange }) => (
  <div style={{ gridColumn: "1/-1" }}>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
      {SIZES.map(s => (
        <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ac)", letterSpacing: ".04em" }}>{s}</label>
          <input
            type="number"
            min="0"
            value={sizes[s] ?? 0}
            onChange={e => onChange({ ...sizes, [s]: Math.max(0, parseInt(e.target.value) || 0) })}
            style={{ width: 58, textAlign: "center", padding: "6px 4px" }}
          />
        </div>
      ))}
    </div>
    <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 8 }}>
      Total : <strong style={{ color: "var(--ac)" }}>{SIZES.reduce((a, s) => a + (sizes[s] || 0), 0)}</strong>
    </p>
  </div>
);

// ─── Toggle mode tailles dans formulaire ─────────────────────────
const SizesToggle = ({ form, set, setForm }) => {
  const enabled = !!form.sizes;
  return (
    <div style={{ gridColumn: "1/-1" }}>
      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, userSelect: "none" }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => {
            if (e.target.checked) {
              const initSizes = Object.fromEntries(SIZES.map(s => [s, s === form.size && form.size ? parseInt(form.stock) || 0 : 0]));
              setForm(f => ({ ...f, sizes: initSizes, size: "" }));
            } else {
              const total = SIZES.reduce((a, s) => a + (form.sizes?.[s] || 0), 0);
              setForm(f => ({ ...f, sizes: null, stock: String(total) }));
            }
          }}
          style={{ width: 15, height: 15, cursor: "pointer" }}
        />
        <span style={{ color: enabled ? "var(--ac)" : "var(--sub)", fontWeight: enabled ? 600 : 400 }}>
          Gérer le stock par taille (S / M / L…)
        </span>
      </label>
    </div>
  );
};

// ─── Affichage badges tailles ─────────────────────────────────────
const SizesBadges = ({ p }) => {
  if (hasSizes(p)) {
    return SIZES.filter(s => (p.sizes[s] || 0) > 0).map(s => (
      <span key={s} style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", background: "var(--acb)", border: "1px solid rgba(79,70,229,.25)", borderRadius: 5, color: "var(--ac)" }}>
        {s}:{p.sizes[s]}
      </span>
    ));
  }
  if (p.size) {
    return <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", background: "var(--acb)", border: "1px solid rgba(79,70,229,.25)", borderRadius: 5, color: "var(--ac)" }}>{p.size}</span>;
  }
  return null;
};

// ─── Modal vente ──────────────────────────────────────────────────
const SellModal = ({ product, totalCost, onConfirm, onClose }) => {
  const hasSz = hasSizes(product);
  const availSizes = hasSz ? SIZES.filter(s => (product.sizes[s] || 0) > 0) : [];
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState(String(product.sellPrice));
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [selSize, setSelSize] = useState(availSizes[0] || "");
  const qN = Math.max(1, parseInt(qty) || 1);
  const pN = parseFloat(price) || 0;
  const profit = (pN - totalCost) * qN;
  const sizeStock = hasSz && selSize ? (product.sizes[selSize] || 0) : product.stock;
  const over = product.category === "physical" && qN > sizeStock;
  return (
    <Modal title={`Vendre — ${product.name}`} onClose={onClose} width={420}>
      {product.category === "physical" && (
        <div style={{ padding: "10px 14px", background: "var(--surf)", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid var(--brd)" }}>
          Stock disponible : <strong style={{ color: sizeStock <= LOW ? "var(--warn)" : "var(--ok)" }}>
            {sizeStock} {product.unit}{hasSz && selSize ? ` (taille ${selSize})` : ""}
          </strong>
        </div>
      )}
      {totalCost > product.buyPrice && (
        <div style={{ padding: "8px 12px", background: "rgba(217,119,6,.08)", border: "1px solid rgba(217,119,6,.2)", borderRadius: 8, marginBottom: 16, fontSize: 12, color: "var(--warn)" }}>
          Coût réel (achat + frais) : <strong>{euro(totalCost)}</strong>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {hasSz && availSizes.length > 0 && (
          <F label="Taille">
            <select value={selSize} onChange={e => { setSelSize(e.target.value); setQty("1"); }}>
              {availSizes.map(s => <option key={s} value={s}>{s} — stock : {product.sizes[s]}</option>)}
            </select>
          </F>
        )}
        <F label="Quantité"><input type="number" value={qty} min="1" onChange={e => setQty(e.target.value)} /></F>
        {over && <p style={{ fontSize: 11, color: "var(--err)", marginTop: -10 }}>⚠ Stock insuffisant</p>}
        <F label="Prix de vente unitaire (€)"><input type="number" value={price} onChange={e => setPrice(e.target.value)} /></F>
        <F label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} /></F>
        <F label="Notes"><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Client, référence…" /></F>
        {pN > 0 && <Preview ca={pN * qN} profit={profit} margin={pct(profit, pN * qN)} />}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn onClick={onClose}>Annuler</Btn>
          <Btn variant="pri" onClick={() => !over && onConfirm({ qty: qN, sellPrice: pN, date, notes, size: hasSz ? selSize : null })} disabled={over || pN <= 0}>Enregistrer</Btn>
        </div>
      </div>
    </Modal>
  );
};

// ─── Modal frais (mobile) ─────────────────────────────────────────
const ExpensesModal = ({ product, expenses, onAdd, onDel, onClose }) => {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const prodExpenses = expenses.filter(e => e.productId === product.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const totalExtra = prodExpenses.reduce((a, e) => a + e.amount, 0);
  const add = () => {
    const a = parseFloat(amount);
    if (!label.trim() || !a || a <= 0) return;
    onAdd({ id: uid(), productId: product.id, label: label.trim(), amount: a, date });
    setLabel(""); setAmount(""); setDate(today());
  };
  return (
    <Modal title={`Frais — ${product.name}`} onClose={onClose} width={500}>
      <div style={{ display: "flex", gap: 0, background: "var(--acb)", borderRadius: 12, marginBottom: 20, border: "1px solid rgba(79,70,229,.15)", overflow: "hidden" }}>
        {[{ l: "Prix d'achat", v: euro(product.buyPrice), c: "var(--sub)" }, { l: "Frais cumulés", v: "+" + euro(totalExtra), c: totalExtra > 0 ? "var(--warn)" : "var(--mut)" }, { l: "Coût total", v: euro(product.buyPrice + totalExtra), c: "var(--ac)", bold: true }].map((x, i) => (
          <div key={i} style={{ flex: 1, padding: "14px 16px", borderRight: i < 2 ? "1px solid rgba(79,70,229,.15)" : "none" }}>
            <p style={{ fontSize: 10, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>{x.l}</p>
            <p style={{ fontWeight: x.bold ? 700 : 600, fontSize: 15, color: x.c }}>{x.v}</p>
          </div>
        ))}
      </div>
      {prodExpenses.length === 0 ? <p style={{ fontSize: 13, color: "var(--mut)", textAlign: "center", padding: "20px 0 24px" }}>Aucun frais enregistré.</p> : (
        <div style={{ marginBottom: 20, border: "1px solid var(--brd)", borderRadius: 10, overflow: "hidden" }}>
          {prodExpenses.map((e, i) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderTop: i > 0 ? "1px solid var(--brd)" : "none" }}>
              <div style={{ flex: 1 }}><p style={{ fontSize: 13, fontWeight: 500 }}>{e.label}</p><p style={{ fontSize: 11, color: "var(--mut)", marginTop: 1 }}>{fmtDate(e.date)}</p></div>
              <p style={{ fontWeight: 600, color: "var(--warn)" }}>+{euro(e.amount)}</p>
              <Btn sm variant="err" onClick={() => onDel(e.id)}>×</Btn>
            </div>
          ))}
        </div>
      )}
      <div style={{ background: "var(--surf)", borderRadius: 10, border: "1px solid var(--brd)", padding: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--sub)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>Ajouter un frais</p>
        <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="ex: Carrosserie, Révision…" style={{ flex: "1 1 160px" }} />
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant (€)" style={{ width: 130, flex: "0 0 130px" }} onKeyDown={e => e.key === "Enter" && add()} />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1 }} />
          <Btn variant="pri" onClick={add} disabled={!label.trim() || !amount || parseFloat(amount) <= 0}>+ Ajouter</Btn>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}><Btn onClick={onClose}>Fermer</Btn></div>
    </Modal>
  );
};

// ─── Modal Modifier (desktop) — infos + frais + suppression ──────────
const Section = ({ title, children, right }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".07em" }}>{title}</p>
      {right}
    </div>
    {children}
  </div>
);

const ModifyModal = ({ product, aBiz, expenses, expenseA, prodA, onClose }) => {
  const vehicleInit = parseVehicleDesc(product.description) || emptyVehicleFields;
  const [form, setForm] = useState({ ...product, buyPrice: String(product.buyPrice), sellPrice: String(product.sellPrice), stock: String(product.stock), sizes: product.sizes || null, images: product.images || [], ...vehicleInit });
  const [confirmDel, setConfirmDel] = useState(false);
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const [expLabel, setExpLabel] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(today());
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const prodExpenses = expenses.filter(e => e.productId === product.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const totalExtra = prodExpenses.reduce((a, e) => a + e.amount, 0);
  const basePrice = parseFloat(form.buyPrice) || 0;
  const totalCostVal = basePrice + totalExtra;

  const save = () => {
    if (!form.name.trim() || !form.bizId) return;
    const computedStock = form.sizes
      ? SIZES.reduce((a, s) => a + (form.sizes[s] || 0), 0)
      : parseInt(form.stock) || 0;
    const description = form.isVehicle ? encodeVehicleDesc(form) : form.description;
    prodA.update({ ...form, description, buyPrice: parseFloat(form.buyPrice) || 0, sellPrice: parseFloat(form.sellPrice) || 0, stock: computedStock, sizes: form.sizes || null });
    pendingDeletes.forEach(deleteStorageImage);
    onClose();
  };

  const addExp = () => {
    const a = parseFloat(expAmount);
    if (!expLabel.trim() || !a || a <= 0) return;
    expenseA.add({ id: uid(), productId: product.id, label: expLabel.trim(), amount: a, date: expDate });
    setExpLabel(""); setExpAmount(""); setExpDate(today());
  };


  return (
    <Modal title={`Modifier — ${product.name}`} onClose={onClose} width={620}>
      {/* ── Informations ── */}
      <Section title="Informations">
        <div className="fg2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <F label="Nom" col="1/-1"><input value={form.name} onChange={e => set("name", e.target.value)} /></F>
          <F label="Activité">
            <select value={form.bizId} onChange={e => set("bizId", e.target.value)}>
              {aBiz.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </F>
          <F label="Catégorie">
            <select value={form.category} onChange={e => set("category", e.target.value)}>
              {CATS.map(c => <option key={c.id} value={c.id}>{c.l}</option>)}
            </select>
          </F>
          <F label="Prix d'achat / Coût de base (€)"><input type="number" value={form.buyPrice} onChange={e => set("buyPrice", e.target.value)} onFocus={e => e.target.select()} placeholder="0.00" /></F>
          <F label="Prix de vente (€)"><input type="number" value={form.sellPrice} onChange={e => set("sellPrice", e.target.value)} onFocus={e => e.target.select()} placeholder="0.00" /></F>
          {form.category === "physical" && <>
            {!form.sizes && (
              <>
                <F label="Stock"><input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} onFocus={e => e.target.select()} min="0" /></F>
                <F label="Unité"><select value={form.unit} onChange={e => set("unit", e.target.value)}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></F>
              </>
            )}
            <SizesToggle form={form} set={set} setForm={setForm} />
            {form.sizes && <SizesGrid sizes={form.sizes} onChange={v => set("sizes", v)} />}
          </>}
          <VehicleToggle form={form} set={set} />
          {form.isVehicle
            ? <VehicleFields form={form} set={set} />
            : <F label="Description" col="1/-1"><input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Variante, couleur…" /></F>
          }
          <div style={{ gridColumn: "1/-1" }}>
            <Lbl>Photos (max 5)</Lbl>
            <PhotosField
              images={form.images || []}
              onAdd={url => set("images", [...(form.images || []), url])}
              onRemove={url => { set("images", (form.images || []).filter(u => u !== url)); setPendingDeletes(p => [...p, url]); }}
            />
          </div>
        </div>
      </Section>

      <div style={{ height: 1, background: "var(--brd)", margin: "0 0 22px" }} />

      {/* ── Frais additionnels ── */}
      <Section
        title="Frais additionnels"
        right={
          <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
            <span style={{ color: "var(--mut)" }}>Base : <strong>{euro(basePrice)}</strong></span>
            {totalExtra > 0 && <span style={{ color: "var(--warn)" }}>+frais : <strong>{euro(totalExtra)}</strong></span>}
            <span style={{ color: "var(--ac)" }}>Total : <strong>{euro(totalCostVal)}</strong></span>
          </div>
        }
      >
        {prodExpenses.length > 0 && (
          <div style={{ border: "1px solid var(--brd)", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
            {prodExpenses.map((e, i) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 13px", borderTop: i > 0 ? "1px solid var(--brd)" : "none" }}>
                <div style={{ flex: 1 }}><p style={{ fontSize: 13, fontWeight: 500 }}>{e.label}</p><p style={{ fontSize: 11, color: "var(--mut)" }}>{fmtDate(e.date)}</p></div>
                <p style={{ fontWeight: 600, color: "var(--warn)" }}>+{euro(e.amount)}</p>
                <Btn sm variant="err" onClick={() => expenseA.hardDel(e.id)}>×</Btn>
              </div>
            ))}
          </div>
        )}
        <div style={{ background: "var(--surf)", borderRadius: 10, border: "1px solid var(--brd)", padding: "12px 14px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <F label="Libellé" col={undefined}><input value={expLabel} onChange={e => setExpLabel(e.target.value)} placeholder="ex: Révision, Pneus…" style={{ minWidth: 160 }} /></F>
          <F label="Montant (€)"><input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" style={{ width: 110 }} onKeyDown={e => e.key === "Enter" && addExp()} /></F>
          <F label="Date"><input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} style={{ width: 140 }} /></F>
          <Btn variant="pri" onClick={addExp} disabled={!expLabel.trim() || !expAmount || parseFloat(expAmount) <= 0} style={{ marginBottom: 1 }}>+ Ajouter</Btn>
        </div>
      </Section>

      <div style={{ height: 1, background: "var(--brd)", margin: "0 0 16px" }} />

      {/* ── Footer ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {confirmDel ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--err)", fontWeight: 500 }}>Confirmer la suppression ?</span>
            <Btn sm variant="err" onClick={() => { prodA.softDel(product.id); onClose(); }}>Oui, supprimer</Btn>
            <Btn sm onClick={() => setConfirmDel(false)}>Non</Btn>
          </div>
        ) : (
          <Btn variant="err" sm onClick={() => setConfirmDel(true)}>Supprimer</Btn>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={onClose}>Annuler</Btn>
          <Btn variant="pri" onClick={save} disabled={!form.name.trim() || !form.bizId}>Enregistrer</Btn>
        </div>
      </div>
    </Modal>
  );
};

// ─── Vue principale ───────────────────────────────────────────────────
export default function Products({ prods, prodA, biz, sales, saleA, expenses, expenseA }) {
  const [prodModal, setProdModal] = useState(null);   // "add" | null  (mobile + add)
  const [modifyModal, setModifyModal] = useState(null); // product | null  (desktop Modifier)
  const [sellModal, setSellModal] = useState(null);
  const [expModal, setExpModal] = useState(null);       // mobile Frais
  const [form, setForm] = useState(emptyProd);
  const [filterBiz, setFilterBiz] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [editStock, setEditStock] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleExpand = id => setExpandedId(prev => prev === id ? null : id);

  const aBiz = active(biz);
  const bN = id => aBiz.find(b => b.id === id)?.name ?? "—";
  const bC = id => aBiz.find(b => b.id === id)?.color ?? "var(--mut)";

  const totalCost = p => {
    const extra = (expenses || []).filter(e => e.productId === p.id).reduce((a, e) => a + e.amount, 0);
    return p.buyPrice + extra;
  };
  const expCount = p => (expenses || []).filter(e => e.productId === p.id).length;

  const openAdd = () => { setForm({ ...emptyProd, bizId: aBiz[0]?.id ?? "" }); setPendingDeletes([]); setProdModal("add"); };

  const openEditMobile = p => {
    const vehicleData = parseVehicleDesc(p.description) || emptyVehicleFields;
    setForm({ ...p, buyPrice: String(p.buyPrice), sellPrice: String(p.sellPrice), stock: String(p.stock), sizes: p.sizes || null, images: p.images || [], ...vehicleData });
    setPendingDeletes([]);
    setProdModal(p);
  };

  const saveProd = () => {
    if (!form.name.trim() || !form.bizId) return;
    const computedStock = form.sizes
      ? SIZES.reduce((a, s) => a + (form.sizes[s] || 0), 0)
      : parseInt(form.stock) || 0;
    const description = form.isVehicle ? encodeVehicleDesc(form) : form.description;
    const prod = { ...form, description, id: typeof prodModal === "string" ? uid() : prodModal.id, buyPrice: parseFloat(form.buyPrice) || 0, sellPrice: parseFloat(form.sellPrice) || 0, stock: computedStock, sizes: form.sizes || null, deletedAt: null };
    if (typeof prodModal === "string") prodA.add(prod);
    else prodA.update(prod);
    pendingDeletes.forEach(deleteStorageImage);
    setPendingDeletes([]);
    setProdModal(null);
  };

  const confirmStock = id => {
    const p = active(prods).find(x => x.id === id);
    const val = Math.max(0, parseInt(editStock?.val) || 0);
    if (p) prodA.update({ ...p, stock: val });
    setEditStock(null);
  };

  const handleSell = (product, { qty, sellPrice, date, notes, size }) => {
    if (product.category === "physical") {
      if (hasSizes(product) && size) {
        const newSizes = { ...product.sizes, [size]: Math.max(0, (product.sizes[size] || 0) - qty) };
        const newStock = SIZES.reduce((a, s) => a + (newSizes[s] || 0), 0);
        prodA.update({ ...product, sizes: newSizes, stock: newStock });
      } else {
        prodA.update({ ...product, stock: Math.max(0, product.stock - qty) });
      }
    }
    saleA.add({ id: uid(), bizId: product.bizId, productId: product.id, name: product.name, qty, sellPrice, costPrice: totalCost(product), date, notes, size: hasSizes(product) ? size : null, deletedAt: null });
    setSellModal(null);
  };

  const q = searchQ.trim().toLowerCase();
  const filtered = active(prods)
    .filter(p => filterBiz === "all" || p.bizId === filterBiz)
    .filter(p => filterCat === "all" || p.category === filterCat)
    .filter(p => !q || p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));

  const sbtn = { width: 26, height: 26, borderRadius: 6, border: "1px solid var(--brd)", background: "var(--surf)", cursor: "pointer", fontSize: 16, color: "var(--sub)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", lineHeight: 1 };

  return (
    <div>
      {/* Filtres + bouton ajouter */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <select value={filterBiz} onChange={e => setFilterBiz(e.target.value)} style={{ width: "auto", minWidth: 120, maxWidth: 180 }}>
          <option value="all">Toutes les activités</option>
          {aBiz.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: "auto", minWidth: 120, maxWidth: 160 }}>
          <option value="all">Tous les types</option>
          {CATS.map(c => <option key={c.id} value={c.id}>{c.l}</option>)}
        </select>
        <input
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Rechercher un produit…"
          style={{ flex: 1, minWidth: 140 }}
        />
        {aBiz.length > 0 && <Btn variant="pri" onClick={openAdd}>+ Ajouter</Btn>}
      </div>

      {aBiz.length === 0 ? (
        <Empty icon="◈" text="Créez d'abord une activité dans l'onglet Activités." />
      ) : filtered.length === 0 ? (
        <Empty text="Aucun produit trouvé." />
      ) : (
        <>
          {/* ══ Vue desktop (accordéon) ══ */}
          <div className="mhide">
            <Card style={{ overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <THead cols={["", "Produit", "Activité", "Prix vente", "Marge", ""]} />
                <tbody>
                  {filtered.map(p => {
                    const tc = totalCost(p);
                    const ec = expCount(p);
                    const margin = p.sellPrice - tc;
                    const mPct = p.sellPrice ? ((margin / p.sellPrice) * 100).toFixed(0) + "%" : "—";
                    const stockTotal = totalSzStock(p);
                    const isLow = p.category === "physical" && stockTotal <= LOW;
                    const expanded = expandedId === p.id;
                    return (
                      <Fragment key={p.id}>
                        {/* ─ Ligne compacte ─ */}
                        <tr
                          onClick={() => toggleExpand(p.id)}
                          style={{ borderTop: "1px solid var(--brd)", cursor: "pointer", background: expanded ? "var(--surf)" : undefined, transition: "background .1s" }}
                          onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = "var(--surf)"; }}
                          onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = ""; }}
                        >
                          <td style={{ padding: "10px 10px 10px 16px", width: 52 }}>
                            {p.images?.[0]
                              ? <img src={p.images[0]} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", border: "1px solid var(--brd)", display: "block" }} />
                              : <div style={{ width: 38, height: 38, borderRadius: 8, background: "var(--surf)", border: "1px solid var(--brd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "var(--mut)" }}>◻</div>
                            }
                          </td>
                          <td style={{ padding: "11px 16px" }}>
                            <p style={{ fontWeight: 600 }}>{p.name}</p>
                            {p.description && <p style={{ fontSize: 11, color: "var(--mut)", marginTop: 1 }}>{p.description}</p>}
                          </td>
                          <td style={{ padding: "11px 16px" }}><Bdg label={bN(p.bizId)} color={bC(p.bizId)} sm /></td>
                          <td style={{ padding: "11px 16px", fontWeight: 600 }}>{euro(p.sellPrice)}</td>
                          <td style={{ padding: "11px 16px", fontWeight: 600, color: margin >= 0 ? "var(--ok)" : "var(--err)" }}>{mPct}</td>
                          <td style={{ padding: "11px 16px", textAlign: "right", width: 32 }}>
                            <span style={{ fontSize: 10, color: "var(--mut)", display: "inline-block", transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span>
                          </td>
                        </tr>

                        {/* ─ Ligne dépliée ─ */}
                        {expanded && (
                          <tr style={{ background: "var(--surf)", borderTop: "1px solid var(--brd)" }}>
                            <td colSpan={6} style={{ padding: "14px 16px 16px" }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
                                {/* Infos supplémentaires */}
                                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                                  <div>
                                    <p style={{ fontSize: 10, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Type</p>
                                    <CatBdg id={p.category} />
                                  </div>
                                  {/* Tailles ou taille unique */}
                                  {hasSizes(p) ? (
                                    <div>
                                      <p style={{ fontSize: 10, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Tailles</p>
                                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                        {SIZES.filter(s => (p.sizes[s] || 0) > 0).map(s => (
                                          <span key={s} style={{ fontWeight: 700, fontSize: 12, padding: "3px 9px", background: "var(--acb)", border: "1px solid rgba(79,70,229,.25)", borderRadius: 6, color: "var(--ac)" }}>
                                            {s} : {p.sizes[s]}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : p.size ? (
                                    <div>
                                      <p style={{ fontSize: 10, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Taille</p>
                                      <span style={{ fontWeight: 700, fontSize: 13, padding: "2px 10px", background: "var(--acb)", border: "1px solid rgba(79,70,229,.25)", borderRadius: 6, color: "var(--ac)" }}>{p.size}</span>
                                    </div>
                                  ) : null}
                                  <div>
                                    <p style={{ fontSize: 10, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Coût réel</p>
                                    <p style={{ fontWeight: 600, fontSize: 13, color: "var(--sub)" }}>
                                      {euro(tc)}
                                      {ec > 0 && <span style={{ fontSize: 10, color: "var(--warn)", marginLeft: 5 }}>+{ec} frais</span>}
                                    </p>
                                  </div>
                                  {p.category === "physical" && (
                                    <div>
                                      <p style={{ fontSize: 10, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Stock</p>
                                      {hasSizes(p) ? (
                                        <span style={{ fontSize: 13, fontWeight: 700, color: isLow ? "var(--warn)" : "var(--ac)", background: "var(--acb)", border: `1px solid ${isLow ? "rgba(217,119,6,.3)" : "rgba(79,70,229,.2)"}`, borderRadius: 6, padding: "3px 10px" }}>
                                          {stockTotal} <span style={{ fontWeight: 400, fontSize: 11, color: "var(--mut)" }}>total</span>
                                        </span>
                                      ) : editStock?.id === p.id ? (
                                        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                                          <input type="number" min="0" value={editStock.val}
                                            onChange={e => setEditStock(s => ({ ...s, val: e.target.value }))}
                                            onKeyDown={e => { if (e.key === "Enter") confirmStock(p.id); if (e.key === "Escape") setEditStock(null); }}
                                            autoFocus style={{ width: 68, padding: "4px 8px", fontSize: 13, textAlign: "center" }} />
                                          <button onClick={() => confirmStock(p.id)} style={{ ...sbtn, color: "var(--ok)", borderColor: "var(--ok)" }}>✓</button>
                                          <button onClick={() => setEditStock(null)} style={{ ...sbtn, color: "var(--err)", borderColor: "var(--err)" }}>✕</button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={e => { e.stopPropagation(); setEditStock({ id: p.id, val: String(p.stock) }); }}
                                          title="Cliquer pour modifier"
                                          style={{ fontSize: 13, fontWeight: 700, color: isLow ? "var(--warn)" : "var(--ac)", background: "var(--acb)", border: `1px solid ${isLow ? "rgba(217,119,6,.3)" : "rgba(79,70,229,.2)"}`, borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontFamily: "inherit" }}>
                                          {p.stock} <span style={{ fontWeight: 400, fontSize: 11, color: "var(--mut)" }}>{p.unit}</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div style={{ flex: 1 }} />
                                {/* Actions */}
                                <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
                                  <Btn variant="success" onClick={() => setSellModal(p)}>Vendre</Btn>
                                  <Btn variant="pri" onClick={() => setModifyModal(p)}>Modifier</Btn>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: "10px 16px", borderTop: "1px solid var(--brd)", fontSize: 12, color: "var(--mut)" }}>{filtered.length} produit(s)</div>
            </Card>
          </div>

          {/* ══ Vue mobile (accordéon) ══ */}
          <div className="m-only" style={{ display: "none" }}>
            {filtered.map(p => {
              const tc = totalCost(p);
              const ec = expCount(p);
              const margin = p.sellPrice - tc;
              const mPct = p.sellPrice ? ((margin / p.sellPrice) * 100).toFixed(0) + "%" : "—";
              const stockTotal = totalSzStock(p);
              const isLow = p.category === "physical" && stockTotal <= LOW;
              const expanded = expandedId === p.id;
              return (
                <div key={p.id} style={{ background: "var(--w)", border: `1px solid ${expanded ? "var(--ac)" : "var(--brd)"}`, borderRadius: 14, overflow: "hidden", boxShadow: "var(--sh)", transition: "border-color .15s" }}>
                  <button onClick={() => toggleExpand(p.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "12px 13px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: "cover", border: "1px solid var(--brd)", flexShrink: 0 }} />
                      : <div style={{ width: 42, height: 42, borderRadius: 8, background: "var(--surf)", border: "1px solid var(--brd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: "var(--mut)", flexShrink: 0 }}>◻</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, color: "var(--txt)" }}>{p.name}</p>
                      <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                        <Bdg label={bN(p.bizId)} color={bC(p.bizId)} sm />
                        <CatBdg id={p.category} />
                        <SizesBadges p={p} />
                        {p.category === "physical" && <span style={{ fontSize: 10, color: isLow ? "var(--warn)" : "var(--mut)", fontWeight: isLow ? 600 : 400 }}>stock : {stockTotal}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginRight: 4 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "var(--ac)" }}>{euro(p.sellPrice)}</p>
                      <p style={{ fontSize: 11, color: margin >= 0 ? "var(--ok)" : "var(--err)", marginTop: 1 }}>{mPct}</p>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--mut)", display: "inline-block", transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>▼</span>
                  </button>
                  {expanded && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid var(--brd)", borderBottom: "1px solid var(--brd)" }}>
                        {[{ l: "Coût réel", v: euro(tc), sub: ec > 0 ? `+${ec} frais` : null, c: "var(--sub)" }, { l: "Prix vente", v: euro(p.sellPrice), c: "var(--txt)" }, { l: "Marge", v: mPct, c: margin >= 0 ? "var(--ok)" : "var(--err)" }].map((s, i) => (
                          <div key={i} style={{ padding: "10px 10px", borderRight: i < 2 ? "1px solid var(--brd)" : "none", textAlign: "center" }}>
                            <p style={{ fontSize: 9, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 3 }}>{s.l}</p>
                            <p style={{ fontWeight: 700, fontSize: 13, color: s.c }}>{s.v}</p>
                            {s.sub && <p style={{ fontSize: 9, color: "var(--warn)", marginTop: 1 }}>{s.sub}</p>}
                          </div>
                        ))}
                      </div>
                      {p.category === "physical" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 13px", borderBottom: "1px solid var(--brd)" }}>
                          <span style={{ fontSize: 11, color: "var(--mut)" }}>Stock :</span>
                          {hasSizes(p) ? (
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1 }}>
                              {SIZES.filter(s => (p.sizes[s] || 0) > 0).map(s => (
                                <span key={s} style={{ fontSize: 12, fontWeight: 700, color: "var(--ac)", background: "var(--acb)", border: "1px solid rgba(79,70,229,.2)", borderRadius: 6, padding: "3px 9px" }}>
                                  {s} : {p.sizes[s]}
                                </span>
                              ))}
                              <span style={{ fontSize: 11, color: "var(--mut)", alignSelf: "center" }}>= {stockTotal} total</span>
                            </div>
                          ) : editStock?.id === p.id ? (
                            <>
                              <input type="number" min="0" value={editStock.val} onChange={e => setEditStock(s => ({ ...s, val: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") confirmStock(p.id); if (e.key === "Escape") setEditStock(null); }} autoFocus style={{ width: 80, padding: "6px 10px", fontSize: 14, textAlign: "center" }} />
                              <button onClick={() => confirmStock(p.id)} style={{ ...sbtn, color: "var(--ok)", borderColor: "var(--ok)" }}>✓</button>
                              <button onClick={() => setEditStock(null)} style={{ ...sbtn, color: "var(--err)", borderColor: "var(--err)" }}>✕</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setEditStock({ id: p.id, val: String(p.stock) })} style={{ fontSize: 15, fontWeight: 700, color: isLow ? "var(--warn)" : "var(--ac)", background: "var(--acb)", border: `1px solid ${isLow ? "rgba(217,119,6,.3)" : "rgba(79,70,229,.2)"}`, borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontFamily: "inherit" }}>{p.stock}</button>
                              <span style={{ fontSize: 12, color: "var(--mut)" }}>{p.unit}</span>
                              <div style={{ flex: 1 }}><StockBar v={p.stock} /></div>
                            </>
                          )}
                        </div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 12 }}>
                        <Btn variant="success" onClick={() => setSellModal(p)} full>Vendre</Btn>
                        <Btn variant="warn" onClick={() => setExpModal(p)} full>Frais{ec > 0 ? ` (${ec})` : ""}</Btn>
                        <Btn variant="ghost" onClick={() => openEditMobile(p)} full>Éditer</Btn>
                        <Btn variant="err" onClick={() => setConfirm({ msg: `Supprimer "${p.name}" ?`, sub: "Il sera déplacé dans la corbeille pendant 30 jours.", onOk: () => { prodA.softDel(p.id); setExpandedId(null); setConfirm(null); } })} full>Supprimer</Btn>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            <p style={{ fontSize: 12, color: "var(--mut)", textAlign: "center", paddingTop: 4 }}>{filtered.length} produit(s)</p>
          </div>
        </>
      )}

      {/* ── Modals ── */}
      {confirm && <Confirm {...confirm} onCancel={() => setConfirm(null)} />}
      {sellModal && <SellModal product={sellModal} totalCost={totalCost(sellModal)} onConfirm={d => handleSell(sellModal, d)} onClose={() => setSellModal(null)} />}
      {expModal && <ExpensesModal product={expModal} expenses={expenses || []} onAdd={expenseA.add} onDel={expenseA.hardDel} onClose={() => setExpModal(null)} />}
      {modifyModal && <ModifyModal product={modifyModal} aBiz={aBiz} expenses={expenses || []} expenseA={expenseA} prodA={prodA} onClose={() => setModifyModal(null)} />}

      {/* Formulaire ajout + édition mobile */}
      {prodModal && (
        <Modal title={typeof prodModal === "string" ? "Nouveau produit" : "Modifier le produit"} onClose={() => setProdModal(null)}>
          <div className="fg2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <F label="Nom" col="1/-1"><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="ex: Peugeot 308, Prestation…" /></F>
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
            <F label="Prix d'achat (€)"><input type="number" value={form.buyPrice} onChange={e => set("buyPrice", e.target.value)} onFocus={e => e.target.select()} placeholder="0.00" /></F>
            <F label="Prix de vente (€)"><input type="number" value={form.sellPrice} onChange={e => set("sellPrice", e.target.value)} onFocus={e => e.target.select()} placeholder="0.00" /></F>
            {form.category === "physical" && <>
              {!form.sizes && (
                <>
                  <F label="Stock"><input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} onFocus={e => e.target.select()} min="0" /></F>
                  <F label="Unité"><select value={form.unit} onChange={e => set("unit", e.target.value)}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></F>
                </>
              )}
              <SizesToggle form={form} set={set} setForm={setForm} />
              {form.sizes && <SizesGrid sizes={form.sizes} onChange={v => set("sizes", v)} />}
            </>}
            <VehicleToggle form={form} set={set} />
            {form.isVehicle
              ? <VehicleFields form={form} set={set} />
              : <F label="Description" col="1/-1"><input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Variante, couleur…" /></F>
            }
          </div>
          <div style={{ marginTop: 14 }}>
            <Lbl>Photos (max 5)</Lbl>
            <PhotosField
              images={form.images || []}
              onAdd={url => set("images", [...(form.images || []), url])}
              onRemove={url => { set("images", (form.images || []).filter(u => u !== url)); setPendingDeletes(p => [...p, url]); }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <Btn onClick={() => setProdModal(null)}>Annuler</Btn>
            <Btn variant="pri" onClick={saveProd} disabled={!form.name.trim() || !form.bizId}>Enregistrer</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
