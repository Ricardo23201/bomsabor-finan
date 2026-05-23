import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type ExpenseScope } from "@/lib/store";
import { BRL, currentMonth, monthKey, todayISO } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Paperclip } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/despesas")({
  head: () => ({ meta: [{ title: "Despesas — Bom Sabor RS" }] }),
  component: DespesasPage,
});

const categories = [
  "matéria-prima", "aluguel", "energia", "gás", "funcionário", "internet",
  "manutenção", "embalagem", "transporte", "mercado", "gastos pessoais", "outros",
];

function DespesasPage() {
  const { expenses, addExpense, removeExpense } = useStore();
  const [form, setForm] = useState({
    date: todayISO(), amount: "", category: "matéria-prima",
    supplier: "", scope: "empresa" as ExpenseScope, sharedBusinessPct: 70,
    fixed: false, note: "", receiptName: "",
  });

  const month = currentMonth();
  const monthly = expenses.filter(e => monthKey(e.date) === month);
  const totalMonth = monthly.reduce((a, e) => a + e.amount, 0);
  const empresaTotal = monthly.filter(e => e.scope === "empresa").reduce((a, e) => a + e.amount, 0);
  const pessoalTotal = monthly.filter(e => e.scope === "pessoal").reduce((a, e) => a + e.amount, 0);
  const compTotal = monthly.filter(e => e.scope === "compartilhado").reduce((a, e) => a + e.amount, 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return toast.error("Valor inválido");
    addExpense({ ...form, amount });
    setForm({ ...form, amount: "", supplier: "", note: "", receiptName: "" });
    toast.success("Despesa registrada");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Despesas</h1>
        <p className="text-sm text-muted-foreground">Separe corretamente o que é da empresa, pessoal ou compartilhado</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5 shadow-card"><p className="text-xs uppercase text-muted-foreground">Total no mês</p><p className="mt-2 font-display text-2xl font-semibold">{BRL(totalMonth)}</p></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><p className="text-xs uppercase text-muted-foreground">Empresa</p><p className="mt-2 font-display text-2xl font-semibold text-primary">{BRL(empresaTotal)}</p></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><p className="text-xs uppercase text-muted-foreground">Pessoal</p><p className="mt-2 font-display text-2xl font-semibold text-destructive">{BRL(pessoalTotal)}</p></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><p className="text-xs uppercase text-muted-foreground">Compartilhado</p><p className="mt-2 font-display text-2xl font-semibold">{BRL(compTotal)}</p></div>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border bg-card p-5 shadow-card md:grid-cols-3">
        <div><Label className="mb-1.5 block text-xs">Data</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        <div><Label className="mb-1.5 block text-xs">Valor</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
        <div><Label className="mb-1.5 block text-xs">Categoria</Label>
          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="mb-1.5 block text-xs">Fornecedor</Label><Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} /></div>
        <div><Label className="mb-1.5 block text-xs">Tipo</Label>
          <Select value={form.scope} onValueChange={v => setForm({ ...form, scope: v as ExpenseScope })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="empresa">Empresa</SelectItem>
              <SelectItem value="pessoal">Pessoal</SelectItem>
              <SelectItem value="compartilhado">Compartilhado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.scope === "compartilhado" && (
          <div><Label className="mb-1.5 block text-xs">% Empresa ({form.sharedBusinessPct}%)</Label>
            <Input type="number" min={0} max={100} value={form.sharedBusinessPct} onChange={e => setForm({ ...form, sharedBusinessPct: parseInt(e.target.value) || 0 })} />
          </div>
        )}
        <div className="md:col-span-2"><Label className="mb-1.5 block text-xs">Observação</Label><Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
        <div>
          <Label className="mb-1.5 block text-xs">Nota / comprovante</Label>
          <Input type="file" onChange={e => setForm({ ...form, receiptName: e.target.files?.[0]?.name || "" })} />
        </div>
        <div className="flex items-center gap-2"><Switch checked={form.fixed} onCheckedChange={v => setForm({ ...form, fixed: v })} /><Label className="text-xs">Despesa fixa</Label></div>
        <div className="md:col-span-3 flex justify-end"><Button type="submit"><Plus className="mr-1 h-4 w-4" />Registrar despesa</Button></div>
      </form>

      <div className="rounded-2xl border bg-card shadow-card">
        <div className="border-b p-4"><h3 className="font-display font-semibold">Lançamentos recentes</h3></div>
        <div className="divide-y">
          {expenses.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma despesa registrada.</p>}
          {expenses.slice(0, 60).map(e => (
            <div key={e.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <div className="min-w-0">
                <p className="font-medium capitalize">{e.category}{e.supplier ? ` · ${e.supplier}` : ""}{e.fixed ? " · Fixa" : ""}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.date).toLocaleDateString("pt-BR")} · <span className="capitalize">{e.scope}</span>
                  {e.scope === "compartilhado" && ` (${e.sharedBusinessPct}% empresa)`}
                  {e.receiptName && <> · <Paperclip className="inline h-3 w-3" /> {e.receiptName}</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-destructive">-{BRL(e.amount)}</span>
                <Button size="icon" variant="ghost" onClick={() => removeExpense(e.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
