import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader, Panel, Kpi, DataTable, Td, SectionTitle } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCollection, useDoc, type Row } from "@/lib/store";
import {
  DEFAULT_SETTINGS,
  bagsFromKg,
  currentMonthKey,
  fmtDateBR,
  lastNDays,
  monthProduction,
  numFmt,
  todayStr,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/producao")({
  component: ProducaoPage,
});

function emptyForm(mix2: number) {
  return { date: todayStr(), kg: "", mix: String(mix2), perda: "0", obs: "" };
}

function ProducaoPage() {
  const { rows, add, update, remove } = useCollection("production");
  const { data: settings } = useDoc("settings", "main", DEFAULT_SETTINGS);
  const [form, setForm] = useState(() => emptyForm(settings.mix2));
  const [editingId, setEditingId] = useState<string | null>(null);

  const mk = currentMonthKey();
  const mProd = useMemo(() => monthProduction(rows, mk), [rows, mk]);
  const totalKg = mProd.reduce((a, p) => a + (Number(p.kg) || 0), 0);
  const daysLancados = mProd.length;
  const avgDay = daysLancados ? totalKg / daysLancados : 0;
  const monthGoal = (settings.dailyTarget || 0) * (settings.daysPerMonth || 26);
  const pctGoal = monthGoal ? (totalKg / monthGoal) * 100 : 0;

  const days = lastNDays(14);
  const chartData = days.map((d) => {
    const rec = rows.find((p) => p.date === d);
    return { date: `${d.slice(8, 10)}/${d.slice(5, 7)}`, kg: rec ? Number(rec.kg) || 0 : 0 };
  });

  const sorted = useMemo(() => [...rows].sort((a, b) => String(b.date).localeCompare(String(a.date))), [rows]);

  function reset() {
    setForm(emptyForm(settings.mix2));
    setEditingId(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const kg = Math.max(0, parseFloat(form.kg) || 0);
    const mix = Math.min(100, Math.max(0, parseFloat(form.mix) || 0));
    const perda = Math.max(0, parseFloat(form.perda) || 0);
    const { q2, q5 } = bagsFromKg(kg, mix);
    const data = { date: form.date || todayStr(), kg, q2, q5, perda, obs: form.obs.trim() };
    if (editingId) await update(editingId, data);
    else await add(data);
    reset();
  }

  function editRow(p: Row) {
    setEditingId(p.id);
    const mix = p.kg ? Math.round(((Number(p.q2) * 2) / Number(p.kg)) * 100) : settings.mix2;
    setForm({ date: p.date, kg: String(p.kg ?? ""), mix: String(mix), perda: String(p.perda ?? 0), obs: p.obs ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const cap = settings.machineCapacity || 50;
  const preview = bagsFromKg(Math.max(0, parseFloat(form.kg) || 0), Math.max(0, parseFloat(form.mix) || 0));

  return (
    <div>
      <PageHeader title="Produção" description="Lançamento diário de produção de gelo e acompanhamento da meta mensal." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Kg produzidos (mês)" value={numFmt(totalKg, 1)} sub={`Meta: ${numFmt(monthGoal, 0)} kg`} />
        <Kpi label="Média por dia" value={numFmt(avgDay, 1)} sub="kg/dia lançado" />
        <Kpi
          label="% da meta mensal"
          value={`${numFmt(pctGoal, 1)}%`}
          tone={pctGoal >= 90 ? "good" : pctGoal >= 60 ? "warn" : "critical"}
        />
        <Kpi label="Dias lançados" value={numFmt(daysLancados)} sub={`de ${settings.daysPerMonth || 26} dias úteis`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Registrar produção do dia" subtitle="Lançar de novo na mesma data pode ser usado para corrigir o registro (edite pela tabela).">
          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data</Label>
              <Input type="date" required value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Total produzido (kg)</Label>
              <Input type="number" min={0} step="0.1" required value={form.kg} onChange={(e) => setForm((s) => ({ ...s, kg: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">% em sacos 2 kg</Label>
              <Input type="number" min={0} max={100} step="1" value={form.mix} onChange={(e) => setForm((s) => ({ ...s, mix: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Perdas (kg)</Label>
              <Input type="number" min={0} step="0.1" value={form.perda} onChange={(e) => setForm((s) => ({ ...s, perda: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observação</Label>
              <Input value={form.obs} onChange={(e) => setForm((s) => ({ ...s, obs: e.target.value }))} />
            </div>
            <div className="col-span-2 text-xs text-muted-foreground">
              Sugestão de sacos: {numFmt(preview.q2)}× 2kg e {numFmt(preview.q5)}× 5kg
            </div>
            <div className="col-span-2 flex items-end gap-2">
              <Button type="submit">{editingId ? "Salvar alterações" : "Salvar dia"}</Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={reset}>
                  Cancelar edição
                </Button>
              )}
            </div>
          </form>
        </Panel>

        <Panel title="Produção — últimos 14 dias" subtitle="Kg produzidos por dia">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--surface-solid, #101828)", border: "1px solid var(--border)" }} />
                <Bar dataKey="kg" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Capacidade nominal da máquina: {numFmt(cap)} kg/dia.</p>
        </Panel>
      </div>

      <SectionTitle hint={`${sorted.length} registro(s)`}>Histórico de produção</SectionTitle>
      <DataTable
        columns={["Data", "kg", "Sacos 2 kg", "Sacos 5 kg", "Perdas", "Eficiência", "Obs.", ""]}
        isEmpty={sorted.length === 0}
        empty="Nenhuma produção registrada ainda. Lance o primeiro dia acima."
      >
        {sorted.map((p) => {
          const eff = cap ? ((Number(p.kg) || 0) / cap) * 100 : 0;
          return (
            <tr key={p.id} className="hover:bg-surface-2/50">
              <Td>{fmtDateBR(p.date)}</Td>
              <Td className="num">{numFmt(p.kg, 1)}</Td>
              <Td className="num">{numFmt(p.q2)}</Td>
              <Td className="num">{numFmt(p.q5)}</Td>
              <Td className="num">{numFmt(p.perda || 0, 1)}</Td>
              <Td>
                <span
                  className={
                    eff >= 90
                      ? "text-success"
                      : eff >= 60
                        ? "text-warning"
                        : "text-destructive"
                  }
                >
                  {numFmt(eff, 0)}%
                </span>
              </Td>
              <Td className="text-xs text-muted-foreground">{p.obs || "—"}</Td>
              <Td className="text-right whitespace-nowrap">
                <Button size="sm" variant="ghost" onClick={() => editRow(p)}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(p.id)}>
                  Excluir
                </Button>
              </Td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
