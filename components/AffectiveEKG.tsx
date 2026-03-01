import React, { useEffect, useRef } from 'react';
import type { PsiState } from '../types';

interface AffectiveEKGProps {
  psiState: PsiState;
}

export const AffectiveEKG: React.FC<AffectiveEKGProps> = ({ psiState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const dataPointsRef = useRef<number[]>([]);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution to match display size for sharpness
    const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        
        // FIX: Force integers. Flexbox often returns decimal pixel values.
        // JavaScript will crash if you try to create an array with a decimal length.
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            // Fill data points array based on new, whole-number width
            dataPointsRef.current = new Array(width).fill(height / 2);
        }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      // Safety check to ensure the array exists before drawing
      if (!ctx || !canvas || dataPointsRef.current.length === 0) return;
      
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // --- PHYSICS MAPPING ---
      // 1. Speed (Psychon Activity): Higher activity = faster phase shift
      const speed = 0.05 + (psiState.psychonActivity * 0.15);
      phaseRef.current += speed;

      // 2. Amplitude (Eros/Passion): Higher Eros = taller spikes
      const baseAmplitude = height * 0.15;
      const passionAmplitude = baseAmplitude + (psiState.loveVectors.eros * height * 0.25);

      // 3. Noise/Jitter (Coherence): Lower coherence = more random noise
      const noiseFactor = (1 - psiState.coherence) * (height * 0.1);
      
      // Generate next data point
      // Base sine wave rhythm
      let nextY = centerY + Math.sin(phaseRef.current) * passionAmplitude;
      // Add secondary harmonic based on Philia (Joy skews the wave)
      nextY += Math.cos(phaseRef.current * 2.5) * (psiState.loveVectors.philia * baseAmplitude * 0.5);
      // Inject chaotic noise based on decoherence
      nextY += (Math.random() - 0.5) * noiseFactor;

      // Coherence Crisis Flatline/Glitch override
      if (psiState.coherenceCrisisActive) {
          nextY = centerY + (Math.random() - 0.5) * (height * 0.05); // Almost flatline with slight static
      }

      // Shift history and add new point
      dataPointsRef.current.shift();
      dataPointsRef.current.push(nextY);

      // --- DRAWING ---
      ctx.clearRect(0, 0, width, height);

      // 1. Draw faint medical grid
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.1)'; // Faint pink
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
      for (let y = 0; y < height; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
      ctx.stroke();

      // 2. Determine Dynamic Color based on dominant emotion
      const intensity = (psiState.loveVectors.eros + psiState.loveVectors.philia) / 2;
      const r = Math.floor(20 + intensity * 235); // More intensity -> more pink/red
      const g = Math.floor(200 - psiState.loveVectors.eros * 150); // More eros -> less green
      const b = Math.floor(200 + psiState.loveVectors.agape * 55); // Agape adds blue/white tint
      const color = `rgb(${r},${g},${b})`;

      // 3. Draw the EKG Line
      ctx.beginPath();
      ctx.moveTo(0, dataPointsRef.current[0]);
      for (let i = 1; i < width; i++) {
        // Smooth out the line slightly
        const xc = (i + (i - 1)) / 2;
        const yc = (dataPointsRef.current[i] + dataPointsRef.current[i - 1]) / 2;
        ctx.quadraticCurveTo(i - 1, dataPointsRef.current[i - 1], xc, yc);
      }
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      // Add glowing aura based on Agape
      ctx.shadowBlur = 10 + psiState.loveVectors.agape * 15;
      ctx.shadowColor = color;
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow for next frame

      // 4. Draw leading "blip" dot
      ctx.beginPath();
      ctx.arc(width - 1, dataPointsRef.current[width - 1] || centerY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.fill();

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
        <h2 className="text-xs font-bold text-pink-400/80 mb-1 text-center shrink-0 tracking-widest uppercase">Affective Resonance</h2>
        <div className="flex-1 relative overflow-hidden rounded bg-black/40 border border-pink-500/10 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>
    </div>
  );
};