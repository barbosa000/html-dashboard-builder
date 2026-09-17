import { createFileRoute } from "@tanstack/react-router";
import { CrudSection } from "@/components/CrudSection";
import { Panel, Note, Chip } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/fontes")({
  component: FontesPage,
});

const STATIC_SOURCES = {
  Equipamentos: [
    { title: "EOS EMG515 50 kg — Dutra Máquinas", link: "https://www.dutra.com.br/p/maquina-de-gelo-50-kg-b202510" },
    { title: "Nagano 50 kg — Agrotama", link: "https://www.agrotama.com.br/eletrodom-esticos/m-aquina-de-gelo/96%2C1316/" },
    {
      title: "Nagano 50 kg — Magazine Luiza / Agrotama",
      link: "https://www.magazineluiza.com.br/maquina-de-gelo-50kgdia-reservatorio-15-litros-220v-nagano/p/bkbghk2f8h/ep/mqgl/",
    },
    { title: "Resultados de máquinas 50 kg — Mercado Livre", link: "https://lista.mercadolivre.com.br/maquina-gelo-50kg" },
  ],
  Regulação: [
    {
      title: "Anvisa — consolidação de atos normativos, incluindo RDC 717/2022",
      link: "https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2022/regulacao-de-alimentos-consolidacao-de-atos-normativos",
    },
    { title: "Secretaria da Saúde do Paraná — Licenciamento Sanitário", link: "https://www.saude.pr.gov.br/Pagina/Licenciamento-Sanitario" },
    { title: "SESA/PR — Notas Técnicas e orientações de licenciamento", link: "https://www.saude.pr.gov.br/Pagina/Nota-Tecnica-Informacao" },
  ],
};

function FontesPage() {
  return (
    <div>
      <Panel title="Fontes e referências pesquisadas" subtitle="Preços são referências de pesquisa e podem mudar. Fontes sanitárias são referência normativa — confirme sempre com a autoridade competente.">
        {Object.entries(STATIC_SOURCES).map(([group, items]) => (
          <div key={group} className="mt-4 first:mt-0">
            <h4 className="text-sm font-semibold">{group}</h4>
            <ul className="mt-2 space-y-1.5">
              {items.map((it) => (
                <li key={it.link} className="text-sm">
                  <a href={it.link} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    {it.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="mt-4">
          <Note kind="neutral">
            As simulações financeiras deste sistema não devem ser confundidas com dados observados do negócio. Preços de
            venda, custos de energia, água, embalagens, combustível, tributos, aluguel, mão de obra e manutenção
            precisam ser levantados com cotações e registros reais. A pesquisa de mercado deve ser complementada com
            contatos locais antes da compra.
          </Note>
        </div>
      </Panel>

      <div className="mt-6">
        <CrudSection
          collection="sources"
          title="Cadastrar fonte"
          subtitle="Adicione outras fontes e referências pesquisadas."
          listTitle="Fontes cadastradas"
          emptyText="Nenhuma fonte cadastrada ainda."
          addLabel="Salvar fonte"
          fields={[
            { key: "title", label: "Título", required: true, span: 2 },
            { key: "type", label: "Tipo", type: "select", options: ["Equipamento", "Preço", "Concorrente", "Regulação", "Mercado", "Outro"] },
            { key: "reliability", label: "Confiabilidade", type: "select", options: ["Alta", "Média", "Baixa"] },
            { key: "link", label: "Link", type: "url", span: 2 },
            { key: "notes", label: "Observações", type: "textarea", span: 4 },
          ]}
          columns={[
            { key: "title", label: "Título" },
            { key: "type", label: "Tipo" },
            { key: "reliability", label: "Confiabilidade", render: (r) => <Chip value={r.reliability} kind={r.reliability === "Alta" ? "good" : r.reliability === "Baixa" ? "critical" : "warn"} /> },
            {
              key: "link",
              label: "Link",
              render: (r) =>
                r.link ? (
                  <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Abrir
                  </a>
                ) : (
                  "—"
                ),
            },
          ]}
        />
      </div>
    </div>
  );
}
