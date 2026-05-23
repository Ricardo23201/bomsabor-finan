import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore, selectMonthRevenue, selectMonthExpenses } from "@/lib/store";
import { BRL, monthKey, monthLabel } from "@/lib/format";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Bom Sabor RS" }] }),
  component: RelatoriosPage,
});

const colors = ["oklch(0.55 0.15 165)", "oklch(0.7 0.14 75)", "oklch(0.55 0.18 25)", "oklch(0.55 0.15 245)", "oklch(0.6 0.13 300)", "oklch(0.65 0.12 200)"];

function RelatoriosPage() {
  const state = useStore();

  const monthly = useMemo(() => {
    const arr: { month: string; faturamento: number; despesas: number; lucro: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = monthKey(d);
      const r = selectMonthRevenue(state, k);
      const e = selectMonthExpenses(state, k);
      arr.push({ month: monthLabel(k), faturamento: r, despesas: e, lucro: r - e });
    }
    return arr;
  }, [state.entries, state.expenses]);

  const byCat = useMemo(() => {
    const acc: Record<string, number> = {};
    state.expenses.forEach(e => { acc[e.category] = (acc[e.category] || 0) + e.amount; });
    return Object.entries(acc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [state.expenses]);

  const byMethod = useMemo(() => {
    const acc: Record<string, number> = { pix: 0, dinheiro: 0, credito: 0, debito: 0 };
    state.entries.forEach(e => acc[e.method] += e.amount);
    return [
      { name: "Pix", value: acc.pix },
      { name: "Dinheiro", value: acc.dinheiro },
      { name: "Crédito", value: acc.credito },
      { name: "Débito", value: acc.debito },
    ];
  }, [state.entries]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Análises visuais para decisões inteligentes</p>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <h3 className="mb-4 font-display font-semibold">Faturamento vs Despesas vs Lucro (12 meses)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" />
              <XAxis dataKey="month" fontSize={12} stroke="oklch(0.5 0.02 255)" />
              <YAxis fontSize={12} stroke="oklch(0.5 0.02 255)" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => BRL(v)} />
              <Legend />
              <Bar dataKey="faturamento" fill="oklch(0.55 0.15 165)" radius={[6,6,0,0]} />
              <Bar dataKey="despesas" fill="oklch(0.55 0.18 25)" radius={[6,6,0,0]} />
              <Bar dataKey="lucro" fill="oklch(0.7 0.14 75)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <h3 className="mb-4 font-display font-semibold">Despesas por categoria</h3>
          <div className="h-72">
            {byCat.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem dados</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCat} dataKey="value" nameKey="name" outerRadius={100} label>
                    {byCat.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => BRL(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <h3 className="mb-4 font-display font-semibold">Formas de pagamento (histórico)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byMethod} dataKey="value" nameKey="name" outerRadius={100} label>
                  {byMethod.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => BRL(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
