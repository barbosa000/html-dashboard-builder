import { createFileRoute } from "@tanstack/react-router";
import { CrudSection } from "@/components/CrudSection";
import { Note, Chip } from "@/components/ui-kit";
import { fmtDateBR } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/premissas")({
  component: PremissasPage,
});

const STATUS_OPTIONS = ["Confirmado", "Estimado", "A validar"];

function PremissasPage() {
  return (
    <div>
      <Note kind="neutral">Cada premissa deve ter valor, fonte, data e status — mantenha atualizado conforme a pesquisa avança.</Note>

      <div className="mt-6">
        <CrudSection
          collection="premises"
          title="Adicionar premissa"
          subtitle="Hipóteses do negócio usadas nas simulações, com origem e nível de confiança."
          listTitle="Premissas registradas"
          emptyText="Nenhuma premissa registrada ainda."
          addLabel="Salvar premissa"
          fields={[
            { key: "name", label: "Premissa", required: true, span: 2, placeholder: "Ex.: Capacidade da máquina" },
            { key: "value", label: "Valor" },
            { key: "unit", label: "Unidade" },
            { key: "source", label: "Origem/fonte", span: 2 },
            { key: "date", label: "Data", type: "date" },
            { key: "status", label: "Confiança", type: "select", options: STATUS_OPTIONS },
            { key: "notes", label: "Observações", type: "textarea", span: 4 },
          ]}
          columns={[
            { key: "name", label: "Premissa" },
            { key: "value", label: "Valor", render: (r) => `${r.value ?? "—"}${r.unit ? ` ${r.unit}` : ""}` },
            { key: "source", label: "Origem" },
            { key: "date", label: "Data", render: (r) => fmtDateBR(r.date) },
            { key: "status", label: "Confiança", render: (r) => <Chip value={r.status} /> },
            { key: "notes", label: "Observações" },
          ]}
        />
      </div>
    </div>
  );
}
