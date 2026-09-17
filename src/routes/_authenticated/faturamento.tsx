import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Kpi, PageHeader, Panel, SectionTitle, DataTable, Td } from "@/components/ui-kit";
import { useCollection } from "@/lib/store";
import { activeSales, allMonthKeys, brl, currentMonthKey, monthLabel, monthSales, numFmt, revenueOf } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/faturamento")({ component: Faturamento });

function Faturamento() {
  const { rows: sales } = useCollection("sales");

  const mk = currentMonthKey();
  const mSales = useMemo(() => monthSales(sales, mk), [sales, mk]);
  const revenue = revenueOf(mSales);
  const avgTicket = mSales.length ? revenue / mSales.length : 0;
  const paid = mSales.filter((s) => s["payment"] === "Pago").reduce((a, s) => a + (Number(s["total"]) || 0), 0);

  const months = useMemo(() => allMonthKeys([], sales), [sales]);
  const series = useMemo(
    () =>
      months.map((m) => {
        const ms = monthSales(sales, m);
        return { mk: m, label: monthLabel(m), revenue: revenueOf(ms), orders: ms.length };
      }),
    [months, sales],
  );

  const byClient = useMemo(() => {
    const map: Record<string, { orders: number; bags: number; rev: number }> = {};
    mSales.forEach((s) => {
      const k = s["clientName"] || "—";
      map[k] = map[k] || { orders: 0, bags: 0, rev: 0 };
      map[k].orders += 1;
      map[k].bags += (Number(s["q2"]) || 0) + (Number(s["q5"]) || 0);
      map[k].rev += Number(s["total"]) || 0;
    });
    return Object.entries(map)
      .sort((a, b) => b[1].rev - a[1].rev)
      .slice(0, 10);
  }, [mSales]);

  return (
    <div>
      <PageHeader title="Faturamento" description="Receita diária, mensal e por cliente." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Faturamento do mês" value={brl(revenue)} />
        <Kpi label="Pedidos" value={numFmt(mSales.length)} />
        <Kpi label="Ticket médio" value={brl(avgTicket)} />
        <Kpi label="Recebido (pago)" value={brl(paid)} />
      </div>

      <SectionTitle>Faturamento por mês</SectionTitle>
      <Panel>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$ ${numFmt(v)}`} />
              <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)" }} />
              <Line type="monotone" dataKey="revenue" name="Faturamento" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <SectionTitle>Top clientes do mês</SectionTitle>
      <DataTable columns={["Cliente", "Pedidos", "Sacos", "Faturamento"]} isEmpty={byClient.length === 0} empty="Sem vendas registradas neste mês.">
        {byClient.map(([name, d]) => (
          <tr key={name}>
            <Td>{name}</Td>
            <Td className="num">{numFmt(d.orders)}</Td>
            <Td className="num">{numFmt(d.bags)}</Td>
            <Td className="num">{brl(d.rev)}</Td>
          </tr>
        ))}
      </DataTable>

      <SectionTitle>Detalhamento mensal</SectionTitle>
      <DataTable columns={["Mês", "Pedidos", "Faturamento"]} isEmpty={series.length === 0}>
        {series.map((s) => (
          <tr key={s.mk}>
            <Td>{s.label}</Td>
            <Td className="num">{numFmt(s.orders)}</Td>
            <Td className="num">{brl(s.revenue)}</Td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
