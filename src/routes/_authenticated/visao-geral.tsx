import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Kpi, Panel, PageHeader, SectionTitle, DataTable, Td, Note } from "@/components/ui-kit";
import { useCollection, useDoc } from "@/lib/store";
import {
  DEFAULT_SETTINGS,
  CHECK_ITEMS,
  brl,
  numFmt,
  pct,
  allMonthKeys,
  monthLabel,
  monthProduction,
  monthSales,
  revenueOf,
  currentMonthKey,
  inventoryIce,
  type Settings,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/visao-geral")({
  component: VisaoGeral,
});

function VisaoGeral() {
  const { data: settings } = useDoc<Settings>("settings", "main", DEFAULT_SETTINGS);
  const { rows: production } = useCollection("production");
  const { rows: sales } = useCollection("sales");
  const { rows: clients } = useCollection("clients");
  const { rows: investments } = useCollection("investments");
  const { data: checklist } = useDoc<Record<string, any>>("checklist", "main", {});

  const months = allMonthKeys(production, sales);
  const series = months.map((mk) => ({
    mes: monthLabel(mk),
    kg: monthProduction(production, mk).reduce((a, p) => a + (Number(p.kg) || 0), 0),
    receita: revenueOf(monthSales(sales, mk)),
  }));

  const inv = inventoryIce(production, sales);
  const totalKg = production.reduce((a, p) => a + (Number(p.kg) || 0), 0);
  const totalRevenue = revenueOf(sales.filter((s) => s.status !== "Cancelado"));
  const activeClients = clients.filter(
    (c) => c.status === "Cliente" || c.status === "Recorrente",
  ).length;
  const investTotal = investments.reduce(
    (a, i) => a + (Number(i.actualValue) || Number(i.plannedValue) || 0),
    0,
  );
  const done = CHECK_ITEMS.filter(([k]) => checklist?.[k]?.status === "Concluído").length;
  const mk = currentMonthKey();

  return (
    <div>
      <PageHeader
        title="Visão Geral"
        description="Panorama consolidado do negócio desde o início da operação."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Produção acumulada" value={`${numFmt(totalKg)} kg`} />
        <Kpi label="Faturamento acumulado" value={brl(totalRevenue)} tone="good" />
        <Kpi
          label="Clientes ativos"
          value={numFmt(activeClients)}
          sub={`${clients.length} cadastrados`}
        />
        <Kpi label="Investimento registrado" value={brl(investTotal)} tone="info" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi
          label="Estoque total"
          value={`${numFmt(inv.estQ2 + inv.estQ5)} sacos`}
          sub={`2 kg: ${numFmt(inv.estQ2)} · 5 kg: ${numFmt(inv.estQ5)}`}
        />
        <Kpi
          label="Checklist sanitário"
          value={`${done}/${CHECK_ITEMS.length}`}
          tone={done === CHECK_ITEMS.length ? "good" : "warn"}
        />
        <Kpi
          label="Capacidade utilizada"
          value={pct(
            settings.machineCapacity
              ? ((settings.dailyTarget || 0) / settings.machineCapacity) * 100
              : 0,
          )}
        />
      </div>

      <SectionTitle hint={`Mês atual: ${monthLabel(mk)}`}>Evolução mensal</SectionTitle>
      <Panel className="h-[320px]">
        {series.length === 0 ? (
          <Note>Sem dados suficientes — lance produções e pedidos para ver a evolução.</Note>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="mes"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--foreground)",
                }}
              />
              <Line
                type="monotone"
                dataKey="kg"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
                name="Produção (kg)"
              />
              <Line
                type="monotone"
                dataKey="receita"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
                name="Receita (R$)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <SectionTitle>Resumo por mês</SectionTitle>
      <DataTable columns={["Mês", "Produção (kg)", "Receita"]} isEmpty={series.length === 0}>
        {series.map((r) => (
          <tr key={r.mes}>
            <Td>{r.mes}</Td>
            <Td className="num">{numFmt(r.kg)}</Td>
            <Td className="num">{brl(r.receita)}</Td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
