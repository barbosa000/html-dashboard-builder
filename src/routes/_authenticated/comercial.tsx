import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { PageHeader, Panel, SectionTitle, DataTable, Td, Chip, Note, Kpi } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCollection } from "@/lib/store";
import { CLIENT_STAGES, activeSales, brl, numFmt } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/comercial")({
  component: ComercialPage,
});

const SWOT_QUADRANTS: [string, string][] = [
  ["Força", "good"],
  ["Fraqueza", "warn"],
  ["Oportunidade", "info"],
  ["Ameaça", "critical"],
];

function SwotBoard() {
  const { rows, add, remove } = useCollection("swot");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {SWOT_QUADRANTS.map(([q, kind]) => {
        const items = rows.filter((x) => x.quadrant === q);
        return (
          <Panel key={q} title={<Chip value={q} kind={kind} />}>
            <ul className="flex flex-col gap-2">
              {items.length === 0 && <li className="text-sm text-muted-foreground">Nenhum item ainda.</li>}
              {items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <span>{it.text}</span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remover"
                    onClick={() => remove(it.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="mt-3 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const text = (drafts[q] || "").trim();
                if (!text) return;
                await add({ quadrant: q, text });
                setDrafts((s) => ({ ...s, [q]: "" }));
              }}
            >
              <Input
                placeholder="Adicionar item…"
                value={drafts[q] || ""}
                onChange={(e) => setDrafts((s) => ({ ...s, [q]: e.target.value }))}
              />
              <Button type="submit" size="sm">
                +
              </Button>
            </form>
          </Panel>
        );
      })}
    </div>
  );
}

function ComercialPage() {
  const { rows: clients } = useCollection("clients");
  const { rows: sales } = useCollection("sales");

  const funil = useMemo(
    () => CLIENT_STAGES.map((st) => ({ stage: st, count: clients.filter((c) => c.status === st).length })),
    [clients],
  );

  const act = activeSales(sales);

  const bySegment = useMemo(() => {
    const map = new Map<string, number>();
    act.forEach((s) => {
      const c = clients.find((x) => x.id === s.clientId);
      const seg = c?.segment || "Não informado";
      map.set(seg, (map.get(seg) || 0) + (Number(s.total) || 0));
    });
    return [...map.entries()].map(([segment, total]) => ({ segment, total })).sort((a, b) => b.total - a.total);
  }, [act, clients]);

  const topClients = useMemo(() => {
    const map = new Map<string, number>();
    act.forEach((s) => {
      map.set(s.clientId, (map.get(s.clientId) || 0) + (Number(s.total) || 0));
    });
    return [...map.entries()]
      .map(([clientId, total]) => ({ client: clients.find((c) => c.id === clientId), total }))
      .filter((r) => r.client)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [act, clients]);

  const activeClients = clients.filter((c) => c.status === "Recorrente" || c.status === "Cliente").length;

  return (
    <div>
      <PageHeader title="Análise Comercial" description="Estratégia comercial, funil de clientes, desempenho por segmento e SWOT." />

      <Panel title="Como competir">
        <p className="text-sm">
          O diferencial inicial não precisa ser simplesmente menor preço. A tese comercial é{" "}
          <b>proximidade + disponibilidade + entrega rápida + padrão de produto</b>.
        </p>
        <div className="mt-3">
          <Note kind="info">
            Em vez de tentar atender toda Curitiba, começar por uma área delimitada da RMC reduz combustível, tempo de rota e risco de atrasos.
          </Note>
        </div>
        <h3 className="mt-4 text-sm font-semibold">Hipóteses a validar</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Clientes aceitam comprar de um fornecedor local.</li>
          <li>Reposição 1–3 vezes por semana tem valor.</li>
          <li>5 kg funciona bem para B2B.</li>
          <li>2 kg tem maior margem no varejo.</li>
        </ul>
      </Panel>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Clientes ativos" value={numFmt(activeClients)} sub={`${numFmt(clients.length)} no total`} />
        <Kpi label="Faturamento (pedidos ativos)" value={brl(act.reduce((a, s) => a + (Number(s.total) || 0), 0))} />
        <Kpi label="Segmentos com vendas" value={numFmt(bySegment.length)} />
        <Kpi label="Pedidos ativos" value={numFmt(act.length)} />
      </div>

      <SectionTitle>Funil de clientes</SectionTitle>
      <Panel>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funil}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--surface-solid, #101828)", border: "1px solid var(--border)" }} />
              <Bar dataKey="count" name="Clientes" radius={[4, 4, 0, 0]}>
                {funil.map((_, i) => (
                  <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <SectionTitle>Vendas por segmento</SectionTitle>
      <Panel>
        {bySegment.length === 0 ? (
          <Note kind="neutral">Nenhuma venda ativa registrada ainda.</Note>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySegment} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => brl(v)} />
                <YAxis type="category" dataKey="segment" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={140} />
                <Tooltip contentStyle={{ background: "var(--surface-solid, #101828)", border: "1px solid var(--border)" }} formatter={(v: any) => brl(v)} />
                <Bar dataKey="total" name="Faturamento" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <SectionTitle>Top clientes por faturamento</SectionTitle>
      <DataTable columns={["Cliente", "Segmento", "Status", "Faturamento"]} isEmpty={topClients.length === 0} empty="Nenhuma venda ativa registrada ainda.">
        {topClients.map((r) => (
          <tr key={r.client!.id}>
            <Td>{r.client!.name}</Td>
            <Td>{r.client!.segment || "—"}</Td>
            <Td>
              <Chip value={r.client!.status} />
            </Td>
            <Td className="num">{brl(r.total)}</Td>
          </tr>
        ))}
      </DataTable>

      <SectionTitle>Análise SWOT</SectionTitle>
      <SwotBoard />
    </div>
  );
}
