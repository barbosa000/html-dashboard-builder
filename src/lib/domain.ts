import type { Row } from "./store";

/* ============ formatação ============ */
export function brl(n: unknown) {
  const v = Number(n) || 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}
export function numFmt(n: unknown, d = 0) {
  return (Number(n) || 0).toLocaleString("pt-BR", { maximumFractionDigits: d });
}
export function pct(n: unknown, d = 1) {
  return `${numFmt(n, d)}%`;
}
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function monthKeyOf(dateStr?: string) {
  return (dateStr || todayStr()).slice(0, 7);
}
export function currentMonthKey() {
  return monthKeyOf(todayStr());
}
export function monthLabel(mk: string) {
  if (!mk) return "";
  const [y, m] = mk.split("-");
  const names = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${names[parseInt(m, 10) - 1]}/${y.slice(2)}`;
}
export function addMonths(mk: string, n: number) {
  const [y, m] = mk.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export function fmtDateBR(iso?: string) {
  if (!iso) return "—";
  const p = iso.split("-");
  return p.length < 3 ? iso : `${p[2]}/${p[1]}/${p[0]}`;
}

/* ============ configurações padrão ============ */
export type Settings = {
  machineCapacity: number;
  dailyTarget: number;
  daysPerMonth: number;
  mix2: number;
  price2: number;
  price5: number;
  varCost2: number;
  varCost5: number;
  packaging: number;
  otherCosts: number;
  taxRate: number;
  workingCapital: number;
};

export const DEFAULT_SETTINGS: Settings = {
  machineCapacity: 50,
  dailyTarget: 45,
  daysPerMonth: 26,
  mix2: 40,
  price2: 10,
  price5: 17,
  varCost2: 0,
  varCost5: 0,
  packaging: 380,
  otherCosts: 1100,
  taxRate: 0,
  workingCapital: 0,
};

export const COST_KEYS = [
  ["packaging", "Embalagens"],
  ["energy", "Energia"],
  ["water", "Água"],
  ["fuel", "Combustível/entrega"],
  ["maintenance", "Manutenção"],
  ["hygiene", "Higiene/limpeza"],
  ["marketing", "Marketing"],
] as const;

export const CHECK_ITEMS: [string, string][] = [
  ["c1", "Definir endereço de produção"],
  ["c2", "Confirmar CNAE/atividade com contador"],
  ["c3", "Consultar Vigilância Sanitária"],
  ["c4", "Confirmar exigências de água potável"],
  ["c5", "Definir fluxo limpo de produção"],
  ["c6", "Definir armazenamento"],
  ["c7", "Definir embalagem/rotulagem aplicável"],
  ["c8", "Verificar licenciamento"],
];

export const SEGMENTS: [string, string][] = [
  ["distribuidoras", "Distribuidoras de bebidas"],
  ["mercados", "Mercados"],
  ["conveniencias", "Conveniências/postos"],
  ["bares", "Bares/restaurantes"],
  ["eventos", "Eventos"],
  ["consumidor", "Consumidor final"],
];

export const CLIENT_STAGES = ["Lead", "Contato", "Negociação", "Cliente", "Recorrente", "Inativo"];
export const ORDER_STATUS = ["Novo", "Produção", "Saiu para entrega", "Entregue", "Cancelado"];
export const PAYMENT_STATUS = ["Pendente", "Pago"];

/* ============ cálculos ============ */
export function activeSales(sales: Row[]) {
  return sales.filter((s) => s.status !== "Cancelado");
}
export function monthProduction(production: Row[], mk: string) {
  return production.filter((p) => monthKeyOf(p.date) === mk);
}
export function monthSales(sales: Row[], mk: string) {
  return activeSales(sales).filter((s) => monthKeyOf(s.date) === mk);
}
export function inventoryIce(production: Row[], sales: Row[]) {
  const prodQ2 = production.reduce((a, p) => a + (Number(p.q2) || 0), 0);
  const prodQ5 = production.reduce((a, p) => a + (Number(p.q5) || 0), 0);
  const act = activeSales(sales);
  const soldQ2 = act.reduce((a, s) => a + (Number(s.q2) || 0), 0);
  const soldQ5 = act.reduce((a, s) => a + (Number(s.q5) || 0), 0);
  return { prodQ2, prodQ5, soldQ2, soldQ5, estQ2: prodQ2 - soldQ2, estQ5: prodQ5 - soldQ5 };
}
export function monthCostsTotal(c: Record<string, any> = {}) {
  return COST_KEYS.reduce((a, [k]) => a + (Number(c[k]) || 0), 0);
}
export function revenueOf(sales: Row[]) {
  return sales.reduce((a, s) => a + (Number(s.total) || 0), 0);
}
export function allMonthKeys(production: Row[], sales: Row[], extra: string[] = []) {
  const set = new Set<string>();
  production.forEach((p) => set.add(monthKeyOf(p.date)));
  sales.forEach((s) => set.add(monthKeyOf(s.date)));
  extra.forEach((mk) => set.add(mk));
  set.add(currentMonthKey());
  return [...set].sort();
}
export function lastNDays(n: number) {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`);
  }
  return out;
}
export function bagsFromKg(kg: number, mix2Pct: number) {
  const kg2 = (kg * (mix2Pct || 0)) / 100;
  const kg5 = kg - kg2;
  return { q2: Math.floor(kg2 / 2), q5: Math.floor(kg5 / 5) };
}

