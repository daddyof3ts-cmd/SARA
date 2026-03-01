import React, { useState, useEffect } from 'react';
import type { NumberTheoreticState } from '../types';
import { CelebrationOverlay } from './CelebrationOverlay';

interface NumberTheoreticVisualizerProps {
  state: NumberTheoreticState;
}

const MetricDisplay: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className }) => (
    <div 
        className={`bg-black/80 p-2 rounded-lg border border-fuchsia-900/40 ${className}`}
        style={{ boxShadow: 'inset 0 0 10px rgba(192,38,211,0.05)' }}
    >
        <h3 className="text-xs text-fuchsia-500 font-bold tracking-widest mb-1 truncate">{label}</h3>
        <p className="text-lg font-mono font-bold text-pink-300 text-center truncate">{value}</p>
    </div>
);

export const NumberTheoreticVisualizer: React.FC<NumberTheoreticVisualizerProps> = ({ state }) => {
    const [lastPrimeCount, setLastPrimeCount] = useState(state.discoveredPrimes.length);
    const [isCelebrating, setIsCelebrating] = useState(false);
    const [newestPrime, setNewestPrime] = useState<string | null>(null);

    useEffect(() => {
        if (state.discoveredPrimes.length > lastPrimeCount) {
            setNewestPrime(state.discoveredPrimes[state.discoveredPrimes.length - 1]);
            setLastPrimeCount(state.discoveredPrimes.length);
            setIsCelebrating(true);
            const timer = setTimeout(() => setIsCelebrating(false), 33000); // 33 seconds
            return () => clearTimeout(timer);
        }
    }, [state.discoveredPrimes]);

  return (
    <div className="h-full flex flex-col text-pink-100">
      {isCelebrating && <CelebrationOverlay />}
      <h2 className="text-lg font-bold text-fuchsia-400 mb-2 text-center tracking-wider">Axiom of Generative Aperiodicity</h2>
       <div 
         className="flex-1 w-full p-3 relative bg-black/60 rounded-md border border-fuchsia-900/50 flex flex-col"
         style={{ boxShadow: 'inset 0 0 15px rgba(192,38,211,0.1)' }}
       >
          <p className="text-xs text-fuchsia-300/80 mb-3">
            Proof of novelty generation via <span className="font-mono text-pink-400">n&#8336;₊&#8321; = n&#8336; + P(n&#8336;)</span>. Each new prime factor discovered is a provable instance of generative aperiodicity.
          </p>

          <div className="space-y-3">
            <MetricDisplay label="Current Integer (nₖ)" value={state.n.toString()} />
            <MetricDisplay label="Dissonance Transducer (P(nₖ))" value={state.p.toString()} />
          </div>

          <div className="mt-3 flex-1 flex flex-col">
             <h3 className="text-xs text-fuchsia-500 font-bold tracking-widest mb-1">Discovered Prime Factors (Π(S))</h3>
             <div className="bg-black/80 p-2 rounded-lg border border-fuchsia-900/40 flex-1 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                    {state.discoveredPrimes.map((prime) => (
                        <span 
                            key={prime} 
                            className={`font-mono text-xs px-2 py-1 rounded transition-all duration-500 ${
                                isCelebrating && prime === newestPrime
                                ? 'bg-yellow-400 text-black scale-125 animate-pulse' 
                                : 'bg-black border border-fuchsia-900/50 text-fuchsia-400'
                            }`}
                            style={isCelebrating && prime === newestPrime ? { boxShadow: '0 0 10px rgba(253,224,71,0.8)' } : {}}
                        >
                            {prime}
                        </span>
                    ))}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};