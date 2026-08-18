import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore, selectMonthRevenue, selectMonthExpenses, selectReserveTotal } from "@/lib/store";
import { BRL, currentMonth, monthKey, monthLabel, pct } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { TrendingUp, Receipt, Wallet, Target, PiggyBank, AlertTriangle, Building2, User } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Visão geral — Bom Sabor RS" }] }),
  component: Overview,
});

function Overview() {
  const state = useStore();
  const month = currentMonth();
  const revenue = selectMonthRevenue(state, month);
  const expenses = selectMonthExpenses(state, month);
  const profit = revenue - expenses;
  const proLabore = state.rules.filter((r) => r.bucket === "pro-labore").reduce((a, r) => a + r.separated, 0);
  const empresaSep = state.rules.filter((r) => r.bucket === "empresa").reduce((a, r) => a + r.separated, 0);
  const reservaTotal = selectReserveTotal(state);
  const reservaSep = state.rules.filter((r) => r.bucket === "reserva").reduce((a, r) => a + r.separated, 0);
  const available = revenue - expenses - proLabore - empresaSep - reservaSep;

  const goalPct = pct(revenue, state.settings.monthlyRevenueGoal);

  // Last 6 months series
  const monthly = useMemo(() => {
    const arr: { month: string; faturamento: number; despesas: number; lucro: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = monthKey(d);
      const rev = selectMonthRevenue(state, k);
      const exp = selectMonthExpenses(state, k);
      arr.push({ month: monthLabel(k), faturamento: rev, despesas: exp, lucro: rev - exp });
    }
    return arr;
  }, [state.entries, state.expenses]);

  // Payment method breakdown current month
  const byMethod = useMemo(() => {
    const acc: Record<string, number> = { pix: 0, dinheiro: 0, credito: 0, debito: 0 };
    state.entries.filter((e) => monthKey(e.date) === month).forEach((e) => (acc[e.method] += e.amount));
    return [
      { name: "Pix", value: acc.pix },
      { name: "Dinheiro", value: acc.dinheiro },
      { name: "Crédito", value: acc.credito },
      { name: "Débito", value: acc.debito },
    ];
  }, [state.entries, month]);

  const colors = ["oklch(0.55 0.15 165)", "oklch(0.7 0.14 75)", "oklch(0.55 0.18 25)", "oklch(0.55 0.15 245)"];

  const alerts: { tone: "warning" | "destructive"; msg: string }[] = [];
  if (revenue < state.settings.monthlyRevenueGoal * 0.6 && new Date().getDate() > 15)
    alerts.push({ tone: "warning", msg: "Faturamento abaixo da meta no meio do mês." });
  if (expenses > state.settings.monthlyExpenseCap)
    alerts.push({ tone: "destructive", msg: "Despesas do mês acima do teto definido." });
  if (profit < state.settings.monthlyProfitGoal * 0.4 && revenue > 0)
    alerts.push({ tone: "warning", msg: "Lucro estimado muito baixo." });
  if (reservaTotal < state.settings.reserveGoal * 0.2)
    alerts.push({ tone: "warning", msg: "Reserva financeira da empresa está baixa." });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Visão geral</h1>
          <p className="text-sm text-muted-foreground">Visão geral financeira de {monthLabel(month)}</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-2 text-sm shadow-card">
          <span className="text-muted-foreground">Saldo disponível: </span>
          <span className={`font-display font-semibold ${available >= 0 ? "text-success" : "text-destructive"}`}>
            {BRL(available)}
          </span>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="grid gap-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${
                a.tone === "destructive"
                  ? "border-destructive/30 bg-destructive/5 text-destructive"
                  : "border-[oklch(0.78_0.15_75)]/40 bg-[oklch(0.78_0.15_75)]/10 text-[oklch(0.45_0.12_75)]"
              }`}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faturamento do mês" value={BRL(revenue)} icon={TrendingUp} accent="primary" />
        <StatCard label="Despesas totais" value={BRL(expenses)} icon={Receipt} accent="destructive" />
        <StatCard label="Lucro estimado" value={BRL(profit)} icon={Wallet} accent="gold" />
        <StatCard
          label="Reserva acumulada"
          value={BRL(reservaTotal)}
          hint={`Meta ${BRL(state.settings.reserveGoal)}`}
          icon={PiggyBank}
          accent="primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Evolução mensal</h3>
              <p className="text-xs text-muted-foreground">Faturamento × Despesas × Lucro</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.15 165)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.55 0.15 165)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.14 75)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.7 0.14 75)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" />
                <XAxis dataKey="month" stroke="oklch(0.5 0.02 255)" fontSize={12} />
                <YAxis
                  stroke="oklch(0.5 0.02 255)"
                  fontSize={12}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number) => BRL(v)}
                  contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.01 250)" }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="faturamento"
                  stroke="oklch(0.55 0.15 165)"
                  fill="url(#g1)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  stroke="oklch(0.55 0.18 25)"
                  fill="oklch(0.55 0.18 25)"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area type="monotone" dataKey="lucro" stroke="oklch(0.7 0.14 75)" fill="url(#g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <h3 className="font-display text-lg font-semibold">Meta mensal</h3>
          <p className="mt-1 text-xs text-muted-foreground">Faturamento vs meta</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl font-semibold">{goalPct}%</span>
              <span className="text-xs text-muted-foreground">
                {BRL(revenue)} / {BRL(state.settings.monthlyRevenueGoal)}
              </span>
            </div>
            <Progress value={goalPct} className="h-2" />
          </div>
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Recebido por forma de pagamento</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byMethod} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {byMethod.map((_, i) => (
                      <Cell key={i} fill={colors[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => BRL(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {byMethod.map((m, i) => (
                <div key={m.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: colors[i] }} />
                  <span className="text-muted-foreground">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Pró-labore separado</h3>
          </div>
          <p className="mt-3 font-display text-2xl font-semibold">{BRL(proLabore)}</p>
          <p className="text-xs text-muted-foreground">Reservado automaticamente neste mês</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Empresa separado</h3>
          </div>
          <p className="mt-3 font-display text-2xl font-semibold">{BRL(empresaSep)}</p>
          <p className="text-xs text-muted-foreground">Capital de giro reservado</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Reserva alimentada</h3>
          </div>
          <p className="mt-3 font-display text-2xl font-semibold">{BRL(reservaSep)}</p>
          <p className="text-xs text-muted-foreground">A separar para reserva no mês</p>
        </div>
      </div>
    </div>
  );
}
