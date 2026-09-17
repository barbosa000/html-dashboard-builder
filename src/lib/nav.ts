export type NavItem = { slug: string; label: string };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { slug: "dashboard", label: "Dashboard" },
      { slug: "visao-geral", label: "Visão Geral" },
    ],
  },
  {
    label: "Operação",
    items: [
      { slug: "producao", label: "Produção" },
      { slug: "estoque", label: "Estoque" },
      { slug: "pedidos", label: "Pedidos" },
      { slug: "entregas", label: "Entregas" },
      { slug: "clientes", label: "Clientes" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { slug: "faturamento", label: "Faturamento" },
      { slug: "custos", label: "Custos" },
      { slug: "fluxo-caixa", label: "Fluxo de Caixa" },
      { slug: "margens", label: "Margens" },
      { slug: "simulador", label: "Simulador" },
    ],
  },
  {
    label: "Estratégia",
    items: [
      { slug: "mercado", label: "Estudos de Mercado" },
      { slug: "concorrentes", label: "Concorrentes" },
      { slug: "comercial", label: "Análise Comercial" },
      { slug: "metas", label: "Metas" },
      { slug: "indicadores", label: "Indicadores" },
    ],
  },
  {
    label: "Empresa",
    items: [
      { slug: "socios", label: "Sócios" },
      { slug: "investimentos", label: "Investimentos" },
      { slug: "equipamentos", label: "Equipamentos" },
      { slug: "documentacao", label: "Documentação" },
      { slug: "sanitario", label: "Sanitário" },
    ],
  },
  {
    label: "Planejamento",
    items: [
      { slug: "roadmap", label: "Roadmap" },
      { slug: "expansao", label: "Plano de Expansão" },
      { slug: "cenarios", label: "Cenários" },
      { slug: "riscos", label: "Riscos" },
    ],
  },
  {
    label: "Informações",
    items: [
      { slug: "pesquisas", label: "Pesquisas" },
      { slug: "fontes", label: "Fontes" },
      { slug: "premissas", label: "Premissas" },
      { slug: "configuracoes", label: "Configurações" },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV.flatMap((g) => g.items);
export const LABEL_BY_SLUG = Object.fromEntries(ALL_NAV_ITEMS.map((i) => [i.slug, i.label]));
