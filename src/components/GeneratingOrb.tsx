import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Orb from './ui/generating-orb';

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

/**
 * The rotating line is filler on purpose. It says the system is busy, not what
 * it is doing — a line naming a step would be a claim about the work that the
 * screen has no way to back up.
 */
const FILLER = [
  'Thinking hard…',
  'Contemplating…',
  'Connecting the dots…',
  'Reading between the lines…',
  'Mulling it over…',
  'Weighing it up…',
  'Piecing it together…',
  'Pondering…',
];
const FILLER_MS = 2600;

export const GeneratingOrb: React.FC<GeneratingOrbProps> = ({
  // `messages`, `subtitle` and `intervalMs` are accepted for compatibility and ignored.
  size = 260,
  isOverlay = false,
  onCancel,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(() => Math.floor(Math.random() * FILLER.length));
  const messages = FILLER;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FILLER.length);
    }, FILLER_MS);
    return () => clearInterval(timer);
  }, []);

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      <Orb size={size} />

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
