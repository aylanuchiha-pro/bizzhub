import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { M, uid, active, trashed, TRASH_MS } from "./utils";
import { CSS } from "./theme";
import Auth from "./components/Auth";
import { Sidebar, TopTabs } from "./components/Sidebar";
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
const mkActions = (table, mapper, state, setState, userId) => ({
  add: async item => {
    setState(s => [...s, item]);
    const row = mapper.to(item, userId);
    const { error } = await supabase.from(table).insert(row);
    if (error) console.error(`[${table}] add:`, error.message, JSON.stringify(row));
  },
  update: async item => {
    setState(s => s.map(x => x.id === item.id ? item : x));
    const { error } = await supabase.from(table).upsert(mapper.to(item, userId));
    if (error) console.error(`[${table}] update:`, error.message);
  },
  softDel: async id => {
    const now = Date.now();
    setState(s => s.map(x => x.id === id ? { ...x, deletedAt: now } : x));
    const { error } = await supabase.from(table).update({ deleted_at: new Date(now).toISOString() }).eq("id", id);
    if (error) console.error(`[${table}] softDel:`, error.message);
  },
  restore: async id => {
    setState(s => s.map(x => x.id === id ? { ...x, deletedAt: null } : x));
    const { error } = await supabase.from(table).update({ deleted_at: null }).eq("id", id);
    if (error) console.error(`[${table}] restore:`, error.message);
  },
  hardDel: async id => {
    setState(s => s.filter(x => x.id !== id));
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) console.error(`[${table}] hardDel:`, error.message);
  },
});

const mkPaymentActions = (setState, userId) => ({
  add: async item => {
    setState(s => [...s, item]);
    const { error } = await supabase.from("partner_payments").insert(M.payment.to(item, userId));
    if (error) console.error("[partner_payments] add:", error.message);
  },
  hardDel: async id => {
    setState(s => s.filter(x => x.id !== id));
    await supabase.from("partner_payments").delete().eq("id", id);
  },
});

const Loader = () => (
  <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
    <p style={{ color: "var(--mut)", fontSize: 14 }}>Chargement…</p>
  </div>
);

const TAB_LABELS = {
  dashboard: "Dashboard", products: "Produits & Stock", sales: "Ventes",
  rentals: "Locations", partners: "Partenaires", subscriptions: "Abonnements",
  businesses: "Activités", trash: "Corbeille",
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState("dashboard");

  const [biz, setBiz] = useState([]);
  const [prods, setProds] = useState([]);
  const [sales, setSales] = useState([]);
  const [rentalAssets, setRentalAssets] = useState([]);
  const [rentalBookings, setRentalBookings] = useState([]);
  const [partners, setPartners] = useState([]);
  const [salePartners, setSalePartners] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadAll();
      else setLoaded(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "SIGNED_IN") loadAll();
      if (event === "SIGNED_OUT") {
        setBiz([]); setProds([]); setSales([]);
        setRentalAssets([]); setRentalBookings([]);
        setPartners([]); setSalePartners([]); setPayments([]); setSubs([]);
        setTab("dashboard"); setLoaded(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadAll = async () => {
    setLoaded(false);
    const now = Date.now();
    const keep = x => !(x.deleted_at && (now - new Date(x.deleted_at).getTime()) >= TRASH_MS);

    const [b, p, s, ra, rb, pt, sp, pm, sb] = await Promise.all([
      supabase.from("businesses").select("*"),
      supabase.from("products").select("*"),
      supabase.from("sales").select("*"),
      supabase.from("rental_assets").select("*"),
      supabase.from("rental_bookings").select("*"),
      supabase.from("partners").select("*"),
      supabase.from("sale_partners").select("*"),
      supabase.from("partner_payments").select("*"),
      supabase.from("subscriptions").select("*"),
    ]);

    setBiz((b.data || []).filter(keep).map(M.biz.from));
    setProds((p.data || []).filter(keep).map(M.prod.from));
    setSales((s.data || []).filter(keep).map(M.sale.from));
    setRentalAssets((ra.data || []).filter(keep).map(M.asset.from));
    setRentalBookings((rb.data || []).filter(keep).map(M.booking.from));
    setPartners((pt.data || []).filter(keep).map(M.partner.from));
    setSalePartners((sp.data || []).map(M.sp.from));
    setPayments((pm.data || []).map(M.payment.from));
    setSubs((sb.data || []).filter(keep).map(M.sub.from));

    setDark(localStorage.getItem("bhub_theme") === "dark");
    setLoaded(true);
  };

  const userId = session?.user?.id;

  const bizA     = mkActions("businesses",     M.biz,     biz,            setBiz,            userId);
  const prodA    = mkActions("products",        M.prod,    prods,          setProds,          userId);
  const saleA    = mkActions("sales",           M.sale,    sales,          setSales,          userId);
  const assetA   = mkActions("rental_assets",   M.asset,   rentalAssets,   setRentalAssets,   userId);
  const bookingA = mkActions("rental_bookings", M.booking, rentalBookings, setRentalBookings, userId);
  const partnerA = mkActions("partners",        M.partner, partners,       setPartners,       userId);
  const spA      = mkActions("sale_partners",   M.sp,      salePartners,   setSalePartners,   userId);
  const subA     = mkActions("subscriptions",   M.sub,     subs,           setSubs,           userId);
  const paymentA = mkPaymentActions(setPayments, userId);

  const deleteBiz = async id => {
    const now = Date.now();
    const ts = new Date(now).toISOString();
    setBiz(s => s.map(x => x.id === id ? { ...x, deletedAt: now } : x));
    setProds(s => s.map(x => x.bizId === id && !x.deletedAt ? { ...x, deletedAt: now } : x));
    setSales(s => s.map(x => x.bizId === id && !x.deletedAt ? { ...x, deletedAt: now } : x));
    setRentalAssets(s => s.map(x => x.bizId === id && !x.deletedAt ? { ...x, deletedAt: now } : x));
    await Promise.all([
      supabase.from("businesses").update({ deleted_at: ts }).eq("id", id),
      supabase.from("products").update({ deleted_at: ts }).eq("biz_id", id).is("deleted_at", null),
      supabase.from("sales").update({ deleted_at: ts }).eq("biz_id", id).is("deleted_at", null),
      supabase.from("rental_assets").update({ deleted_at: ts }).eq("biz_id", id).is("deleted_at", null),
    ]);
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
    partners, salePartners, payments, subs,
    bizA, prodA, saleA, assetA, bookingA,
    partnerA, spA, subA, paymentA, deleteBiz,
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
        <div className="mhide" style={{ padding: "14px 24px", borderBottom: "1px solid var(--brd)", background: "var(--sdbar)", display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 700 }}>{TAB_LABELS[tab]}</p>
        </div>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--brd)", background: "var(--sdbar)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700 }}>Business<span style={{ color: "var(--ac)" }}>Hub</span></p>
          <p style={{ fontSize: 11, color: "var(--mut)" }}>@{username}</p>
        </div>
        <TopTabs tab={tab} setTab={setTab} trashCount={trashCount} dark={dark} onToggleDark={toggleDark} onLogout={logout} />
        <div className="pg" style={{ flex: 1, padding: "22px 24px", overflowY: "auto" }}>
          {views[tab]}
        </div>
      </div>
    </div>
  );
}
