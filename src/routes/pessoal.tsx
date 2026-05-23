import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { BRL, currentMonth, monthKey, todayISO } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Wallet } from "lucide-react";

export const Route = createFileRoute("/pessoal")({
  head: () => ({ meta: [{ title: "Financeiro Pessoal — Bom Sabor RS" }] }),
  component: PessoalPage,
});

const categories = ["Pró-labore", "Alimentação", "Lazer", "Transporte", "Saúde", "Casa", "Outros"];

function PessoalPage() {
  const state = useStore();
  const [form, setForm] = useState({
    date: todayISO(), amount: "", type: "despesa" as "entrada" | "despesa",
    category: "Pró-labore", note: "",
  });

  const month = currentMonth();
  const monthly = state.personal.filter(p => monthKey(p.date) === month);
  const ent = monthly.filter(p => p.type === "entrada").reduce((a, p) => a + p.amount, 0);
  const desp = monthly.filter(p => p.type === "despesa").reduce((a, p) => a + p.amount, 0);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount) return;
    state.addPersonal({ ...form, amount });
    setForm({ ...form, amount: "", note: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Financeiro Pessoal</h1>
        <p className="text-sm text-muted-foreground">Mantenha o pessoal separado do empresarial</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card"><p className="text-xs uppercase text-muted-foreground">Entradas no mês</p><p className="mt-2 font-display text-2xl font-semibold text-success">{BRL(ent)}</p></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><p className="text-xs uppercase text-muted-foreground">Despesas no mês</p><p className="mt-2 font-display text-2xl font-semibold text-destructive">{BRL(desp)}</p></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><p className="text-xs uppercase text-muted-foreground">Saldo pessoal</p><p className={`mt-2 font-display text-2xl font-semibold ${ent - desp >= 0 ? "text-foreground" : "text-destructive"}`}>{BRL(ent - desp)}</p></div>
      </div>

      <form onSubmit={add} className="grid gap-3 rounded-2xl border bg-card p-5 shadow-card md:grid-cols-6">
        <div><Label className="mb-1.5 block text-xs">Data</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        <div><Label className="mb-1.5 block text-xs">Tipo</Label>
          <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as "entrada" | "despesa" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label className="mb-1.5 block text-xs">Categoria</Label>
          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="mb-1.5 block text-xs">Valor</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
        <div><Label className="mb-1.5 block text-xs">Observação</Label><Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
        <div className="flex items-end"><Button type="submit" className="w-full"><Plus className="mr-1 h-4 w-4" />Adicionar</Button></div>
      </form>

      <div className="rounded-2xl border bg-card shadow-card">
        <div className="border-b p-4 flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /><h3 className="font-display font-semibold">Lançamentos</h3></div>
        <div className="divide-y">
          {state.personal.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhum lançamento pessoal.</p>}
          {state.personal.slice(0, 60).map(p => (
            <div key={p.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p className="font-medium">{p.category}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString("pt-BR")}{p.note ? ` · ${p.note}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-display font-semibold ${p.type === "entrada" ? "text-success" : "text-destructive"}`}>
                  {p.type === "entrada" ? "+" : "-"}{BRL(p.amount)}
                </span>
                <Button size="icon" variant="ghost" onClick={() => state.removePersonal(p.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
