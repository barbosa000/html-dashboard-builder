import { useState, type ReactNode } from "react";
import { Panel, SectionTitle, DataTable, Td } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCollection, type Row } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type CrudField = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea" | "url";
  options?: string[];
  span?: number;
  required?: boolean;
  step?: string;
  placeholder?: string;
  default?: string | number;
};

export type CrudColumn = {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
};

export function CrudSection({
  collection,
  title,
  subtitle,
  listTitle = "Registros",
  emptyText = "Nenhum registro ainda.",
  addLabel = "Salvar",
  fields,
  columns,
  beforeSave,
}: {
  collection: string;
  title: string;
  subtitle?: string;
  listTitle?: string;
  emptyText?: string;
  addLabel?: string;
  fields: CrudField[];
  columns: CrudColumn[];
  beforeSave?: (data: Record<string, any>) => Record<string, any>;
}) {
  const { rows, isLoading, add, update, remove } = useCollection(collection);
  const emptyForm = () =>
    Object.fromEntries(
      fields.map((f) => [f.key, f.default ?? (f.type === "select" ? (f.options?.[0] ?? "") : "")]),
    );
  const [form, setForm] = useState<Record<string, any>>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm(emptyForm());
    setEditingId(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let data: Record<string, any> = {};
    fields.forEach((f) => {
      const v = form[f.key];
      data[f.key] =
        f.type === "number" ? (v === "" || v == null ? 0 : parseFloat(String(v))) : (v ?? "");
    });
    if (beforeSave) data = beforeSave(data) ?? data;
    setSaving(true);
    try {
      if (editingId) await update(editingId, data);
      else await add(data);
      toast.success(editingId ? "Registro atualizado." : "Registro salvo.");
      reset();
    } catch {
      // erro já reportado pelo store (toast.error)
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    try {
      await remove(id);
      toast.success("Registro excluído.");
    } catch {
      // erro já reportado pelo store (toast.error)
    }
  }

  return (
    <div>
      <Panel title={title} subtitle={subtitle}>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map((f) => (
            <div
              key={f.key}
              className={cn(
                "space-y-1.5",
                f.span === 2 && "sm:col-span-2",
                f.span === 4 && "sm:col-span-2 lg:col-span-4",
              )}
            >
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              {f.type === "select" ? (
                <select
                  className="h-10 w-full rounded-md border border-input bg-surface-2 px-3 text-sm"
                  value={form[f.key] ?? ""}
                  required={f.required}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                >
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <Textarea
                  value={form[f.key] ?? ""}
                  required={f.required}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              ) : (
                <Input
                  type={f.type === "url" ? "url" : (f.type ?? "text")}
                  step={f.step}
                  value={form[f.key] ?? ""}
                  required={f.required}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div className="flex items-end gap-2 sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : editingId ? "Salvar alterações" : addLabel}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={reset}>
                Cancelar edição
              </Button>
            )}
          </div>
        </form>
      </Panel>

      <SectionTitle hint={`${rows.length} registro(s)`}>{listTitle}</SectionTitle>
      <DataTable
        columns={[...columns.map((c) => c.label), ""]}
        isEmpty={rows.length === 0}
        empty={emptyText}
        isLoading={isLoading}
      >
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-surface-2/50">
            {columns.map((c) => (
              <Td key={c.key}>{c.render ? c.render(r) : (r[c.key] ?? "—")}</Td>
            ))}
            <Td className="text-right whitespace-nowrap">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(r.id);
                  setForm(Object.fromEntries(fields.map((f) => [f.key, r[f.key] ?? ""])));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => setDeleteId(r.id)}
              >
                Excluir
              </Button>
            </Td>
          </tr>
        ))}
      </DataTable>

      <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
