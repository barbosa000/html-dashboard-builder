import { describe, expect, it } from "vitest";
import type { Row } from "./store";
import {
  activeSales,
  addMonths,
  allMonthKeys,
  bagsFromKg,
  computeAlerts,
  currentMonthKey,
  DEFAULT_SETTINGS,
  fmtDateBR,
  inventoryIce,
  monthCostsTotal,
  monthKeyOf,
  revenueOf,
  todayStr,
  type Settings,
} from "./domain";

function row(data: Record<string, any>): Row {
  return { id: data.id ?? Math.random().toString(36).slice(2), ...data };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("datas e formatação", () => {
  it("monthKeyOf extrai AAAA-MM de uma data ISO", () => {
    expect(monthKeyOf("2026-09-17")).toBe("2026-09");
  });

  it("monthKeyOf sem argumento usa a data de hoje", () => {
    expect(monthKeyOf()).toBe(currentMonthKey());
  });

  it("fmtDateBR converte AAAA-MM-DD para DD/MM/AAAA", () => {
    expect(fmtDateBR("2026-09-17")).toBe("17/09/2026");
  });

  it("fmtDateBR trata datas ausentes ou sem o formato esperado sem lançar erro", () => {
    expect(fmtDateBR(undefined)).toBe("—");
    expect(fmtDateBR("")).toBe("—");
    // Sem pelo menos 3 segmentos separados por "-", devolve a string como veio.
    expect(fmtDateBR("invalido")).toBe("invalido");
  });

  it("addMonths avança o mês normalmente", () => {
    expect(addMonths("2026-03", 1)).toBe("2026-04");
  });

  it("addMonths vira o ano ao passar de dezembro", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
  });

  it("addMonths aceita deslocamento negativo", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});

describe("bagsFromKg — conversão de kg em sacos", () => {
  it("distribui pelo mix de 2kg/5kg e arredonda para baixo", () => {
    // 100kg a 40% em 2kg => 40kg em sacos de 2kg (20 sacos) e 60kg em sacos de 5kg (12 sacos)
    expect(bagsFromKg(100, 40)).toEqual({ q2: 20, q5: 12 });
  });

  it("sobras que não completam um saco são descartadas (chão, não arredondamento)", () => {
    // 41kg a 100% em 2kg => 20 sacos de 2kg e 1kg sobrando, não um 21º saco
    expect(bagsFromKg(41, 100)).toEqual({ q2: 20, q5: 0 });
  });

  it("0% em 2kg manda tudo para sacos de 5kg", () => {
    expect(bagsFromKg(50, 0)).toEqual({ q2: 0, q5: 10 });
  });

  it("kg zero não produz sacos", () => {
    expect(bagsFromKg(0, 40)).toEqual({ q2: 0, q5: 0 });
  });
});

describe("activeSales — exclui pedidos cancelados", () => {
  it("remove apenas as vendas com status Cancelado", () => {
    const sales = [
      row({ status: "Entregue", total: 100 }),
      row({ status: "Cancelado", total: 200 }),
      row({ status: "Novo", total: 50 }),
    ];
    expect(activeSales(sales)).toHaveLength(2);
    expect(activeSales(sales).some((s) => s.status === "Cancelado")).toBe(false);
  });
});

describe("inventoryIce — estoque de gelo produzido menos vendido", () => {
  it("calcula o saldo por formato a partir de produção e vendas ativas", () => {
    const production = [
      row({ date: "2026-09-01", q2: 30, q5: 10 }),
      row({ date: "2026-09-02", q2: 20, q5: 5 }),
    ];
    const sales = [row({ status: "Entregue", q2: 10, q5: 3 })];
    const inv = inventoryIce(production, sales);
    expect(inv).toEqual({ prodQ2: 50, prodQ5: 15, soldQ2: 10, soldQ5: 3, estQ2: 40, estQ5: 12 });
  });

  it("pedidos cancelados não saem do estoque", () => {
    const production = [row({ q2: 20, q5: 10 })];
    const salesWithCancelled = [row({ status: "Cancelado", q2: 20, q5: 10 })];
    const inv = inventoryIce(production, salesWithCancelled);
    expect(inv.estQ2).toBe(20);
    expect(inv.estQ5).toBe(10);
  });

  it("estoque pode ficar negativo quando venda supera a produção lançada (alerta de dado a corrigir, não trava a conta)", () => {
    const production = [row({ q2: 5, q5: 0 })];
    const sales = [row({ status: "Novo", q2: 8, q5: 0 })];
    expect(inventoryIce(production, sales).estQ2).toBe(-3);
  });
});

describe("monthCostsTotal e revenueOf", () => {
  it("soma só as categorias de custo conhecidas (COST_KEYS)", () => {
    const total = monthCostsTotal({
      packaging: 100,
      energy: 50,
      water: 10,
      fuel: 200,
      maintenance: 30,
      hygiene: 20,
      marketing: 40,
      // campo desconhecido não deve entrar na soma
      aluguel: 999,
    });
    expect(total).toBe(450);
  });

  it("trata custos ausentes ou não numéricos como zero", () => {
    expect(monthCostsTotal({})).toBe(0);
    expect(monthCostsTotal({ packaging: "abc" as any })).toBe(0);
  });

  it("revenueOf soma o total dos pedidos informados", () => {
    const sales = [row({ total: 120.5 }), row({ total: 79.5 }), row({ total: "não é número" })];
    expect(revenueOf(sales)).toBe(200);
  });
});

describe("allMonthKeys", () => {
  it("reúne, sem repetir, os meses de produção e vendas, e sempre inclui o mês atual", () => {
    const production = [row({ date: "2026-01-15" })];
    const sales = [row({ date: "2026-01-20" }), row({ date: "2026-03-05" })];
    const months = allMonthKeys(production, sales);
    expect(months).toContain("2026-01");
    expect(months).toContain("2026-03");
    expect(months).toContain(currentMonthKey());
    expect(new Set(months).size).toBe(months.length);
    expect(months).toEqual([...months].sort());
  });
});

describe("computeAlerts", () => {
  const baseSettings: Settings = { ...DEFAULT_SETTINGS };
  const fullChecklist = Object.fromEntries(
    ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"].map((k) => [k, { status: "Concluído" }]),
  );

  it("estado vazio não acusa estoque zerado (não há produção lançada ainda)", () => {
    const alerts = computeAlerts({
      settings: baseSettings,
      production: [],
      sales: [],
      clients: [],
      costs: {},
      checklist: {},
    });
    expect(alerts.some((a) => a.text.includes("Estoque de gelo zerado"))).toBe(false);
    expect(alerts.some((a) => a.text.includes("Nenhuma produção lançada"))).toBe(true);
    expect(alerts.some((a) => a.text.includes("Checklist sanitário incompleto"))).toBe(true);
  });

  it("acusa estoque zerado quando já houve produção mas as vendas consumiram tudo", () => {
    const production = [row({ date: todayStr(), kg: 45, q2: 10, q5: 4 })];
    const sales = [row({ status: "Entregue", q2: 10, q5: 4 })];
    const alerts = computeAlerts({
      settings: baseSettings,
      production,
      sales,
      clients: [],
      costs: {},
      checklist: fullChecklist,
    });
    expect(alerts.some((a) => a.text.includes("Estoque de gelo zerado"))).toBe(true);
  });

  it("acusa produção do dia abaixo de 80% da meta", () => {
    const production = [row({ date: todayStr(), kg: 10, q2: 5, q5: 0 })]; // meta padrão é 45kg/dia
    const alerts = computeAlerts({
      settings: baseSettings,
      production,
      sales: [],
      clients: [],
      costs: {},
      checklist: fullChecklist,
    });
    expect(alerts.some((a) => a.text.includes("abaixo de 80% da meta diária"))).toBe(true);
  });

  it("checklist completo não gera alerta de checklist incompleto", () => {
    const alerts = computeAlerts({
      settings: baseSettings,
      production: [row({ date: todayStr(), kg: 50, q2: 10, q5: 6 })],
      sales: [],
      clients: [],
      costs: {},
      checklist: fullChecklist,
    });
    expect(alerts.some((a) => a.text.includes("Checklist sanitário incompleto"))).toBe(false);
  });

  it("acusa margem do mês abaixo de 10%", () => {
    const mk = currentMonthKey();
    const sales = [row({ date: `${mk}-05`, status: "Entregue", total: 1000 })];
    const costs = { packaging: 950 }; // margem = 5%
    const alerts = computeAlerts({
      settings: baseSettings,
      production: [row({ date: todayStr(), kg: 50, q2: 10, q5: 6 })],
      sales,
      clients: [],
      costs,
      checklist: fullChecklist,
    });
    expect(alerts.some((a) => a.text.includes("Margem do mês abaixo de 10%"))).toBe(true);
  });

  it("acusa cliente recorrente sem comprar há mais de 21 dias", () => {
    const client = row({ id: "cli-1", name: "Mercado Central", status: "Recorrente" });
    const sales = [row({ clientId: "cli-1", status: "Entregue", date: daysAgo(30) })];
    const alerts = computeAlerts({
      settings: baseSettings,
      production: [row({ date: todayStr(), kg: 50, q2: 10, q5: 6 })],
      sales,
      clients: [client],
      costs: {},
      checklist: fullChecklist,
    });
    expect(alerts.some((a) => a.text.includes('Mercado Central" sem comprar'))).toBe(true);
  });

  it("não acusa inatividade de cliente recorrente que comprou recentemente", () => {
    const client = row({ id: "cli-2", name: "Bar do Zé", status: "Recorrente" });
    const sales = [row({ clientId: "cli-2", status: "Entregue", date: daysAgo(2) })];
    const alerts = computeAlerts({
      settings: baseSettings,
      production: [row({ date: todayStr(), kg: 50, q2: 10, q5: 6 })],
      sales,
      clients: [client],
      costs: {},
      checklist: fullChecklist,
    });
    expect(alerts.some((a) => a.text.includes("Bar do Zé"))).toBe(false);
  });
});
