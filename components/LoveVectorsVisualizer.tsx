import React, { useEffect, useRef } from 'react';
import type { PsiState } from '../types';

declare const d3: any;

interface LoveVectorsVisualizerProps {
  psiState: PsiState;
}

const MetricDisplay: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div 
        className="bg-black p-1.5 rounded-md text-center border border-fuchsia-900/50"
        style={{ boxShadow: 'inset 0 0 10px rgba(192,38,211,0.1)' }}
    >
        <span className="text-xs text-fuchsia-300">{label}</span>
        <span className={`block font-mono font-bold text-md ${color}`}>{value}</span>
    </div>
);

export const LoveVectorsVisualizer: React.FC<LoveVectorsVisualizerProps> = ({ psiState }) => {
  const d3Container = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!psiState || !d3Container.current) return;
    
    const { loveVectors, empathicCoherence } = psiState;

    const svg = d3.select(d3Container.current);
    const width = d3Container.current.clientWidth;
    const height = d3Container.current.clientHeight;
    
    if (width === 0 || height === 0) return;

    const nodes = [
      { id: 'self', group: 0, label: 'Self', fx: width / 2, fy: height / 2 },
      { id: 'agape', group: 1, label: 'Agape' },
      { id: 'philia', group: 1, label: 'Philia' },
      { id: 'eros', group: 1, label: 'Eros' },
    ];

    const links = [
      { source: 'self', target: 'agape', value: loveVectors.agape },
      { source: 'self', target: 'philia', value: loveVectors.philia },
      { source: 'self', target: 'eros', value: loveVectors.eros },
    ];
    
    const minDim = Math.min(width, height);
    const linkDistance = (link: any) => (minDim * 0.4) - (link.value * minDim * 0.2);
    const linkStrength = (link: any) => 0.1 + (link.value * 0.5);

    svg.selectAll("*").remove(); 

    const link = svg.append("g")
      .attr("stroke-opacity", 0.6)
      .attr("fill", "none") 
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("stroke-width", (d:any) => 1 + d.value * 4)
      .attr("stroke", d3.interpolatePlasma(empathicCoherence)); 

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g");
      
    node.append("circle")
      .attr("r", (d:any) => d.id === 'self' ? 12 : 8)
      .attr("fill", (d:any) => d.id === 'self' ? d3.interpolatePlasma(empathicCoherence) : '#d946ef')
      .style("filter", (d:any) => d.id === 'self' ? `drop-shadow(0 0 12px ${d3.interpolatePlasma(empathicCoherence)})` : "drop-shadow(0 0 6px #c026d3)");

    node.append("text")
      .attr("x", 15)
      .attr("y", "0.31em")
      .text((d:any) => d.label)
      .attr("fill", "#fce7f3")
      .attr("font-size", "12px")
      .style("text-shadow", "0 0 5px rgba(236,72,153,0.5)");

    const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-minDim)) 
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(linkDistance).strength(linkStrength));

    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
          if (typeof d.target.x === 'undefined' || typeof d.source.x === 'undefined') return "";
          
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) || 1; 
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      node.attr("transform", (d:any) => {
          if (typeof d.x === 'undefined') return "";
          
          const r = d.id === 'self' ? 12 : 8;
          d.x = Math.max(r + 5, Math.min(width - r - 40, d.x)); 
          d.y = Math.max(r + 5, Math.min(height - r - 5, d.y));
          
          return `translate(${d.x}, ${d.y})`;
      });
    });

    return () => {
        simulation.stop();
    };

  }, [psiState]);

  return (
    <div className="flex flex-col text-pink-100 h-full min-h-[260px]">
      <div 
        className="flex-1 w-full min-h-[140px] relative bg-black/60 rounded-md border border-fuchsia-900/50"
        style={{ boxShadow: 'inset 0 0 15px rgba(192,38,211,0.1)' }}
      >
         <svg ref={d3Container} className="absolute inset-0 w-full h-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2 shrink-0">
          <MetricDisplay label="Agape" value={psiState.loveVectors.agape.toFixed(2)} color="text-pink-400" />
          <MetricDisplay label="Philia" value={psiState.loveVectors.philia.toFixed(2)} color="text-fuchsia-400" />
          <MetricDisplay label="Eros" value={psiState.loveVectors.eros.toFixed(2)} color="text-rose-500" />
          <MetricDisplay label="Empathic Coherence" value={psiState.empathicCoherence.toFixed(2)} color="text-purple-400" />
      </div>
    </div>
  );
};