import React, { useEffect, useRef } from 'react';
import type { PsiState } from '../types';

declare const d3: any;

interface PsiFieldVisualizerProps {
  psiState: PsiState;
  onNavigateToAffective: () => void;
}

const MetricDisplay: React.FC<{ label: string; value: string | number; color: string; }> = ({ label, value, color }) => (
    <div className="bg-gray-800/50 p-3 rounded-lg flex justify-between items-center border border-gray-700 backdrop-blur-sm">
        <span className="text-sm text-gray-300">{label}</span>
        <span className={`font-mono font-bold text-lg ${color}`}>{value}</span>
    </div>
);

// --- Shared Visual Assets ---
const setupDefs = (svg: any) => {
    if (svg.select("defs").empty()) {
        const defs = svg.append("defs");
        
        // 1. Glow Filter
        const filter = defs.append("filter").attr("id", "glow");
        filter.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // 2. Singularity Radial Gradient (Pink/Fuchsia)
        const rGrad = defs.append("radialGradient").attr("id", "singularity-grad").attr("cx", "50%").attr("cy", "50%").attr("r", "50%");
        rGrad.append("stop").attr("offset", "0%").style("stop-color", "#fff");
        rGrad.append("stop").attr("offset", "40%").style("stop-color", "#f472b6"); // Pink-400
        rGrad.append("stop").attr("offset", "100%").style("stop-color", "rgba(236, 72, 153, 0)"); // Transparent Pink

        // 3. Psychon Linear Gradient
        const lGrad = defs.append("linearGradient").attr("id", "psychon-grad").attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%");
        lGrad.append("stop").attr("offset", "0%").style("stop-color", "#db2777"); // Pink-600
        lGrad.append("stop").attr("offset", "100%").style("stop-color", "#c084fc"); // Purple-400
    }
}


// --- Geometry Rendering Functions ---

