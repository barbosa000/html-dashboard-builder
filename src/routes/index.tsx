import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "OS PIA do Gelo — Painel de gestão" },
      { name: "description", content: "Painel de gestão da fábrica de gelo: produção, estoque, pedidos e finanças." },
      { property: "og:title", content: "OS PIA do Gelo — Painel de gestão" },
      { property: "og:description", content: "Painel de gestão da fábrica de gelo: produção, estoque, pedidos e finanças." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
