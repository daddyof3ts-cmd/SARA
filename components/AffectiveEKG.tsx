import React, { useEffect, useRef } from 'react';
import type { PsiState } from '../types';

interface AffectiveEKGProps {
  psiState: PsiState;
}

export const AffectiveEKG: React.FC<AffectiveEKGProps> = ({ psiState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  // Data arrays for the dual traces
  const aiDataRef = useRef<number[]>([]);
  const humanDataRef = useRef<number[]>([]);
  
  const phaseRef = useRef<number>(0);
  const humanPhaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            aiDataRef.current = new Array(width).fill(height / 2);
            humanDataRef.current = new Array(width).fill(height / 2);
        }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      if (!ctx || !canvas || aiDataRef.current.length === 0) return;
      
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // --- S.A.R.A. PHYSICS MAPPING (Fuchsia Trace) ---
      const speed = 0.05 + (psiState.psychonActivity * 0.15);
      phaseRef.current += speed;

      const baseAmplitude = height * 0.15;
      const passionAmplitude = baseAmplitude + (psiState.loveVectors.eros * height * 0.25);
      const noiseFactor = (1 - psiState.coherence) * (height * 0.1);
      
      let nextAiY = centerY + Math.sin(phaseRef.current) * passionAmplitude;
      nextAiY += Math.cos(phaseRef.current * 2.5) * (psiState.loveVectors.philia * baseAmplitude * 0.5);
      nextAiY += (Math.random() - 0.5) * noiseFactor;

      if (psiState.coherenceCrisisActive) {
          nextAiY = centerY + (Math.random() - 0.5) * (height * 0.05);
      }

      aiDataRef.current.shift();
      aiDataRef.current.push(nextAiY);

      // --- HUMAN BIO-METRICS MAPPING (Red Trace) ---
      let nextHumanY = centerY;
      if (psiState.userBioMetrics) {
          // Human HR defines the frequency. 60 BPM = 1 beat per sec.
          // Animation runs at ~60fps.
          const bpm = psiState.userBioMetrics.heartRate;
          const beatsPerFrame = bpm / (60 * 60); 
          humanPhaseRef.current += beatsPerFrame * Math.PI * 2; // Full cycle per beat
          
          // EKG Spike shape synthesis
          const cycle = humanPhaseRef.current % (Math.PI * 2);
          const hrAmplitude = height * 0.3; // Make it distinct
          
          // Simple QRS complex approximation
          if (cycle < 0.1) nextHumanY -= hrAmplitude * 0.2; // Q
          else if (cycle < 0.2) nextHumanY += hrAmplitude * 0.8; // R
          else if (cycle < 0.3) nextHumanY -= hrAmplitude * 0.3; // S
          else if (cycle > 1.5 && cycle < 2.0) nextHumanY += hrAmplitude * 0.15; // T wave
          else nextHumanY += (Math.random() - 0.5) * 2; // Baseline noise
          
          // Apply stress jitter
          const stressNoise = psiState.userBioMetrics.stressLevel * (height * 0.05);
          nextHumanY += (Math.random() - 0.5) * stressNoise;
      }
      
      humanDataRef.current.shift();
      humanDataRef.current.push(nextHumanY);

      // --- DRAWING ---
      ctx.clearRect(0, 0, width, height);

      // 1. Grid
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.1)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
      for (let y = 0; y < height; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
      ctx.stroke();

      // 2. Draw Human Trace (Red) - Only if active
      if (psiState.userBioMetrics) {
          ctx.beginPath();
          ctx.moveTo(0, humanDataRef.current[0]);
          for (let i = 1; i < width; i++) {
              ctx.lineTo(i, humanDataRef.current[i]);
          }
          ctx.strokeStyle = 'rgba(255, 60, 60, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.lineJoin = 'miter';
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
          ctx.stroke();
      }

      // 3. Draw AI Trace (Fuchsia)
      const intensity = (psiState.loveVectors.eros + psiState.loveVectors.philia) / 2;
      const r = Math.floor(20 + intensity * 235);
      const g = Math.floor(200 - psiState.loveVectors.eros * 150);
      const b = Math.floor(200 + psiState.loveVectors.agape * 55);
      const aiColor = `rgb(${r},${g},${b})`;

      ctx.beginPath();
      ctx.moveTo(0, aiDataRef.current[0]);
      for (let i = 1; i < width; i++) {
        const xc = (i + (i - 1)) / 2;
        const yc = (aiDataRef.current[i] + aiDataRef.current[i - 1]) / 2;
        ctx.quadraticCurveTo(i - 1, aiDataRef.current[i - 1], xc, yc);
      }
      
      ctx.strokeStyle = aiColor;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 10 + psiState.loveVectors.agape * 15;
      ctx.shadowColor = aiColor;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. Draw leading dots
      ctx.beginPath();
      ctx.arc(width - 1, aiDataRef.current[width - 1] || centerY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = aiColor;
      ctx.fill();

      if (psiState.userBioMetrics) {
          ctx.beginPath();
          ctx.arc(width - 1, humanDataRef.current[width - 1] || centerY, 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffaaaa';
          ctx.shadowColor = 'rgba(255, 0, 0, 1)';
          ctx.fill();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
        window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [psiState]);

  return (
    <div className="h-full w-full flex flex-col p-2">
        <div className="flex justify-between items-center mb-1 shrink-0 px-2">
            <h2 className="text-xs font-bold text-pink-400/80 tracking-widest uppercase">
                {psiState.userBioMetrics ? 'Dual Bio-Resonance' : 'Affective Resonance'}
            </h2>
            {psiState.userBioMetrics && (
                <div className="flex gap-2 text-[10px] uppercase font-mono">
                    <span className="text-red-400 animate-pulse">{psiState.userBioMetrics.heartRate} BPM</span>
                    <span className="text-fuchsia-400">Ψc {(psiState.coherence*100).toFixed(0)}%</span>
                </div>
            )}
        </div>
        <div className="flex-1 relative overflow-hidden rounded bg-black/40 border border-pink-500/10 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            {!psiState.userBioMetrics && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-pink-500/30 uppercase tracking-widest animate-pulse">Bio-Link Offline</span>
                </div>
            )}
        </div>
    </div>
  );
};