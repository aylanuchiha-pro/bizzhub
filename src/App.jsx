import { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";
import loadingAnim from "./loading.json";
import { supabase } from "./supabase";
import { M, uid, active, trashed, TRASH_MS } from "./utils";
import { CSS } from "./theme";
import Auth from "./components/Auth";
import { Sidebar, MobileNav } from "./components/Sidebar";
import Dashboard from "./views/Dashboard";
import Businesses from "./views/Businesses";
import Products from "./views/Products";
import Sales from "./views/Sales";
import Rentals from "./views/Rentals";
import Partners from "./views/Partners";
import Subscriptions from "./views/Subscriptions";
import Trash from "./views/Trash";

// ─── Generic Supabase action factory ─────────────────────────────
// BUG FIX : mapper.to(item, null) envoyait user_id:null → rejeté par RLS.
// Maintenant userId est passé explicitement à la factory.
const mkActions = (table, mapper, state, setState, userId, onError) => ({
  add: async item => {
    const prev = state;
    setState(s => [...s, item]);
    const row = mapper.to(item, userId);
    const { error } = await supabase.from(table).insert(row);
    if (error) { setState(prev); console.error(`[${table}] add:`, error.message); onError?.("Erreur lors de l'enregistrement. Vérifiez votre connexion."); }
  },
  update: async item => {
    const prev = state;
    setState(s => s.map(x => x.id === item.id ? item : x));
    const { error } = await supabase.from(table).upsert(mapper.to(item, userId));
    if (error) { setState(prev); console.error(`[${table}] update:`, error.message); onError?.("Erreur lors de la mise à jour. Vérifiez votre connexion."); }
  },
  softDel: async id => {
    const prev = state;
    const now = Date.now();
    setState(s => s.map(x => x.id === id ? { ...x, deletedAt: now } : x));
    const { error } = await supabase.from(table).update({ deleted_at: new Date(now).toISOString() }).eq("id", id);
    if (error) { setState(prev); console.error(`[${table}] softDel:`, error.message); onError?.("Erreur lors de la suppression."); }
  },
  restore: async id => {
    const prev = state;
    setState(s => s.map(x => x.id === id ? { ...x, deletedAt: null } : x));
    const { error } = await supabase.from(table).update({ deleted_at: null }).eq("id", id);
    if (error) { setState(prev); console.error(`[${table}] restore:`, error.message); onError?.("Erreur lors de la restauration."); }
  },
  hardDel: async id => {
    const prev = state;
    setState(s => s.filter(x => x.id !== id));
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { setState(prev); console.error(`[${table}] hardDel:`, error.message); onError?.("Erreur lors de la suppression définitive."); }
  },
});

const mkPaymentActions = (payments, setState, userId, onError) => ({
  add: async item => {
    const prev = payments;
    setState(s => [...s, item]);
    const { error } = await supabase.from("partner_payments").insert(M.payment.to(item, userId));
    if (error) { setState(prev); console.error("[partner_payments] add:", error.message); onError?.("Erreur lors de l'enregistrement du paiement."); }
  },
  hardDel: async id => {
    const prev = payments;
    setState(s => s.filter(x => x.id !== id));
    const { error } = await supabase.from("partner_payments").delete().eq("id", id);
    if (error) { setState(prev); }
  },
});

const Loader = () => (
  <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
    <Lottie animationData={loadingAnim} loop style={{ width: 220, height: 220 }} />
  </div>
);

const TAB_LABELS = {
  dashboard: "Dashboard", products: "Produits & Stock", sales: "Ventes",
  rentals: "Locations", partners: "Partenaires", subscriptions: "Abonnements",
  businesses: "Activités", trash: "Corbeille",
};

export default function App() {
  const [session, setSession] = useState(null);
  const loadedUserRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [biz, setBiz] = useState([]);
  const [prods, setProds] = useState([]);
  const [sales, setSales] = useState([]);
  const [rentalAssets, setRentalAssets] = useState([]);
  const [rentalBookings, setRentalBookings] = useState([]);
  const [partners, setPartners] = useState([]);
  const [salePartners, setSalePartners] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subs, setSubs] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadAll(session);
      else setLoaded(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "SIGNED_IN") loadAll(session);
      if (event === "SIGNED_OUT") {
        loadedUserRef.current = null;
        setBiz([]); setProds([]); setSales([]);
        setRentalAssets([]); setRentalBookings([]);
        setPartners([]); setSalePartners([]); setPayments([]); setSubs([]); setExpenses([]);
        setTab("dashboard"); setLoaded(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadAll = async (userSession) => {
    const userId = userSession?.user?.id;
    if (!userId) { setLoaded(true); return; }
    if (loadedUserRef.current === userId) return;
    loadedUserRef.current = userId;
    setLoaded(false);
    const now = Date.now();
    const keep = x => !(x.deleted_at && (now - new Date(x.deleted_at).getTime()) >= TRASH_MS);

    const t0 = performance.now();
    const tq = (name, promise) => {
      const start = performance.now();
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000));
      return Promise.race([promise, timeout]).then(r => {
        console.log(`[load] ${name}: ${Math.round(performance.now() - start)}ms`);
        return r;
      }).catch(e => {
        console.warn(`[load] ${name}: ÉCHEC (${Math.round(performance.now() - start)}ms) —`, e.message);
        throw e;
      });
    };
    try {
      const [b, p, s, ra, rb, pt, sp, pm, sb, ex] = await Promise.allSettled([
        tq("businesses",       supabase.from("businesses").select("*").eq("user_id", userId)),
        tq("products",         supabase.from("products").select("id,user_id,biz_id,name,category,buy_price,sell_price,stock,unit,description,deleted_at,created_at,size,sizes,images,available").eq("user_id", userId)),
        tq("sales",            supabase.from("sales").select("*").eq("user_id", userId)),
        tq("rental_assets",    supabase.from("rental_assets").select("*").eq("user_id", userId)),
        tq("rental_bookings",  supabase.from("rental_bookings").select("*").eq("user_id", userId)),
        tq("partners",         supabase.from("partners").select("*").eq("user_id", userId)),
        tq("sale_partners",    supabase.from("sale_partners").select("*").eq("user_id", userId)),
        tq("partner_payments", supabase.from("partner_payments").select("*").eq("user_id", userId)),
        tq("subscriptions",    supabase.from("subscriptions").select("*").eq("user_id", userId)),
        tq("product_expenses", supabase.from("product_expenses").select("*").eq("user_id", userId)),
      ]);
      console.log(`[load] TOTAL: ${Math.round(performance.now() - t0)}ms`);

      const get = (r, name) => {
        if (r.status === "rejected") { console.error(`[load] ${name}: rejeté —`, r.reason?.message); return []; }
        if (r.value?.error) { console.error(`[load] ${name}: erreur DB —`, r.value.error.message); return []; }
        return r.value?.data || [];
      };
      setBiz(get(b,"businesses").filter(keep).map(M.biz.from));
      setProds(get(p,"products").filter(keep).map(M.prod.from));
      setSales(get(s,"sales").filter(keep).map(M.sale.from));
      setRentalAssets(get(ra,"rental_assets").filter(keep).map(M.asset.from));
      setRentalBookings(get(rb,"rental_bookings").filter(keep).map(M.booking.from));
      setPartners(get(pt,"partners").filter(keep).map(M.partner.from));
      setSalePartners(get(sp,"sale_partners").map(M.sp.from));
      setPayments(get(pm,"partner_payments").map(M.payment.from));
      setSubs(get(sb,"subscriptions").filter(keep).map(M.sub.from));
      setExpenses(get(ex,"product_expenses").map(M.expense.from));

      setDark(localStorage.getItem("bhub_theme") === "dark");
    } catch (e) {
      console.error("[loadAll] erreur:", e.message);
    } finally {
      setLoaded(true);
    }
  };

  const userId = session?.user?.id;

  const showError = msg => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  };

  const bizA     = mkActions("businesses",     M.biz,     biz,            setBiz,            userId, showError);
  const prodA    = mkActions("products",        M.prod,    prods,          setProds,          userId, showError);
  const saleA    = mkActions("sales",           M.sale,    sales,          setSales,          userId, showError);
  const assetA   = mkActions("rental_assets",   M.asset,   rentalAssets,   setRentalAssets,   userId, showError);
  const bookingA = mkActions("rental_bookings", M.booking, rentalBookings, setRentalBookings, userId, showError);
  const partnerA = mkActions("partners",        M.partner, partners,       setPartners,       userId, showError);
  const spA      = mkActions("sale_partners",   M.sp,      salePartners,   setSalePartners,   userId, showError);
  const subA     = mkActions("subscriptions",   M.sub,     subs,           setSubs,           userId, showError);
  const paymentA = mkPaymentActions(payments, setPayments, userId, showError);

  const expenseA = {
    add: async item => {
      const prev = expenses;
      setExpenses(s => [...s, item]);
      const { error } = await supabase.from("product_expenses").insert(M.expense.to(item, userId));
      if (error) { setExpenses(prev); console.error("[product_expenses] add:", error.message); showError("Erreur lors de l'enregistrement du frais."); }
    },
    hardDel: async id => {
      const prev = expenses;
      setExpenses(s => s.filter(x => x.id !== id));
      const { error } = await supabase.from("product_expenses").delete().eq("id", id);
      if (error) { setExpenses(prev); }
    },
  };

  const deleteBiz = async id => {
    const prevBiz = biz, prevProds = prods, prevSales = sales;
    const prevAssets = rentalAssets, prevBookings = rentalBookings, prevSubs = subs;
    const now = Date.now();
    const ts = new Date(now).toISOString();
    const assetIds = rentalAssets.filter(a => a.bizId === id && !a.deletedAt).map(a => a.id);
    setBiz(s => s.map(x => x.id === id ? { ...x, deletedAt: now } : x));
    setProds(s => s.map(x => x.bizId === id && !x.deletedAt ? { ...x, deletedAt: now } : x));
    setSales(s => s.map(x => x.bizId === id && !x.deletedAt ? { ...x, deletedAt: now } : x));
    setRentalAssets(s => s.map(x => x.bizId === id && !x.deletedAt ? { ...x, deletedAt: now } : x));
    setRentalBookings(s => s.map(x => assetIds.includes(x.assetId) && !x.deletedAt ? { ...x, deletedAt: now } : x));
    setSubs(s => s.map(x => x.bizId === id && !x.deletedAt ? { ...x, deletedAt: now } : x));
    const ops = [
      supabase.from("businesses").update({ deleted_at: ts }).eq("id", id),
      supabase.from("products").update({ deleted_at: ts }).eq("biz_id", id).is("deleted_at", null),
      supabase.from("sales").update({ deleted_at: ts }).eq("biz_id", id).is("deleted_at", null),
      supabase.from("rental_assets").update({ deleted_at: ts }).eq("biz_id", id).is("deleted_at", null),
      supabase.from("subscriptions").update({ deleted_at: ts }).eq("biz_id", id).is("deleted_at", null),
    ];
    if (assetIds.length > 0)
      ops.push(supabase.from("rental_bookings").update({ deleted_at: ts }).in("asset_id", assetIds).is("deleted_at", null));
    const results = await Promise.all(ops);
    if (results.some(r => r.error)) {
      setBiz(prevBiz); setProds(prevProds); setSales(prevSales);
      setRentalAssets(prevAssets); setRentalBookings(prevBookings); setSubs(prevSubs);
      showError("Erreur lors de la suppression de l'activité.");
    }
  };

  const toggleDark = () => {
    const nd = !dark;
    setDark(nd);
    localStorage.setItem("bhub_theme", nd ? "dark" : "light");
  };

  const logout = () => supabase.auth.signOut();

  if (!loaded) return <><style>{CSS(false)}</style><Loader /></>;
  if (!session) return <><style>{CSS(dark)}</style><Auth /></>;

  const username = session.user.email?.replace("@businesshub.app", "") ?? session.user.email;
  const aBiz = active(biz);
  const trashCount =
    trashed(biz).length + trashed(prods).length + trashed(sales).length +
    trashed(rentalAssets).length + trashed(subs).length;

  const shared = {
    biz, prods, sales, rentalAssets, rentalBookings,
    partners, salePartners, payments, subs, expenses,
    bizA, prodA, saleA, assetA, bookingA,
    partnerA, spA, subA, paymentA, expenseA, deleteBiz,
  };

  const views = {
    dashboard:     <Dashboard {...shared} />,
    products:      <Products {...shared} />,
    sales:         <Sales {...shared} />,
    rentals:       <Rentals {...shared} />,
    partners:      <Partners {...shared} />,
    subscriptions: <Subscriptions {...shared} />,
    businesses:    <Businesses {...shared} />,
    trash:         <Trash {...shared} />,
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", background: "var(--bg)" }}>
      <style>{CSS(dark)}</style>
      <Sidebar tab={tab} setTab={setTab} businesses={aBiz} username={username} onLogout={logout} dark={dark} onToggleDark={toggleDark} trashCount={trashCount} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Desktop sticky header */}
        <div className="mhide" style={{ padding: "14px 24px", borderBottom: "1px solid var(--brd)", background: "var(--sdbar)", display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 700 }}>{TAB_LABELS[tab]}</p>
        </div>
        {/* Mobile top bar avec hamburger */}
        <div className="mshow" style={{ display: "none", padding: "0 4px 0 16px", borderBottom: "1px solid var(--brd)", background: "var(--sdbar)", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 20, minHeight: 52 }}>
          <p onClick={() => setTab("dashboard")} style={{ fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Business<span style={{ color: "var(--ac)" }}>Hub</span></p>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--sub)" }}>{TAB_LABELS[tab]}</p>
            <button
              onClick={() => setMenuOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "12px", color: "var(--txt)", fontFamily: "inherit", display: "flex", flexDirection: "column", gap: 4, alignItems: "center", justifyContent: "center" }}
              aria-label="Menu"
            >
              <span style={{ display: "block", width: 20, height: 2, background: "currentColor", borderRadius: 2 }} />
              <span style={{ display: "block", width: 20, height: 2, background: "currentColor", borderRadius: 2 }} />
              <span style={{ display: "block", width: 20, height: 2, background: "currentColor", borderRadius: 2 }} />
            </button>
          </div>
        </div>
        <div className="pg" style={{ flex: 1, padding: "22px 24px", overflowY: "auto" }}>
          {Object.entries(views).map(([id, view]) => (
            <div key={id} style={{ display: tab === id ? "block" : "none" }}>
              {view}
            </div>
          ))}
        </div>
      </div>
      <MobileNav
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        tab={tab} setTab={setTab}
        businesses={aBiz} username={username}
        dark={dark} onToggleDark={toggleDark}
        onLogout={logout} trashCount={trashCount}
      />
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#dc2626", color: "#fff", padding: "12px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500, zIndex: 9999, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 4px 24px rgba(0,0,0,.25)", whiteSpace: "nowrap" }}>
          <span>⚠ {toast}</span>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
        </div>
      )}
    </div>
  );
}
