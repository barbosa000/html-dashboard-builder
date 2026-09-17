import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Kpi,
  PageHeader,
  Panel,
  SectionTitle,
  DataTable,
  Td,
  ExportCsvButton,
} from "@/components/ui-kit";
import { useCollection, useDoc } from "@/lib/store";
import { downloadCsv } from "@/lib/export";
import { toast } from "sonner";
import {
  allMonthKeys,
  brl,
  currentMonthKey,
  DEFAULT_SETTINGS,
  monthCostsTotal,
  monthLabel,
  monthSales,
  numFmt,
  pct,
  revenueOf,
  todayStr,
  type Settings,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/margens")({ component: Margens });

function Margens() {
  const { rows: production } = useCollection("production");
  const { rows: sales } = useCollection("sales");
  const { rows: allCosts } = useCollection("costs");
  const { data: settings } = useDoc<Settings>("settings", "main", DEFAULT_SETTINGS);

  const months = useMemo(() => allMonthKeys(production, sales), [production, sales]);
  const costsByMonth = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    allCosts.forEach((c) => {
      const key = (c as any)._key ?? c["month"];
      if (key) map[key] = c;
    });
    return map;
  }, [allCosts]);

  const series = useMemo(
    () =>
      months.map((mk) => {
        const revenue = revenueOf(monthSales(sales, mk));
        const custos = monthCostsTotal(costsByMonth[mk] || {});
        const result = revenue - custos;
        const margin = revenue ? (result / revenue) * 100 : 0;
        return { mk, label: monthLabel(mk), revenue, custos, result, margin };
      }),
    [months, sales, costsByMonth],
  );

  const mk = currentMonthKey();
  const current = series.find((s) => s.mk === mk);

  const margin2 = settings.price2
    ? ((settings.price2 - (settings.varCost2 || 0)) / settings.price2) * 100
    : null;
  const margin5 = settings.price5
    ? ((settings.price5 - (settings.varCost5 || 0)) / settings.price5) * 100
    : null;

  function exportCsv() {
    if (series.length === 0) {
      toast.error("Não há dados para exportar.");
      return;
    }
    downloadCsv(
      `resultado-mensal-${todayStr()}.csv`,
      ["Mês", "Receita", "Custos", "Resultado", "Margem (%)"],
      series.map((s) => [s.label, s.revenue, s.custos, s.result, numFmt(s.margin, 1)]),
    );
  }

  return (
    <div>
      <PageHeader
        title="Margens"
        description="Evolução da margem operacional e margem por produto."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Receita do mês" value={brl(current?.revenue ?? 0)} />
        <Kpi label="Custos do mês" value={brl(current?.custos ?? 0)} />
        <Kpi
          label="Resultado do mês"
          value={brl(current?.result ?? 0)}
          tone={(current?.result ?? 0) >= 0 ? "good" : "critical"}
        />
        <Kpi
          label="Margem do mês"
          value={pct(current?.margin ?? 0)}
          tone={(current?.margin ?? 0) < 10 ? "warn" : "good"}
        />
      </div>

      <SectionTitle>Margem por produto (Configurações)</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel title="Saco 2 kg">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço de venda</span>
              <b className="num">{brl(settings.price2)}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo variável</span>
              <b className="num">{brl(settings.varCost2)}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Margem unitária</span>
              <b className="num">{brl((settings.price2 || 0) - (settings.varCost2 || 0))}</b>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Margem %</span>
              <b className="num">{margin2 != null ? pct(margin2) : "—"}</b>
            </div>
          </div>
        </Panel>
        <Panel title="Saco 5 kg">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço de venda</span>
              <b className="num">{brl(settings.price5)}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo variável</span>
              <b className="num">{brl(settings.varCost5)}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Margem unitária</span>
              <b className="num">{brl((settings.price5 || 0) - (settings.varCost5 || 0))}</b>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Margem %</span>
              <b className="num">{margin5 != null ? pct(margin5) : "—"}</b>
            </div>
          </div>
        </Panel>
      </div>

      <SectionTitle>Evolução da margem operacional</SectionTitle>
      <Panel>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(v: number) => pct(v)}
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              />
              <Line
                type="monotone"
                dataKey="margin"
                name="Margem (%)"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <SectionTitle hint={<ExportCsvButton onExport={exportCsv} />}>Resultado por mês</SectionTitle>
      <DataTable
        columns={["Mês", "Receita", "Custos", "Resultado", "Margem"]}
        isEmpty={series.length === 0}
        empty="Sem dados suficientes ainda."
      >
        {series.map((s) => (
          <tr key={s.mk}>
            <Td>{s.label}</Td>
            <Td className="num">{brl(s.revenue)}</Td>
            <Td className="num">{brl(s.custos)}</Td>
            <Td className="num">{brl(s.result)}</Td>
            <Td className="num">{numFmt(s.margin, 1)}%</Td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
