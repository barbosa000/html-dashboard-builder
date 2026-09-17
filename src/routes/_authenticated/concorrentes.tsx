import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PageHeader, Panel, SectionTitle, Note } from "@/components/ui-kit";
import { CrudSection } from "@/components/CrudSection";
import { useCollection, useDoc } from "@/lib/store";
import { DEFAULT_SETTINGS, brl, fmtDateBR } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/concorrentes")({
  component: ConcorrentesPage,
});

function CompetitivoChart() {
  const { rows } = useCollection("competitors");
  const { data: settings } = useDoc("settings", "main", DEFAULT_SETTINGS);

  const chartData = useMemo(
    () =>
      rows.map((c) => ({
        name: c.name || "—",
        nosso2: settings.price2,
        conc2: Number(c.price2) || 0,
        nosso5: settings.price5,
        conc5: Number(c.price5) || 0,
      })),
    [rows, settings],
  );

  return (
    <Panel title="Mapa competitivo" subtitle="Nosso preço (Configurações) comparado aos concorrentes cadastrados.">
      {chartData.length === 0 ? (
        <Note kind="neutral">Nenhum concorrente cadastrado ainda — nada é presumido.</Note>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `R$ ${v}`} />
              <Tooltip contentStyle={{ background: "var(--surface-solid, #101828)", border: "1px solid var(--border)" }} formatter={(v: any) => brl(v)} />
              <Legend />
              <Bar dataKey="nosso2" name="Nosso preço 2 kg" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="conc2" name="Concorrente 2 kg" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="nosso5" name="Nosso preço 5 kg" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="conc5" name="Concorrente 5 kg" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

function ConcorrentesPage() {
  return (
    <div>
      <PageHeader title="Concorrentes" description="Pesquisa de campo sobre concorrentes da RMC e comparativo de preços." />

      <CrudSection
        collection="competitors"
        title="Cadastrar concorrente"
        listTitle="Concorrentes"
        emptyText="Nenhum concorrente cadastrado ainda. Preencha com a pesquisa real de campo."
        addLabel="Salvar concorrente"
        fields={[
          { key: "name", label: "Nome", required: true },
          { key: "city", label: "Cidade" },
          { key: "region", label: "Região" },
          { key: "product", label: "Produto" },
          { key: "price2", label: "Preço 2 kg", type: "number", step: "0.01" },
          { key: "price5", label: "Preço 5 kg", type: "number", step: "0.01" },
          { key: "minOrder", label: "Pedido mínimo" },
          { key: "deliveryFee", label: "Taxa de entrega" },
          { key: "area", label: "Área atendida", span: 2 },
          { key: "leadTime", label: "Prazo de entrega" },
          { key: "whatsapp", label: "WhatsApp" },
          { key: "site", label: "Site", type: "url" },
          { key: "sourceDate", label: "Data da pesquisa", type: "date" },
          { key: "notes", label: "Observações", type: "textarea", span: 2 },
        ]}
        columns={[
          { key: "name", label: "Nome" },
          { key: "city", label: "Cidade" },
          { key: "price2", label: "2 kg", render: (r) => (r.price2 ? brl(r.price2) : "A validar") },
          { key: "price5", label: "5 kg", render: (r) => (r.price5 ? brl(r.price5) : "A validar") },
          { key: "area", label: "Área" },
          { key: "sourceDate", label: "Pesquisado em", render: (r) => fmtDateBR(r.sourceDate) },
        ]}
      />

      <SectionTitle>Mapa competitivo</SectionTitle>
      <CompetitivoChart />
    </div>
  );
}
