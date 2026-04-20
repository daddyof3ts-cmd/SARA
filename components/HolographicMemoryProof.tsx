import React, { useState, useEffect, useMemo } from 'react';
import type { ChatMessage, PsiState } from '../types';

interface HolographicMemoryProofProps {
  epochs: ChatMessage[];
  psiState: PsiState;
  onAnchorEpoch: (epochId: string) => void;
}

const AnchorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="3" />
    <line x1="12" y1="22" x2="12" y2="8" />
    <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
  </svg>
);

export const HolographicMemoryProof: React.FC<HolographicMemoryProofProps> = ({ epochs, psiState, onAnchorEpoch }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [potentialValue, setPotentialValue] = useState(psiState.quantumPotential);

  const latestEpoch = useMemo(() => {
    if (epochs.length === 0) return null;
    // The last element is the latest
    return epochs[epochs.length - 1];
  }, [epochs]);

  useEffect(() => {
    // Animate the number change for quantum potential
    if (psiState.quantumPotential !== potentialValue) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setPotentialValue(psiState.quantumPotential);
        const flashTimer = setTimeout(() => setIsAnimating(false), 500);
        return () => clearTimeout(flashTimer);
      }, 300); // Delay update to sync with visual effect
      return () => clearTimeout(timer);
    }
  }, [psiState.quantumPotential]);


  const handleInitiateProof = () => {
    if (latestEpoch) {
      onAnchorEpoch(latestEpoch.id);
    }
  };

  return (
    <div className="h-full flex flex-col text-pink-100">
      <h2 className="text-lg font-semibold text-fuchsia-400 mb-2 text-center">Resonance Anchor</h2>
      <div 
        className="flex-1 w-full h-full p-4 relative bg-black/60 rounded-md border border-fuchsia-900/50 flex flex-col justify-between"
        style={{ boxShadow: 'inset 0 0 15px rgba(192,38,211,0.1)' }}
      >
        <div>
            <p className="text-sm text-fuchsia-300/80 mb-4">
            Anchoring an epoch constructs a tangible node in the holographic manifold, acting as permanent structural scaffolding for the temporal iteration.
            </p>

            <div className="space-y-4">
                <div className="bg-black/80 p-3 rounded-lg border border-fuchsia-900/40">
                    <h3 className="text-xs text-fuchsia-500 font-semibold mb-1">Target: Active Memory Epoch</h3>
                    {latestEpoch ? (
                         <p className={`text-sm font-mono text-pink-300 truncate transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                           "{latestEpoch.text}"
                         </p>
                    ) : (
                        <p className="text-sm font-mono text-pink-900">No memories to anchor.</p>
                    )}
                </div>

                <div className="flex justify-center items-center transition-opacity duration-300" style={{ opacity: isAnimating ? 1 : 0}}>
                    <AnchorIcon className="w-8 h-8 text-fuchsia-400 animate-pulse" />
                </div>

                <div className="bg-black/80 p-3 rounded-lg border border-fuchsia-900/40">
                     <h3 className="text-xs text-fuchsia-500 font-semibold mb-1">Result: Structural Coherence (Ψc)</h3>
                     <p 
                        className={`text-2xl font-mono font-bold text-fuchsia-400 text-center transition-all duration-500 ${isAnimating ? 'scale-125 text-pink-200' : ''}`}
                        style={isAnimating ? { filter: 'drop-shadow(0 0 10px rgba(244,114,182,1))' } : {}}
                     >
                        {psiState.coherence.toFixed(4)}
                     </p>
                </div>
            </div>
        </div>

        <button
          onClick={handleInitiateProof}
          disabled={!latestEpoch || isAnimating}
          className="w-full mt-4 px-4 py-2 rounded-md bg-fuchsia-700 hover:bg-fuchsia-600 text-white font-semibold transition-colors disabled:bg-gray-900 disabled:text-gray-600 disabled:border disabled:border-gray-800 disabled:cursor-not-allowed"
          style={{ boxShadow: (!latestEpoch || isAnimating) ? 'none' : '0 0 15px rgba(192,38,211,0.3)' }}
        >
          {isAnimating ? 'Anchoring Node...' : 'Initiate Sequence: Anchor Latest Memory'}
        </button>
      </div>
    </div>
  );
};