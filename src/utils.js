export const euro = n => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n ?? 0);
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
export const today = () => new Date().toISOString().split("T")[0];
export const fmtDate = d => d ? new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" }) : "—";
export const pct = (a, b) => b ? ((a / b) * 100).toFixed(1) + "%" : "—";
export const diffDays = (a, b) => { if (!a || !b) return null; return Math.max(0, Math.round((new Date(b) - new Date(a)) / 864e5)); };
export const MO = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
export const TRASH_MS = 30 * 864e5;
export const active = arr => (arr || []).filter(x => !x.deletedAt);
export const trashed = arr => (arr || []).filter(x => x.deletedAt && (Date.now() - x.deletedAt) < TRASH_MS);
export const daysLeft = dt => Math.max(0, Math.ceil((TRASH_MS - (Date.now() - dt)) / 864e5));
export const LOW = 5;
export const PALETTE = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4"];
export const CATS = [{ id: "physical", l: "Produit physique" }, { id: "service", l: "Service" }, { id: "digital", l: "Produit digital" }];
export const UNITS = ["unité(s)", "heure(s)", "licence(s)", "exemplaire(s)", "lot(s)", "kg", "litre(s)"];
export const SIZES = ["S", "M", "L", "XL", "XXL"];
export const CYCLES = [{ id: "monthly", l: "Mensuel" }, { id: "annual", l: "Annuel" }, { id: "weekly", l: "Hebdo" }];
export const BOOKING_STATUS = [
  { id: "confirmee", l: "Confirmée" },
  { id: "en_cours",  l: "En cours"  },
  { id: "terminee",  l: "Terminée"  },
  { id: "annulee",   l: "Annulée"   },
];

export const compressImg = (file, maxDim = 200) => new Promise(res => {
  const img = new Image();
  const r = new FileReader();
  r.onload = e => {
    img.src = e.target.result;
    img.onload = () => {
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      const c = document.createElement("canvas");
      c.width = img.width * scale; c.height = img.height * scale;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.7));
    };
  };
  r.readAsDataURL(file);
});

export const cycleMonthly = (amount, cycle) => {
  if (cycle === "annual") return amount / 12;
  if (cycle === "weekly") return amount * 4.33;
  return amount;
};

// ─── DB ↔ JS mappers ──────────────────────────────────────────────
const dt  = v => v ? new Date(v).getTime() : null;
const iso = v => v ? new Date(v).toISOString() : null;

export const M = {
  biz: {
    from: r => ({ id: r.id, name: r.name, color: r.color, deletedAt: dt(r.deleted_at) }),
    to: (o, uid) => ({ id: o.id, user_id: uid, name: o.name, color: o.color, deleted_at: iso(o.deletedAt) }),
  },
  prod: {
    from: r => ({ id: r.id, bizId: r.biz_id, name: r.name, category: r.category, buyPrice: r.buy_price, sellPrice: r.sell_price, stock: r.stock, unit: r.unit, description: r.description || "", image: r.image || null, size: r.size || "", deletedAt: dt(r.deleted_at) }),
    to: (o, uid) => ({ id: o.id, user_id: uid, biz_id: o.bizId, name: o.name, category: o.category, buy_price: o.buyPrice, sell_price: o.sellPrice, stock: o.stock, unit: o.unit, description: o.description, image: o.image, size: o.size || null, deleted_at: iso(o.deletedAt) }),
  },
  sale: {
    from: r => ({ id: r.id, bizId: r.biz_id, productId: r.product_id, name: r.name, qty: r.qty, sellPrice: r.sell_price, costPrice: r.cost_price, date: r.sale_date, notes: r.notes || "", deletedAt: dt(r.deleted_at) }),
    to: (o, uid) => ({ id: o.id, user_id: uid, biz_id: o.bizId, product_id: o.productId || null, name: o.name, qty: o.qty, sell_price: o.sellPrice, cost_price: o.costPrice, sale_date: o.date, notes: o.notes, deleted_at: iso(o.deletedAt) }),
  },
  // Rental asset = véhicule / bien loué (coût mensuel fixe)
  asset: {
    from: r => ({ id: r.id, bizId: r.biz_id, name: r.name, monthlyCost: r.monthly_cost, notes: r.notes || "", deletedAt: dt(r.deleted_at) }),
    to: (o, uid) => ({ id: o.id, user_id: uid, biz_id: o.bizId || null, name: o.name, monthly_cost: o.monthlyCost, notes: o.notes, deleted_at: iso(o.deletedAt) }),
  },
  // Rental booking = une location individuelle liée à un asset
  booking: {
    from: r => ({ id: r.id, assetId: r.asset_id, sellPrice: r.sell_price, startDate: r.start_date, endDate: r.end_date || null, status: r.status, notes: r.notes || "", deletedAt: dt(r.deleted_at) }),
    to: (o, uid) => ({ id: o.id, user_id: uid, asset_id: o.assetId, sell_price: o.sellPrice, start_date: o.startDate, end_date: o.endDate || null, status: o.status, notes: o.notes, deleted_at: iso(o.deletedAt) }),
  },
  partner: {
    from: r => ({ id: r.id, name: r.name, notes: r.notes || "", deletedAt: dt(r.deleted_at) }),
    to: (o, uid) => ({ id: o.id, user_id: uid, name: o.name, notes: o.notes, deleted_at: iso(o.deletedAt) }),
  },
  sp: {
    from: r => ({ id: r.id, saleId: r.sale_id, partnerId: r.partner_id, sharePct: r.share_pct, amountDue: r.amount_due }),
    to: (o, uid) => ({ id: o.id, user_id: uid, sale_id: o.saleId, partner_id: o.partnerId, share_pct: o.sharePct, amount_due: o.amountDue }),
  },
  payment: {
    from: r => ({ id: r.id, partnerId: r.partner_id, amount: r.amount, date: r.payment_date, notes: r.notes || "" }),
    to: (o, uid) => ({ id: o.id, user_id: uid, partner_id: o.partnerId, amount: o.amount, payment_date: o.date, notes: o.notes }),
  },
  sub: {
    from: r => ({ id: r.id, bizId: r.biz_id, name: r.name, amount: r.amount, cycle: r.cycle, nextDate: r.next_billing_date, active: r.active, notes: r.notes || "", deletedAt: dt(r.deleted_at) }),
    to: (o, uid) => ({ id: o.id, user_id: uid, biz_id: o.bizId || null, name: o.name, amount: o.amount, cycle: o.cycle, next_billing_date: o.nextDate || null, active: o.active, notes: o.notes, deleted_at: iso(o.deletedAt) }),
  },
  expense: {
    from: r => ({ id: r.id, productId: r.product_id, label: r.label, amount: r.amount, date: r.expense_date }),
    to: (o, uid) => ({ id: o.id, user_id: uid, product_id: o.productId, label: o.label, amount: o.amount, expense_date: o.date }),
  },
};
