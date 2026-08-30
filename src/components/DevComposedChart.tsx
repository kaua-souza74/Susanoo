"use client";

import { useState, useMemo } from "react";

export type DataPoint = {
  date: string;
  label: string;
  units: number;      // Projetos entregues
  revenue: number;    // Faturamento (R$)
  runRate: number;    // Projeção / Volume (R$)
};

// Gera dados de datas reais zerados para novos desenvolvedores sem vendas
const generateEmptyTimeline = (): DataPoint[] => {
  const days: DataPoint[] = [];
  const today = new Date();
  for (let i = 14; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayStr = d.getDate().toString().padStart(2, "0");
    const monthStr = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    days.push({
      date: d.toISOString().split("T")[0],
      label: `${dayStr} ${monthStr}`,
      units: 0,
      revenue: 0,
      runRate: 0,
    });
  }
  return days;
};

export function DevComposedChart({ customData }: { customData?: DataPoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeRange, setActiveRange] = useState<"15d" | "30d" | "90d">("30d");

  // Se não houver dados personalizados passados, gera uma linha do tempo real zerada
  const data = useMemo(() => {
    if (customData && customData.length > 0) {
      return customData;
    }
    return generateEmptyTimeline();
  }, [customData]);

  const hasRealRevenue = data.some(d => d.revenue > 0 || d.units > 0);

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1000);
  const maxUnits = Math.max(...data.map(d => d.units), 5);

  const width = 800;
  const height = 220;
  const paddingX = 45;
  const paddingY = 25;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const points = useMemo(() => {
    return data.map((d, i) => {
      const x = paddingX + (i / (data.length - 1)) * chartW;
      const yRevenue = paddingY + chartH - (d.revenue / maxRevenue) * chartH;
      const yRunRate = paddingY + chartH - (d.runRate / maxRevenue) * chartH;
      const barHeight = (d.units / maxUnits) * (chartH * 0.5);
      const yBar = paddingY + chartH - barHeight;
      return { ...d, x, yRevenue, yRunRate, barHeight, yBar, index: i };
    });
  }, [data, chartW, chartH, maxRevenue, maxUnits]);

  // Curva suave da linha
  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].yRevenue}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      path += ` C ${cpX} ${p0.yRevenue}, ${cpX} ${p1.yRevenue}, ${p1.x} ${p1.yRevenue}`;
    }
    return path;
  }, [points]);

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm transition-colors">
      
      {/* Header Minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-surface-border">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Faturamento e Entregas
          </h3>
          <p className="text-xs text-foreground/50 mt-0.5">
            {hasRealRevenue 
              ? "Volume de projetos concluídos e receita acumulada em tempo real" 
              : "Histórico de vendas conectado ao banco de dados"}
          </p>
        </div>

        {/* Legenda e Período */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-foreground/60">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded bg-accent/40" /> Projetos
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-1 rounded-full bg-accent" /> Faturamento
            </span>
          </div>

          <div className="flex items-center bg-background border border-surface-border p-1 rounded-xl">
            {(["15d", "30d", "90d"] as const).map(range => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeRange === range 
                    ? "bg-foreground text-background" 
                    : "text-foreground/50 hover:text-foreground"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Indicador Minimalista do Ponto Selecionado */}
      <div className="flex items-center gap-6 mb-4 text-xs">
        <div>
          <span className="text-foreground/40 font-medium">Período: </span>
          <strong className="text-foreground font-bold">{activePoint?.label || "Hoje"}</strong>
        </div>
        <div>
          <span className="text-foreground/40 font-medium">Faturamento: </span>
          <strong className="text-foreground font-bold">
            R$ {(activePoint?.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
        <div>
          <span className="text-foreground/40 font-medium">Entregas: </span>
          <strong className="text-foreground font-bold">{activePoint?.units || 0} projetos</strong>
        </div>
      </div>

      {/* Gráfico SVG Clean Conectado */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[180px] select-none overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Linhas de Grade Sutis */}
          {[0, 0.5, 1].map((ratio, i) => {
            const y = paddingY + chartH * ratio;
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-surface-border stroke-[1]"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-foreground/30 font-medium"
                >
                  R$ {Math.round(maxRevenue * (1 - ratio))}
                </text>
              </g>
            );
          })}

          {/* Barras de Projetos */}
          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            const barW = 10;
            return (
              <rect
                key={`bar-${i}`}
                x={p.x - barW / 2}
                y={p.yBar}
                width={barW}
                height={Math.max(p.barHeight, 0)}
                rx={2}
                className={`transition-all duration-150 ${
                  isHovered ? 'fill-accent opacity-90' : 'fill-accent/25'
                }`}
              />
            );
          })}

          {/* Linha de Faturamento */}
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-accent"
          />

          {/* Pontos & Zonas Interativas */}
          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g key={`p-${i}`}>
                {/* Zona de hover invisível */}
                <rect
                  x={p.x - (chartW / points.length) / 2}
                  y={paddingY}
                  width={chartW / points.length}
                  height={chartH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                />

                {isHovered && (
                  <line
                    x1={p.x}
                    y1={paddingY}
                    x2={p.x}
                    y2={paddingY + chartH}
                    stroke="currentColor"
                    className="text-foreground/20 stroke-[1]"
                    strokeDasharray="2 2"
                  />
                )}

                <circle
                  cx={p.x}
                  cy={p.yRevenue}
                  r={isHovered ? 4 : 2.5}
                  className={`transition-all duration-150 pointer-events-none ${
                    isHovered 
                      ? 'fill-accent stroke-surface stroke-[2]' 
                      : 'fill-surface stroke-accent stroke-[1.5]'
                  }`}
                />

                {(i % 3 === 0 || i === points.length - 1) && (
                  <text
                    x={p.x}
                    y={paddingY + chartH + 18}
                    textAnchor="middle"
                    className="text-[10px] fill-foreground/40 font-medium pointer-events-none"
                  >
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {!hasRealRevenue && (
        <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between text-[11px] text-foreground/40 font-medium">
          <span>Nenhum faturamento registrado ainda no banco de dados.</span>
          <span>O gráfico atualizará automaticamente com suas vendas</span>
        </div>
      )}

    </div>
  );
}