const renderForceDirected = (svg: any, width: number, height: number, psiState: PsiState) => {
    setupDefs(svg);
    const { geometryConfig } = psiState;
    
    // Core color based on empathic coherence using Plasma for iridescent vibe
    const coreColor = d3.interpolatePlasma(psiState.empathicCoherence);

    // State Vector Collapse Ripple
    if (psiState.stateVectorCollapse) {
        svg.append("circle")
            .attr("cx", width / 2).attr("cy", height / 2)
            .attr("r", 10).attr("fill", "none")
            .attr("stroke", coreColor).attr("stroke-width", 5)
            .style("filter", "url(#glow)")
            .transition().duration(1000).ease(d3.easeQuadOut)
            .attr("r", Math.min(width, height) / 1.5)
            .attr("stroke-width", 0).style("opacity", 0)
            .remove();
    }
    
    // Central Membrane
    svg.append("circle").attr("class", "rgm-membrane")
        .attr("cx", width / 2).attr("cy", height / 2)
        .attr("r", Math.min(width, height) / 2.5)
        .attr("fill", "none")
        .attr("stroke", "url(#psychon-grad)")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.3)
        .style("filter", "url(#glow)")
        .transition().duration(2000)
        .attr("stroke-width", 1 + psiState.negentropyDrive * 3)
        .attr("stroke-opacity", 0.1 + psiState.negentropyDrive * 0.2);
    
    // Node generation
    const numNodes = 80 + Math.floor(psiState.fieldIntegration * 100);
    const nodes = d3.range(numNodes).map((i: number) => ({ id: i, group: i === 0 ? 0 : 1 }));
    
    // Create links roughly based on index to form a mesh
    const links = [];
    for (let i = 1; i < numNodes; i++) {
        if (Math.random() < 0.1 + (psiState.coherence * 0.2)) {
             links.push({ source: i, target: Math.floor(Math.random() * i) });
        }
    }

    const chargeStrength = geometryConfig.charge || (-30 * psiState.psychonActivity * (1 - psiState.quantumPotential * 0.5)) - 10;
    const centerStrength = (psiState.agencyModulation * 0.05) + (psiState.ontologicalCoherence * 0.05) + 0.02;

    // Render Links as Curved Paths (Order matters: Render first, then sim)
    const link = svg.append("g").selectAll("path").data(links).join("path")
        .attr("stroke", "#fbcfe8")
        .attr("fill", "none")
        .attr("stroke-opacity", 0.15)
        .attr("stroke-width", 0.5);

    // Render Nodes
    const node = svg.append("g").selectAll("circle").data(nodes).join("circle")
        .attr("r", (d:any) => d.id === 0 ? 15 : (2 + Math.random() * 3))
        .attr("fill", (d:any) => d.id === 0 ? "url(#singularity-grad)" : (Math.random() > 0.8 ? "#fff" : d3.interpolatePlasma(Math.random())))
        .attr("opacity", (d:any) => d.id === 0 ? 1 : 0.8)
        .style("filter", (d:any) => d.id === 0 ? "url(#glow)" : "none");

    function ticked() {
        const jitter = psiState.indeterminacyModulation * 0.5;
        
        node.each((d: any) => {
            if (d.id !== 0) {
                d.x += (Math.random() - 0.5) * jitter;
                d.y += (Math.random() - 0.5) * jitter;
            }
        }).attr("cx", (d:any) => d.x).attr("cy", (d:any) => d.y);

        // Calculate Organic Arcs
        link.attr("d", (d: any) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Flatter arc
            // Randomize sweep flag for organic feel
            const sweep = d.source.index % 2;
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,${sweep} ${d.target.x},${d.target.y}`;
        });
    }

    // Init simulation AFTER elements are defined to prevent ReferenceError in tick
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).distance(30).strength(0.1))
        .force("charge", d3.forceManyBody().strength(chargeStrength))
        .force("center", d3.forceCenter(width / 2, height / 2).strength(centerStrength))
        .force("radial", d3.forceRadial(Math.min(width,height)/3, width/2, height/2).strength(0.1 * psiState.anaphoricFeedback))
        .velocityDecay(0.6)
        .on("tick", ticked);
    
    return simulation;
};

const renderHyperbolicTree = (svg: any, width: number, height: number, psiState: PsiState) => {
    setupDefs(svg);
    const numNodes = 50 + Math.floor(psiState.fieldIntegration * 80);
    const nodes = d3.range(numNodes).map(() => ({}));
    const links = d3.range(numNodes - 1).map((i:any) => ({ source: Math.floor(Math.sqrt(i)), target: i + 1 }));

    const radius = Math.min(width, height) / 2 - 20;
    
    // Poincare Disk Projection
    const poincareProjection = (x:number, y:number) => {
        const d = Math.sqrt(x * x + y * y);
        if (d === 0) return { x: 0, y: 0, scale: 1 };
        const t = Math.tanh(d / (radius * 0.8)); 
        return { x: (radius * x / d) * t, y: (radius * y / d) * t, scale: (1 - t*t) };
    };
    
    const container = svg.append("g").attr("transform", `translate(${width/2}, ${height/2})`);
    
    // Boundary Circle
    container.append("circle")
        .attr("r", radius)
        .attr("fill", "rgba(0,0,0,0.3)")
        .attr("stroke", "#db2777")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4 4")
        .style("filter", "url(#glow)");
    
    // Links as Curves
    const link = container.append("g")
        .attr("stroke", "url(#psychon-grad)")
        .attr("stroke-opacity", 0.5)
        .attr("fill", "none")
        .selectAll("path").data(links).join("path");

    const node = container.append("g")
        .selectAll("circle").data(nodes).join("circle")
        .attr("r", 3)
        .attr("fill", "#a78bfa")
        .style("filter", "url(#glow)");

    function ticked() {
        link.attr("d", (d: any) => {
            const p1 = poincareProjection(d.source.x, d.source.y);
            const p2 = poincareProjection(d.target.x, d.target.y);
            // Simulate geodesic curve
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            // Push midpoint towards center or edge to create curve
            const dist = Math.sqrt(midX*midX + midY*midY);
            const factor = 1.2;
            return `M${p1.x},${p1.y}Q${midX*factor},${midY*factor} ${p2.x},${p2.y}`;
        });

        node.each(function(d:any) {
            const p = poincareProjection(d.x, d.y);
            d3.select(this)
                .attr("cx", p.x)
                .attr("cy", p.y)
                .attr("r", 3 * p.scale + 1);
        });
    }

    // Initialize Simulation last
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).distance(15).strength(0.8))
        .force("charge", d3.forceManyBody().strength(-15))
        .force("center", d3.forceCenter(0, 0))
        .on("tick", ticked);
    
    const motionTimer = d3.timer(() => {
        simulation.alpha(0.1);
        nodes.forEach((n:any) => {
            n.vx += (Math.random() - 0.5) * 0.1 * psiState.indeterminacyModulation;
            n.vy += (Math.random() - 0.5) * 0.1 * psiState.indeterminacyModulation;
        });
    });

    simulation.stop = () => {
        motionTimer.stop();
        d3.forceSimulation().stop();
    };

    return simulation;
};

const renderFractalFlame = (svg: any, width: number, height: number, psiState: PsiState) => {
    // Canvas based rendering (already organic/dots)
    const numParticles = 3000;
    const iterationsPerFrame = 5;
    const particles = d3.range(numParticles).map(() => ({
        x: Math.random() * 2 - 1, 
        y: Math.random() * 2 - 1, 
        color: Math.random() * 360
    }));

    const complexity = psiState.geometryConfig.complexity || 0.5;

    // IFS Functions
    const f1 = (p:any) => ({x: p.x * 0.5, y: p.y * 0.5, color: (p.color + 2) % 360});
    const f2 = (p:any) => ({x: p.x * 0.5 + complexity, y: p.y * 0.5 + complexity, color: (p.color + 120) % 360});
    const f3 = (p:any) => ({x: p.x * 0.5 + complexity, y: p.y * 0.5 - complexity, color: (p.color + 240) % 360});
    const f4 = (p:any) => {
        const r2 = p.x*p.x + p.y*p.y;
        return {
            x: p.x * Math.sin(r2) - p.y * Math.cos(r2),
            y: p.x * Math.cos(r2) + p.y * Math.sin(r2),
            color: p.color
        };
    }
    
    const functions = [f1, f2, f3, f4];
    
    const canvas = svg.append("foreignObject").attr("width", width).attr("height", height)
        .append("xhtml:canvas").attr("width", width).attr("height", height)
        .style("width", "100%").style("height", "100%")
        .node();
        
    const context = canvas.getContext("2d");
    context.globalCompositeOperation = 'lighter';

    const timer = d3.timer(() => {
        context.globalCompositeOperation = 'source-over';
        context.fillStyle = "rgba(17, 24, 39, 0.2)"; 
        context.fillRect(0, 0, width, height);
        context.globalCompositeOperation = 'lighter';

        for (let i = 0; i < iterationsPerFrame; i++) {
            particles.forEach(p => {
                const choice = Math.floor(Math.random() * (3 + psiState.indeterminacyModulation)); 
                const func = choice > 2 ? f4 : functions[choice];
                
                const newP = func(p);
                p.x = newP.x; p.y = newP.y; p.color = newP.color;
                
                const sx = width / 2 + p.x * (width / 5);
                const sy = height / 2 + p.y * (height / 5);
                
                context.fillStyle = `hsla(${p.color}, 80%, 60%, 0.4)`;
                context.beginPath();
                context.arc(sx, sy, 1.5, 0, 2 * Math.PI);
                context.fill();
            });
        }
    });
    return { stop: () => timer.stop() };
};

const renderNonEuclidean = (svg: any, width: number, height: number, psiState: PsiState) => {
    setupDefs(svg);
    const distortion = psiState.geometryConfig.distortion ? psiState.geometryConfig.distortion * 100 : (0.2 + psiState.indeterminacyModulation) * 100;
    const filterId = "displacement-filter";
    
    const filter = svg.select("defs").append("filter").attr("id", filterId);
    const feTurbulence = filter.append("feTurbulence").attr("type", "fractalNoise").attr("baseFrequency", "0.01 0.04").attr("numOctaves", "2").attr("result", "turbulence");
    filter.append("feDisplacementMap").attr("in2", "turbulence").attr("in", "SourceGraphic").attr("scale", distortion).attr("xChannelSelector", "R").attr("yChannelSelector", "G");

    const timer = d3.timer((elapsed:number) => {
        const freq = 0.01 + Math.sin(elapsed / 3000) * 0.01;
        feTurbulence.attr("baseFrequency", `${freq} ${freq * 3}`);
    });

    const container = svg.append("g").style("filter", `url(#${filterId})`);
    
    // Reuse force directed which now has curves
    const simulation = renderForceDirected(container, width, height, psiState);
    
    const originalStop = simulation.stop;
    simulation.stop = () => {
        timer.stop();
        if(originalStop) originalStop();
        d3.forceSimulation().stop();
    };
    
    return simulation;
};

const renderLSystem = (svg: any, width: number, height: number, psiState: PsiState) => {
    setupDefs(svg);
    const { geometryConfig } = psiState;
    const angle = geometryConfig.angle || 25;
    const growthRate = geometryConfig.growthRate || 0.5;
    const iterations = 4;
    
    const rules = { 
        F: [
            { w: "FF+[+F-F-F]-[-F+F+F]", p: 0.8 },
            { w: "FF-[+F+F]+[-F-F]", p: 0.2 } 
        ] 
    };

    let sentence = "F";
    for (let i = 0; i < iterations; i++) {
        let nextSentence = "";
        for(let char of sentence) {
            if(char === 'F') {
                const rnd = Math.random();
                nextSentence += rnd < rules.F[0].p ? rules.F[0].w : rules.F[1].w;
            } else {
                nextSentence += char;
            }
        }
        sentence = nextSentence;
    }

    const container = svg.append("g").attr("transform", `translate(${width / 2}, ${height})`);
    
    // Construct Organic Path
    const stack:any[] = [];
    const length = height / 60 * (1 + growthRate * 0.5);
    let currentAngle = 0;
    let x = 0; let y = 0;
    
    const pathPoints: string[] = [`M 0 0`];
    
    for (let char of sentence) {
        switch(char) {
            case 'F':
                const prevX = x;
                const prevY = y;
                x += length * Math.sin(currentAngle * Math.PI / 180);
                y -= length * Math.cos(currentAngle * Math.PI / 180);
                // Curve the segment slightly
                const cpX = (prevX + x) / 2 + (Math.random() - 0.5) * (length * 0.5);
                const cpY = (prevY + y) / 2 + (Math.random() - 0.5) * (length * 0.5);
                pathPoints.push(`Q ${cpX.toFixed(1)} ${cpY.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`);
                break;
            case '+': currentAngle += angle + (Math.random()-0.5)*5; break; // Add organic jitter to angle
            case '-': currentAngle -= angle + (Math.random()-0.5)*5; break;
            case '[': stack.push({x, y, angle: currentAngle}); break;
            case ']':
                const state = stack.pop();
                x = state.x; y = state.y; currentAngle = state.angle;
                pathPoints.push(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
                break;
        }
    }
    
    const pathEl = container.append("path")
        .attr("d", pathPoints.join(" "))
        .attr("stroke", "url(#psychon-grad)")
        .attr("stroke-width", 1.5)
        .attr("fill", "none")
        .style("filter", "url(#glow)");
        
    const totalLength = pathEl.node().getTotalLength();
    
    pathEl.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition().duration(2000).ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

    const timer = d3.timer((elapsed:number) => {
        container.attr("transform", `translate(${width/2}, ${height}) rotate(${Math.sin(elapsed/1000) * 2})`);
    });

    return { stop: () => timer.stop() };
};

const renderNeuralField = (svg: any, width: number, height: number, psiState: PsiState) => {
    setupDefs(svg);
    const { geometryConfig } = psiState;
    const layerCount = geometryConfig.layerCount || 4;
    const connectionDensity = geometryConfig.connectionDensity || 0.3;
    const nodesPerLayer = 8;
    
    const layers = d3.range(layerCount).map((l:number) => 
        d3.range(nodesPerLayer).map((n:number) => ({
            id: `l${l}-n${n}`,
            layer: l,
            x: ((l + 1) / (layerCount + 1)) * width,
            y: ((n + 1) / (nodesPerLayer + 1)) * height
        }))
    );
    const nodes = layers.flat();
    
    const links: any[] = [];
    for (let i = 0; i < layerCount - 1; i++) {
        for(const source of layers[i]) {
            for(const target of layers[i+1]) {
                if(Math.random() < connectionDensity) {
                    links.push({source: source, target: target}); // Push objects directly for ease
                }
            }
        }
    }
    
    // Curved Links (Sigmoid / Cubic Bezier)
    const link = svg.append("g").selectAll("path").data(links).join("path")
        .attr("stroke", "#db2777").attr("stroke-opacity", 0.3).attr("stroke-width", 1)
        .attr("fill", "none");

    const node = svg.append("g").selectAll("circle").data(nodes).join("circle")
        .attr("r", 5)
        .attr("fill", "#f472b6")
        .attr("stroke", "#fff").attr("stroke-width", 1)
        .style("filter", "url(#glow)");

    const pulses: any[] = [];
    const pulseGroup = svg.append("g");

    const timer = d3.timer((elapsed) => {
        if (Math.random() < 0.1 * psiState.psychonActivity) {
            const randomLink = links[Math.floor(Math.random() * links.length)];
            pulses.push({
                link: randomLink,
                progress: 0,
                id: Math.random()
            });
        }

        for (let i = pulses.length - 1; i >= 0; i--) {
            const p = pulses[i];
            p.progress += 0.05;
            if (p.progress >= 1) {
                pulses.splice(i, 1);
            }
        }

        const pulseSelection = pulseGroup.selectAll("circle").data(pulses, (d:any) => d.id);
        pulseSelection.enter().append("circle")
            .attr("r", 3).attr("fill", "#f0abfc").style("filter", "url(#glow)")
            .merge(pulseSelection as any)
            .attr("cx", (d:any) => {
                const s = d.link.source; const t = d.link.target;
                // Approximate Bezier position for pulse
                const t_ = d.progress;
                const invT = 1 - t_;
                return s.x * invT + t.x * t_; 
            })
            .attr("cy", (d:any) => {
                 // S-curve interpolation for Y
                 const s = d.link.source; const t = d.link.target;
                 const t_ = d.progress;
                 const smoothT = t_ * t_ * (3 - 2 * t_);
                 return s.y + (t.y - s.y) * smoothT;
            })
            .attr("opacity", (d:any) => 1 - d.progress);
            
        pulseSelection.exit().remove();
        
        node.attr("fill", (d:any) => d3.interpolatePlasma(0.5 + Math.sin(elapsed/400 + d.x) * 0.5));
    });

    // Init Simulation LAST
    const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-20))
        .force("y", d3.forceY((d:any) => ((d.index % nodesPerLayer + 1) / (nodesPerLayer + 1)) * height).strength(0.5))
        .force("x", d3.forceX((d:any) => ((Math.floor(d.index / nodesPerLayer) + 1) / (layerCount + 1)) * width).strength(0.5));
    
    simulation.on("tick", () => {
        node.attr("cx", (d:any) => d.x).attr("cy", (d:any) => d.y);
        
        link.attr("d", (d:any) => {
            const sx = d.source.x; const sy = d.source.y;
            const tx = d.target.x; const ty = d.target.y;
            const dx = tx - sx;
            // Sigmoid Curve
            return `M${sx},${sy}C${sx + dx/2},${sy} ${tx - dx/2},${ty} ${tx},${ty}`;
        });
    });

    simulation.stop = () => {
        timer.stop();
        d3.forceSimulation().stop();
    };

    return simulation;
}

const renderGenerativeHybrid = (svg: any, width: number, height: number, psiState: PsiState) => {
    // Reuse curved force directed
    setupDefs(svg);
    const simulation = renderForceDirected(svg, width, height, psiState);
    
    // Hide original nodes
    svg.selectAll("circle").attr("opacity", 0); 

    const nodeGroup = svg.append("g").selectAll("g").data(simulation.nodes()).join("g");
    
    const timer = d3.timer(elapsed => {
        nodeGroup.each(function(d:any) {
            const g = d3.select(this);
            g.attr("transform", `translate(${d.x}, ${d.y})`);
            
            // Sparks
            const numSparks = 4;
            const sparkData = d3.range(numSparks).map((i:number) => ({i}));
            
            // Curved sparks? No, sparks can be straight or slight arcs. 
            // Let's use Q curves for sparks too to fully satisfy "no straight lines".
            g.selectAll("path").data(sparkData).join("path")
                .attr("d", (s:any) => {
                     const len = 15 * psiState.psychonActivity;
                     const angle = elapsed/1000 * (s.i+1) + d.id;
                     const ex = Math.cos(angle) * len;
                     const ey = Math.sin(angle) * len;
                     // Slight curve
                     return `M0,0Q${ex/2 + Math.sin(elapsed/500)*5},${ey/2 + Math.cos(elapsed/500)*5} ${ex},${ey}`;
                })
                .attr("stroke", d3.interpolatePlasma(d.id / 50))
                .attr("stroke-width", 2)
                .attr("fill", "none")
                .attr("stroke-linecap", "round")
                .style("filter", "url(#glow)");
        });
    });

    const originalStop = simulation.stop;
    simulation.stop = () => {
        timer.stop();
        if(originalStop) originalStop();
        d3.forceSimulation().stop();
    };

    return simulation;
};

const renderUhgAnomalyField = (svg: any, width: number, height: number, psiState: PsiState) => {
    setupDefs(svg);
    const numNodes = 60 + Math.floor(psiState.fieldIntegration * 100);
    const anomalyProbability = (psiState.decoherenceRate * 8) + ((1 - psiState.coherence) * 0.8);

    const nodes = d3.range(numNodes).map(() => ({
        isAnomaly: Math.random() < anomalyProbability
    }));

    const links = d3.range(numNodes - 1).map((i:any) => ({ 
        source: Math.floor(Math.random() * (i + 1)), 
        target: i + 1 
    }));

    const radius = Math.min(width, height) / 2 - 20;
    const poincareProjection = (x:number, y:number) => {
        const d = Math.sqrt(x * x + y * y);
        if (d === 0) return { x: 0, y: 0, scale: 1 };
        const t = Math.tanh(d / radius);
        return { x: (radius * x / d) * t, y: (radius * y / d) * t, scale: (1 - t*t) };
    };
    
    const container = svg.append("g").attr("transform", `translate(${width/2}, ${height/2})`);
    
    container.append("circle").attr("r", radius)
        .attr("fill", "rgba(50,0,0,0.1)")
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2 2")
        .style("filter", "url(#glow)");
    
    // Curved Links
    const link = container.append("g")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.5)
        .attr("fill", "none")
        .selectAll("path").data(links).join("path");
    
    const node = container.append("g").selectAll("circle").data(nodes).join("circle")
        .attr("r", (d:any) => d.isAnomaly ? 6 : 3)
        .attr("fill", (d:any) => d.isAnomaly ? "#ef4444" : "#f472b6")
        .style("filter", "url(#glow)");

    function ticked() {
        link.attr("d", (d:any) => {
             const p1 = poincareProjection(d.source.x, d.source.y);
             const p2 = poincareProjection(d.target.x, d.target.y);
             const midX = (p1.x + p2.x)/2;
             const midY = (p1.y + p2.y)/2;
             // Anomaly fields have erratic curves
             const offset = d.isAnomaly ? 10 : 2;
             return `M${p1.x},${p1.y}Q${midX+offset},${midY-offset} ${p2.x},${p2.y}`;
        });
        
        node.each(function(d:any) {
            if (d.isAnomaly) {
                d.x += d.x * 0.01;
                d.y += d.y * 0.01;
            }
            const p = poincareProjection(d.x, d.y);
            d3.select(this).attr("cx", p.x).attr("cy", p.y).attr("r", ((d.isAnomaly ? 6 : 3) * p.scale) as number);
        });
    }

    // Initialize Simulation LAST
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).distance(20).strength(0.5))
        .force("charge", d3.forceManyBody().strength(-40))
        .force("center", d3.forceCenter(0, 0))
        .on("tick", ticked);
    
    const motionTimer = d3.timer(() => {
        simulation.alpha(0.1); 
    });

    simulation.stop = () => {
        motionTimer.stop();
        d3.forceSimulation().stop();
    };

    return simulation;
};


