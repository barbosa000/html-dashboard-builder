import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Kpi, Chip } from "@/components/ui-kit";
import { CrudSection } from "@/components/CrudSection";
import { useCollection } from "@/lib/store";
import { CLIENT_STAGES, SEGMENTS, fmtDateBR, numFmt } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: ClientesPage,
});

function ClientesPage() {
  const { rows: clients } = useCollection("clients");
  const { rows: sales } = useCollection("sales");

  const lastOrderByClient = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => {
      const last = sales
        .filter((s) => s.clientId === c.id && s.status !== "Cancelado")
        .map((s) => s.date)
        .sort()
        .pop();
      if (last) map[c.id] = last;
    });
    return map;
  }, [clients, sales]);

  const stageCounts = CLIENT_STAGES.map((st) => ({ st, n: clients.filter((c) => c.stage === st).length }));

  return (
    <div>
      <PageHeader title="Clientes" description="Cadastro de clientes e leads, com pipeline por estágio." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stageCounts.map(({ st, n }) => (
          <Kpi key={st} label={st} value={numFmt(n)} />
        ))}
      </div>

      <div className="mt-6">
        <CrudSection
          collection="clients"
          title="Novo cliente / lead"
          subtitle="Cadastro de clientes e leads do pipeline comercial."
          listTitle="Clientes"
          emptyText="Nenhum cliente cadastrado ainda."
          addLabel="Salvar cliente"
          fields={[
            { key: "name", label: "Nome", required: true, span: 2 },
            { key: "segment", label: "Segmento", type: "select", options: SEGMENTS.map(([, label]) => label) },
            { key: "contact", label: "Contato (telefone/WhatsApp)", placeholder: "(41) 9…" },
            { key: "neighborhood", label: "Bairro" },
            { key: "city", label: "Cidade" },
            { key: "stage", label: "Estágio", type: "select", options: CLIENT_STAGES },
            { key: "frequency", label: "Frequência de compra", placeholder: "ex.: semanal" },
            { key: "notes", label: "Observações", type: "textarea", span: 4 },
          ]}
          columns={[
            { key: "name", label: "Nome" },
            { key: "segment", label: "Segmento" },
            {
              key: "local",
              label: "Bairro/Cidade",
              render: (r) => [r.neighborhood, r.city].filter(Boolean).join(" / ") || "—",
            },
            { key: "frequency", label: "Frequência" },
            {
              key: "lastOrder",
              label: "Último pedido",
              render: (r) => (lastOrderByClient[r.id] ? fmtDateBR(lastOrderByClient[r.id]) : "—"),
            },
            { key: "stage", label: "Estágio", render: (r) => <Chip value={r.stage || "Lead"} /> },
          ]}
        />
      </div>
    </div>
  );
}
