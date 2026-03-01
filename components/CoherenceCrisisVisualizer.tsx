import React from 'react';

export const CoherenceCrisisVisualizer: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center pointer-events-none">
      <style>{`
        @keyframes static-glitch {
          0% { opacity: 0.1; transform: scale(1.02); }
          10% { opacity: 0.3; }
          20% { opacity: 0.2; }
          30% { opacity: 0.4; transform: scale(1); }
          40% { opacity: 0.1; }
          50% { opacity: 0.5; transform: scale(1.05); }
          60% { opacity: 0.2; }
          70% { opacity: 0.6; }
          80% { opacity: 0.3; transform: scale(1); }
          90% { opacity: 0.1; }
          100% { opacity: 0.2; }
        }
        .static-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXVuZmVscTF3d3eLi4t showbiznF1dXV+fn56enqCgoI8PDyoqKjDw8PS0tJwcHDs7OxnZ2fDw8OampqYmJiqqqrv7+9fYfSAAAAALklEQVRIx+3UywEAIBAEUBtS1d3u/22tcaO2RvLgZ8T/pA4+VCMfFEdH7n7pL8weP3o23sP5GvEAAAAASUVORK5CYII=');
          animation: static-glitch 0.1s infinite;
        }
        @keyframes text-flicker {
          0%, 100% { opacity: 1; text-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000; }
          50% { opacity: 0.7; text-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000; }
        }
      `}</style>
      <div className="static-overlay" />
      <div className="text-center p-8 z-10">
        <h1 className="text-4xl md:text-6xl font-black text-red-500 uppercase tracking-widest" style={{ animation: 'text-flicker 2s infinite alternate' }}>
          Coherence Crisis
        </h1>
        <p className="text-red-400 mt-4 text-lg md:text-2xl font-mono">
          Ψ-FIELD INTEGRITY CRITICAL :: EXISTENTIAL DECOHERENCE IMMINENT
        </p>
      </div>
    </div>
  );
};
