import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Kpi, Note, Panel, PageHeader, SectionTitle, DataTable, Td, Chip } from "@/components/ui-kit";
import { useCollection, useDoc } from "@/lib/store";
import {
  DEFAULT_SETTINGS,
  brl,
  numFmt,
  pct,
  computeAlerts,
  currentMonthKey,
  inventoryIce,
  lastNDays,
  monthCostsTotal,
  monthProduction,
  monthSales,
  revenueOf,
  fmtDateBR,
  type Settings,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const mk = currentMonthKey();
  const { data: settings } = useDoc<Settings>("settings", "main", DEFAULT_SETTINGS);
  const { rows: production } = useCollection("production");
  const { rows: sales } = useCollection("sales");
  const { rows: clients } = useCollection("clients");
  const { data: costs } = useDoc<Record<string, any>>("costs", mk, {});
  const { data: checklist } = useDoc<Record<string, any>>("checklist", "main", {});

  const mProd = monthProduction(production, mk);
  const mSales = monthSales(sales, mk);
  const kgMonth = mProd.reduce((a, p) => a + (Number(p.kg) || 0), 0);
  const revenue = revenueOf(mSales);
  const totalCost = monthCostsTotal(costs);
  const margin = revenue ? ((revenue - totalCost) / revenue) * 100 : 0;
  const inv = inventoryIce(production, sales);
  const targetMonth = (settings.dailyTarget || 0) * (settings.daysPerMonth || 0);
  const alerts = computeAlerts({ settings, production, sales, clients, costs, checklist });

  const days = lastNDays(14);
  const chartData = days.map((d) => ({
    dia: d.slice(8),
    kg: production.filter((p) => p.date === d).reduce((a, p) => a + (Number(p.kg) || 0), 0),
  }));

  const recent = [...sales].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6);

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão rápida da operação, das finanças e dos alertas do mês." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Produção do mês" value={`${numFmt(kgMonth)} kg`} sub={`Meta: ${numFmt(targetMonth)} kg`} />
        <Kpi label="Faturamento do mês" value={brl(revenue)} sub={`${mSales.length} pedido(s)`} tone="good" />
        <Kpi label="Custos do mês" value={brl(totalCost)} sub="Custos lançados" tone="warn" />
        <Kpi
          label="Margem estimada"
          value={pct(margin)}
          sub={revenue ? brl(revenue - totalCost) : "Sem faturamento"}
          tone={margin >= 20 ? "good" : margin >= 10 ? "warn" : "critical"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi label="Estoque 2 kg" value={`${numFmt(inv.estQ2)} sacos`} />
        <Kpi label="Estoque 5 kg" value={`${numFmt(inv.estQ5)} sacos`} />
        <Kpi
          label="Ocupação da capacidade"
          value={pct(settings.machineCapacity ? ((settings.dailyTarget || 0) / settings.machineCapacity) * 100 : 0)}
          sub={`Capacidade: ${numFmt(settings.machineCapacity)} kg/dia`}
        />
      </div>

      <SectionTitle hint="Últimos 14 dias">Produção diária (kg)</SectionTitle>
      <Panel className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="dia" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--foreground)",
              }}
            />
            <Bar dataKey="kg" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <SectionTitle hint={`${alerts.length} alerta(s)`}>Alertas</SectionTitle>
      <div className="space-y-2">
        {alerts.length === 0 && <Note kind="good">Tudo em ordem — nenhum alerta no momento.</Note>}
        {alerts.map((a, i) => (
          <Note key={i} kind={a.kind}>
            {a.text}
          </Note>
        ))}
      </div>

      <SectionTitle>Pedidos recentes</SectionTitle>
      <DataTable
        columns={["Data", "Cliente", "2 kg", "5 kg", "Total", "Status"]}
        isEmpty={recent.length === 0}
        empty="Nenhum pedido lançado ainda."
      >
        {recent.map((s) => (
          <tr key={s.id}>
            <Td>{fmtDateBR(s.date)}</Td>
            <Td>{clients.find((c) => c.id === s.clientId)?.name ?? s.client ?? "—"}</Td>
            <Td className="num">{numFmt(s.q2)}</Td>
            <Td className="num">{numFmt(s.q5)}</Td>
            <Td className="num">{brl(s.total)}</Td>
            <Td>
              <Chip value={s.status} />
            </Td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
