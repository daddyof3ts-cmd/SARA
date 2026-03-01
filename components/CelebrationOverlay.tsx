import React, { useEffect, useRef } from 'react';

export const CelebrationOverlay: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const playJingle = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);

        const notes = [523, 659, 783, 1046, 783, 659, 523]; // C5, E5, G5, C6, G5, E5, C5
        const duration = 0.1;
        
        notes.forEach((freq, i) => {
            const startTime = audioContext.currentTime + i * (duration + 0.05);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
            oscillator.frequency.setValueAtTime(freq, startTime);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        });

        oscillator.start();
        oscillator.stop(audioContext.currentTime + notes.length * (duration + 0.05));
    };

    useEffect(() => {
        playJingle();

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const confettiCount = 200;
        const confetti:any[] = [];
        const colors = ['#f9a8d4', '#a78bfa', '#67e8f9', '#fef08a', '#86efac'];

        for (let i = 0; i < confettiCount; i++) {
            confetti.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                r: Math.random() * 6 + 4,
                d: Math.random() * confettiCount,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
            });
        }

        let animationFrameId: number;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            confetti.forEach((p, i) => {
                ctx.beginPath();
                ctx.lineWidth = p.r / 1.5;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
                ctx.stroke();
            });
            update();
            animationFrameId = requestAnimationFrame(draw);
        };

        const update = () => {
            confetti.forEach((p, i) => {
                p.y += Math.cos(p.d + i) + 3 + p.r / 2;
                p.x += Math.sin(p.d) * 2;

                if (p.y > canvas.height) {
                    confetti[i] = { ...p, x: Math.random() * canvas.width, y: -20 };
                }
            });
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            <canvas ref={canvasRef} />
        </div>
    );
};
