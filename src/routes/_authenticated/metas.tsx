import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, SectionTitle, Kpi, Chip } from "@/components/ui-kit";
import { CrudSection } from "@/components/CrudSection";
import { useCollection } from "@/lib/store";
import { fmtDateBR, numFmt } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/metas")({
  component: MetasPage,
});

function progressOf(status: string) {
  if (status === "Concluída") return 100;
  if (status === "Em andamento") return 55;
  if (status === "Atrasada") return 35;
  return 0;
}

function GoalsProgress() {
  const { rows } = useCollection("goals");

  const total = rows.length;
  const done = rows.filter((g) => g.status === "Concluída").length;
  const late = rows.filter((g) => g.status === "Atrasada").length;
  const avgProgress = total ? rows.reduce((a, g) => a + progressOf(g.status), 0) / total : 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Metas cadastradas" value={numFmt(total)} />
        <Kpi label="Concluídas" value={numFmt(done)} tone="good" sub={total ? `${numFmt((done / total) * 100, 0)}% do total` : undefined} />
        <Kpi label="Atrasadas" value={numFmt(late)} tone={late > 0 ? "critical" : "good"} />
        <Kpi label="Progresso médio" value={`${numFmt(avgProgress, 0)}%`} tone={avgProgress >= 70 ? "good" : avgProgress >= 40 ? "warn" : "critical"} />
      </div>

      <SectionTitle hint={`${rows.length} meta(s)`}>Progresso por meta</SectionTitle>
      {rows.length === 0 ? (
        <Panel>
          <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada ainda.</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rows.map((g) => {
            const p = progressOf(g.status);
            const barColor = p >= 100 ? "bg-success" : p >= 50 ? "bg-info" : g.status === "Atrasada" ? "bg-destructive" : "bg-warning";
            return (
              <Panel key={g.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{g.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {g.metric || "—"} · Alvo: {numFmt(g.target, 2)} · Prazo: {fmtDateBR(g.deadline)} · {g.owner || "Sem responsável"}
                    </div>
                  </div>
                  <Chip value={g.status} />
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${p}%` }} />
                </div>
                <div className="mt-1 text-right text-xs text-muted-foreground">{p}%</div>
              </Panel>
            );
          })}
        </div>
      )}
    </>
  );
}

function MetasPage() {
  return (
    <div>
      <PageHeader title="Metas" description="Metas do negócio, responsáveis, prazos e acompanhamento de progresso." />

      <CrudSection
        collection="goals"
        title="Nova meta"
        listTitle="Metas"
        emptyText="Nenhuma meta cadastrada ainda."
        addLabel="Salvar meta"
        fields={[
          { key: "name", label: "Meta", required: true, span: 2 },
          { key: "metric", label: "Métrica/unidade" },
          { key: "target", label: "Valor alvo", type: "number", step: "0.01" },
          { key: "deadline", label: "Prazo", type: "date" },
          { key: "owner", label: "Responsável" },
          { key: "status", label: "Status", type: "select", options: ["Não iniciada", "Em andamento", "Concluída", "Atrasada"] },
        ]}
        columns={[
          { key: "name", label: "Meta" },
          { key: "metric", label: "Métrica" },
          { key: "target", label: "Alvo", render: (r) => numFmt(r.target, 2) },
          { key: "deadline", label: "Prazo", render: (r) => fmtDateBR(r.deadline) },
          { key: "owner", label: "Responsável" },
          { key: "status", label: "Status", render: (r) => <Chip value={r.status} /> },
        ]}
      />

      <SectionTitle>Acompanhamento</SectionTitle>
      <GoalsProgress />
    </div>
  );
}
