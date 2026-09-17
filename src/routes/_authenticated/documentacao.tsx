import { createFileRoute } from "@tanstack/react-router";
import { CrudSection } from "@/components/CrudSection";
import { PageHeader, Note, Chip } from "@/components/ui-kit";
import { useCollection } from "@/lib/store";
import { fmtDateBR } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/documentacao")({
  component: DocumentacaoPage,
});

function daysUntil(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr).getTime();
  return Math.floor((d - Date.now()) / 86400000);
}

function DocumentacaoPage() {
  const { rows: documents } = useCollection("licenses");

  const vencendo = documents.filter((d) => {
    const days = daysUntil(d["validity"]);
    return days != null && days <= 30;
  });

  return (
    <div>
      <PageHeader
        title="Documentação"
        description="Biblioteca de documentos, licenças e órgãos responsáveis."
      />

      {vencendo.length > 0 && (
        <Note kind="critical">
          {vencendo.length} documento(s) vencido(s) ou vencendo em até 30 dias:{" "}
          {vencendo.map((d) => d["document"]).join(", ")}.
        </Note>
      )}

      <div className="mt-6">
        <CrudSection
          collection="licenses"
          title="Adicionar documento"
          listTitle="Biblioteca"
          emptyText="Nenhum documento cadastrado ainda."
          addLabel="Salvar documento"
          fields={[
            {
              key: "document",
              label: "Documento",
              required: true,
              span: 2,
              placeholder: "Ex.: Alvará sanitário",
            },
            { key: "agency", label: "Órgão", placeholder: "Ex.: Vigilância Sanitária" },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: ["Pendente", "Em análise", "Emitido", "Vencido"],
            },
            { key: "validity", label: "Validade", type: "date" },
            { key: "link", label: "Link", type: "url", span: 2 },
            { key: "notes", label: "Observações", type: "textarea", span: 2 },
          ]}
          columns={[
            { key: "document", label: "Documento" },
            { key: "agency", label: "Órgão" },
            { key: "status", label: "Status", render: (r) => <Chip value={r["status"]} /> },
            {
              key: "validity",
              label: "Validade",
              render: (r) => {
                const days = daysUntil(r["validity"]);
                if (!r["validity"]) return "—";
                const vencido = days != null && days < 0;
                const proximo = days != null && days >= 0 && days <= 30;
                return (
                  <span className={vencido ? "text-destructive" : proximo ? "text-warning" : ""}>
                    {fmtDateBR(r["validity"])}
                  </span>
                );
              },
            },
            {
              key: "link",
              label: "Link",
              render: (r) =>
                r["link"] ? (
                  <a
                    href={r["link"]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    abrir ↗
                  </a>
                ) : (
                  "—"
                ),
            },
          ]}
        />
      </div>
    </div>
  );
}