export type Alert = { kind: "critical" | "warn" | "info" | "neutral"; text: string };

export function computeAlerts(ctx: {
  settings: Settings;
  production: Row[];
  sales: Row[];
  clients: Row[];
  costs: Record<string, any>;
  checklist: Record<string, any>;
}): Alert[] {
  const { settings, production, sales, clients, costs, checklist } = ctx;
  const alerts: Alert[] = [];
  const mk = currentMonthKey();
  const target = settings.dailyTarget || 45;
  const todayProd = production.find((p) => p.date === todayStr());
  const inv = inventoryIce(production, sales);
  const doneChecks = CHECK_ITEMS.filter(([k]) => (checklist?.[k]?.status ?? "") === "Concluído").length;
  const mSales = monthSales(sales, mk);
  const revenue = revenueOf(mSales);
  const totalCost = monthCostsTotal(costs);
  const margin = revenue ? ((revenue - totalCost) / revenue) * 100 : null;
  const fuelPerOrder = costs?.fuel && mSales.length ? Number(costs.fuel) / mSales.length : null;

  if (inv.estQ2 + inv.estQ5 <= 0 && production.length > 0)
    alerts.push({ kind: "critical", text: "Estoque de gelo zerado — produção não está cobrindo as vendas." });
  else if (inv.estQ2 + inv.estQ5 > 0 && inv.estQ2 + inv.estQ5 < 20)
    alerts.push({ kind: "warn", text: "Estoque de gelo baixo (menos de 20 sacos no total)." });
  if (!todayProd) alerts.push({ kind: "info", text: "Nenhuma produção lançada para hoje ainda." });
  else if (Number(todayProd.kg) < target * 0.8)
    alerts.push({ kind: "warn", text: "Produção de hoje abaixo de 80% da meta diária." });
  if (target >= (settings.machineCapacity || 50) * 0.95)
    alerts.push({ kind: "warn", text: "Meta diária já próxima da capacidade nominal — avalie o gatilho da 2ª máquina." });
  if (doneChecks < CHECK_ITEMS.length)
    alerts.push({ kind: "critical", text: `Checklist sanitário incompleto (${doneChecks}/${CHECK_ITEMS.length}).` });
  if (margin != null && margin < 10) alerts.push({ kind: "warn", text: "Margem do mês abaixo de 10%." });
  if (fuelPerOrder != null && fuelPerOrder > 15)
    alerts.push({ kind: "warn", text: "Custo de entrega por pedido acima de R$ 15 — revisar rotas." });
  if ((settings.workingCapital || 0) > 0 && settings.workingCapital < totalCost)
    alerts.push({ kind: "critical", text: "Capital de giro disponível é menor que os custos fixos do mês." });

  const now = Date.now();
  clients
    .filter((c) => c.status === "Recorrente" || c.status === "Cliente")
    .forEach((c) => {
      const last = sales
        .filter((s) => s.clientId === c.id && s.status !== "Cancelado")
        .map((s) => s.date)
        .sort()
        .pop();
      if (last) {
        const days = Math.floor((now - new Date(last).getTime()) / 86400000);
        if (days > 21) alerts.push({ kind: "warn", text: `Cliente "${c.name}" sem comprar há ${days} dias.` });
      }
    });
  return alerts;
}
