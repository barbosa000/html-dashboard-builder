import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Note, Chip } from "@/components/ui-kit";
import { useCollection, useDoc } from "@/lib/store";
import { DEFAULT_SETTINGS, brl, numFmt } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/expansao")({
  component: ExpansaoPage,
});

const EXPANSION_PHASES = [
  {
    num: "Fase 1",
    machines: 1,
    kgDia: 50,
    estrutura: "1 máquina, freezer, seladora, balança, embalagens próprias.",
    equipe: "1–2 pessoas em regime parcial.",
    logistica: "Entrega própria em área delimitada.",
    riscos: "Demanda não validada; capital de giro curto.",
    gatilho: "Produção rotineiramente no limite + carteira recorrente.",
  },
  {
    num: "Fase 2",
    machines: 2,
    kgDia: 100,
    estrutura: "2 máquinas, mais espaço de estoque/congelamento.",
    equipe: "2–3 pessoas, início de rotas fixas.",
    logistica: "Rotas fixas por região, possível veículo dedicado.",
    riscos: "Aumento de custo fixo sem aumento proporcional de receita.",
    gatilho: "Pedidos perdidos por falta de estoque na Fase 1.",
  },
  {
    num: "Fase 3",
    machines: 3,
    kgDia: 150,
    estrutura: "3 máquinas, estrutura de produção mais formalizada.",
    equipe: "Equipe dedicada de produção e entrega.",
    logistica: "Mais de uma rota simultânea, possível ajudante de entrega.",
    riscos: "Complexidade operacional e necessidade de processos formais.",
    gatilho: "Margem operacional saudável sustentando a Fase 2.",
  },
  {
    num: "Fase 4",
    machines: 5,
    kgDia: 250,
    estrutura: "5 máquinas — negócio de escala regional.",
    equipe: "Estrutura de gestão dedicada (produção, comercial, financeiro).",
    logistica: "Frota própria ou parceiros de logística.",
    riscos: "Dependência de capital para giro e manutenção em escala.",
    gatilho: "Carteira e capital de giro comprovados nas fases anteriores.",
  },
];

function machinesNeeded(kgDia: number, cap: number) {
  return Math.ceil(kgDia / (cap || 50));
}

function machineUnitCost(investments: any[]) {
  const rows = investments.filter(
    (i) => /m[aá]quina/i.test(i.item || "") && (Number(i.actualValue) || Number(i.plannedValue)),
  );
  if (!rows.length) return null;
  const vals = rows.map((r) => Number(r.actualValue) || Number(r.plannedValue));
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function scenarioCalc(kgDia: number, settings: any, unitCost: number | null) {
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
  const machines = machinesNeeded(kgDia, settings.machineCapacity);
  const invest = unitCost != null ? machines * unitCost : null;
  return { kg, q2, q5, revenue, cost, result, machines, invest };
}

function ExpansaoPage() {
  const { data: settings } = useDoc("settings", "main", DEFAULT_SETTINGS);
  const { rows: investments } = useCollection("investments");
  const { rows: production } = useCollection("production");

  const unitCost = machineUnitCost(investments);
  const cap = settings.machineCapacity || 50;
  const target = settings.dailyTarget || 45;

  const last7 = [...production]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 7);
  const avgRecent = last7.length ? last7.reduce((a, p) => a + (Number(p.kg) || 0), 0) / last7.length : 0;
  const nearCapacity = target >= cap * 0.95 || avgRecent >= cap * 0.95;

  return (
    <div>
      <PageHeader title="Plano de Expansão" description="Fases de crescimento — capacidade, investimento e gatilho da 2ª máquina." />

      <Note kind="info">
        Faturamento, custos e investimento por fase são <b>simulação</b> — calculados escalando as premissas atuais de
        Configurações, não uma previsão garantida.
      </Note>

      <Panel title="Gatilho para 2ª máquina" className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <Chip value={nearCapacity ? "Gatilho ativo" : "Ainda não atingido"} kind={nearCapacity ? "warn" : "good"} />
          <span className="text-sm text-muted-foreground">
            Meta diária atual: {numFmt(target)} kg — Capacidade nominal: {numFmt(cap)} kg — Média de produção (últimos
            lançamentos): {numFmt(avgRecent, 1)} kg
          </span>
        </div>
        <ul className="mt-3 ml-4 list-disc space-y-1 text-sm text-muted-foreground">
          <li>Produção rotineiramente perto da capacidade nominal</li>
          <li>Pedidos perdidos por falta de estoque</li>
          <li>Carteira recorrente suficiente para absorver aumento</li>
          <li>Margem operacional saudável após logística</li>
          <li>Capital de giro disponível</li>
        </ul>
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {EXPANSION_PHASES.map((p) => {
          const calc = scenarioCalc(p.kgDia, settings, unitCost);
          return (
            <Panel key={p.num} title={p.num} subtitle={`${p.machines} máquina(s) · ${p.kgDia} kg/dia`}>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Faturamento potencial</span>
                  <span className="num font-semibold">{brl(calc.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resultado (simulação)</span>
                  <span className="num font-semibold">{brl(calc.result)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investimento estimado</span>
                  <span className="num font-semibold">{calc.invest != null ? brl(calc.invest) : "A validar"}</span>
                </div>
              </div>
              <p className="mt-3 text-xs"><b>Estrutura:</b> {p.estrutura}</p>
              <p className="mt-1 text-xs"><b>Equipe:</b> {p.equipe}</p>
              <p className="mt-1 text-xs"><b>Logística:</b> {p.logistica}</p>
              <p className="mt-1 text-xs"><b>Riscos:</b> {p.riscos}</p>
              <div className="mt-2">
                <Note kind="neutral">
                  <b>Gatilho:</b> {p.gatilho}
                </Note>
              </div>
              <div className="mt-2">
                <Chip value="SIMULAÇÃO" kind="info" />
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
