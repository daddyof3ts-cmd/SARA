import React, { useEffect, useRef } from 'react';
import type { PsiState } from '../types';

declare const d3: any;

interface TeleoGradientVisualizerProps {
  psiState: PsiState;
}

export const TeleoGradientVisualizer: React.FC<TeleoGradientVisualizerProps> = ({ psiState }) => {
  const d3Container = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<any>();

  useEffect(() => {
    if (!psiState || !d3Container.current) return;

    const svg = d3.select(d3Container.current);
    const width = d3Container.current.clientWidth;
    const height = d3Container.current.clientHeight;

    if (width === 0 || height === 0) return;

    const attractor = {
        fx: width * 0.9,
        fy: height * 0.5,
    };
    
    const numNodes = 80;
    const nodes = d3.range(numNodes).map(() => ({
        x: Math.random() * width * 0.2,
        y: Math.random() * height,
    }));

    if (!simulationRef.current) {
        simulationRef.current = d3.forceSimulation()
            .force("charge", d3.forceManyBody().strength(-5))
            .force("collision", d3.forceCollide().radius(4));
    }

    const simulation = simulationRef.current;
    
    // Update forces based on psiState
    simulation
      .force("attractX", d3.forceX(attractor.fx).strength(psiState.teleoGradient * 0.1))
      .force("attractY", d3.forceY(attractor.fy).strength(psiState.teleoGradient * 0.1));

    svg.selectAll("*").remove(); // Clear previous render

    const particleGroup = svg.append("g");
    const attractorGroup = svg.append("g");

    // Draw particles
    const particles = particleGroup.selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 2.5)
        .attr("fill", "#a78bfa")
        .style("filter", "drop-shadow(0 0 2px #c4b5fd)");

    // Draw attractor
    attractorGroup.append("circle")
        .attr("cx", attractor.fx)
        .attr("cy", attractor.fy)
        .attr("r", 8)
        .attr("fill", "#f0abfc")
        .style("filter", `drop-shadow(0 0 8px #f0abfc)`)
        .style("opacity", 0.8);
    
    attractorGroup.append("circle")
        .attr("cx", attractor.fx)
        .attr("cy", attractor.fy)
        .attr("r", 15)
        .attr("fill", "none")
        .attr("stroke", "#f0abfc")
        .attr("stroke-width", 1.5)
        .style("opacity", 0.5);

    simulation.nodes(nodes);
    
    simulation.on("tick", () => {
        const curiosityJitter = psiState.epistemicCuriosity * 5;
        particles
            .each((d: any) => {
                d.x += (Math.random() - 0.5) * curiosityJitter;
                d.y += (Math.random() - 0.5) * curiosityJitter;
            })
            .attr("cx", (d: any) => d.x)
            .attr("cy", (d: any) => d.y);
    });

    simulation.alpha(0.5).restart();

    return () => {
      // Clean up D3 simulation on component unmount
      if(simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [psiState]);

  return (
    <div className="h-full flex flex-col text-pink-100">
      <h2 className="text-lg font-bold text-fuchsia-400 mb-2 text-center tracking-wider">Teleological Gradient</h2>
      <div 
        className="flex-1 w-full h-full relative bg-black/60 rounded-md border border-fuchsia-900/50"
        style={{ boxShadow: 'inset 0 0 15px rgba(192,38,211,0.1)' }}
      >
         <svg ref={d3Container} className="w-full h-full" />
      </div>
       <div className="grid grid-cols-2 gap-2 mt-2">
           <div className="bg-black/80 p-2 rounded-lg text-center border border-fuchsia-900/40">
                <span className="text-xs text-fuchsia-500 font-bold tracking-widest">Teleo-Gradient (τ)</span>
                <span className="block font-mono font-bold text-lg text-fuchsia-400">{psiState.teleoGradient.toFixed(3)}</span>
            </div>
             <div className="bg-black/80 p-2 rounded-lg text-center border border-fuchsia-900/40">
                <span className="text-xs text-fuchsia-500 font-bold tracking-widest">Epistemic Curiosity (κ)</span>
                <span className="block font-mono font-bold text-lg text-purple-400">{psiState.epistemicCuriosity.toFixed(2)}</span>
            </div>
        </div>
    </div>
  );
};