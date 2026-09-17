import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Kpi, PageHeader, Panel, SectionTitle } from "@/components/ui-kit";
import { useCollection, useDoc } from "@/lib/store";
import {
  brl,
  currentMonthKey,
  DEFAULT_SETTINGS,
  monthCostsTotal,
  monthProduction,
  monthSales,
  numFmt,
  type Settings,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/indicadores")({ component: IndicadoresPage });

function statusTone(pct: number, invert = false) {
  const good = invert ? pct <= 50 : pct >= 90;
  const warn = invert ? pct <= 80 : pct >= 60;
  if (good) return "good" as const;
  if (warn) return "warn" as const;
  return "critical" as const;
}

function IndicadoresPage() {
  const { rows: production } = useCollection("production");
  const { rows: sales } = useCollection("sales");
  const { rows: clients } = useCollection("clients");
  const { rows: allCosts } = useCollection("costs");
  const { data: settings } = useDoc<Settings>("settings", "main", DEFAULT_SETTINGS);

  const mk = currentMonthKey();
  const costsDoc: Record<string, any> = useMemo(() => allCosts.find((c) => ((c as any)._key ?? c["month"]) === mk) ?? {}, [allCosts, mk]);

  const mProd = useMemo(() => monthProduction(production, mk), [production, mk]);
  const mSales = useMemo(() => monthSales(sales, mk), [sales, mk]);

  const kgProd = mProd.reduce((a, p) => a + (Number(p.kg) || 0), 0);
  const perdas = mProd.reduce((a, p) => a + (Number(p.perda) || 0), 0);
  const kgSold = mSales.reduce((a, s) => a + (Number(s.q2) || 0) * 2 + (Number(s.q5) || 0) * 5, 0);
  const revenue = mSales.reduce((a, s) => a + (Number(s.total) || 0), 0);
  const totalCost = monthCostsTotal(costsDoc);
  const daysWithProd = new Set(mProd.map((p) => p.date)).size || 1;
  const activeClients = clients.filter((c) => c.status === "Recorrente" || c.status === "Cliente").length;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const recentBuyers = new Set(
    sales.filter((s) => s.status !== "Cancelado" && new Date(s.date) >= weekAgo).map((s) => s.clientId),
  ).size;
  const avgTicket = mSales.length ? revenue / mSales.length : 0;
  const orders = mSales.length || 1;

  const capacity = settings.machineCapacity || 50;
  const daysPerMonth = settings.daysPerMonth || 26;
  const capacityUsagePct = capacity && daysWithProd ? (kgProd / daysWithProd / capacity) * 100 : 0;
  const margin = revenue ? ((revenue - totalCost) / revenue) * 100 : 0;
  const productivityPct = daysWithProd ? Math.min(100, (kgProd / daysWithProd / (settings.dailyTarget || 45)) * 100) : 0;

  const items: { label: string; value: string; tone: "good" | "warn" | "critical"; sub?: string }[] = [
    {
      label: "Kg produzidos/dia (média do mês)",
      value: `${numFmt(kgProd / daysWithProd, 1)} kg`,
      tone: statusTone(productivityPct),
      sub: `Meta diária: ${numFmt(settings.dailyTarget || 45)} kg`,
    },
    { label: "Ocupação da capacidade", value: `${numFmt(capacityUsagePct, 0)}%`, tone: statusTone(capacityUsagePct), sub: `Capacidade: ${numFmt(capacity)} kg/dia` },
    { label: "Kg vendidos (equivalente, mês)", value: `${numFmt(kgSold, 1)} kg`, tone: kgSold >= kgProd * 0.8 ? "good" : "warn" },
    { label: "Perda registrada no mês", value: `${numFmt(perdas, 1)} kg`, tone: perdas === 0 ? "good" : perdas / (kgProd || 1) < 0.03 ? "warn" : "critical" },
    { label: "Custo por kg produzido", value: kgProd ? brl(totalCost / kgProd) : "—", tone: "warn" },
    { label: "Receita por kg vendido", value: kgSold ? brl(revenue / kgSold) : "—", tone: "good" },
    { label: "Margem do mês", value: revenue ? `${numFmt(margin, 1)}%` : "—", tone: statusTone(margin >= 10 ? 90 : margin >= 0 ? 60 : 0) },
    { label: "Ticket médio por pedido", value: brl(avgTicket), tone: "good" },
    {
      label: "Custo de entrega por pedido",
      value: costsDoc.fuel && mSales.length ? brl(Number(costsDoc.fuel) / orders) : "—",
      tone: costsDoc.fuel && mSales.length ? (Number(costsDoc.fuel) / orders > 15 ? "critical" : "good") : "warn",
    },
    { label: "Clientes ativos (recorrentes)", value: numFmt(activeClients), tone: activeClients > 0 ? "good" : "warn" },
    { label: "Clientes com compra nos últimos 7 dias", value: numFmt(recentBuyers), tone: recentBuyers > 0 ? "good" : "warn" },
    { label: "Dias com produção lançada", value: `${numFmt(daysWithProd)} / ${numFmt(daysPerMonth)}`, tone: statusTone((daysWithProd / daysPerMonth) * 100) },
  ];

  return (
    <div>
      <PageHeader title="Indicadores" description="Indicadores operacionais calculados a partir dos lançamentos reais do mês corrente." />

      <SectionTitle hint="Semáforo: verde = dentro do esperado, amarelo = atenção, vermelho = crítico">Indicadores operacionais</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Kpi key={it.label} label={it.label} value={it.value} tone={it.tone} sub={it.sub} />
        ))}
      </div>

      {production.length === 0 && sales.length === 0 && (
        <Panel className="mt-6">
          <p className="text-sm text-muted-foreground">
            Lance produção e vendas para que os indicadores sejam calculados com dados reais.
          </p>
        </Panel>
      )}
    </div>
  );
}
