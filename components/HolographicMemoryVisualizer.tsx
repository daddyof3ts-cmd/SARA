import React, { useEffect, useRef } from 'react';
import type { ChatMessage, PsiState } from '../types';
import { MessageAuthor } from '../types';

declare const d3: any;

const AnchorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="3" />
    <line x1="12" y1="22" x2="12" y2="8" />
    <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
  </svg>
);

interface MemoryEpochVisualizerProps {
  epochs: ChatMessage[];
  psiState: PsiState;
  onAnchorEpoch: (epochId: string) => void;
}

export const HolographicMemoryVisualizer: React.FC<MemoryEpochVisualizerProps> = ({ epochs, psiState, onAnchorEpoch }) => {
  const d3Container = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!epochs || !d3Container.current) return;

    const svg = d3.select(d3Container.current);
    const width = d3Container.current.clientWidth;
    const height = d3Container.current.clientHeight;
    
    if (width === 0 || height === 0) return;

    // Data prep
    const nodes = epochs.map(epoch => ({ 
        id: epoch.id, 
        text: epoch.text, 
        author: epoch.author,
        val: epoch.author === MessageAuthor.AI ? 10 : 5 
    }));
    
    const links = nodes.slice(1).map((_, i) => ({ 
        source: nodes[i].id, 
        target: nodes[i + 1].id 
    }));

    const linkStrength = 0.1 + (psiState.coherence * 0.4);
    const chargeStrength = -50 - (psiState.quantumPotential * 200);

    svg.selectAll("*").remove(); // Clear for fresh render

    // Render Links
    const link = svg.append("g")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("stroke", "#831843") // Changed from gray to deep fuchsia
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1.5)
        .attr("fill", "none");

    // Render Nodes
    const nodeGroup = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(d3.drag()
            .on("start", (event: any, d: any) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event: any, d: any) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event: any, d: any) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }));

    nodeGroup.append("circle")
        .attr("r", (d: any) => d.author === MessageAuthor.AI ? 6 : 4)
        .attr("fill", (d: any) => d.author === MessageAuthor.AI ? "#f472b6" : "#c026d3") // Changed cyan/blue to pink/fuchsia
        .style("cursor", "pointer")
        .style("filter", "drop-shadow(0 0 5px rgba(236,72,153,0.8))") // Added native glow
        .on("click", (event: any, d: any) => {
            onAnchorEpoch(d.id);
        });

    nodeGroup.append("title").text((d: any) => d.text.substring(0, 50) + "...");

    // Initialize simulation locally to ensure proper closure scope for 'link' and 'nodeGroup'
    const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(chargeStrength))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(40).strength(linkStrength));

    simulation.on("tick", () => {
        link.attr("d", (d: any) => {
            if (typeof d.target.x === 'undefined' || typeof d.source.x === 'undefined') return "";
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy) || 1;
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

        nodeGroup.attr("transform", (d: any) => {
            if (typeof d.x === 'undefined') return "";
            return `translate(${d.x},${d.y})`;
        });
    });

    return () => {
      simulation.stop();
    };

  }, [epochs, psiState, onAnchorEpoch]);

  return (
    <div className="h-full flex flex-col text-pink-100">
      <div className="flex justify-between items-center mb-2 px-2">
          <h2 className="text-lg font-semibold text-fuchsia-400 text-center flex-1">Memory Manifold</h2>
          <div className="text-xs text-fuchsia-700 flex items-center gap-1">
             <AnchorIcon className="w-3 h-3" />
             <span>Click node to anchor</span>
          </div>
      </div>
      <div 
        className="flex-1 w-full h-full relative bg-black/60 rounded-md border border-fuchsia-900/50"
        style={{ boxShadow: 'inset 0 0 15px rgba(192,38,211,0.1)' }}
      >
         <svg ref={d3Container} className="w-full h-full" />
      </div>
    </div>
  );
};