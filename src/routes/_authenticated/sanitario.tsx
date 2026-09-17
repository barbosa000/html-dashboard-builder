import { createFileRoute } from "@tanstack/react-router";
import { Panel, PageHeader, Note, Chip } from "@/components/ui-kit";
import { useDoc } from "@/lib/store";
import { CHECK_ITEMS } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/sanitario")({ component: SanitarioPage });

type ChecklistItem = { status?: string; responsible?: string; deadline?: string; notes?: string };
type ChecklistDoc = Record<string, ChecklistItem>;

function SanitarioPage() {
  const { data: checklist, save } = useDoc<ChecklistDoc>("checklist", "main", {});

  const done = CHECK_ITEMS.filter(([k]) => checklist[k]?.status === "Concluído").length;
  const total = CHECK_ITEMS.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  function updateItem(key: string, patch: Partial<ChecklistItem>) {
    const cur = { ...(checklist[key] ?? {}), ...patch };
    save({ [key]: cur } as Partial<ChecklistDoc>);
  }

  return (
    <div>
      <PageHeader title="Sanitário" description="Regularização e checklist de conformidade sanitária." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Regularização sanitária">
          <p className="text-sm text-muted-foreground">
            Como o produto é <b className="text-foreground">gelo para consumo humano</b>, a operação deve ser tratada
            como atividade de interesse sanitário. A Anvisa trata dos requisitos sanitários de águas envasadas e gelo
            para consumo humano na RDC 717/2022.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            No Paraná, o licenciamento sanitário segue o <b className="text-foreground">grau de risco</b> da
            atividade e pode envolver Estado ou município conforme as competências pactuadas.
          </p>
          <div className="mt-3">
            <Note kind="critical">
              Confirme com a Vigilância Sanitária do município onde a produção será instalada as exigências
              específicas antes de comprar equipamentos adicionais ou iniciar vendas.
            </Note>
          </div>
        </Panel>

        <Panel title="Checklist de conformidade" subtitle={`${done} de ${total} itens concluídos`}>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          {done < total && (
            <div className="mb-3">
              <Note kind="warn">Checklist sanitário incompleto ({done}/{total}). Conclua os itens pendentes antes de avançar.</Note>
            </div>
          )}

          <div className="grid gap-3">
            {CHECK_ITEMS.map(([key, label]) => {
              const item = checklist[key] ?? {};
              const status = item.status || "Não iniciado";
              return (
                <div
                  key={key}
                  className={`rounded-xl border p-3 ${status === "Concluído" ? "border-success/40" : "border-border"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{label}</span>
                    <Chip value={status} />
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <select
                      className="h-9 rounded-md border border-input bg-surface-2 px-2 text-xs"
                      value={status}
                      onChange={(e) => updateItem(key, { status: e.target.value })}
                    >
                      {["Não iniciado", "Em andamento", "Concluído"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      className="h-9 rounded-md border border-input bg-surface-2 px-2 text-xs"
                      placeholder="Responsável"
                      value={item.responsible || ""}
                      onChange={(e) => updateItem(key, { responsible: e.target.value })}
                    />
                    <input
                      className="h-9 rounded-md border border-input bg-surface-2 px-2 text-xs"
                      placeholder="Observação / nota"
                      value={item.notes || ""}
                      onChange={(e) => updateItem(key, { notes: e.target.value })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
