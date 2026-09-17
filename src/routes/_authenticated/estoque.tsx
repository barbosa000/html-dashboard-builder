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
  Note,
  ConfirmDeleteButton,
} from "@/components/ui-kit";
import { CrudSection } from "@/components/CrudSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCollection } from "@/lib/store";
import { fmtDateBR, inventoryIce, numFmt, todayStr } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/estoque")({
  component: EstoquePage,
});

function supplyStatus(s: Record<string, any>) {
  const q = Number(s.quantity) || 0;
  const min = Number(s.minLevel) || 0;
  if (q <= 0) return "Crítico";
  if (min > 0 && q < min) return "Baixo estoque";
  return "Normal";
}

function MovementsForm({ supplies }: { supplies: any[] }) {
  const { rows: supplyRows, update: updateSupply } = useCollection("supplies");
  const { rows, isLoading, add, remove } = useCollection("movements");
  const [itemId, setItemId] = useState("");
  const [tipo, setTipo] = useState("entrada");
  const [qtd, setQtd] = useState("");
  const [date, setDate] = useState(todayStr());

  const sorted = useMemo(
    () => [...rows].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 50),
    [rows],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemId) return;
    const supply = supplyRows.find((s) => s.id === itemId);
    if (!supply) return;
    const q = Math.max(0, parseFloat(qtd) || 0);
    const delta = tipo === "entrada" ? q : -q;
    await updateSupply(itemId, { ...supply, quantity: (Number(supply.quantity) || 0) + delta });
    await add({ date: date || todayStr(), itemId, itemName: supply.name, type: tipo, qty: q });
    setQtd("");
  }

  return (
    <Panel title="Movimentações de estoque">
      <form onSubmit={submit} className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Item</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-surface-2 px-3 text-sm"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
          >
            <option value="">Selecione…</option>
            {supplies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-surface-2 px-3 text-sm"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Quantidade</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={qtd}
            onChange={(e) => setQtd(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button type="submit">Registrar</Button>
        </div>
      </form>

      <div className="mt-5">
        <DataTable
          columns={["Data", "Item", "Tipo", "Qtd.", ""]}
          isEmpty={sorted.length === 0}
          empty="Nenhuma movimentação registrada."
          isLoading={isLoading}
        >
          {sorted.map((m) => (
            <tr key={m.id} className="hover:bg-surface-2/50">
              <Td>{fmtDateBR(m.date)}</Td>
              <Td>{m.itemName || "—"}</Td>
              <Td>
                <Chip
                  value={m.type === "entrada" ? "Entrada" : "Saída"}
                  kind={m.type === "entrada" ? "good" : "critical"}
                />
              </Td>
              <Td className="num">{numFmt(m.qty, 2)}</Td>
              <Td className="text-right">
                <ConfirmDeleteButton onConfirm={() => remove(m.id)} />
              </Td>
            </tr>
          ))}
        </DataTable>
      </div>
    </Panel>
  );
}

function EstoquePage() {
  const { rows: production } = useCollection("production");
  const { rows: sales } = useCollection("sales");
  const { rows: supplies } = useCollection("supplies");

  const inv = inventoryIce(production, sales);

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Estoque de gelo estimado e controle de insumos/embalagens."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Kpi
          label="Estoque sacos 2 kg"
          value={`${numFmt(inv.estQ2)} un.`}
          sub={`${numFmt(inv.estQ2 * 2)} kg equivalentes`}
          tone={inv.estQ2 < 0 ? "critical" : "default"}
        />
        <Kpi
          label="Estoque sacos 5 kg"
          value={`${numFmt(inv.estQ5)} un.`}
          sub={`${numFmt(inv.estQ5 * 5)} kg equivalentes`}
          tone={inv.estQ5 < 0 ? "critical" : "default"}
        />
      </div>

      <div className="mt-4">
        <Note kind="info">
          Estoque de gelo calculado automaticamente: total produzido (por formato) menos vendas
          registradas com status diferente de "Cancelado".
        </Note>
      </div>

      <SectionTitle>Composição do estoque de gelo</SectionTitle>
      <DataTable columns={["Formato", "Produzido (un.)", "Vendido (un.)", "Em estoque (un.)"]}>
        <tr className="hover:bg-surface-2/50">
          <Td>Saco 2 kg</Td>
          <Td className="num">{numFmt(inv.prodQ2)}</Td>
          <Td className="num">{numFmt(inv.soldQ2)}</Td>
          <Td className="num">{numFmt(inv.estQ2)}</Td>
        </tr>
        <tr className="hover:bg-surface-2/50">
          <Td>Saco 5 kg</Td>
          <Td className="num">{numFmt(inv.prodQ5)}</Td>
          <Td className="num">{numFmt(inv.soldQ5)}</Td>
          <Td className="num">{numFmt(inv.estQ5)}</Td>
        </tr>
      </DataTable>

      <SectionTitle hint="🟢 normal · 🟡 baixo · 🔴 crítico">
        Embalagens, matéria-prima e insumos
      </SectionTitle>
      <CrudSection
        collection="supplies"
        title="Cadastrar item"
        subtitle="Embalagens, matéria-prima e insumos."
        listTitle="Itens em estoque"
        emptyText="Nenhum item cadastrado ainda."
        addLabel="Salvar item"
        fields={[
          { key: "name", label: "Item", required: true, span: 2 },
          {
            key: "category",
            label: "Categoria",
            type: "select",
            options: ["Embalagens", "Matéria-prima", "Insumos"],
          },
          { key: "quantity", label: "Quantidade", type: "number", step: "0.01" },
          { key: "unit", label: "Unidade", placeholder: "un., kg, L" },
          { key: "minLevel", label: "Estoque mínimo", type: "number", step: "0.01" },
          { key: "notes", label: "Observações", type: "textarea", span: 2 },
        ]}
        columns={[
          { key: "name", label: "Item" },
          { key: "category", label: "Categoria" },
          {
            key: "quantity",
            label: "Quantidade",
            render: (r) => `${numFmt(r.quantity, 2)} ${r.unit || ""}`,
          },
          {
            key: "status",
            label: "Status",
            render: (r) => {
              const st = supplyStatus(r);
              return (
                <Chip
                  value={st}
                  kind={st === "Normal" ? "good" : st === "Baixo estoque" ? "warn" : "critical"}
                />
              );
            },
          },
        ]}
      />

      <SectionTitle>Movimentações de estoque</SectionTitle>
      <MovementsForm supplies={supplies} />
    </div>
  );
}
