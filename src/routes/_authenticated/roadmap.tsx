import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Note, Chip } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/roadmap")({
  component: RoadmapPage,
});

const STEPS = [
  { num: "01", title: "Validação", desc: "Pesquisar concorrência, preços e clientes potenciais.", status: "Concluída" },
  { num: "02", title: "Regularização", desc: "Definir local, contador e requisitos sanitários.", status: "Em andamento" },
  { num: "03", title: "MVP", desc: "Comprar 1 máquina e estrutura mínima.", status: "Não iniciada" },
  { num: "04", title: "Venda", desc: "Construir carteira recorrente e rotas.", status: "Não iniciada" },
  { num: "05", title: "Escala", desc: "Comprar 2ª máquina somente com demanda comprovada.", status: "Não iniciada" },
];

function RoadmapPage() {
  return (
    <div>
      <PageHeader title="Roadmap" description="Fases de implantação do negócio, da validação até a escala." />

      <Panel title="Roadmap de implantação">
        <div className="relative mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <div key={s.num} className="relative rounded-xl border border-border bg-surface-2/50 p-4">
              <div className="flex items-center justify-between">
                <span className="num text-2xl font-bold text-primary">{s.num}</span>
                <Chip value={s.status} />
              </div>
              <div className="mt-2 font-semibold">{s.title}</div>
              <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <div className={cn("absolute top-1/2 -right-2 hidden h-px w-4 bg-border lg:block")} />
              )}
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-4">
        <Note kind="info">
          O gatilho detalhado para a 2ª máquina está no Plano de Expansão e no Dashboard; o registro formal de cada
          decisão de avançar de fase deve ficar documentado (ex.: em Premissas ou nas suas anotações internas).
        </Note>
      </div>
    </div>
  );
}
