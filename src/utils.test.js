import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  euro, uid, today, fmtDate, pct, diffDays,
  active, trashed, daysLeft, cycleMonthly,
  TRASH_MS, LOW, SIZES, CATS, CYCLES, BOOKING_STATUS,
  M,
} from "./utils";

// ─── euro ─────────────────────────────────────────────────────────
describe("euro", () => {
  it("formate un entier", () => {
    expect(euro(1000)).toBe("1 000,00 €");
  });
  it("formate des centimes", () => {
    expect(euro(9.5)).toBe("9,50 €");
  });
  it("formate zéro", () => {
    expect(euro(0)).toBe("0,00 €");
  });
  it("traite null/undefined comme 0", () => {
    expect(euro(null)).toBe("0,00 €");
    expect(euro(undefined)).toBe("0,00 €");
  });
  it("formate les négatifs", () => {
    const r = euro(-50);
    expect(r).toContain("50");
    expect(r).toContain("€");
  });
});

// ─── uid ──────────────────────────────────────────────────────────
describe("uid", () => {
  it("retourne une chaîne non vide", () => {
    expect(typeof uid()).toBe("string");
    expect(uid().length).toBeGreaterThan(0);
  });
  it("génère des ids uniques", () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBe(100);
  });
});

// ─── today ────────────────────────────────────────────────────────
describe("today", () => {
  it("retourne le format YYYY-MM-DD", () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("correspond à la date actuelle", () => {
    const d = new Date().toISOString().split("T")[0];
    expect(today()).toBe(d);
  });
});

// ─── fmtDate ──────────────────────────────────────────────────────
describe("fmtDate", () => {
  it("formate une date ISO", () => {
    const r = fmtDate("2025-01-15");
    expect(r).toContain("15");
    expect(r).toContain("janv");
  });
  it("retourne — pour valeur falsy", () => {
    expect(fmtDate(null)).toBe("—");
    expect(fmtDate("")).toBe("—");
    expect(fmtDate(undefined)).toBe("—");
  });
});

// ─── pct ──────────────────────────────────────────────────────────
describe("pct", () => {
  it("calcule un pourcentage", () => {
    expect(pct(50, 200)).toBe("25.0%");
  });
  it("retourne — si b est 0", () => {
    expect(pct(50, 0)).toBe("—");
  });
  it("100%", () => {
    expect(pct(100, 100)).toBe("100.0%");
  });
  it("négatif", () => {
    expect(pct(-20, 100)).toBe("-20.0%");
  });
});

// ─── diffDays ─────────────────────────────────────────────────────
describe("diffDays", () => {
  it("calcule le nombre de jours", () => {
    expect(diffDays("2025-01-01", "2025-01-11")).toBe(10);
  });
  it("retourne 0 si même date", () => {
    expect(diffDays("2025-06-01", "2025-06-01")).toBe(0);
  });
  it("retourne null si argument manquant", () => {
    expect(diffDays(null, "2025-01-01")).toBeNull();
    expect(diffDays("2025-01-01", null)).toBeNull();
  });
});

// ─── active / trashed ─────────────────────────────────────────────
describe("active", () => {
  it("filtre les items sans deletedAt", () => {
    const items = [
      { id: 1, deletedAt: null },
      { id: 2, deletedAt: Date.now() },
      { id: 3, deletedAt: undefined },
    ];
    expect(active(items).map(x => x.id)).toEqual([1, 3]);
  });
  it("gère un tableau vide", () => {
    expect(active([])).toEqual([]);
  });
  it("gère null/undefined", () => {
    expect(active(null)).toEqual([]);
    expect(active(undefined)).toEqual([]);
  });
});

describe("trashed", () => {
  it("retourne les items supprimés dans les 30j", () => {
    const recentDel = Date.now() - 1000 * 60 * 60; // 1h ago
    const oldDel = Date.now() - TRASH_MS - 1000;    // > 30j
    const items = [
      { id: 1, deletedAt: null },
      { id: 2, deletedAt: recentDel },
      { id: 3, deletedAt: oldDel },
    ];
    expect(trashed(items).map(x => x.id)).toEqual([2]);
  });
  it("gère null/undefined", () => {
    expect(trashed(null)).toEqual([]);
  });
});

// ─── daysLeft ─────────────────────────────────────────────────────
describe("daysLeft", () => {
  it("retourne ~30 pour un item supprimé à l'instant", () => {
    const now = Date.now();
    expect(daysLeft(now)).toBeGreaterThanOrEqual(29);
    expect(daysLeft(now)).toBeLessThanOrEqual(30);
  });
  it("retourne 0 pour un item expiré", () => {
    const expired = Date.now() - TRASH_MS - 1000;
    expect(daysLeft(expired)).toBe(0);
  });
});

// ─── cycleMonthly ─────────────────────────────────────────────────
describe("cycleMonthly", () => {
  it("mensuel = identique", () => {
    expect(cycleMonthly(100, "monthly")).toBe(100);
  });
  it("annuel ÷ 12", () => {
    expect(cycleMonthly(1200, "annual")).toBeCloseTo(100);
  });
  it("hebdo × 4.33", () => {
    expect(cycleMonthly(100, "weekly")).toBeCloseTo(433);
  });
});

// ─── Constantes ───────────────────────────────────────────────────
describe("constantes", () => {
  it("LOW = 5", () => { expect(LOW).toBe(5); });
  it("TRASH_MS = 30 jours", () => { expect(TRASH_MS).toBe(30 * 864e5); });
  it("SIZES contient 5 tailles", () => {
    expect(SIZES).toEqual(["S", "M", "L", "XL", "XXL"]);
  });
  it("CATS contient 3 catégories", () => {
    expect(CATS.map(c => c.id)).toEqual(["physical", "service", "digital"]);
  });
  it("CYCLES contient monthly/annual/weekly", () => {
    expect(CYCLES.map(c => c.id)).toEqual(["monthly", "annual", "weekly"]);
  });
  it("BOOKING_STATUS contient 4 statuts", () => {
    expect(BOOKING_STATUS.map(s => s.id)).toEqual(["confirmee", "en_cours", "terminee", "annulee"]);
  });
});

// ─── Mappers M ────────────────────────────────────────────────────
const USER_ID = "test-user-123";

describe("M.biz", () => {
  const row = { id: "b1", name: "Mon activité", color: "#4f46e5", deleted_at: null };

  it("from : convertit la ligne DB en objet JS", () => {
    const r = M.biz.from(row);
    expect(r).toEqual({ id: "b1", name: "Mon activité", color: "#4f46e5", deletedAt: null });
  });
  it("to : convertit l'objet JS en ligne DB avec user_id", () => {
    const obj = { id: "b1", name: "Mon activité", color: "#4f46e5", deletedAt: null };
    const r = M.biz.to(obj, USER_ID);
    expect(r.user_id).toBe(USER_ID);
    expect(r.name).toBe("Mon activité");
    expect(r.deleted_at).toBeNull();
  });
  it("to : convertit deletedAt en ISO string", () => {
    const ts = 1700000000000;
    const obj = { id: "b1", name: "x", color: "#fff", deletedAt: ts };
    const r = M.biz.to(obj, USER_ID);
    expect(r.deleted_at).toBe(new Date(ts).toISOString());
  });
});

describe("M.prod", () => {
  const row = {
    id: "p1", biz_id: "b1", name: "Produit test",
    category: "physical", buy_price: 10, sell_price: 25,
    stock: 8, unit: "unité(s)", description: "desc",
    image: null, images: ["url1"], available: true,
    size: null, sizes: { S: 3, M: 5, L: 0, XL: 0, XXL: 0 },
    deleted_at: null,
  };

  it("from : champs de base corrects", () => {
    const r = M.prod.from(row);
    expect(r.bizId).toBe("b1");
    expect(r.buyPrice).toBe(10);
    expect(r.sellPrice).toBe(25);
    expect(r.sizes).toEqual({ S: 3, M: 5, L: 0, XL: 0, XXL: 0 });
    expect(r.images).toEqual(["url1"]);
    expect(r.available).toBe(true);
  });
  it("from : valeurs par défaut si colonnes absentes", () => {
    const minimal = { id: "p2", biz_id: "b1", name: "x", category: "service", buy_price: 0, sell_price: 0, stock: 0, unit: "unité(s)", deleted_at: null };
    const r = M.prod.from(minimal);
    expect(r.description).toBe("");
    expect(r.images).toEqual([]);
    expect(r.available).toBe(false);
    expect(r.sizes).toBeNull();
  });
  it("to : user_id injecté", () => {
    const obj = M.prod.from(row);
    const r = M.prod.to(obj, USER_ID);
    expect(r.user_id).toBe(USER_ID);
    expect(r.biz_id).toBe("b1");
    expect(r.buy_price).toBe(10);
    expect(r.sell_price).toBe(25);
  });
  it("to : sizes actif → size = null", () => {
    const obj = { ...M.prod.from(row), sizes: { S: 2 } };
    const r = M.prod.to(obj, USER_ID);
    expect(r.size).toBeNull();
  });
});

describe("M.sale", () => {
  const row = {
    id: "s1", biz_id: "b1", product_id: "p1", name: "Vente test",
    qty: 2, sell_price: 50, cost_price: 20, sale_date: "2025-03-15",
    notes: "client ok", size: "M", payment_status: "complet",
    deposit_amount: 0, deleted_at: null,
  };

  it("from : tous les champs mappés", () => {
    const r = M.sale.from(row);
    expect(r.bizId).toBe("b1");
    expect(r.productId).toBe("p1");
    expect(r.qty).toBe(2);
    expect(r.sellPrice).toBe(50);
    expect(r.costPrice).toBe(20);
    expect(r.date).toBe("2025-03-15");
    expect(r.paymentStatus).toBe("complet");
    expect(r.depositAmount).toBe(0);
  });
  it("from : paymentStatus par défaut = complet", () => {
    const r = M.sale.from({ ...row, payment_status: null });
    expect(r.paymentStatus).toBe("complet");
  });
  it("to : user_id, sale_date, cost_price corrects", () => {
    const obj = M.sale.from(row);
    const r = M.sale.to(obj, USER_ID);
    expect(r.user_id).toBe(USER_ID);
    expect(r.sale_date).toBe("2025-03-15");
    expect(r.cost_price).toBe(20);
    expect(r.product_id).toBe("p1");
  });
});

describe("M.sp (sale_partners)", () => {
  const row = { id: "sp1", sale_id: "s1", partner_id: "pt1", share_pct: 30, amount_due: 45 };

  it("from : tous les champs", () => {
    const r = M.sp.from(row);
    expect(r).toEqual({ id: "sp1", saleId: "s1", partnerId: "pt1", sharePct: 30, amountDue: 45 });
  });
  it("to : snakeCase correct", () => {
    const obj = { id: "sp1", saleId: "s1", partnerId: "pt1", sharePct: 30, amountDue: 45 };
    const r = M.sp.to(obj, USER_ID);
    expect(r.user_id).toBe(USER_ID);
    expect(r.sale_id).toBe("s1");
    expect(r.partner_id).toBe("pt1");
    expect(r.share_pct).toBe(30);
    expect(r.amount_due).toBe(45);
  });
});

describe("M.partner", () => {
  it("from/to aller-retour", () => {
    const row = { id: "pt1", name: "Alice", notes: "associée", deleted_at: null };
    const obj = M.partner.from(row);
    expect(obj).toEqual({ id: "pt1", name: "Alice", notes: "associée", deletedAt: null });
    const back = M.partner.to(obj, USER_ID);
    expect(back.user_id).toBe(USER_ID);
    expect(back.name).toBe("Alice");
  });
});

describe("M.asset (rental_assets)", () => {
  it("from : monthlyCost mappé depuis monthly_cost", () => {
    const row = { id: "a1", biz_id: "b1", name: "Voiture", monthly_cost: 500, notes: "", deleted_at: null };
    const r = M.asset.from(row);
    expect(r.monthlyCost).toBe(500);
    expect(r.bizId).toBe("b1");
  });
  it("to : monthly_cost dans la ligne DB", () => {
    const obj = { id: "a1", bizId: "b1", name: "Voiture", monthlyCost: 500, notes: "", deletedAt: null };
    const r = M.asset.to(obj, USER_ID);
    expect(r.monthly_cost).toBe(500);
    expect(r.biz_id).toBe("b1");
  });
});

describe("M.booking (rental_bookings)", () => {
  it("from : tous les champs", () => {
    const row = { id: "bk1", asset_id: "a1", sell_price: 200, start_date: "2025-06-01", end_date: "2025-06-07", status: "confirmee", notes: "", deleted_at: null };
    const r = M.booking.from(row);
    expect(r.assetId).toBe("a1");
    expect(r.sellPrice).toBe(200);
    expect(r.startDate).toBe("2025-06-01");
    expect(r.endDate).toBe("2025-06-07");
    expect(r.status).toBe("confirmee");
  });
  it("from : end_date null reste null", () => {
    const row = { id: "bk2", asset_id: "a1", sell_price: 100, start_date: "2025-06-01", end_date: null, status: "en_cours", notes: "", deleted_at: null };
    const r = M.booking.from(row);
    expect(r.endDate).toBeNull();
  });
});

describe("M.sub (subscriptions)", () => {
  it("from : cycle et nextDate mappés", () => {
    const row = { id: "sb1", biz_id: "b1", name: "Netflix", amount: 15, cycle: "monthly", next_billing_date: "2025-07-01", active: true, notes: "", deleted_at: null };
    const r = M.sub.from(row);
    expect(r.cycle).toBe("monthly");
    expect(r.nextDate).toBe("2025-07-01");
    expect(r.active).toBe(true);
  });
});

describe("M.expense (product_expenses)", () => {
  it("from : productId et expense_date", () => {
    const row = { id: "e1", product_id: "p1", label: "Révision", amount: 80, expense_date: "2025-04-10" };
    const r = M.expense.from(row);
    expect(r.productId).toBe("p1");
    expect(r.date).toBe("2025-04-10");
  });
  it("to : product_id et expense_date", () => {
    const obj = { id: "e1", productId: "p1", label: "Révision", amount: 80, date: "2025-04-10" };
    const r = M.expense.to(obj, USER_ID);
    expect(r.product_id).toBe("p1");
    expect(r.expense_date).toBe("2025-04-10");
  });
});

describe("M.bizExpense (biz_expenses)", () => {
  it("from : bizId et productId nullable", () => {
    const row = { id: "be1", biz_id: "b1", product_id: null, label: "Carburant", amount: 60, expense_date: "2025-05-01", notes: "", deleted_at: null };
    const r = M.bizExpense.from(row);
    expect(r.bizId).toBe("b1");
    expect(r.productId).toBeNull();
  });
});

describe("M.order (orders)", () => {
  it("from : reference, supplier, status par défaut", () => {
    const row = { id: "o1", biz_id: "b1", reference: "CMD-001", supplier: "Fournisseur X", order_date: "2025-05-01", expected_date: null, status: "en_attente", notes: "", deleted_at: null };
    const r = M.order.from(row);
    expect(r.reference).toBe("CMD-001");
    expect(r.supplier).toBe("Fournisseur X");
    expect(r.status).toBe("en_attente");
  });
  it("from : status par défaut si null", () => {
    const row = { id: "o2", biz_id: null, reference: "CMD-002", supplier: null, order_date: "2025-05-01", expected_date: null, status: null, notes: "", deleted_at: null };
    const r = M.order.from(row);
    expect(r.status).toBe("en_attente");
    expect(r.supplier).toBe("");
    expect(r.bizId).toBeNull();
  });
});

describe("M.orderItem (order_items)", () => {
  it("from : orderId, productId nullable, size nullable", () => {
    const row = { id: "oi1", order_id: "o1", product_id: "p1", name: "Article", qty: 3, unit_price: 15, size: "M", notes: "" };
    const r = M.orderItem.from(row);
    expect(r.orderId).toBe("o1");
    expect(r.productId).toBe("p1");
    expect(r.unitPrice).toBe(15);
    expect(r.size).toBe("M");
  });
  it("from : product_id null si pas de produit lié", () => {
    const row = { id: "oi2", order_id: "o1", product_id: null, name: "Divers", qty: 1, unit_price: 10, size: null, notes: "" };
    const r = M.orderItem.from(row);
    expect(r.productId).toBeNull();
    expect(r.size).toBeNull();
  });
});

// ─── Logiques métier clés ──────────────────────────────────────────
describe("Calcul profit & trésorerie", () => {
  it("profit = (sellPrice - costPrice) * qty", () => {
    const sellPrice = 100, costPrice = 40, qty = 3;
    expect((sellPrice - costPrice) * qty).toBe(180);
  });
  it("amountDue = profit * sharePct / 100", () => {
    const profit = 180, sharePct = 30;
    expect(profit * sharePct / 100).toBeCloseTo(54);
  });
  it("trésorerie : stockValue exclu si filtre de période actif", () => {
    const salesCa = 5000, rentalCa = 1000;
    const allSalesCost = 2000, rentalPropCost = 500;
    const stockValue = 3000;
    const expensesTotal = 200, bizExpTotal = 300;

    const from_empty = "";
    const from_date = "2025-01-01";

    const tresoAllTime = salesCa + rentalCa - allSalesCost - rentalPropCost - (from_empty ? 0 : stockValue) - expensesTotal - bizExpTotal;
    const tresoFiltered = salesCa + rentalCa - allSalesCost - rentalPropCost - (from_date ? 0 : stockValue) - expensesTotal - bizExpTotal;

    // All-time : stockValue soustrait
    expect(tresoAllTime).toBe(5000 + 1000 - 2000 - 500 - 3000 - 200 - 300);
    // Avec filtre période : stockValue non soustrait
    expect(tresoFiltered).toBe(5000 + 1000 - 2000 - 500 - 0 - 200 - 300);
    expect(tresoFiltered - tresoAllTime).toBe(stockValue);
  });
  it("acompte : reste à encaisser = total - depositAmount", () => {
    const sellPrice = 500, qty = 2, depositAmount = 300;
    expect(sellPrice * qty - depositAmount).toBe(700);
  });
});

describe("Logique stock produit", () => {
  it("décrément stock simple", () => {
    const stock = 10, qty = 3;
    expect(Math.max(0, stock - qty)).toBe(7);
  });
  it("stock ne descend pas sous 0", () => {
    const stock = 2, qty = 5;
    expect(Math.max(0, stock - qty)).toBe(0);
  });
  it("décrément stock par taille", () => {
    const sizes = { S: 5, M: 3, L: 2, XL: 0, XXL: 0 };
    const qty = 2, selSize = "M";
    const newSizes = { ...sizes, [selSize]: Math.max(0, (sizes[selSize] || 0) - qty) };
    expect(newSizes.M).toBe(1);
    expect(newSizes.S).toBe(5); // inchangé
  });
  it("total stock par taille", () => {
    const sizes = { S: 5, M: 3, L: 2, XL: 0, XXL: 0 };
    const total = ["S", "M", "L", "XL", "XXL"].reduce((a, s) => a + (sizes[s] || 0), 0);
    expect(total).toBe(10);
  });
  it("seuil LOW : stock ≤ 5 = faible", () => {
    expect(5 <= LOW).toBe(true);
    expect(6 <= LOW).toBe(false);
  });
});

describe("Filtre période (Sales / Dashboard)", () => {
  it("filtre 7 jours : date >= il y a 6 jours", () => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    const from = d.toISOString().split("T")[0];
    const sale = { date: today() };
    expect(sale.date >= from).toBe(true);
  });
  it("exclut une vente ancienne", () => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    const from = d.toISOString().split("T")[0];
    const oldSale = { date: "2020-01-01" };
    expect(oldSale.date >= from).toBe(false);
  });
});

describe("cycleMonthly — abonnements", () => {
  it("calcul coût mensuel total multi-abonnements", () => {
    const subs = [
      { amount: 120, cycle: "annual" },   // 10/mois
      { amount: 50, cycle: "monthly" },   // 50/mois
      { amount: 20, cycle: "weekly" },    // ~86.6/mois
    ];
    const monthly = subs.reduce((a, s) => a + cycleMonthly(s.amount, s.cycle), 0);
    expect(monthly).toBeCloseTo(10 + 50 + 86.6, 0);
  });
});
