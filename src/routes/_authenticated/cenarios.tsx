import { createFileRoute } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PageHeader, Panel, DataTable, Td, Chip } from "@/components/ui-kit";
import { useCollection, useDoc } from "@/lib/store";
import { DEFAULT_SETTINGS, Settings, brl, numFmt } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/cenarios")({
  component: CenariosPage,
});

function machineUnitCost(investments: any[]) {
  const rows = investments.filter(
    (i) => /m[aá]quina/i.test(i.item || "") && (Number(i.actualValue) || Number(i.plannedValue)),
  );
  if (!rows.length) return null;
  const vals = rows.map((r) => Number(r.actualValue) || Number(r.plannedValue));
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function machinesNeeded(kgDia: number, cap: number) {
  return Math.ceil(kgDia / (cap || 50));
}

function scenarioCalc(kgDia: number, settings: Settings, unitCost: number | null) {
  const dias = settings.daysPerMonth || 26;
  const mix = Math.min(100, Math.max(0, settings.mix2 || 0)) / 100;
  const scale = (settings.dailyTarget || 45) > 0 ? kgDia / (settings.dailyTarget || 45) : 1;
  const kg = kgDia * dias;
  const kg2 = kg * mix;
  const kg5 = kg - kg2;
  const q2 = Math.floor(kg2 / 2);
  const q5 = Math.floor(kg5 / 5);
  const revenue = q2 * (settings.price2 || 0) + q5 * (settings.price5 || 0);
  const cost = (settings.packaging || 0) * scale + (settings.otherCosts || 0) * scale;
  const result = revenue - cost;
  const margin = revenue ? (result / revenue) * 100 : 0;
  const machines = machinesNeeded(kgDia, settings.machineCapacity);
  const invest = unitCost != null ? machines * unitCost : null;
  return { kgDia, kg, q2, q5, revenue, cost, result, margin, machines, invest };
}

const GROWTH_SCENARIOS = [25, 35, 45, 50, 100, 150, 250];

const NAMED = [
  { key: "Pessimista", kg: 25, tone: "critical" as const },
  { key: "Realista", kg: 45, tone: "info" as const },
  { key: "Otimista", kg: 100, tone: "good" as const },
];

function CenariosPage() {
  const { data: settings } = useDoc("settings", "main", DEFAULT_SETTINGS);
  const { rows: investments } = useCollection("investments");
  const unitCost = machineUnitCost(investments);

  const rows = GROWTH_SCENARIOS.map((kg) => scenarioCalc(kg, settings, unitCost));
  const named = NAMED.map((n) => ({ ...n, calc: scenarioCalc(n.kg, settings, unitCost) }));

  const chartData = rows.map((r) => ({
    name: `${numFmt(r.kgDia)} kg/dia`,
    Faturamento: Math.round(r.revenue),
    Custos: Math.round(r.cost),
    Resultado: Math.round(r.result),
  }));

  return (
    <div>
      <PageHeader
        title="Cenários"
        description="Produção de 25 a 250 kg/dia — simulação calculada a partir das premissas em Configurações."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {named.map((n) => (
          <Panel key={n.key} title={n.key} subtitle={`${n.kg} kg/dia`}>
            <div className="mb-2">
              <Chip value="SIMULAÇÃO" kind="info" />
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Faturamento</span>
                <span className="num font-semibold">{brl(n.calc.revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custos</span>
                <span className="num font-semibold">{brl(n.calc.cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resultado</span>
                <span className="num font-semibold">{brl(n.calc.result)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margem</span>
                <span className="num font-semibold">{numFmt(n.calc.margin, 1)}%</span>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <Panel title="Faturamento, custos e resultado por cenário" className="mt-6">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ background: "var(--surface-solid, #101828)", border: "1px solid var(--border)" }} />
              <Legend />
              <Bar dataKey="Faturamento" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Custos" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Resultado" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="mt-6">
        <DataTable
          columns={["Cenário", "kg/mês", "Sacos 2 kg", "Sacos 5 kg", "Faturamento", "Custos", "Resultado", "Margem", "Máquinas", "Investimento"]}
        >
          {rows.map((r) => (
            <tr key={r.kgDia} className="hover:bg-surface-2/50">
              <Td>{numFmt(r.kgDia)} kg/dia</Td>
              <Td className="num">{numFmt(r.kg)}</Td>
              <Td className="num">{numFmt(r.q2)}</Td>
              <Td className="num">{numFmt(r.q5)}</Td>
              <Td className="num">{brl(r.revenue)}</Td>
              <Td className="num">{brl(r.cost)}</Td>
              <Td className="num">{brl(r.result)}</Td>
              <Td className="num">{numFmt(r.margin, 1)}%</Td>
              <Td className="num">{r.machines}</Td>
              <Td className="num">{r.invest != null ? brl(r.invest) : "A validar"}</Td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