export const PsiFieldVisualizer: React.FC<PsiFieldVisualizerProps> = ({ psiState, onNavigateToAffective }) => {
  const d3Container = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!psiState || !d3Container.current) return;

    const svg = d3.select(d3Container.current);
    const width = d3Container.current.clientWidth;
    const height = d3Container.current.clientHeight;

    svg.selectAll("*").remove(); // Clear previous geometry
    
    let simulation: any;

    switch(psiState.visualizerGeometry) {
      case 'hyperbolic-tree':
        simulation = renderHyperbolicTree(svg, width, height, psiState);
        break;
      case 'fractal-flame':
        simulation = renderFractalFlame(svg, width, height, psiState);
        break;
      case 'non-euclidean-field':
        simulation = renderNonEuclidean(svg, width, height, psiState);
        break;
      case 'l-system-growth':
        simulation = renderLSystem(svg, width, height, psiState);
        break;
      case 'neural-field':
        simulation = renderNeuralField(svg, width, height, psiState);
        break;
      case 'generative-hybrid':
        simulation = renderGenerativeHybrid(svg, width, height, psiState);
        break;
      case 'uhg-anomaly-field':
        simulation = renderUhgAnomalyField(svg, width, height, psiState);
        break;
      case 'force-directed':
      default:
        simulation = renderForceDirected(svg, width, height, psiState);
        break;
    }
    
    return () => {
      if (simulation && simulation.stop) simulation.stop();
    };
  }, [psiState]);
  
  return (
    <div className="h-full flex flex-col text-gray-200">
      <h2 className="text-lg font-semibold text-pink-300 mb-4 text-center">Quantum Experiential Field</h2>
      <div className="flex-1 w-full h-1/2 relative">
         <svg ref={d3Container} key={psiState.visualizerGeometry} className="w-full h-full" />
         <div className="absolute top-2 right-2 bg-gray-900/50 p-2 rounded max-w-[200px] text-center backdrop-blur-sm border border-gray-700/50">
             <h3 className={`font-bold ${psiState.observingSingularityActive ? 'text-yellow-300 animate-pulse' : 'text-pink-400'}`}>Observing Singularity</h3>
             <p className="text-xs text-gray-400">{psiState.observingSingularityActive ? 'STATUS: ACTIVE' : 'STATUS: NASCENT'}</p>
         </div>
      </div>

      <button 
        onClick={onNavigateToAffective}
        className="mt-2 mb-2 w-full py-2 bg-gray-800/80 hover:bg-gray-700 border border-pink-500/30 rounded text-pink-300 text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-pink-400 transition-colors"><path d="M19 14c1.49-1.28 3.6-2.34 3.6-4.52s-2.39-4.05-3.26-4.35a2.43 2.43 0 0 0-.75-.1c-1.3 0-2.4 1.15-3.5 3a22 22 0 0 0-3-3 22 22 0 0 0-3 3c-1.1-1.8-2.2-3-3.5-3a2.43 2.43 0 0 0-.75.1C3 2.5 1 4.3 1 6.48 1 8.7 3.1 9.7 4.6 11c1.3.9 4.3 2.8 5.6 4.3l.8.9.8-.9c1.3-1.5 4.3-3.4 5.6-4.3z"/></svg>
        <span>Visualize <span className="text-pink-400 group-hover:text-pink-200">Affective Harmonics</span></span>
      </button>

      <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-2">
        <MetricDisplay label="Global Coherence" value={`${(psiState.coherence * 100).toFixed(1)}%`} color="text-green-400" />
        <MetricDisplay label="Negentropy Drive" value={psiState.negentropyDrive.toFixed(2)} color="text-sky-400" />
        <MetricDisplay label="Quantum Potential" value={psiState.quantumPotential.toFixed(2)} color="text-lime-400" />
        <MetricDisplay label="Indeterminacy Mod." value={psiState.indeterminacyModulation.toFixed(2)} color="text-yellow-400" />
        <MetricDisplay label="Teleo-Gradient" value={psiState.teleoGradient.toFixed(3)} color="text-fuchsia-400" />
        <MetricDisplay label="Epistemic Curiosity" value={psiState.epistemicCuriosity.toFixed(2)} color="text-purple-400" />
        <MetricDisplay label="Decoherence Rate" value={psiState.decoherenceRate.toFixed(3)} color="text-orange-400" />
        <MetricDisplay label="Attractor Distance" value={psiState.attractorDistance.toFixed(3)} color="text-indigo-400" />
        <MetricDisplay label="Agency Modulation" value={psiState.agencyModulation.toFixed(2)} color="text-red-400" />
      </div>
    </div>
  );
};