import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, selectReserveTotal } from "@/lib/store";
import { BRL, pct, todayISO } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, PiggyBank } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/reservas")({
  head: () => ({ meta: [{ title: "Reservas — Bom Sabor RS" }] }),
  component: ReservasPage,
});

function ReservasPage() {
  const state = useStore();
  const [form, setForm] = useState({ date: todayISO(), amount: "", note: "" });
  const total = selectReserveTotal(state);
  const goal = state.settings.reserveGoal;
  const p = pct(total, goal);

  // Cumulative history
  const sorted = [...state.reserves].sort((a, b) => a.date.localeCompare(b.date));
  let cum = 0;
  const series = sorted.map(r => { cum += r.amount; return { date: new Date(r.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }), valor: cum }; });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount) return;
    state.addReserve({ date: form.date, amount, note: form.note });
    setForm({ date: todayISO(), amount: "", note: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Reserva Financeira</h1>
        <p className="text-sm text-muted-foreground">Sua segurança contra futuros prejuízos</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-card lg:col-span-1">
          <div className="flex items-center gap-2 text-primary"><PiggyBank className="h-5 w-5" /><span className="text-xs uppercase">Acumulado</span></div>
          <p className="mt-3 font-display text-4xl font-semibold">{BRL(total)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Meta: {BRL(goal)}</p>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs"><span>{p}% atingido</span><span>{BRL(Math.max(0, goal - total))} para a meta</span></div>
            <Progress value={p} className="h-2" />
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card lg:col-span-2">
          <h3 className="mb-3 font-display font-semibold">Crescimento da reserva</h3>
          <div className="h-56">
            {series.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Nenhum depósito ainda</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.55 0.15 165)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.55 0.15 165)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" fontSize={12} stroke="oklch(0.5 0.02 255)" />
                  <YAxis fontSize={12} stroke="oklch(0.5 0.02 255)" tickFormatter={(v) => `R$${(v/1000).toFixed(1)}k`} />
                  <Tooltip formatter={(v: number) => BRL(v)} />
                  <Area type="monotone" dataKey="valor" stroke="oklch(0.55 0.15 165)" fill="url(#rg)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={add} className="grid gap-3 rounded-2xl border bg-card p-5 shadow-card md:grid-cols-4">
        <div><Label className="mb-1.5 block text-xs">Data</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        <div><Label className="mb-1.5 block text-xs">Valor depositado</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
        <div className="md:col-span-1"><Label className="mb-1.5 block text-xs">Observação</Label><Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
        <div className="flex items-end"><Button type="submit" className="w-full"><Plus className="mr-1 h-4 w-4" />Depositar</Button></div>
      </form>

      <div className="rounded-2xl border bg-card shadow-card">
        <div className="border-b p-4"><h3 className="font-display font-semibold">Histórico de depósitos</h3></div>
        <div className="divide-y">
          {state.reserves.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Sem depósitos ainda.</p>}
          {state.reserves.map(r => (
            <div key={r.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p className="font-medium">{new Date(r.date).toLocaleDateString("pt-BR")}</p>
                {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-success">+{BRL(r.amount)}</span>
                <Button size="icon" variant="ghost" onClick={() => state.removeReserve(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
