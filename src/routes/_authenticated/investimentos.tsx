import { createFileRoute } from "@tanstack/react-router";
import { CrudSection } from "@/components/CrudSection";
import { Kpi, PageHeader, Chip } from "@/components/ui-kit";
import { useCollection } from "@/lib/store";
import { brl } from "@/lib/domain";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/_authenticated/investimentos")({ component: InvestimentosPage });

const CATEGORIES = ["Equipamento", "Embalagens", "Identidade visual", "Marketing", "Capital de giro", "Outros"];

function InvestimentosPage() {
  const { rows: investments } = useCollection("investments");
  const { rows: partners } = useCollection("partners");

  const planned = investments.reduce((a, i) => a + (Number(i.plannedValue) || 0), 0);
  const actual = investments.reduce((a, i) => a + (Number(i.actualValue) || Number(i.plannedValue) || 0), 0);
  const partnersCapital = partners.reduce((a, p) => a + (Number(p.invested) || 0), 0);
  const remaining = partnersCapital - actual;

  const byCat: Record<string, number> = {};
  investments.forEach((i) => {
    const cat = i.category || "Outros";
    byCat[cat] = (byCat[cat] || 0) + (Number(i.actualValue) || Number(i.plannedValue) || 0);
  });
  const chartData = Object.entries(byCat).map(([categoria, valor]) => ({ categoria, valor }));

  return (
    <div>
      <PageHeader title="Investimentos" description="Investimento inicial por item e por categoria." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Investimento planejado" value={brl(planned)} />
        <Kpi label="Investimento realizado" value={brl(actual)} />
        <Kpi label="Capital dos sócios" value={brl(partnersCapital)} />
        <Kpi
          label="Capital restante (sócios − realizado)"
          value={brl(remaining)}
          tone={remaining < 0 ? "critical" : "good"}
        />
      </div>

      <div className="panel mt-6 p-5">
        <h3 className="mb-3 text-base font-semibold">Distribuição por categoria</h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum investimento cadastrado ainda.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="categoria" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Bar dataKey="valor" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-8">
        <CrudSection
          collection="investments"
          title="Cadastrar investimento"
          listTitle="Investimentos"
          emptyText="Nenhum investimento cadastrado ainda."
          addLabel="Salvar investimento"
          fields={[
            { key: "item", label: "Item", required: true, span: 2, placeholder: "Ex.: Máquina de gelo" },
            { key: "category", label: "Categoria", type: "select", options: CATEGORIES },
            { key: "plannedValue", label: "Valor planejado (R$)", type: "number", step: "0.01" },
            { key: "actualValue", label: "Valor real (R$)", type: "number", step: "0.01" },
            { key: "status", label: "Status", type: "select", options: ["Planejado", "Comprado", "Cancelado"] },
            { key: "date", label: "Data", type: "date" },
            { key: "notes", label: "Observações", type: "textarea", span: 2 },
          ]}
          columns={[
            { key: "item", label: "Item" },
            { key: "category", label: "Categoria" },
            { key: "plannedValue", label: "Planejado", render: (r) => brl(r.plannedValue) },
            { key: "actualValue", label: "Real", render: (r) => brl(r.actualValue) },
            { key: "status", label: "Status", render: (r) => <Chip value={r.status} /> },
          ]}
        />
      </div>
    </div>
  );
}
