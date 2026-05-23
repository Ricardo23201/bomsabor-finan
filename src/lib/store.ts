import { create } from "zustand";
import { persist } from "zustand/middleware";
import { monthKey } from "./format";

export type PaymentMethod = "pix" | "dinheiro" | "credito" | "debito";
export type ExpenseScope = "empresa" | "pessoal" | "compartilhado";

export interface Entry {
  id: string;
  date: string; // ISO yyyy-mm-dd
  amount: number;
  category: string;
  method: PaymentMethod;
  note?: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  supplier?: string;
  scope: ExpenseScope;
  sharedBusinessPct?: number; // 0-100
  fixed?: boolean;
  note?: string;
  receiptName?: string;
}

export interface AutoRule {
  id: string;
  name: string;
  pct: number; // % do faturamento
  cap?: number; // teto mensal
  activateAfter?: number; // só ativar quando faturamento mês >= valor
  bucket: "pro-labore" | "empresa" | "reserva" | "outro";
  separated: number; // total já separado (acumulador histórico)
}

export interface Goal {
  id: string;
  name: string;
  type: "faturamento" | "lucro" | "reserva" | "teto-gastos" | "custos-fixos";
  target: number;
  month?: string; // se mensal
}

export interface Closing {
  id: string;
  date: string;
  totalSales: number;
  pix: number;
  dinheiro: number;
  credito: number;
  debito: number;
  expenses: number;
  balance: number;
}

export interface ReserveDeposit {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface PersonalEntry {
  id: string;
  date: string;
  amount: number;
  type: "entrada" | "despesa";
  category: string;
  note?: string;
}

export interface Settings {
  businessName: string;
  reserveGoal: number;
  monthlyRevenueGoal: number;
  monthlyExpenseCap: number;
  monthlyProfitGoal: number;
  fixedCostsCap: number;
}

interface State {
  entries: Entry[];
  expenses: Expense[];
  rules: AutoRule[];
  goals: Goal[];
  closings: Closing[];
  reserves: ReserveDeposit[];
  personal: PersonalEntry[];
  settings: Settings;

  addEntry: (e: Omit<Entry, "id">) => void;
  removeEntry: (id: string) => void;
  addExpense: (e: Omit<Expense, "id">) => void;
  removeExpense: (id: string) => void;
  addRule: (r: Omit<AutoRule, "id" | "separated">) => void;
  updateRule: (id: string, patch: Partial<AutoRule>) => void;
  removeRule: (id: string) => void;
  addGoal: (g: Omit<Goal, "id">) => void;
  removeGoal: (id: string) => void;
  addClosing: (c: Omit<Closing, "id">) => void;
  addReserve: (r: Omit<ReserveDeposit, "id">) => void;
  removeReserve: (id: string) => void;
  addPersonal: (p: Omit<PersonalEntry, "id">) => void;
  removePersonal: (id: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  recomputeSeparations: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultSettings: Settings = {
  businessName: "Bom Sabor RS Confeitaria",
  reserveGoal: 10000,
  monthlyRevenueGoal: 15000,
  monthlyExpenseCap: 8000,
  monthlyProfitGoal: 4000,
  fixedCostsCap: 3000,
};

const defaultRules: AutoRule[] = [
  { id: uid(), name: "Pró-labore Esposa", pct: 20, cap: 2000, bucket: "pro-labore", separated: 0 },
  { id: uid(), name: "Reserva da Empresa", pct: 10, cap: 1000, bucket: "empresa", separated: 0 },
  { id: uid(), name: "Pró-labore Ricardo", pct: 15, cap: 3000, activateAfter: 20000, bucket: "pro-labore", separated: 0 },
  { id: uid(), name: "Reserva Diária", pct: 5, bucket: "reserva", separated: 0 },
];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      entries: [],
      expenses: [],
      rules: defaultRules,
      goals: [],
      closings: [],
      reserves: [],
      personal: [],
      settings: defaultSettings,

      addEntry: (e) => {
        set({ entries: [{ ...e, id: uid() }, ...get().entries] });
        get().recomputeSeparations();
      },
      removeEntry: (id) => {
        set({ entries: get().entries.filter((x) => x.id !== id) });
        get().recomputeSeparations();
      },
      addExpense: (e) => set({ expenses: [{ ...e, id: uid() }, ...get().expenses] }),
      removeExpense: (id) => set({ expenses: get().expenses.filter((x) => x.id !== id) }),
      addRule: (r) => set({ rules: [...get().rules, { ...r, id: uid(), separated: 0 }] }),
      updateRule: (id, patch) =>
        set({ rules: get().rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) }),
      removeRule: (id) => set({ rules: get().rules.filter((r) => r.id !== id) }),
      addGoal: (g) => set({ goals: [...get().goals, { ...g, id: uid() }] }),
      removeGoal: (id) => set({ goals: get().goals.filter((g) => g.id !== id) }),
      addClosing: (c) => set({ closings: [{ ...c, id: uid() }, ...get().closings] }),
      addReserve: (r) => set({ reserves: [{ ...r, id: uid() }, ...get().reserves] }),
      removeReserve: (id) => set({ reserves: get().reserves.filter((r) => r.id !== id) }),
      addPersonal: (p) => set({ personal: [{ ...p, id: uid() }, ...get().personal] }),
      removePersonal: (id) => set({ personal: get().personal.filter((p) => p.id !== id) }),
      updateSettings: (s) => set({ settings: { ...get().settings, ...s } }),

      recomputeSeparations: () => {
        const { entries, rules } = get();
        const month = monthKey(new Date());
        const monthRevenue = entries
          .filter((e) => monthKey(e.date) === month)
          .reduce((s, e) => s + e.amount, 0);

        const updated = rules.map((r) => {
          if (r.activateAfter && monthRevenue < r.activateAfter) {
            return { ...r, separated: 0 };
          }
          const raw = monthRevenue * (r.pct / 100);
          const sep = r.cap ? Math.min(raw, r.cap) : raw;
          return { ...r, separated: sep };
        });
        set({ rules: updated });
      },
    }),
    { name: "bomsabor-finance-v1" }
  )
);

// Derived selectors
export const selectMonthRevenue = (s: State, month: string) =>
  s.entries.filter((e) => monthKey(e.date) === month).reduce((a, e) => a + e.amount, 0);

export const selectMonthExpenses = (s: State, month: string) =>
  s.expenses
    .filter((e) => monthKey(e.date) === month)
    .reduce((a, e) => {
      const businessShare =
        e.scope === "empresa"
          ? e.amount
          : e.scope === "pessoal"
            ? 0
            : (e.amount * (e.sharedBusinessPct ?? 50)) / 100;
      return a + businessShare;
    }, 0);

export const selectReserveTotal = (s: State) =>
  s.reserves.reduce((a, r) => a + r.amount, 0);
