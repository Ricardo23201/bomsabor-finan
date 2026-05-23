import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { BRL, todayISO } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/fechamento")({
  head: () => ({ meta: [{ title: "Fechamento de Caixa — Bom Sabor RS" }] }),
  component: FechamentoPage,
});

function FechamentoPage() {
  const { entries, expenses, closings, addClosing } = useStore();
  const [date, setDate] = useState(todayISO());

  const dayEntries = entries.filter(e => e.date === date);
  const dayExp = expenses.filter(e => e.date === date).reduce((a, e) => a + e.amount, 0);
  const totals = dayEntries.reduce((acc, e) => { acc[e.method] += e.amount; acc.total += e.amount; return acc; },
    { pix: 0, dinheiro: 0, credito: 0, debito: 0, total: 0 });
  const balance = totals.total - dayExp;

  const close = () => {
    addClosing({ date, totalSales: totals.total, pix: totals.pix, dinheiro: totals.dinheiro,
      credito: totals.credito, debito: totals.debito, expenses: dayExp, balance });
    toast.success(`Caixa de ${new Date(date).toLocaleDateString("pt-BR")} fechado`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Fechamento de Caixa</h1>
        <p className="text-sm text-muted-foreground">Confira e feche o caixa do dia</p>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-end gap-3">
          <div><Label className="mb-1.5 block text-xs">Data do fechamento</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <Button onClick={close} className="ml-auto"><Lock className="mr-1 h-4 w-4" />Fechar caixa</Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Pix" value={totals.pix} />
          <Stat label="Dinheiro" value={totals.dinheiro} />
          <Stat label="Crédito" value={totals.credito} />
          <Stat label="Débito" value={totals.debito} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Total vendido" value={totals.total} tone="primary" />
          <Stat label="Despesas do dia" value={dayExp} tone="destructive" />
          <Stat label="Saldo final" value={balance} tone={balance >= 0 ? "success" : "destructive"} />
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        <div className="border-b p-4"><h3 className="font-display font-semibold">Fechamentos anteriores</h3></div>
        <div className="divide-y">
          {closings.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhum fechamento registrado.</p>}
          {closings.slice(0, 30).map(c => (
            <div key={c.id} className="grid grid-cols-2 gap-2 p-4 text-sm sm:grid-cols-5">
              <div><p className="text-xs text-muted-foreground">Data</p><p className="font-medium">{new Date(c.date).toLocaleDateString("pt-BR")}</p></div>
              <div><p className="text-xs text-muted-foreground">Vendas</p><p className="font-medium text-success">{BRL(c.totalSales)}</p></div>
              <div><p className="text-xs text-muted-foreground">Despesas</p><p className="font-medium text-destructive">{BRL(c.expenses)}</p></div>
              <div><p className="text-xs text-muted-foreground">Saldo</p><p className={`font-medium ${c.balance >= 0 ? "text-success" : "text-destructive"}`}>{BRL(c.balance)}</p></div>
              <div className="text-xs text-muted-foreground">Pix {BRL(c.pix)} · Din {BRL(c.dinheiro)}<br/>Cred {BRL(c.credito)} · Deb {BRL(c.debito)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "muted" }: { label: string; value: number; tone?: "muted" | "primary" | "success" | "destructive" }) {
  const c = { muted: "text-foreground", primary: "text-primary", success: "text-success", destructive: "text-destructive" }[tone];
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-xl font-semibold ${c}`}>{BRL(value)}</p>
    </div>
  );
}
