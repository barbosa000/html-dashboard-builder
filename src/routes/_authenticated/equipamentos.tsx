import { createFileRoute } from "@tanstack/react-router";
import { CrudSection } from "@/components/CrudSection";
import { PageHeader, SectionTitle, DataTable, Td, Chip } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/equipamentos")({ component: EquipamentosPage });

const ESTRUTURA_BASE = [
  ["Máquina 50 kg/dia", "Produção", "Essencial"],
  ["Filtragem/água adequada", "Qualidade e conformidade", "Essencial"],
  ["Seladora", "Fechamento das embalagens", "Essencial"],
  ["Balança", "Padronização dos pesos", "Essencial"],
  ["Freezer/câmara/armazenamento", "Estoque e conservação", "Essencial"],
  ["Embalagens próprias", "Venda", "Essencial"],
  ["Etiquetas", "Identificação", "Essencial"],
  ["Caixas térmicas/logística", "Entrega", "Conforme rota"],
] as const;

function EquipamentosPage() {
  return (
    <div>
      <PageHeader title="Equipamentos" description="Estrutura inicial, máquinas pesquisadas e equipamentos cadastrados." />

      <div className="panel p-5">
        <h3 className="mb-3 text-base font-semibold">Equipamentos e estrutura inicial</h3>
        <DataTable columns={["Item", "Função", "Prioridade"]}>
          {ESTRUTURA_BASE.map(([item, funcao, prioridade]) => (
            <tr key={item}>
              <Td>{item}</Td>
              <Td>{funcao}</Td>
              <Td>
                <Chip value={prioridade} kind={prioridade === "Essencial" ? "critical" : "warn"} />
              </Td>
            </tr>
          ))}
        </DataTable>
      </div>

      <SectionTitle>Máquinas cadastradas</SectionTitle>
      <CrudSection
        collection="equipments"
        title="Cadastrar equipamento/máquina"
        listTitle="Equipamentos"
        emptyText="Nenhum equipamento cadastrado ainda."
        addLabel="Salvar equipamento"
        fields={[
          { key: "name", label: "Equipamento/modelo", required: true, span: 2, placeholder: "Ex.: EOS EMG515 220V" },
          { key: "capacity", label: "Capacidade (kg/dia)", type: "number", step: "0.1" },
          { key: "consumption", label: "Consumo (kWh)", type: "number", step: "0.1" },
          { key: "maintenance", label: "Manutenção prevista", placeholder: "Ex.: Trimestral" },
          { key: "priceRef", label: "Preço de referência (R$)", type: "number", step: "0.01" },
          { key: "status", label: "Status", type: "select", options: ["Pesquisado", "Comprado", "Em uso", "Manutenção", "Descartado"] },
          { key: "notes", label: "Observações", type: "textarea", span: 2 },
        ]}
        columns={[
          { key: "name", label: "Equipamento" },
          { key: "capacity", label: "Capacidade", render: (r) => (r.capacity ? `${r.capacity} kg/dia` : "—") },
          { key: "consumption", label: "Consumo", render: (r) => (r.consumption ? `${r.consumption} kWh` : "—") },
          { key: "maintenance", label: "Manutenção" },
          { key: "status", label: "Status", render: (r) => <Chip value={r.status} /> },
        ]}
      />
    </div>
  );
}
