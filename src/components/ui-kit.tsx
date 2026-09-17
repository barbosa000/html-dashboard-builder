import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------- Panel / cartão base ---------- */
export function Panel({
  children,
  className,
  title,
  subtitle,
  action,
}: {
  children?: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={cn("panel p-5", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-base font-semibold">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mt-8 mb-3 flex items-end justify-between gap-4">
      <h2 className="text-lg font-semibold">{children}</h2>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

/* ---------- KPI ---------- */
export function Kpi({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "good" | "warn" | "critical" | "info";
}) {
  const toneClass = {
    default: "text-foreground",
    good: "text-success",
    warn: "text-warning",
    critical: "text-destructive",
    info: "text-info",
  }[tone];
  return (
    <div className="panel p-4">
      <div className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className={cn("num mt-1.5 text-2xl font-semibold", toneClass)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

/* ---------- Chip de status ---------- */
const KIND_MAP: Record<string, string> = {
  Ativo: "good",
  Inativo: "critical",
  Confirmado: "good",
  Estimado: "neutral",
  "A validar": "warn",
  Concluída: "good",
  Concluído: "good",
  "Em andamento": "neutral",
  "Não iniciada": "neutral",
  "Não iniciado": "neutral",
  Atrasada: "critical",
  Aberto: "warn",
  Mitigando: "neutral",
  Encerrado: "good",
  Baixo: "good",
  Baixa: "good",
  Médio: "warn",
  Média: "warn",
  Alto: "critical",
  Alta: "critical",
  "Muito alto": "critical",
  Planejado: "neutral",
  Comprado: "good",
  Cancelado: "critical",
  Lead: "neutral",
  Contato: "neutral",
  Negociação: "warn",
  Cliente: "good",
  Recorrente: "good",
  Novo: "neutral",
  Pendente: "neutral",
  Pago: "good",
  Entregue: "good",
  Produção: "warn",
  "Saiu para entrega": "warn",
  Normal: "good",
  Crítico: "critical",
};

export function Chip({ value, kind }: { value?: ReactNode; kind?: string }) {
  const k = kind ?? KIND_MAP[String(value ?? "")] ?? "neutral";
  const cls =
    {
      good: "bg-success/15 text-success border-success/25",
      warn: "bg-warning/15 text-warning border-warning/25",
      critical: "bg-destructive/15 text-destructive border-destructive/25",
      info: "bg-info/15 text-info border-info/25",
      neutral: "bg-muted text-muted-foreground border-border",
    }[k] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", cls)}>
      {value == null || value === "" ? "—" : value}
    </span>
  );
}

/* ---------- Nota / alerta ---------- */
export function Note({ kind = "neutral", children }: { kind?: string; children: ReactNode }) {
  const cls =
    {
      good: "border-success/30 bg-success/10 text-success",
      warn: "border-warning/30 bg-warning/10 text-warning",
      critical: "border-destructive/30 bg-destructive/10 text-destructive",
      info: "border-info/30 bg-info/10 text-info",
      neutral: "border-border bg-surface-2/60 text-muted-foreground",
    }[kind] ?? "border-border bg-surface-2/60 text-muted-foreground";
  return <div className={cn("rounded-xl border px-4 py-3 text-sm", cls)}>{children}</div>;
}

/* ---------- Tabela ---------- */
export function DataTable({
  columns,
  children,
  empty,
  isEmpty,
}: {
  columns: ReactNode[];
  children: ReactNode;
  empty?: string;
  isEmpty?: boolean;
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              {columns.map((c, i) => (
                <th key={i} className="px-4 py-3 font-medium whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr]:border-b [&>tr]:border-border/60 [&>tr:last-child]:border-0">{children}</tbody>
        </table>
      </div>
      {isEmpty && <div className="px-4 py-8 text-center text-sm text-muted-foreground">{empty ?? "Nenhum registro ainda."}</div>}
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children ?? "—"}</td>;
}
