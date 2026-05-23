import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type PaymentMethod } from "@/lib/store";
import { BRL, currentMonth, monthKey, todayISO } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/entradas")({
  head: () => ({ meta: [{ title: "Entradas — Bom Sabor RS" }] }),
  component: EntradasPage,
});

const categories = ["Venda balcão", "Encomenda", "Festa/Evento", "Delivery", "Outros"];
const methods: { v: PaymentMethod; l: string }[] = [
  { v: "pix", l: "Pix" }, { v: "dinheiro", l: "Dinheiro" },
  { v: "credito", l: "Crédito" }, { v: "debito", l: "Débito" },
];

function EntradasPage() {
  const { entries, addEntry, removeEntry } = useStore();
  const [form, setForm] = useState({
    date: todayISO(), amount: "", category: "Venda balcão",
    method: "pix" as PaymentMethod, note: "",
  });

  const today = todayISO();
  const month = currentMonth();
  const todayTotal = entries.filter(e => e.date === today).reduce((a, e) => a + e.amount, 0);
  const monthTotal = entries.filter(e => monthKey(e.date) === month).reduce((a, e) => a + e.amount, 0);
  const byMethod: Record<string, number> = { pix: 0, dinheiro: 0, credito: 0, debito: 0 };
  entries.filter(e => monthKey(e.date) === month).forEach(e => byMethod[e.method] += e.amount);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return toast.error("Informe um valor válido");
    addEntry({ ...form, amount });
    setForm({ ...form, amount: "", note: "" });
    toast.success("Entrada registrada");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Entradas</h1>
        <p className="text-sm text-muted-foreground">Registre cada venda do dia</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <p className="text-xs uppercase text-muted-foreground">Vendas hoje</p>
          <p className="mt-2 font-display text-2xl font-semibold">{BRL(todayTotal)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <p className="text-xs uppercase text-muted-foreground">Vendas no mês</p>
          <p className="mt-2 font-display text-2xl font-semibold text-primary">{BRL(monthTotal)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <p className="mb-2 text-xs uppercase text-muted-foreground">Por forma de pagamento (mês)</p>
          <div className="space-y-1 text-sm">
            {methods.map(m => (
              <div key={m.v} className="flex justify-between"><span className="text-muted-foreground">{m.l}</span><span className="font-medium">{BRL(byMethod[m.v])}</span></div>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border bg-card p-5 shadow-card md:grid-cols-6">
        <div className="md:col-span-1">
          <Label className="mb-1.5 block text-xs">Data</Label>
          <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
        <div className="md:col-span-1">
          <Label className="mb-1.5 block text-xs">Valor</Label>
          <Input type="number" step="0.01" placeholder="0,00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div className="md:col-span-1">
          <Label className="mb-1.5 block text-xs">Categoria</Label>
          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-1">
          <Label className="mb-1.5 block text-xs">Pagamento</Label>
          <Select value={form.method} onValueChange={v => setForm({ ...form, method: v as PaymentMethod })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{methods.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-1">
          <Label className="mb-1.5 block text-xs">Observação</Label>
          <Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
        </div>
        <div className="flex items-end md:col-span-1">
          <Button type="submit" className="w-full"><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
        </div>
      </form>

      <div className="rounded-2xl border bg-card shadow-card">
        <div className="border-b p-4"><h3 className="font-display font-semibold">Histórico</h3></div>
        <div className="divide-y">
          {entries.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma entrada ainda.</p>}
          {entries.slice(0, 50).map(e => (
            <div key={e.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{e.category} · <span className="text-muted-foreground capitalize">{e.method}</span></p>
                <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("pt-BR")}{e.note ? ` · ${e.note}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-success">+{BRL(e.amount)}</span>
                <Button size="icon" variant="ghost" onClick={() => removeEntry(e.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
