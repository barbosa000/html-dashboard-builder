import { createFileRoute } from "@tanstack/react-router";
import { CrudSection } from "@/components/CrudSection";
import { Kpi, Note, PageHeader, Chip } from "@/components/ui-kit";
import { useCollection } from "@/lib/store";
import { brl, numFmt } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/socios")({ component: SociosPage });

function SociosPage() {
  const { rows: partners } = useCollection("partners");

  const totalInvested = partners.reduce((a, p) => a + (Number(p.invested) || 0), 0);
  const totalPct = partners.reduce((a, p) => a + (Number(p.percent) || 0), 0);
  const ativos = partners.filter((p) => p.status === "Ativo").length;
  const pctOk = Math.abs(totalPct - 100) < 0.01;

  return (
    <div>
      <PageHeader title="Sócios" description="Cadastro, participação e responsabilidades dos sócios." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi label="Capital investido pelos sócios" value={brl(totalInvested)} />
        <Kpi
          label="Participação total"
          value={`${numFmt(totalPct, 2)}%`}
          tone={pctOk ? "good" : "critical"}
        />
        <Kpi label="Sócios ativos" value={numFmt(ativos)} />
      </div>

      {partners.length > 0 && !pctOk && (
        <div className="mt-4">
          <Note kind="critical">
            A soma das participações é {numFmt(totalPct, 2)}% — deveria totalizar 100%. Revise os percentuais cadastrados.
          </Note>
        </div>
      )}

      {partners.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {partners.map((p) => (
            <div key={p.id} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold">{p.name}</span>
                <Chip value={p.status || "Ativo"} />
              </div>
              <div className="num mt-1.5 text-2xl font-semibold">
                {numFmt(p.percent, 2)}%<span className="ml-1 text-xs font-normal text-muted-foreground">participação</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {brl(p.invested)} investidos · {p.role || "—"}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <CrudSection
          collection="partners"
          title="Cadastrar sócio"
          listTitle="Sócios"
          emptyText="Nenhum sócio cadastrado ainda."
          addLabel="Salvar sócio"
          fields={[
            { key: "name", label: "Nome", required: true, span: 2 },
            { key: "role", label: "Função" },
            { key: "responsibility", label: "Responsabilidades", type: "textarea", span: 2 },
            { key: "percent", label: "Participação (%)", type: "number", step: "0.01" },
            { key: "invested", label: "Valor investido (R$)", type: "number", step: "0.01" },
            { key: "investedDate", label: "Data do investimento", type: "date" },
            { key: "phone", label: "Telefone" },
            { key: "status", label: "Status", type: "select", options: ["Ativo", "Inativo"] },
            { key: "notes", label: "Observações", type: "textarea", span: 2 },
          ]}
          columns={[
            { key: "name", label: "Nome" },
            { key: "role", label: "Função" },
            { key: "percent", label: "%", render: (r) => `${numFmt(r.percent, 2)}%` },
            { key: "invested", label: "Investido", render: (r) => brl(r.invested) },
            { key: "status", label: "Status", render: (r) => <Chip value={r.status} /> },
          ]}
        />
      </div>
    </div>
  );
}
