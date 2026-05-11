import { useMemo, useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { euro, pct, active, MO, cycleMonthly, diffDays, LOW, SIZES } from "../utils";
import { KPI, Card, Empty, Bdg, ChartTip } from "../components/ui";

const PERIODS = [
  { id: "all",    l: "Tout" },
  { id: "month",  l: "Ce mois" },
  { id: "3m",     l: "3 mois" },
  { id: "year",   l: "Cette année" },
  { id: "custom", l: "Personnalisé" },
];

const szStock = p => p.sizes && SIZES.some(s => (p.sizes[s] || 0) > 0)
  ? SIZES.reduce((a, s) => a + (p.sizes[s] || 0), 0)
  : (p.stock || 0);

export default function Dashboard({ biz, prods, sales, rentalAssets, rentalBookings, subs, expenses, bizExpenses, orders, orderItems }) {
  const [period,   setPeriod]   = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [selBiz,   setSelBiz]   = useState("all");

  const aBiz      = active(biz);
  const aSales    = active(sales);
  const aProds    = active(prods);
  const aAssets   = active(rentalAssets);
  const aBookings = active(rentalBookings);
  const aSubs     = active(subs).filter(s => s.active);
  const aExpenses    = expenses || [];
  const aBizExpenses = active(bizExpenses || []);

  const { from, to } = useMemo(() => {
    const now = new Date();
    if (period === "month") {
      const f = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: f.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
    }
    if (period === "3m") {
      const f = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { from: f.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
    }
    if (period === "year") {
      const f = new Date(now.getFullYear(), 0, 1);
      return { from: f.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
    }
    if (period === "custom") return { from: dateFrom, to: dateTo };
    return { from: "", to: "" };
  }, [period, dateFrom, dateTo]);

  const fSales = useMemo(() => {
    let s = aSales;
    if (from) s = s.filter(x => x.date >= from);
    if (to)   s = s.filter(x => x.date <= to);
    if (selBiz !== "all") s = s.filter(x => x.bizId === selBiz);
    return s;
  }, [aSales, from, to, selBiz]);

  const fBookings = useMemo(() => {
    let b = aBookings;
    if (from) b = b.filter(x => (x.startDate || "") >= from);
    if (to)   b = b.filter(x => (x.startDate || "") <= to);
    if (selBiz !== "all") {
      const ids = aAssets.filter(a => a.bizId === selBiz).map(a => a.id);
      b = b.filter(x => ids.includes(x.assetId));
    }
    return b;
  }, [aBookings, aAssets, from, to, selBiz]);

  const fProds = useMemo(() => {
    if (selBiz === "all") return aProds;
    return aProds.filter(x => x.bizId === selBiz);
  }, [aProds, selBiz]);

  const fExpenses = useMemo(() => {
    let e = aExpenses;
    if (from) e = e.filter(x => x.date >= from);
    if (to)   e = e.filter(x => x.date <= to);
    if (selBiz !== "all") {
      const ids = aProds.filter(p => p.bizId === selBiz).map(p => p.id);
      e = e.filter(x => ids.includes(x.productId));
    }
    return e;
  }, [aExpenses, aProds, from, to, selBiz]);

  const fBizExpenses = useMemo(() => {
    let e = aBizExpenses;
    if (from) e = e.filter(x => x.date >= from);
    if (to)   e = e.filter(x => x.date <= to);
    if (selBiz !== "all") {
      const bizProdIds = aProds.filter(p => p.bizId === selBiz).map(p => p.id);
      e = e.filter(x => x.bizId === selBiz || bizProdIds.includes(x.productId));
    }
    return e;
  }, [aBizExpenses, aProds, from, to, selBiz]);

  const fSubs = useMemo(() => {
    if (selBiz === "all") return aSubs;
    return aSubs.filter(x => !x.bizId || x.bizId === selBiz);
  }, [aSubs, selBiz]);

  // Commandes en attente (argent sorti mais stock pas encore mis à jour)
  const fPendingOrders = useMemo(() => {
    let o = active(orders || []).filter(x => x.status === "en_attente" || x.status === "recu_partiel");
    if (from) o = o.filter(x => x.date >= from);
    if (to)   o = o.filter(x => x.date <= to);
    if (selBiz !== "all") o = o.filter(x => x.bizId === selBiz);
    return o;
  }, [orders, from, to, selBiz]);

  const bizName  = id => aBiz.find(b => b.id === id)?.name ?? "—";
  const bizColor = id => aBiz.find(b => b.id === id)?.color ?? "var(--mut)";

  const stats = useMemo(() => {
    const saleAmt = s => s.paymentStatus === "acompte" ? (s.depositAmount || 0) : s.sellPrice * s.qty;

    const salesCa     = fSales.reduce((a, s) => a + saleAmt(s), 0);
    const salesProfit = fSales.filter(s => s.paymentStatus !== "acompte").reduce((a, s) => a + (s.sellPrice - s.costPrice) * s.qty, 0);

    const rentalCa       = fBookings.reduce((a, b) => a + b.sellPrice, 0);
    const rentalPropCost = fBookings.reduce((a, b) => {
      const asset = aAssets.find(x => x.id === b.assetId);
      const days  = diffDays(b.startDate, b.endDate) || 0;
      return a + (asset ? (asset.monthlyCost / 30) * days : 0);
    }, 0);
    const rentalProfit = rentalCa - rentalPropCost;

    const totalCa      = salesCa + rentalCa;
    const totalProfit  = salesProfit + rentalProfit;
    const monthlyCharges = fSubs.reduce((a, s) => a + cycleMonthly(s.amount, s.cycle), 0);
    const netProfit    = totalProfit - monthlyCharges;

    // Trésorerie = argent reçu - coût de toutes les ventes (acompte inclus) - stock immobilisé - dépenses
    const allSalesCost    = fSales.reduce((a, s) => a + s.costPrice * s.qty, 0);
    const stockValue      = fProds.filter(p => p.category === "physical").reduce((a, p) => a + szStock(p) * (p.buyPrice || 0), 0);
    const expensesTotal   = fExpenses.reduce((a, e) => a + (e.amount || 0), 0);
    const bizExpTotal     = fBizExpenses.reduce((a, e) => a + (e.amount || 0), 0);
    const aOrderItems     = orderItems || [];
    const pendingOrdersCost = fPendingOrders.reduce((total, o) =>
      total + aOrderItems.filter(i => i.orderId === o.id).reduce((s, i) => s + i.qty * (i.unitPrice || 0), 0), 0);
    const tresorerie      = salesCa + rentalCa - allSalesCost - rentalPropCost - (from ? 0 : stockValue) - expensesTotal - bizExpTotal - pendingOrdersCost;

    const byBiz = aBiz.map(b => {
      const bs    = fSales.filter(s => s.bizId === b.id);
      const ba    = aAssets.filter(a => a.bizId === b.id);
      const baIds = ba.map(a => a.id);
      const bbk   = fBookings.filter(b_ => baIds.includes(b_.assetId));
      const ca    = bs.reduce((a, s) => a + saleAmt(s), 0) + bbk.reduce((a, b_) => a + b_.sellPrice, 0);
      const profit = bs.filter(s => s.paymentStatus !== "acompte").reduce((a, s) => a + (s.sellPrice - s.costPrice) * s.qty, 0) +
        bbk.reduce((a, b_) => {
          const asset = aAssets.find(x => x.id === b_.assetId);
          const days  = diffDays(b_.startDate, b_.endDate) || 0;
          return a + (b_.sellPrice - (asset ? (asset.monthlyCost / 30) * days : 0));
        }, 0);
      return { name: b.name, color: b.color, ca, profit };
    });

    const now = new Date();
    const monthly = Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const ms  = fSales.filter(s => s.date?.startsWith(key));
      const mbk = fBookings.filter(b => (b.startDate || "").startsWith(key));
      return {
        name:   MO[d.getMonth()],
        ca:     ms.reduce((a, s) => a + saleAmt(s), 0) + mbk.reduce((a, b) => a + b.sellPrice, 0),
        profit: ms.filter(s => s.paymentStatus !== "acompte").reduce((a, s) => a + (s.sellPrice - s.costPrice) * s.qty, 0) +
          mbk.reduce((a, b_) => {
            const asset = aAssets.find(x => x.id === b_.assetId);
            const days  = diffDays(b_.startDate, b_.endDate) || 0;
            return a + (b_.sellPrice - (asset ? (asset.monthlyCost / 30) * days : 0));
          }, 0),
      };
    });

    const lowStock = aProds
      .filter(p => p.category === "physical" && szStock(p) <= LOW)
      .map(p => ({ ...p, _stock: szStock(p) }));

    return { totalCa, totalProfit, netProfit, monthlyCharges, stockValue, expensesTotal, bizExpTotal, tresorerie, byBiz, monthly, lowStock, pendingOrdersCost };
  }, [fSales, fBookings, aAssets, fProds, aBiz, fSubs, fExpenses, fBizExpenses, from, fPendingOrders, orderItems]);

  const recent = [...fSales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const btnPill = (active, color) => ({
    padding: "5px 13px",
    borderRadius: 20,
    border: `1px solid ${active ? (color || "var(--ac)") : "var(--brd)"}`,
    background: active ? (color ? color + "22" : "var(--acb)") : "transparent",
    color: active ? (color || "var(--ac)") : "var(--sub)",
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <div>
      {/* ── Filtres desktop ── */}
      <div className="mhide filter-bar" style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div className="pills" style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {PERIODS.map(p => (
            <button key={p.id} style={btnPill(period === p.id)} onClick={() => setPeriod(p.id)}>{p.l}</button>
          ))}
        </div>
        {period === "custom" && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ fontSize: 12, padding: "4px 8px", border: "1px solid var(--brd)", borderRadius: 6, background: "var(--bg)", color: "var(--txt)" }} />
            <span style={{ fontSize: 11, color: "var(--mut)" }}>→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ fontSize: 12, padding: "4px 8px", border: "1px solid var(--brd)", borderRadius: 6, background: "var(--bg)", color: "var(--txt)" }} />
          </div>
        )}
        {aBiz.length > 0 && (
          <div className="pills" style={{ display: "flex", gap: 5, flexWrap: "wrap", borderLeft: "1px solid var(--brd)", paddingLeft: 10 }}>
            <button style={btnPill(selBiz === "all")} onClick={() => setSelBiz("all")}>Toutes</button>
            {aBiz.map(b => (
              <button key={b.id} style={btnPill(selBiz === b.id, b.color)} onClick={() => setSelBiz(selBiz === b.id ? "all" : b.id)}>
                {b.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Filtres mobile ── */}
      <div className="mshow" style={{ display: "none", gap: 8, marginBottom: 14, flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={period} onChange={e => setPeriod(e.target.value)}
            style={{ flex: 1, fontSize: 13, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--brd)", background: "var(--surf)", color: "var(--txt)", fontFamily: "inherit" }}>
            {PERIODS.map(p => <option key={p.id} value={p.id}>{p.l}</option>)}
          </select>
          {aBiz.length > 0 && (
            <select value={selBiz} onChange={e => setSelBiz(e.target.value)}
              style={{ flex: 1, fontSize: 13, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--brd)", background: "var(--surf)", color: "var(--txt)", fontFamily: "inherit" }}>
              <option value="all">Toutes activités</option>
              {aBiz.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>
        {period === "custom" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ flex: 1, fontSize: 13, padding: "7px 10px", border: "1px solid var(--brd)", borderRadius: 8, background: "var(--surf)", color: "var(--txt)" }} />
            <span style={{ fontSize: 12, color: "var(--mut)" }}>→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ flex: 1, fontSize: 13, padding: "7px 10px", border: "1px solid var(--brd)", borderRadius: 8, background: "var(--surf)", color: "var(--txt)" }} />
          </div>
        )}
      </div>

      {/* ── KPIs ── */}
      <div className="kpis" style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <KPI label="Chiffre d'affaires" value={euro(stats.totalCa)} color="var(--ac)" top />
        <KPI label="Bénéfice brut" value={euro(stats.totalProfit)} color={stats.totalProfit >= 0 ? "var(--ok)" : "var(--err)"} sub={`Marge : ${pct(stats.totalProfit, stats.totalCa)}`} />
        <KPI label="Charges mensuelles" value={euro(stats.monthlyCharges)} color="var(--warn)" sub={`${fSubs.length} abonnement(s) actif(s)`} />
        <KPI label="Bénéfice net" value={euro(stats.netProfit)} color={stats.netProfit >= 0 ? "var(--ok)" : "var(--err)"} sub="après charges récurrentes" />
        <KPI label="Trésorerie réelle" value={euro(stats.tresorerie)} color={stats.tresorerie >= 0 ? "var(--ok)" : "var(--err)"} sub={`Stock : ${euro(stats.stockValue)} · Frais : ${euro(stats.bizExpTotal + stats.expensesTotal)}${stats.pendingOrdersCost > 0 ? ` · Cmds en attente : -${euro(stats.pendingOrdersCost)}` : ""}`} />
      </div>

      <div className="cg2" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card style={{ padding: "20px 22px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Évolution mensuelle</p>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={.15} /><stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={.12} /><stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--brd)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--mut)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--mut)" }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? "0" : euro(v).replace(/\s€/, "").trim()} width={52} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="ca" name="CA" stroke="#4f46e5" strokeWidth={2} fill="url(#gCA)" />
                <Area type="monotone" dataKey="profit" name="Bénéfice" stroke="#16a34a" strokeWidth={2} fill="url(#gP)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card style={{ padding: "20px 22px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Répartition CA</p>
          <div style={{ height: 190 }}>
            {stats.byBiz.filter(b => b.ca > 0).length === 0 ? <Empty text="Aucune donnée" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.byBiz.filter(b => b.ca > 0)} dataKey="ca" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3}>
                    {stats.byBiz.filter(b => b.ca > 0).map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Pie>
                  <Tooltip formatter={v => euro(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="cg2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card style={{ padding: "20px 22px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>CA par activité</p>
          <div style={{ height: 150 }}>
            {stats.byBiz.filter(b => b.ca > 0).length === 0 ? <Empty text="Aucune donnée" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byBiz} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--brd)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--mut)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--mut)" }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? "0" : euro(v).replace(/\s€/, "").trim()} width={48} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="ca" name="CA" radius={[4, 4, 0, 0]}>
                    {stats.byBiz.map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card style={{ padding: "20px 22px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Alertes stock</p>
          {stats.lowStock.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ok)", fontSize: 13, marginTop: 8 }}>
              <span>✓</span><span>Tous les stocks sont suffisants</span>
            </div>
          ) : stats.lowStock.slice(0, 5).map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                <p style={{ fontSize: 11, color: "var(--mut)" }}>{bizName(p.bizId)}</p>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: p._stock === 0 ? "var(--err)" : "var(--warn)", flexShrink: 0, marginLeft: 8 }}>{p._stock} {p.unit}</p>
            </div>
          ))}
        </Card>
      </div>

      {recent.length > 0 && (
        <Card style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--brd)" }}><p style={{ fontSize: 13, fontWeight: 600 }}>Dernières ventes</p></div>
          <div className="tbl-wrap">
            <table style={{ width: "100%", fontSize: 13, minWidth: 480 }}>
              <tbody>
                {recent.map(s => {
                  const profit = (s.sellPrice - s.costPrice) * s.qty;
                  return (
                    <tr key={s.id} style={{ borderTop: "1px solid var(--brd)" }}>
                      <td style={{ padding: "11px 16px", color: "var(--mut)", whiteSpace: "nowrap" }}>{new Date(s.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</td>
                      <td style={{ padding: "11px 16px", fontWeight: 500 }}>{s.name}</td>
                      <td style={{ padding: "11px 16px" }}><Bdg label={bizName(s.bizId)} color={bizColor(s.bizId)} sm /></td>
                      <td style={{ padding: "11px 16px", color: "var(--sub)", whiteSpace: "nowrap" }}>{s.qty} × {euro(s.sellPrice)}</td>
                      <td style={{ padding: "11px 16px", fontWeight: 600, color: profit >= 0 ? "var(--ok)" : "var(--err)", textAlign: "right", whiteSpace: "nowrap" }}>{euro(profit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
