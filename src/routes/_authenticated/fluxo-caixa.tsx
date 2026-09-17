import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Note, PageHeader, Panel, SectionTitle, DataTable, Td } from "@/components/ui-kit";
import { useCollection, useDoc } from "@/lib/store";
import { allMonthKeys, brl, monthCostsTotal, monthLabel, monthSales, numFmt, revenueOf } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/fluxo-caixa")({ component: FluxoCaixa });

function FluxoCaixa() {
  const { rows: production } = useCollection("production");
  const { rows: sales } = useCollection("sales");
  const { rows: investments } = useCollection("investments");
  const months = useMemo(() => allMonthKeys(production, sales), [production, sales]);

  return <FluxoBody months={months} sales={sales} investments={investments} />;
}

function FluxoBody({ months, sales, investments }: { months: string[]; sales: any[]; investments: any[] }) {
  // Load costs per month via hooks isn't possible in a loop; use a single collection query.
  const { rows: allCosts } = useCollection("costs");
  const costsByMonth = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    allCosts.forEach((c) => {
      const key = (c as any)._key ?? c.month;
      if (key) map[key] = c;
    });
    return map;
  }, [allCosts]);

  const series = useMemo(() => {
    let acc = 0;
    return months.map((mk) => {
      const c = costsByMonth[mk] || {};
      const ms = monthSales(sales, mk);
      const revenue = revenueOf(ms);
      const custos = monthCostsTotal(c);
      const investOut = investments
        .filter((i) => (i.date || "").slice(0, 7) === mk)
        .reduce((a, i) => a + (Number(i.actualValue) || Number(i.plannedValue) || 0), 0);
      const saidas = custos + investOut;
      const saldoMes = revenue - saidas;
      acc += saldoMes;
      return { mk, label: monthLabel(mk), revenue, saidas, saldoMes, acc };
    });
  }, [months, sales, investments, costsByMonth]);

  return (
    <div>
      <PageHeader title="Fluxo de Caixa" description="Entradas, saídas e saldo acumulado por mês." />
      <Note kind="info">
        Fluxo simplificado por competência: entradas = pedidos não cancelados no mês; saídas = custos fixos lançados + investimentos com data no
        mês.
      </Note>

      <SectionTitle>Saldo acumulado</SectionTitle>
      <Panel>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$ ${numFmt(v)}`} />
              <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)" }} />
              <Area type="monotone" dataKey="acc" name="Saldo acumulado" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <SectionTitle>Detalhamento mensal</SectionTitle>
      <DataTable columns={["Mês", "Entradas", "Saídas", "Saldo do mês", "Saldo acumulado"]} isEmpty={series.length === 0} empty="Sem lançamentos suficientes ainda.">
        {series.map((s) => (
          <tr key={s.mk}>
            <Td>{s.label}</Td>
            <Td className="num">{brl(s.revenue)}</Td>
            <Td className="num">{brl(s.saidas)}</Td>
            <Td className="num">{brl(s.saldoMes)}</Td>
            <Td className="num">{brl(s.acc)}</Td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
