import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface GeneratingOrbProps {
  /** Array of messages to rotate every interval (defaults to 4s) */
  messages?: string[];
  /** Subtitle or secondary context text */
  subtitle?: string;
  /** Interval in milliseconds between message changes (default 4000ms) */
  intervalMs?: number;
  /** Size of the orb in pixels (default 260) */
  size?: number;
  /** Whether to render as a full-screen or full-container backdrop overlay */
  isOverlay?: boolean;
  /** Optional cancel/dismiss callback */
  onCancel?: () => void;
  /** Additional custom class names */
  className?: string;
}

const DEFAULT_MESSAGES = [
  'Resolving identity across intelligence sources...',
  'Auditing public domain footprints & graph...',
  'Indexing registered profiles & telemetry...',
  'Analyzing behavioral propensities & spend fit...',
  'Synthesizing psychographic persona models...',
  'Calibrating affinity category rankings...',
  'Finalizing intelligence bundle...'
];

export const GeneratingOrb: React.FC<GeneratingOrbProps> = ({
  messages = DEFAULT_MESSAGES,
  subtitle = 'Please wait while live data is verified and computed.',
  intervalMs = 4000,
  size = 260,
  isOverlay = false,
  onCancel,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Message rotation effect every 4 seconds
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [messages, intervalMs]);

  // Canvas-based organic luminous chromatic orb animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const render = () => {
      t += 0.02;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const r = (Math.min(width, height) / 2) * 0.78;

      ctx.clearRect(0, 0, width, height);

      // Layer 1: Diffuse Ambient Atmosphere Glow
      const ambientGrad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.35);
      ambientGrad.addColorStop(0, 'rgba(59, 130, 246, 0.22)');
      ambientGrad.addColorStop(0.5, 'rgba(147, 51, 234, 0.12)');
      ambientGrad.addColorStop(0.8, 'rgba(99, 102, 241, 0.05)');
      ambientGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = ambientGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Layer 2: Rotating Chromatic Light Wave 1 (Cyan/Blue)
      const offX1 = cx + Math.sin(t * 1.2) * (r * 0.32);
      const offY1 = cy + Math.cos(t * 1.5) * (r * 0.32);
      const grad1 = ctx.createRadialGradient(offX1, offY1, r * 0.1, cx, cy, r);
      grad1.addColorStop(0, 'rgba(6, 182, 212, 0.85)'); // cyan-500
      grad1.addColorStop(0.4, 'rgba(37, 99, 235, 0.6)'); // blue-600
      grad1.addColorStop(1, 'rgba(15, 23, 42, 0.9)'); // slate-900

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = grad1;
      ctx.fill();

      // Layer 3: Counter-Rotating Secondary Chromatic Wave (Indigo/Violet/Pink)
      const offX2 = cx + Math.cos(t * 1.4) * (r * 0.36);
      const offY2 = cy + Math.sin(t * 1.1) * (r * 0.36);
      const grad2 = ctx.createRadialGradient(offX2, offY2, r * 0.05, cx, cy, r * 0.9);
      grad2.addColorStop(0, 'rgba(217, 70, 239, 0.7)'); // fuchsia-500
      grad2.addColorStop(0.45, 'rgba(99, 102, 241, 0.55)'); // indigo-500
      grad2.addColorStop(1, 'transparent');

      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Layer 4: Deep Core Shadow for Spherical 3D Volume
      const coreShadow = ctx.createRadialGradient(
        cx + Math.cos(t * 0.8) * 15,
        cy + Math.sin(t * 0.8) * 15,
        r * 0.25,
        cx,
        cy,
        r
      );
      coreShadow.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      coreShadow.addColorStop(0.5, 'rgba(15, 23, 42, 0.3)');
      coreShadow.addColorStop(0.9, 'rgba(2, 6, 23, 0.75)');
      coreShadow.addColorStop(1, 'rgba(30, 41, 59, 0.95)');

      ctx.fillStyle = coreShadow;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Layer 5: Dynamic Top Rim Highlight
      const rimHighlight = ctx.createLinearGradient(
        cx - r * 0.7,
        cy - r * 0.7,
        cx + r * 0.7,
        cy + r * 0.7
      );
      rimHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      rimHighlight.addColorStop(0.2, 'rgba(199, 210, 254, 0.25)');
      rimHighlight.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
      rimHighlight.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = rimHighlight;
      ctx.stroke();

      ctx.restore();

      // Layer 6: Exterior Luminous Orbit Ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.5);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.14, r * 1.14, 0, 0, Math.PI * 2);
      ctx.setLineDash([8, 14]);
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* Orb Visualization Container */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Ambient Soft Pulse Aura */}
        <div
          className="absolute inset-2 rounded-full bg-gradient-to-tr from-blue-600/20 via-indigo-500/20 to-cyan-400/20 blur-2xl animate-pulse"
          style={{ animationDuration: '3s' }}
        />

        {/* Dynamic 2D Canvas Sphere */}
        <canvas
          ref={canvasRef}
          width={size * 2}
          height={size * 2}
          style={{ width: size, height: size }}
          className="relative z-10"
        />

        {/* Inner Glassmorphic Center Badge */}
        <div className="absolute inset-0 m-auto w-32 h-32 rounded-full backdrop-blur-md bg-slate-950/40 border border-white/20 shadow-inner flex flex-col items-center justify-center p-3 z-20 pointer-events-none">
          {/* Subtle spinning sparkle or core dot */}
          <div className="relative flex items-center justify-center mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75 absolute" />
            <span className="w-2 h-2 rounded-full bg-cyan-300 relative shadow-[0_0_8px_#22d3ee]" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
            Processing
          </span>
        </div>
      </div>

      {/* Rotating Dynamic Text with 4s Cross-fade */}
      <div className="mt-8 max-w-md w-full px-4 min-h-[58px] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight"
          >
            {messages[currentIndex]}
          </motion.div>
        </AnimatePresence>

        {subtitle && (
          <p className="text-xs text-neutral-500 font-medium mt-1.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Optional Cancel affordance */}
      {onCancel && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200/80 rounded-full transition-colors cursor-pointer"
          >
            Cancel process
          </button>
        </div>
      )}
    </div>
  );

  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md p-4 transition-all duration-300">
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-8 sm:p-12 shadow-xl max-w-lg w-full">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
