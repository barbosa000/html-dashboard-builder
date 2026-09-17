import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Kpi, Chip, DataTable, Td, Note } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { useCollection } from "@/lib/store";
import { fmtDateBR, numFmt, ORDER_STATUS } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/entregas")({
  component: EntregasPage,
});

const PENDING_STATUSES = ["Novo", "Produção", "Saiu para entrega"];

function nextStatus(cur: string) {
  const idx = ORDER_STATUS.indexOf(cur);
  if (idx < 0 || idx >= ORDER_STATUS.length - 2) return cur; // não avança para Cancelado
  return ORDER_STATUS[idx + 1];
}

function EntregasPage() {
  const { rows: sales, update } = useCollection("sales");
  const { rows: clients } = useCollection("clients");

  const pending = useMemo(() => sales.filter((s) => PENDING_STATUSES.includes(s.status)), [sales]);

  const byDay = useMemo(() => {
    const map: Record<string, typeof sales> = {};
    pending.forEach((s) => {
      const key = s.date || "—";
      (map[key] ||= []).push(s);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [pending]);

  const totalSacos = pending.reduce((a, s) => a + (Number(s.q2) || 0) + (Number(s.q5) || 0), 0);

  return (
    <div>
      <PageHeader title="Entregas" description="Roteirização e acompanhamento de pedidos pendentes de entrega." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Pedidos pendentes" value={numFmt(pending.length)} />
        <Kpi label="Sacos a entregar" value={numFmt(totalSacos)} />
        <Kpi label="Saiu para entrega" value={numFmt(sales.filter((s) => s.status === "Saiu para entrega").length)} tone="warn" />
        <Kpi label="Entregues (total)" value={numFmt(sales.filter((s) => s.status === "Entregue").length)} tone="good" />
      </div>

      <div className="mt-4">
        <Note kind="info">
          Pedidos com status Novo, Produção ou Saiu para entrega, agrupados por dia. Use "Avançar status" para mover o pedido no fluxo até Entregue.
        </Note>
      </div>

      <div className="mt-6 space-y-5">
        {byDay.length === 0 && (
          <Panel>
            <p className="text-sm text-muted-foreground">
              Nenhuma entrega pendente. Pedidos novos, em produção ou a caminho aparecem aqui agrupados por dia.
            </p>
          </Panel>
        )}
        {byDay.map(([date, list]) => (
          <Panel key={date} title={`${fmtDateBR(date)}`} subtitle={`${list.length} pedido(s)`}>
            <DataTable columns={["Cliente", "Bairro/Cidade", "Sacos", "Status", ""]}>
              {list.map((s) => {
                const client = clients.find((c) => c.id === s.clientId);
                const local = client ? [client.neighborhood, client.city].filter(Boolean).join(" / ") : "—";
                return (
                  <tr key={s.id} className="hover:bg-surface-2/50">
                    <Td>{s.clientName || "—"}</Td>
                    <Td className="text-xs text-muted-foreground">{local || "—"}</Td>
                    <Td className="num">
                      {numFmt(s.q2)}×2 / {numFmt(s.q5)}×5
                    </Td>
                    <Td>
                      <Chip value={s.status} />
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={s.status === "Entregue"}
                        onClick={() => update(s.id, { status: nextStatus(s.status) })}
                      >
                        Avançar status
                      </Button>
                    </Td>
                  </tr>
                );
              })}
            </DataTable>
          </Panel>
        ))}
      </div>
    </div>
  );
}
