import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type AutoRule } from "@/lib/store";
import { BRL, pct } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Bom Sabor RS" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const state = useStore();
  const [settings, setSettings] = useState(state.settings);
  const [newRule, setNewRule] = useState({
    name: "", pct: 10, cap: "", activateAfter: "",
    bucket: "empresa" as AutoRule["bucket"],
  });

  const saveSettings = () => {
    state.updateSettings(settings);
    toast.success("Configurações salvas");
  };

  const addRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name) return;
    state.addRule({
      name: newRule.name,
      pct: newRule.pct,
      cap: newRule.cap ? parseFloat(newRule.cap) : undefined,
      activateAfter: newRule.activateAfter ? parseFloat(newRule.activateAfter) : undefined,
      bucket: newRule.bucket,
    });
    state.recomputeSeparations();
    setNewRule({ name: "", pct: 10, cap: "", activateAfter: "", bucket: "empresa" });
    toast.success("Regra criada");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Metas globais e regras automáticas de separação</p>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <h3 className="mb-4 font-display font-semibold">Parâmetros financeiros</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nome da empresa"><Input value={settings.businessName} onChange={e => setSettings({ ...settings, businessName: e.target.value })} /></Field>
          <Field label="Meta de reserva (R$)"><Input type="number" value={settings.reserveGoal} onChange={e => setSettings({ ...settings, reserveGoal: +e.target.value })} /></Field>
          <Field label="Meta de faturamento mensal"><Input type="number" value={settings.monthlyRevenueGoal} onChange={e => setSettings({ ...settings, monthlyRevenueGoal: +e.target.value })} /></Field>
          <Field label="Teto mensal de gastos"><Input type="number" value={settings.monthlyExpenseCap} onChange={e => setSettings({ ...settings, monthlyExpenseCap: +e.target.value })} /></Field>
          <Field label="Meta de lucro mensal"><Input type="number" value={settings.monthlyProfitGoal} onChange={e => setSettings({ ...settings, monthlyProfitGoal: +e.target.value })} /></Field>
          <Field label="Limite custos fixos"><Input type="number" value={settings.fixedCostsCap} onChange={e => setSettings({ ...settings, fixedCostsCap: +e.target.value })} /></Field>
        </div>
        <Button onClick={saveSettings} className="mt-4"><Save className="mr-1 h-4 w-4" />Salvar</Button>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <h3 className="mb-1 font-display font-semibold">Regras automáticas de separação</h3>
        <p className="mb-4 text-xs text-muted-foreground">Separe automaticamente uma % do faturamento. Use tetos e condições para travar limites.</p>

        <form onSubmit={addRule} className="grid gap-3 rounded-xl border bg-background p-4 md:grid-cols-6">
          <div className="md:col-span-2"><Label className="mb-1.5 block text-xs">Nome</Label><Input value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })} placeholder="Ex: Pró-labore Ricardo" /></div>
          <div><Label className="mb-1.5 block text-xs">% faturamento</Label><Input type="number" value={newRule.pct} onChange={e => setNewRule({ ...newRule, pct: +e.target.value })} /></div>
          <div><Label className="mb-1.5 block text-xs">Teto (opcional)</Label><Input type="number" value={newRule.cap} onChange={e => setNewRule({ ...newRule, cap: e.target.value })} /></div>
          <div><Label className="mb-1.5 block text-xs">Ativar acima de</Label><Input type="number" value={newRule.activateAfter} onChange={e => setNewRule({ ...newRule, activateAfter: e.target.value })} /></div>
          <div><Label className="mb-1.5 block text-xs">Bucket</Label>
            <Select value={newRule.bucket} onValueChange={v => setNewRule({ ...newRule, bucket: v as AutoRule["bucket"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pro-labore">Pró-labore</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
                <SelectItem value="reserva">Reserva</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-6 flex justify-end"><Button type="submit"><Plus className="mr-1 h-4 w-4" />Adicionar regra</Button></div>
        </form>

        <div className="mt-4 space-y-3">
          {state.rules.map(r => {
            const p = r.cap ? pct(r.separated, r.cap) : 100;
            return (
              <div key={r.id} className="rounded-xl border bg-background p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{r.name} <span className="text-xs font-normal text-muted-foreground capitalize">· {r.bucket}</span></p>
                    <p className="text-xs text-muted-foreground">
                      {r.pct}% do faturamento{r.cap ? ` · teto ${BRL(r.cap)}` : ""}
                      {r.activateAfter ? ` · ativa após ${BRL(r.activateAfter)}` : ""}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => state.removeRule(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Separado este mês</span>
                  <span className="font-display font-semibold text-primary">{BRL(r.separated)}{r.cap ? ` / ${BRL(r.cap)}` : ""}</span>
                </div>
                {r.cap && <Progress value={p} className="mt-1 h-1.5" />}
              </div>
            );
          })}
        </div>
        <Button variant="outline" className="mt-4" onClick={() => { state.recomputeSeparations(); toast.success("Recalculado"); }}>Recalcular separações</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><Label className="mb-1.5 block text-xs">{label}</Label>{children}</div>);
}
