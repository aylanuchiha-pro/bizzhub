import { useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { euro, pct, active, MO, cycleMonthly, diffDays, LOW, SIZES } from "../utils";
import { KPI, Card, Empty, Bdg, ChartTip } from "../components/ui";

export default function Dashboard({ biz, prods, sales, rentalAssets, rentalBookings, subs }) {
  const aBiz      = active(biz);
  const aSales    = active(sales);
  const aProds    = active(prods);
  const aAssets   = active(rentalAssets);
  const aBookings = active(rentalBookings);
  const aSubs     = active(subs).filter(s => s.active);

  const bizName  = id => aBiz.find(b => b.id === id)?.name ?? "—";
  const bizColor = id => aBiz.find(b => b.id === id)?.color ?? "var(--mut)";

  const stats = useMemo(() => {
    const salesCa     = aSales.reduce((a, s) => a + s.sellPrice * s.qty, 0);
    const salesProfit = aSales.reduce((a, s) => a + (s.sellPrice - s.costPrice) * s.qty, 0);
    const rentalCa    = aBookings.reduce((a, b) => a + b.sellPrice, 0);
    const rentalPropCost = aBookings.reduce((a, b) => {
      const asset = aAssets.find(x => x.id === b.assetId);
      const days  = diffDays(b.startDate, b.endDate) || 0;
      return a + (asset ? (asset.monthlyCost / 30) * days : 0);
    }, 0);
    const rentalProfit = rentalCa - rentalPropCost;

    const totalCa     = salesCa + rentalCa;
    const totalProfit = salesProfit + rentalProfit;
    const monthlyCharges = aSubs.reduce((a, s) => a + cycleMonthly(s.amount, s.cycle), 0);
    const netProfit   = totalProfit - monthlyCharges;

    const byBiz = aBiz.map(b => {
      const bs = aSales.filter(s => s.bizId === b.id);
      const ba = aAssets.filter(a => a.bizId === b.id);
      const baIds = ba.map(a => a.id);
      const bbk = aBookings.filter(b_ => baIds.includes(b_.assetId));
      const ca = bs.reduce((a, s) => a + s.sellPrice * s.qty, 0) + bbk.reduce((a, b_) => a + b_.sellPrice, 0);
      const profit = bs.reduce((a, s) => a + (s.sellPrice - s.costPrice) * s.qty, 0) +
        bbk.reduce((a, b_) => {
          const asset = aAssets.find(x => x.id === b_.assetId);
          const days = diffDays(b_.startDate, b_.endDate) || 0;
          return a + (b_.sellPrice - (asset ? (asset.monthlyCost / 30) * days : 0));
        }, 0);
      return { name: b.name, color: b.color, ca, profit };
    });

    const now = new Date();
    const monthly = Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const ms  = aSales.filter(s => s.date?.startsWith(key));
      const mbk = aBookings.filter(b => (b.startDate || "").startsWith(key));
      return {
        name:   MO[d.getMonth()],
        ca:     ms.reduce((a, s) => a + s.sellPrice * s.qty, 0) + mbk.reduce((a, b) => a + b.sellPrice, 0),
        profit: ms.reduce((a, s) => a + (s.sellPrice - s.costPrice) * s.qty, 0) +
          mbk.reduce((a, b_) => {
            const asset = aAssets.find(x => x.id === b_.assetId);
            const days = diffDays(b_.startDate, b_.endDate) || 0;
            return a + (b_.sellPrice - (asset ? (asset.monthlyCost / 30) * days : 0));
          }, 0),
      };
    });

    const szStock = p => p.sizes && SIZES.some(s => (p.sizes[s] || 0) > 0)
      ? SIZES.reduce((a, s) => a + (p.sizes[s] || 0), 0)
      : (p.stock || 0);
    const lowStock = aProds
      .filter(p => p.category === "physical" && szStock(p) <= LOW)
      .map(p => ({ ...p, _stock: szStock(p) }));
    return { totalCa, totalProfit, netProfit, monthlyCharges, count: aSales.length, prodCount: aProds.length, byBiz, monthly, lowStock };
  }, [aSales, aBookings, aAssets, aProds, aBiz, aSubs]);

  const recent = [...aSales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div>
      <div className="kpis" style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <KPI label="Chiffre d'affaires" value={euro(stats.totalCa)} color="var(--ac)" top />
        <KPI label="Bénéfice brut" value={euro(stats.totalProfit)} color={stats.totalProfit >= 0 ? "var(--ok)" : "var(--err)"} sub={`Marge : ${pct(stats.totalProfit, stats.totalCa)}`} />
        <KPI label="Charges mensuelles" value={euro(stats.monthlyCharges)} color="var(--warn)" sub={`${aSubs.length} abonnement(s) actif(s)`} />
        <KPI label="Bénéfice net" value={euro(stats.netProfit)} color={stats.netProfit >= 0 ? "var(--ok)" : "var(--err)"} sub="après charges récurrentes" />
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
