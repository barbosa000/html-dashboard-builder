import { useMemo } from "react";
import { Panel, Note, Chip } from "@/components/ui-kit";
import { useCollection } from "@/lib/store";
import { activeSales, brl, numFmt, REGIONS } from "@/lib/domain";

type Region = (typeof REGIONS)[number];

type RegionStat = {
  region: string;
  clientCount: number;
  activeCount: number;
  revenue: number;
  topPlaces: { place: string; count: number }[];
};

function computeRegionStats(clients: any[], sales: any[]): Record<Region, RegionStat> {
  const act = activeSales(sales);
  const stats = {} as Record<Region, RegionStat>;
  for (const region of REGIONS) {
    const inRegion = clients.filter((c) => c.region === region);
    const ids = new Set(inRegion.map((c) => c.id));
    const revenue = act
      .filter((s) => ids.has(s.clientId))
      .reduce((a, s) => a + (Number(s.total) || 0), 0);
    const placeCounts = new Map<string, number>();
    inRegion.forEach((c) => {
      const place = c.city || c.neighborhood;
      if (!place) return;
      placeCounts.set(place, (placeCounts.get(place) || 0) + 1);
    });
    stats[region] = {
      region,
      clientCount: inRegion.length,
      activeCount: inRegion.filter((c) => c.status === "Cliente" || c.status === "Recorrente")
        .length,
      revenue,
      topPlaces: [...placeCounts.entries()]
        .map(([place, count]) => ({ place, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
    };
  }
  return stats;
}

function intensityClass(count: number, max: number) {
  if (max <= 0 || count <= 0) return "border-2 border-dashed border-border bg-transparent";
  const ratio = count / max;
  if (ratio >= 0.66)
    return "border-transparent bg-primary/80 text-primary-foreground shadow-[0_0_0_6px_color-mix(in_oklab,var(--color-primary)_16%,transparent)]";
  if (ratio >= 0.33) return "border-transparent bg-primary/45 text-foreground";
  return "border-transparent bg-primary/20 text-foreground";
}

function diameter(count: number, max: number) {
  const base = 52;
  const extra = max > 0 ? Math.round(Math.sqrt(count / max) * 68) : 0;
  return base + extra;
}

/** Trava o diâmetro em px, mas nunca deixa passar de uma fração da largura
 * do contêiner (via vw) — evita bolhas se sobrepondo em telas estreitas. */
function sizeStyle(px: number, vwCap: number) {
  return `min(${px}px, ${vwCap}vw)`;
}

export function DemandMap() {
  const { rows: clients } = useCollection("clients");
  const { rows: sales } = useCollection("sales");

  const stats = useMemo(() => computeRegionStats(clients, sales), [clients, sales]);
  const withRegion = clients.filter((c) => c.region).length;
  const withoutRegion = clients.length - withRegion;
  const maxClients = Math.max(1, ...REGIONS.map((r) => stats[r].clientCount));
  const topRegion = [...REGIONS].sort((a, b) => stats[b].clientCount - stats[a].clientCount)[0];

  if (clients.length === 0) {
    return (
      <Note kind="neutral">
        Nenhum cliente cadastrado ainda. Cadastre clientes com uma região em Clientes para ver o
        mapa de demanda.
      </Note>
    );
  }

  if (withRegion === 0) {
    return (
      <Note kind="neutral">
        Nenhum cliente tem a região preenchida ainda. Edite os clientes em Clientes → Região para
        ver o mapa de demanda por área.
      </Note>
    );
  }

  const curitiba = stats["Curitiba"];
  const campoMagro = stats["Campo Magro"];
  const rmc = stats["Região Metropolitana"];
  const outra = stats["Outra"];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Panel
        className="lg:col-span-3"
        title="Diagrama de demanda por região"
        subtitle="Esquemático — não é um mapa geográfico preciso."
      >
        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-surface-2/40 sm:h-80">
          {/* Anel da Região Metropolitana, ao redor de Curitiba */}
          <div
            className={`absolute top-[56%] left-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed transition-all ${
              rmc.clientCount > 0 ? "border-accent/60" : "border-border"
            }`}
            style={{
              width: sizeStyle(diameter(rmc.clientCount, maxClients) + 70, 62),
              height: sizeStyle(diameter(rmc.clientCount, maxClients) + 70, 62),
            }}
          />
          <span className="absolute top-[14%] left-[66%] -translate-x-1/2 text-center text-[11px] font-medium text-nowrap text-muted-foreground">
            Região Metropolitana
          </span>

          {/* Campo Magro */}
          <RegionBubble
            label="Campo Magro"
            stat={campoMagro}
            max={maxClients}
            style={{ top: "62%", left: "18%" }}
            vwCap={24}
          />

          {/* Curitiba */}
          <RegionBubble
            label="Curitiba"
            stat={curitiba}
            max={maxClients}
            style={{ top: "56%", left: "66%" }}
            vwCap={27}
            emphasize
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary/80" /> alta demanda
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary/45" /> média
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary/20" /> baixa
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-border" /> sem
            clientes
          </span>
          {outra.clientCount > 0 && (
            <span className="ml-auto">
              +{outra.clientCount} cliente(s) em "Outra" região · {withoutRegion} sem região
              definida
            </span>
          )}
        </div>
      </Panel>

      <Panel
        className="lg:col-span-2"
        title="Ranking por região"
        subtitle={`Região com mais clientes: ${topRegion}`}
      >
        <div className="space-y-3">
          {[...REGIONS]
            .sort((a, b) => stats[b].clientCount - stats[a].clientCount)
            .map((region) => {
              const s = stats[region];
              return (
                <div key={region} className="rounded-xl border border-border bg-surface-2/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{region}</span>
                    <Chip
                      value={
                        s.clientCount > 0 ? `${numFmt(s.clientCount)} cliente(s)` : "Sem clientes"
                      }
                      kind={
                        s.clientCount === 0
                          ? "neutral"
                          : s.clientCount === maxClients
                            ? "good"
                            : "info"
                      }
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Ativos/recorrentes: {numFmt(s.activeCount)}</span>
                    <span>Faturamento: {brl(s.revenue)}</span>
                  </div>
                  {s.topPlaces.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.topPlaces.map((p) => (
                        <span
                          key={p.place}
                          className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {p.place} ({p.count})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </Panel>
    </div>
  );
}

function RegionBubble({
  label,
  stat,
  max,
  style,
  vwCap,
  emphasize,
}: {
  label: string;
  stat: RegionStat;
  max: number;
  style: { top: string; left: string };
  vwCap: number;
  emphasize?: boolean;
}) {
  const px = Math.round(diameter(stat.clientCount, max) * (emphasize ? 1.1 : 1));
  const size = sizeStyle(px, vwCap);
  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full text-center transition-all duration-500"
      style={{ ...style, width: size, height: size }}
    >
      <div
        className={`flex h-full w-full flex-col items-center justify-center rounded-full ${intensityClass(stat.clientCount, max)}`}
      >
        <span className="num text-sm font-bold">{numFmt(stat.clientCount)}</span>
        <span className="text-[10px] opacity-80">cliente(s)</span>
      </div>
      <span className="absolute -bottom-5 text-[11px] font-medium text-nowrap text-foreground">
        {label}
      </span>
    </div>
  );
}
