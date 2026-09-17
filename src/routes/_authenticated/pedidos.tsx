import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  PageHeader,
  Panel,
  Kpi,
  Chip,
  DataTable,
  Td,
  SectionTitle,
  ConfirmDeleteButton,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCollection, useDoc } from "@/lib/store";
import { toast } from "sonner";
import {
  DEFAULT_SETTINGS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  brl,
  currentMonthKey,
  fmtDateBR,
  monthSales,
  numFmt,
  todayStr,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/pedidos")({
  component: PedidosPage,
});

function emptyForm(settings: typeof DEFAULT_SETTINGS) {
  return {
    date: todayStr(),
    clientId: "",
    q2: "0",
    q5: "0",
    p2: String(settings.price2),
    p5: String(settings.price5),
    desconto: "0",
    status: ORDER_STATUS[0],
    payment: PAYMENT_STATUS[0],
  };
}

function PedidosPage() {
  const { rows: sales, isLoading, add, remove } = useCollection("sales");
  const { rows: clients } = useCollection("clients");
  const { data: settings } = useDoc("settings", "main", DEFAULT_SETTINGS);
  const [form, setForm] = useState(() => emptyForm(settings));

  const mk = currentMonthKey();
  const mSales = useMemo(() => monthSales(sales, mk), [sales, mk]);
  const revenue = mSales.reduce((a, s) => a + (Number(s.total) || 0), 0);
  const avgTicket = mSales.length ? revenue / mSales.length : 0;
  const byStatus = ORDER_STATUS.map((st) => ({
    st,
    n: sales.filter((s) => s.status === st).length,
  }));

  const activeClients = useMemo(
    () =>
      [...clients]
        .filter((c) => c.status !== "Inativo")
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [clients],
  );

  const total = Math.max(
    0,
    (parseFloat(form.q2) || 0) * (parseFloat(form.p2) || 0) +
      (parseFloat(form.q5) || 0) * (parseFloat(form.p5) || 0) -
      (parseFloat(form.desconto) || 0),
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId) return;
    const client = clients.find((c) => c.id === form.clientId);
    const q2 = Math.max(0, parseInt(form.q2) || 0);
    const q5 = Math.max(0, parseInt(form.q5) || 0);
    const p2 = Math.max(0, parseFloat(form.p2) || 0);
    const p5 = Math.max(0, parseFloat(form.p5) || 0);
    const desconto = Math.max(0, parseFloat(form.desconto) || 0);
    const orderTotal = Math.max(0, q2 * p2 + q5 * p5 - desconto);
    await add({
      date: form.date || todayStr(),
      clientId: form.clientId,
      clientName: client ? client.name : "—",
      q2,
      q5,
      p2,
      p5,
      desconto,
      total: orderTotal,
      status: form.status,
      payment: form.payment,
    });
    toast.success("Pedido registrado.");
    setForm(emptyForm(settings));
  }

  const sorted = useMemo(
    () => [...sales].sort((a, b) => String(b.date).localeCompare(String(a.date))),
    [sales],
  );

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Registro de vendas, faturamento do mês e acompanhamento por status."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Faturamento do mês" value={brl(revenue)} />
        <Kpi label="Pedidos no mês" value={numFmt(mSales.length)} />
        <Kpi label="Ticket médio" value={brl(avgTicket)} />
        <Kpi
          label="Pedidos pagos"
          value={numFmt(mSales.filter((s) => s.payment === "Pago").length)}
          sub={`de ${mSales.length}`}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {byStatus.map(({ st, n }) => (
          <div key={st} className="panel p-3 text-center">
            <div className="text-[11px] text-muted-foreground uppercase">{st}</div>
            <div className="num mt-1 text-lg font-semibold">{numFmt(n)}</div>
          </div>
        ))}
      </div>

      <Panel className="mt-6" title="Registrar pedido">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Data</Label>
            <Input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Cliente</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-surface-2 px-3 text-sm"
              required
              value={form.clientId}
              onChange={(e) => setForm((s) => ({ ...s, clientId: e.target.value }))}
            >
              <option value="">Selecione…</option>
              {activeClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sacos 2 kg</Label>
            <Input
              type="number"
              min={0}
              step="1"
              value={form.q2}
              onChange={(e) => setForm((s) => ({ ...s, q2: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sacos 5 kg</Label>
            <Input
              type="number"
              min={0}
              step="1"
              value={form.q5}
              onChange={(e) => setForm((s) => ({ ...s, q5: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Preço 2 kg (R$)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.p2}
              onChange={(e) => setForm((s) => ({ ...s, p2: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Preço 5 kg (R$)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.p5}
              onChange={(e) => setForm((s) => ({ ...s, p5: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Desconto (R$)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.desconto}
              onChange={(e) => setForm((s) => ({ ...s, desconto: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-surface-2 px-3 text-sm"
              value={form.status}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
            >
              {ORDER_STATUS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Pagamento</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-surface-2 px-3 text-sm"
              value={form.payment}
              onChange={(e) => setForm((s) => ({ ...s, payment: e.target.value }))}
            >
              {PAYMENT_STATUS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit">Registrar pedido</Button>
          </div>
          <div className="col-span-2 flex items-end text-sm text-muted-foreground lg:col-span-4">
            Total do pedido:{" "}
            <span className="num ml-1 font-semibold text-foreground">{brl(total)}</span>
          </div>
        </form>
      </Panel>

      <SectionTitle hint={`${sorted.length} registro(s)`}>Pedidos</SectionTitle>
      <DataTable
        columns={["Data", "Cliente", "2 kg", "5 kg", "Total", "Status", "Pagamento", ""]}
        isEmpty={sorted.length === 0}
        empty="Nenhum pedido registrado ainda."
        isLoading={isLoading}
      >
        {sorted.map((s) => (
          <tr key={s.id} className="hover:bg-surface-2/50">
            <Td>{fmtDateBR(s.date)}</Td>
            <Td>{s.clientName || "—"}</Td>
            <Td className="num">{numFmt(s.q2)}</Td>
            <Td className="num">{numFmt(s.q5)}</Td>
            <Td className="num">{brl(s.total)}</Td>
            <Td>
              <Chip value={s.status} />
            </Td>
            <Td>
              <Chip value={s.payment} />
            </Td>
            <Td className="text-right">
              <ConfirmDeleteButton
                onConfirm={async () => {
                  await remove(s.id);
                  toast.success("Pedido excluído.");
                }}
              />
            </Td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
