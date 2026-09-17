import { createFileRoute } from "@tanstack/react-router";
import { CrudSection } from "@/components/CrudSection";
import { Kpi, Note } from "@/components/ui-kit";
import { useCollection } from "@/lib/store";
import { fmtDateBR } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/pesquisas")({
  component: PesquisasPage,
});

const CATEGORIES = [
  "Pesquisa de máquinas",
  "Pesquisa de preços",
  "Pesquisa de concorrentes",
  "Pesquisa sanitária",
  "Fornecedores",
  "Embalagens",
  "Mercado",
  "Estratégia",
  "Financeiro",
  "Outros",
];

function PesquisasPage() {
  const { rows } = useCollection("documents");
  const byCategory = CATEGORIES.map((c) => ({ c, n: rows.filter((r) => r.category === c).length })).filter((x) => x.n > 0);

  return (
    <div>
      <Note kind="neutral">Biblioteca de pesquisas e documentos de apoio — mesma coleção usada em Documentação.</Note>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Documentos" value={rows.length} sub="total cadastrado" />
        {byCategory.slice(0, 3).map((b) => (
          <Kpi key={b.c} label={b.c} value={b.n} sub="registro(s)" />
        ))}
      </div>

      <div className="mt-6">
        <CrudSection
          collection="documents"
          title="Adicionar pesquisa/entrevista"
          subtitle="Registre pesquisas, entrevistas e documentos de apoio ao estudo."
          listTitle="Biblioteca de pesquisas"
          emptyText="Nenhuma pesquisa cadastrada ainda."
          addLabel="Salvar documento"
          fields={[
            { key: "title", label: "Título", required: true, span: 2 },
            { key: "category", label: "Categoria", type: "select", options: CATEGORIES },
            { key: "source", label: "Fonte" },
            { key: "date", label: "Data", type: "date" },
            { key: "link", label: "Link", type: "url", span: 2 },
            { key: "notes", label: "Resumo/observações", type: "textarea", span: 4 },
          ]}
          columns={[
            { key: "title", label: "Título" },
            { key: "category", label: "Categoria" },
            { key: "source", label: "Fonte" },
            { key: "date", label: "Data", render: (r) => fmtDateBR(r.date) },
            {
              key: "link",
              label: "Link",
              render: (r) =>
                r.link ? (
                  <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Abrir
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
