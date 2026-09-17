import { createFileRoute } from "@tanstack/react-router";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CrudSection } from "@/components/CrudSection";
import { Panel, Chip } from "@/components/ui-kit";
import { useCollection } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/riscos")({
  component: RiscosPage,
});

const PROB_OPTIONS = ["Baixa", "Média", "Alta"];
const IMPACT_OPTIONS = ["Baixo", "Médio", "Alto", "Muito alto"];
const PROB_MAP: Record<string, number> = { Baixa: 1, Média: 2, Alta: 3 };
const IMPACT_MAP: Record<string, number> = { Baixo: 1, Médio: 2, Alto: 3, "Muito alto": 4 };

function severity(probability: string, impact: string) {
  const score = (PROB_MAP[probability] || 0) * (IMPACT_MAP[impact] || 0);
  if (score >= 9) return "Alto";
  if (score >= 4) return "Médio";
  if (score > 0) return "Baixo";
  return "—";
}

function RiscosPage() {
  const { rows } = useCollection("risks");

  const cellCount: Record<string, { x: number; y: number; count: number }> = {};
  rows.forEach((r) => {
    const x = PROB_MAP[r.probability] || 0;
    const y = IMPACT_MAP[r.impact] || 0;
    if (!x || !y) return;
    const k = `${x}_${y}`;
    cellCount[k] = cellCount[k] || { x, y, count: 0 };
    cellCount[k].count++;
  });
  const points = Object.values(cellCount).map((c) => ({ ...c, z: 20 + c.count * 30 }));

  const probLabel = (v: number) => ({ 1: "Baixa", 2: "Média", 3: "Alta" }[v] || "");
  const impLabel = (v: number) => ({ 1: "Baixo", 2: "Médio", 3: "Alto", 4: "Muito alto" }[v] || "");

  return (
    <div>
      <Panel title="Matriz de riscos — probabilidade × impacto" subtitle="Tamanho da bolha indica quantidade de riscos naquela combinação.">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[0, 4]}
                ticks={[1, 2, 3]}
                tickFormatter={probLabel}
                name="Probabilidade"
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 5]}
                ticks={[1, 2, 3, 4]}
                tickFormatter={impLabel}
                name="Impacto"
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
              />
              <ZAxis type="number" dataKey="z" range={[100, 900]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ background: "var(--surface-solid, #101828)", border: "1px solid var(--border)" }}
                formatter={(value: any, name: string, item: any) =>
                  name === "x" ? [probLabel(item.payload.x), "Probabilidade"] : value
                }
                labelFormatter={() => ""}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = (payload[0] as any)?.payload ?? {};
                  return (
                    <div className="rounded-md border border-border bg-surface-solid px-3 py-2 text-xs">
                      Probabilidade: {probLabel(p.x)} · Impacto: {impLabel(p.y)} · {p.count} risco(s)
                    </div>
                  );
                }}
              />
              <Scatter data={points} fill="var(--chart-3)">
                {points.map((_, i) => (
                  <Cell key={i} fill="var(--chart-3)" fillOpacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="mt-6">
        <CrudSection
          collection="risks"
          title="Cadastrar risco"
          subtitle="Riscos identificados para o negócio, com probabilidade, impacto e plano de mitigação."
          listTitle="Riscos registrados"
          emptyText="Nenhum risco registrado ainda."
          addLabel="Salvar risco"
          fields={[
            { key: "description", label: "Risco", required: true, span: 4, placeholder: "Ex.: Comprar máquina antes de validar demanda" },
            { key: "probability", label: "Probabilidade", type: "select", options: PROB_OPTIONS },
            { key: "impact", label: "Impacto", type: "select", options: IMPACT_OPTIONS },
            { key: "owner", label: "Responsável" },
            { key: "status", label: "Status", type: "select", options: ["Aberto", "Mitigando", "Encerrado"] },
            { key: "actionPlan", label: "Plano de mitigação", type: "textarea", span: 4 },
          ]}
          columns={[
            { key: "description", label: "Risco" },
            { key: "probability", label: "Probabilidade", render: (r) => <Chip value={r.probability} /> },
            { key: "impact", label: "Impacto", render: (r) => <Chip value={r.impact} /> },
            {
              key: "severity",
              label: "Severidade",
              render: (r) => {
                const sev = severity(r.probability, r.impact);
                return <Chip value={sev} kind={sev === "Alto" ? "critical" : sev === "Médio" ? "warn" : "good"} />;
              },
            },
            { key: "owner", label: "Responsável" },
            { key: "status", label: "Status", render: (r) => <Chip value={r.status} /> },
            { key: "actionPlan", label: "Mitigação" },
          ]}
        />
      </div>
    </div>
  );
}
