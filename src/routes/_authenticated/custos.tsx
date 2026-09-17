import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Kpi, PageHeader, Panel, SectionTitle, DataTable, Td } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCollection, useDoc } from "@/lib/store";
import { allMonthKeys, brl, COST_KEYS, currentMonthKey, monthCostsTotal, monthLabel } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/custos")({ component: Custos });

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-1)", "var(--chart-2)"];

function Custos() {
  const { rows: production } = useCollection("production");
  const { rows: sales } = useCollection("sales");
  const months = useMemo(() => allMonthKeys(production, sales), [production, sales]);
  const [mk, setMk] = useState(currentMonthKey());

  const { data: costs, save } = useDoc<Record<string, any>>("costs", mk, {});
  const [form, setForm] = useState<Record<string, any>>({});

  const values = COST_KEYS.map(([k]) => (form[k] !== undefined ? form[k] : (costs[k] ?? "")));
  const total = monthCostsTotal(Object.fromEntries(COST_KEYS.map(([k], i) => [k, values[i]])));

  const chartData = COST_KEYS.map(([k, label], i) => ({ label, value: Number(values[i]) || 0 }));

  const otherMonths = months.filter((m) => m !== mk);
  const [compareMk, setCompareMk] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Record<string, any> = {};
    COST_KEYS.forEach(([k]) => (data[k] = Math.max(0, parseFloat(form[k] ?? costs[k] ?? 0) || 0)));
    await save(data);
    setForm({});
  }

  return (
    <div>
      <PageHeader title="Custos" description="Custos fixos do mês e sua distribuição." />

      <Panel
        title="Selecionar mês"
        action={
          <select
            className="h-9 rounded-md border border-input bg-surface-2 px-3 text-sm"
            value={mk}
            onChange={(e) => setMk(e.target.value)}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi label={`Total de custos — ${monthLabel(mk)}`} value={brl(total)} />
        </div>
      </Panel>

      <SectionTitle>{`Custos fixos do mês — ${monthLabel(mk)}`}</SectionTitle>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {COST_KEYS.map(([k, label]) => (
              <div key={k} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{label} (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={form[k] !== undefined ? form[k] : (costs[k] ?? "")}
                  onChange={(e) => setForm((s) => ({ ...s, [k]: e.target.value }))}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Button type="submit">Salvar custos do mês</Button>
            </div>
          </form>
        </Panel>

        <Panel title="Distribuição dos custos">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$ ${v}`} />
                <YAxis type="category" dataKey="label" stroke="var(--muted-foreground)" fontSize={12} width={110} />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)" }} />
                <Bar dataKey="value" radius={4}>
                  {chartData.map((_, i) => (
                    <Bar key={i} dataKey="value" fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <SectionTitle
        hint={
          <select
            className="h-8 rounded-md border border-input bg-surface-2 px-2 text-xs"
            value={compareMk}
            onChange={(e) => setCompareMk(e.target.value)}
          >
            <option value="">Comparar com...</option>
            {otherMonths.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        }
      >
        Comparativo entre meses
      </SectionTitle>
      <CustosCompareTable mk={mk} compareMk={compareMk} />
    </div>
  );
}

function CustosCompareTable({ mk, compareMk }: { mk: string; compareMk: string }) {
  const { data: costsA } = useDoc<Record<string, any>>("costs", mk, {});
  const { data: costsB } = useDoc<Record<string, any>>("costs", compareMk || mk, {});
  const totalA = monthCostsTotal(costsA);
  const totalB = compareMk ? monthCostsTotal(costsB) : 0;

  return (
    <DataTable columns={["Categoria", monthLabel(mk), compareMk ? monthLabel(compareMk) : "—", "Variação"]}>
      {COST_KEYS.map(([k, label]) => {
        const a = Number(costsA[k]) || 0;
        const b = compareMk ? Number(costsB[k]) || 0 : 0;
        const diff = compareMk ? a - b : null;
        return (
          <tr key={k}>
            <Td>{label}</Td>
            <Td className="num">{brl(a)}</Td>
            <Td className="num">{compareMk ? brl(b) : "—"}</Td>
            <Td className="num">{diff != null ? brl(diff) : "—"}</Td>
          </tr>
        );
      })}
      <tr className="font-semibold">
        <Td>Total</Td>
        <Td className="num">{brl(totalA)}</Td>
        <Td className="num">{compareMk ? brl(totalB) : "—"}</Td>
        <Td className="num">{compareMk ? brl(totalA - totalB) : "—"}</Td>
      </tr>
    </DataTable>
  );
}
