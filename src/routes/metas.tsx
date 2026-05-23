import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Goal, selectMonthRevenue, selectMonthExpenses, selectReserveTotal } from "@/lib/store";
import { BRL, currentMonth, pct } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/metas")({
  head: () => ({ meta: [{ title: "Metas Financeiras — Bom Sabor RS" }] }),
  component: MetasPage,
});

const types: { v: Goal["type"]; l: string }[] = [
  { v: "faturamento", l: "Faturamento mensal" },
  { v: "lucro", l: "Lucro mensal" },
  { v: "reserva", l: "Reserva financeira" },
  { v: "teto-gastos", l: "Teto de gastos" },
  { v: "custos-fixos", l: "Limite custos fixos" },
];

function MetasPage() {
  const state = useStore();
  const [form, setForm] = useState({ name: "", type: "faturamento" as Goal["type"], target: "" });
  const month = currentMonth();
  const revenue = selectMonthRevenue(state, month);
  const expenses = selectMonthExpenses(state, month);
  const profit = revenue - expenses;
  const reserve = selectReserveTotal(state);
  const fixedCosts = state.expenses.filter(e => e.fixed).reduce((a, e) => a + e.amount, 0);

  const progressFor = (g: Goal) => {
    switch (g.type) {
      case "faturamento": return { current: revenue, p: pct(revenue, g.target) };
      case "lucro": return { current: profit, p: pct(profit, g.target) };
      case "reserva": return { current: reserve, p: pct(reserve, g.target) };
      case "teto-gastos": return { current: expenses, p: pct(expenses, g.target) };
      case "custos-fixos": return { current: fixedCosts, p: pct(fixedCosts, g.target) };
    }
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(form.target);
    if (!target || !form.name) return;
    state.addGoal({ name: form.name, type: form.type, target });
    setForm({ name: "", type: "faturamento", target: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Metas Financeiras</h1>
        <p className="text-sm text-muted-foreground">Defina alvos e acompanhe seu progresso</p>
      </div>

      <form onSubmit={add} className="grid gap-3 rounded-2xl border bg-card p-5 shadow-card md:grid-cols-4">
        <div className="md:col-span-2"><Label className="mb-1.5 block text-xs">Nome da meta</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Faturar R$ 20k em dezembro" /></div>
        <div><Label className="mb-1.5 block text-xs">Tipo</Label>
          <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as Goal["type"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{types.map(t => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="mb-1.5 block text-xs">Valor alvo</Label>
          <div className="flex gap-2">
            <Input type="number" step="0.01" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} />
            <Button type="submit" size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {state.goals.length === 0 && (
          <p className="col-span-2 rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">Nenhuma meta cadastrada ainda.</p>
        )}
        {state.goals.map(g => {
          const { current, p } = progressFor(g);
          const label = types.find(t => t.v === g.type)?.l;
          return (
            <div key={g.id} className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{label}</p>
                  <h3 className="font-display text-lg font-semibold">{g.name}</h3>
                </div>
                <Button size="icon" variant="ghost" onClick={() => state.removeGoal(g.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="font-display text-2xl font-semibold">{p}%</span>
                <span className="text-xs text-muted-foreground">{BRL(current)} / {BRL(g.target)}</span>
              </div>
              <Progress value={p} className="mt-2 h-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
