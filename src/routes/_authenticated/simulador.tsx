import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Kpi, Note, PageHeader, Panel, SectionTitle } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCollection, useDoc } from "@/lib/store";
import {
  brl,
  currentMonthKey,
  DEFAULT_SETTINGS,
  monthCostsTotal,
  monthSales,
  numFmt,
  pct,
  revenueOf,
  type Settings,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/simulador")({ component: Simulador });

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function Simulador() {
  const { data: settings, save } = useDoc<Settings>("settings", "main", DEFAULT_SETTINGS);
  const { rows: sales } = useCollection("sales");
  const { rows: allCosts } = useCollection("costs");

  const mk = currentMonthKey();
  const costsThisMonth = useMemo(() => {
    const found = allCosts.find((c) => ((c as any)._key ?? c.month) === mk);
    return found || {};
  }, [allCosts, mk]);

  const [form, setForm] = useState({
    prod: settings.dailyTarget || 45,
    dias: settings.daysPerMonth || 26,
    p2: settings.mix2 ?? 40,
    v2: settings.price2 ?? 10,
    v5: settings.price5 ?? 17,
    emb: settings.packaging ?? 380,
    out: settings.otherCosts ?? 1100,
    tax: settings.taxRate ?? 0,
    capacity: settings.machineCapacity ?? 50,
    varCost2: settings.varCost2 ?? 0,
    varCost5: settings.varCost5 ?? 0,
    workingCapital: settings.workingCapital ?? 0,
  });
  const [savedMsg, setSavedMsg] = useState("");

  function set<K extends keyof typeof form>(key: K, value: number) {
    setForm((s) => ({ ...s, [key]: value }));
    setSavedMsg("");
  }

  const dias = clamp(form.dias || 26, 1, 31);
  const p2 = clamp(form.p2 || 0, 0, 100) / 100;
  const v2 = Math.max(0, form.v2 || 0);
  const v5 = Math.max(0, form.v5 || 0);
  const emb = Math.max(0, form.emb || 0);
  const out = Math.max(0, form.out || 0);
  const tax = clamp(form.tax || 0, 0, 50) / 100;
  const prod = clamp(form.prod || 0, 1, 300);

  const kg = prod * dias;
  const kg2 = kg * p2;
  const kg5 = kg - kg2;
  const q2 = Math.floor(kg2 / 2);
  const q5 = Math.floor(kg5 / 5);
  const fat = q2 * v2 + q5 * v5;
  const taxv = fat * tax;
  const varCostTotal = q2 * (form.varCost2 || 0) + q5 * (form.varCost5 || 0);
  const custoFixo = emb + out;
  const custoTotal = custoFixo + varCostTotal;
  const res = fat - custoTotal - taxv;
  const marg = fat ? (res / fat) * 100 : 0;

  // Ponto de equilíbrio
  const avgPrice = q2 + q5 > 0 ? fat / (q2 + q5) : v2 * p2 + v5 * (1 - p2);
  const avgVarCost = q2 + q5 > 0 ? varCostTotal / (q2 + q5) : (form.varCost2 || 0) * p2 + (form.varCost5 || 0) * (1 - p2);
  const contrib = avgPrice - avgVarCost;
  const fixos = out + emb;
  const sacosEquilibrio = contrib > 0 ? fixos / contrib : null;
  const kgPorSaco = p2 * 2 + (1 - p2) * 5;
  const kgEquilibrio = sacosEquilibrio != null ? sacosEquilibrio * kgPorSaco : null;
  const fatEquilibrio = sacosEquilibrio != null ? sacosEquilibrio * avgPrice : null;

  // Capital de giro
  const mSales = monthSales(sales, mk);
  const revenueReal = revenueOf(mSales);
  const costsReal = monthCostsTotal(costsThisMonth);
  const workingCapital = form.workingCapital || 0;
  const giroSuficiente = workingCapital <= 0 ? null : workingCapital >= costsReal;

  async function salvarPadrao() {
    await save({
      dailyTarget: prod,
      daysPerMonth: dias,
      mix2: form.p2,
      price2: v2,
      price5: v5,
      packaging: emb,
      otherCosts: out,
      taxRate: form.tax,
      machineCapacity: form.capacity,
      varCost2: form.varCost2,
      varCost5: form.varCost5,
      workingCapital: form.workingCapital,
    });
    setSavedMsg("Padrões salvos — usados em Vendas, Produção e nas demais calculadoras.");
  }

  return (
    <div>
      <PageHeader title="Simulador" description="Cenários, preços, ponto de equilíbrio e capital de giro." />
      <Note kind="info">Ferramenta de planejamento — não usa apenas os dados reais lançados; ajuste as premissas livremente.</Note>

      <SectionTitle>Premissas do cenário</SectionTitle>
      <Panel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Capacidade da máquina (kg/dia)" value={form.capacity} onChange={(v) => set("capacity", v)} />
          <Field label="Meta diária (kg/dia)" value={form.prod} onChange={(v) => set("prod", v)} min={1} max={300} />
          <Field label="Dias de produção/mês" value={form.dias} onChange={(v) => set("dias", v)} min={1} max={31} />
          <Field label="% produção em 2 kg" value={form.p2} onChange={(v) => set("p2", v)} min={0} max={100} />
          <Field label="Preço 2 kg (R$)" value={form.v2} onChange={(v) => set("v2", v)} step="0.01" />
          <Field label="Preço 5 kg (R$)" value={form.v5} onChange={(v) => set("v5", v)} step="0.01" />
          <Field label="Custo variável 2 kg (R$)" value={form.varCost2} onChange={(v) => set("varCost2", v)} step="0.01" />
          <Field label="Custo variável 5 kg (R$)" value={form.varCost5} onChange={(v) => set("varCost5", v)} step="0.01" />
          <Field label="Embalagens/mês (R$)" value={form.emb} onChange={(v) => set("emb", v)} />
          <Field label="Outros custos/mês (R$)" value={form.out} onChange={(v) => set("out", v)} />
          <Field label="Impostos + taxas (%)" value={form.tax} onChange={(v) => set("tax", v)} min={0} max={50} step="0.1" />
          <Field label="Capital de giro disponível (R$)" value={form.workingCapital} onChange={(v) => set("workingCapital", v)} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-muted-foreground">Cenários rápidos:</span>
          {[25, 35, 45, 50].map((v) => (
            <Button key={v} type="button" size="sm" variant="outline" onClick={() => set("prod", v)}>
              {v} kg/dia
            </Button>
          ))}
          <Button type="button" size="sm" className="ml-auto" onClick={salvarPadrao}>
            Usar como padrão do sistema
          </Button>
        </div>
        {savedMsg && <p className="mt-2 text-xs text-muted-foreground">{savedMsg}</p>}
      </Panel>

      <SectionTitle>Resultado do cenário</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Produção mensal" value={`${numFmt(kg)} kg`} sub={`${numFmt(q2)} sacos 2kg / ${numFmt(q5)} sacos 5kg`} />
        <Kpi label="Faturamento" value={brl(fat)} />
        <Kpi label="Custos totais" value={brl(custoTotal)} sub={`Impostos: ${brl(taxv)}`} />
        <Kpi label="Resultado" value={brl(res)} tone={res >= 0 ? "good" : "critical"} />
        <Kpi label="Margem" value={pct(marg)} tone={marg < 10 ? "warn" : "good"} />
        <Kpi label="Capacidade utilizada" value={pct(form.capacity ? (prod / form.capacity) * 100 : 0)} tone={prod >= (form.capacity || 50) * 0.95 ? "warn" : "default"} />
      </div>

      <SectionTitle>Ponto de equilíbrio</SectionTitle>
      <Panel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi label="Preço médio/saco" value={brl(avgPrice)} />
          <Kpi label="Margem de contribuição" value={brl(contrib)} />
          <Kpi label="Sacos necessários/mês" value={sacosEquilibrio != null ? numFmt(sacosEquilibrio) : "A validar"} />
          <Kpi label="kg necessários/mês" value={kgEquilibrio != null ? `${numFmt(kgEquilibrio)} kg` : "A validar"} />
          <Kpi label="Faturamento mínimo/mês" value={fatEquilibrio != null ? brl(fatEquilibrio) : "A validar"} />
          <Kpi label="Faturamento necessário/dia" value={fatEquilibrio != null ? brl(fatEquilibrio / dias) : "A validar"} />
        </div>
      </Panel>

      <SectionTitle>Capital de giro</SectionTitle>
      <Panel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi label="Capital de giro disponível" value={brl(workingCapital)} />
          <Kpi label={`Custos reais do mês (${mk})`} value={brl(costsReal)} />
          <Kpi label="Receita real do mês" value={brl(revenueReal)} />
        </div>
        {giroSuficiente === false && (
          <Note kind="critical" >Capital de giro disponível é menor que os custos fixos do mês.</Note>
        )}
        {giroSuficiente === true && <Note kind="good">Capital de giro cobre os custos fixos do mês corrente.</Note>}
      </Panel>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  min,
  max,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}
