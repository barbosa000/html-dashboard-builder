import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Panel, PageHeader, SectionTitle, Note } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDoc } from "@/lib/store";
import { DEFAULT_SETTINGS, type Settings, brl, numFmt } from "@/lib/domain";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: Configuracoes,
});

const FIELDS: { key: keyof Settings; label: string; suffix?: string; step?: string }[] = [
  { key: "machineCapacity", label: "Capacidade da máquina", suffix: "kg/dia" },
  { key: "dailyTarget", label: "Meta diária", suffix: "kg/dia" },
  { key: "daysPerMonth", label: "Dias de produção por mês", suffix: "dias" },
  { key: "mix2", label: "Mix de sacos 2 kg", suffix: "%" },
  { key: "price2", label: "Preço do saco 2 kg", suffix: "R$", step: "0.01" },
  { key: "price5", label: "Preço do saco 5 kg", suffix: "R$", step: "0.01" },
  { key: "varCost2", label: "Custo variável 2 kg", suffix: "R$", step: "0.01" },
  { key: "varCost5", label: "Custo variável 5 kg", suffix: "R$", step: "0.01" },
  { key: "packaging", label: "Embalagens (mês)", suffix: "R$", step: "0.01" },
  { key: "otherCosts", label: "Outros custos fixos (mês)", suffix: "R$", step: "0.01" },
  { key: "taxRate", label: "Impostos sobre a venda", suffix: "%", step: "0.01" },
  { key: "workingCapital", label: "Capital de giro disponível", suffix: "R$", step: "0.01" },
];

function Configuracoes() {
  const { data, save, isLoading } = useDoc<Settings>("settings", "main", DEFAULT_SETTINGS);
  const [form, setForm] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!isLoading) setForm(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await save(form);
    toast.success("Parâmetros salvos.");
  }

  const monthlyKg = (form.dailyTarget || 0) * (form.daysPerMonth || 0);

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Parâmetros usados nos cálculos de produção, preços, custos e simulações."
      />

      <Panel title="Parâmetros do negócio">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <div key={String(f.key)} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {f.label} {f.suffix && <span className="opacity-60">({f.suffix})</span>}
              </Label>
              <Input
                type="number"
                step={f.step ?? "1"}
                value={String(form[f.key] ?? 0)}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          ))}
          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <Button type="submit">Salvar parâmetros</Button>
          </div>
        </form>
      </Panel>

      <SectionTitle>Resumo dos parâmetros</SectionTitle>
      <div className="space-y-2">
        <Note kind="info">
          Meta mensal estimada: <strong className="num">{numFmt(monthlyKg)} kg</strong> — com mix de {numFmt(form.mix2)}% em
          sacos de 2 kg e preços de {brl(form.price2)} (2 kg) e {brl(form.price5)} (5 kg).
        </Note>
        {form.dailyTarget >= form.machineCapacity * 0.95 && (
          <Note kind="warn">A meta diária já está muito próxima da capacidade da máquina — avalie a segunda máquina.</Note>
        )}
      </div>
    </div>
  );
}
