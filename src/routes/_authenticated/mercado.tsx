import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader, Panel, SectionTitle, DataTable, Td, Chip } from "@/components/ui-kit";
import { CrudSection } from "@/components/CrudSection";
import { useDoc } from "@/lib/store";
import { SEGMENTS, fmtDateBR } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/mercado")({
  component: MercadoPage,
});

type SegData = Record<string, { volume?: string; recorrencia?: string; ticket?: string; prioridade?: string; dificuldade?: string; obs?: string }>;

const VOL_OPTS = ["A validar", "1", "2", "3"];
const PRIO_OPTS = ["A validar", "Baixa", "Média", "Alta"];
const PRIORITY_WEIGHT: Record<string, number> = { "A validar": 60, Baixa: 80, Média: 130, Alta: 190 };

function SegmentsCard() {
  const { data, save } = useDoc<{ segments: SegData }>("marketSegments", "main", { segments: {} });
  const segData = data.segments || {};

  function setField(slug: string, field: string, value: string) {
    const next = { ...segData, [slug]: { ...(segData[slug] || {}), [field]: value } };
    save({ segments: next });
  }

  const points = useMemo(
    () =>
      SEGMENTS.map(([slug, label]) => {
        const s = segData[slug] || {};
        const vol = parseInt(s.volume || "") || 0;
        const rec = parseInt(s.recorrencia || "") || 0;
        return { label, x: vol, y: rec, z: PRIORITY_WEIGHT[s.prioridade || "A validar"] || 60 };
      }).filter((p) => p.x > 0 && p.y > 0),
    [segData],
  );

  return (
    <>
      <Panel title="Segmentos de cliente" subtitle='Campos editáveis — preencha com a pesquisa real. Sem dado, aparece "A validar".'>
        <DataTable columns={["Segmento", "Volume (1-3)", "Recorrência (1-3)", "Ticket estimado", "Prioridade", "Dificuldade", "Observações"]}>
          {SEGMENTS.map(([slug, label]) => {
            const s = segData[slug] || {};
            return (
              <tr key={slug}>
                <Td>{label}</Td>
                <Td>
                  <select
                    className="h-9 rounded-md border border-input bg-surface-2 px-2 text-sm"
                    value={s.volume || "A validar"}
                    onChange={(e) => setField(slug, "volume", e.target.value)}
                  >
                    {VOL_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <select
                    className="h-9 rounded-md border border-input bg-surface-2 px-2 text-sm"
                    value={s.recorrencia || "A validar"}
                    onChange={(e) => setField(slug, "recorrencia", e.target.value)}
                  >
                    {VOL_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <input
                    className="h-9 w-full rounded-md border border-input bg-surface-2 px-2 text-sm"
                    placeholder="A validar"
                    value={s.ticket || ""}
                    onChange={(e) => setField(slug, "ticket", e.target.value)}
                  />
                </Td>
                <Td>
                  <select
                    className="h-9 rounded-md border border-input bg-surface-2 px-2 text-sm"
                    value={s.prioridade || "A validar"}
                    onChange={(e) => setField(slug, "prioridade", e.target.value)}
                  >
                    {PRIO_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <select
                    className="h-9 rounded-md border border-input bg-surface-2 px-2 text-sm"
                    value={s.dificuldade || "A validar"}
                    onChange={(e) => setField(slug, "dificuldade", e.target.value)}
                  >
                    {PRIO_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <input
                    className="h-9 w-full rounded-md border border-input bg-surface-2 px-2 text-sm"
                    value={s.obs || ""}
                    onChange={(e) => setField(slug, "obs", e.target.value)}
                  />
                </Td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>

      <Panel className="mt-4" title="Matriz Volume × Recorrência" subtitle="Tamanho da bolha = prioridade">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" dataKey="x" name="Volume" domain={[0, 4]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis type="number" dataKey="y" name="Recorrência" domain={[0, 4]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <ZAxis type="number" dataKey="z" range={[60, 300]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ background: "var(--surface-solid, #101828)", border: "1px solid var(--border)" }}
                formatter={(value, name, props: any) => (name === "z" ? [props.payload.label, "Segmento"] : [value, name])}
              />
              <Scatter data={points} fill="var(--chart-1)" />
            </ScatterChart>
          </ResponsiveContainer>
          {points.length === 0 && (
            <p className="mt-2 text-center text-xs text-muted-foreground">Preencha volume e recorrência dos segmentos para ver a matriz.</p>
          )}
        </div>
      </Panel>
    </>
  );
}

function MercadoPage() {
  return (
    <div>
      <PageHeader title="Estudos de Mercado" description="Segmentos de cliente, matriz de priorização e anotações de campo na RMC." />

      <SegmentsCard />

      <SectionTitle>Mercado local — anotações de campo</SectionTitle>
      <CrudSection
        collection="marketNotes"
        title="Nova anotação de mercado local"
        listTitle="Anotações"
        emptyText="Nenhuma anotação ainda. Registre concorrentes, clientes potenciais, preços e oportunidades observados em campo."
        addLabel="Salvar anotação"
        fields={[
          { key: "area", label: "Área", type: "select", options: ["Campo Magro", "Curitiba", "Região Metropolitana"] },
          { key: "type", label: "Tipo", type: "select", options: ["Concorrente", "Cliente potencial", "Preço", "Demanda observada", "Oportunidade", "Risco"] },
          { key: "text", label: "Descrição", required: true, span: 2, type: "textarea" },
          { key: "date", label: "Data da observação", type: "date" },
        ]}
        columns={[
          { key: "area", label: "Área" },
          { key: "type", label: "Tipo", render: (r) => <Chip value={r.type} kind={r.type === "Risco" ? "critical" : "neutral"} /> },
          { key: "text", label: "Descrição" },
          { key: "date", label: "Data", render: (r) => fmtDateBR(r.date) },
        ]}
      />
    </div>
  );
}
