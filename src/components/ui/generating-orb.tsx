import React from 'react';

/**
 * Generating Orb — CSS renderer.
 *
 * API-compatible with the 21st.dev "generating-orb" component (same props, same
 * default export), so the original source can be dropped over this file with no
 * other change. This is a re-creation, not a copy of that source.
 */
export interface GeneratingOrbProps {
  renderer?: 'css' | 'canvas';
  size?: number;
  depth?: number;
  speed?: number;
  /** Length of one letter pulse, ms */
  duration?: number;
  /** Delay between letters, ms */
  stagger?: number;
  /** Peak scale of a letter */
  pop?: number;
  restOpacity?: number;
  textSize?: number;
  tracking?: number;
  text?: string;
  showText?: boolean;
  highlightColor?: string;
  haloColor?: string;
  coreColor?: string;
  haloColorAlt?: string;
  coreColorAlt?: string;
  textColor?: string;
  playback?: 'play' | 'pause';
  className?: string;
}

const GeneratingOrb: React.FC<GeneratingOrbProps> = ({
  size = 240,
  depth = 1,
  speed = 1,
  duration = 2000,
  stagger = 100,
  pop = 1.15,
  restOpacity = 0.4,
  textSize = 1.2,
  tracking = 0,
  text = 'Generating',
  showText = true,
  highlightColor = '#ffffff',
  haloColor = '#ad5fff',
  coreColor = '#471eec',
  haloColorAlt = '#d60a47',
  coreColorAlt = '#311e80',
  textColor = '#ffffff',
  playback = 'play',
  className = '',
}) => {
  const state = playback === 'play' ? 'running' : 'paused';
  const spin = (s: number) => `${s / Math.max(speed, 0.1)}s`;
  const letters = Array.from(text);
  const d = Math.max(0, Math.min(depth, 2));

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label={text}
    >
      <style>{`
        @keyframes go-spin { to { transform: rotate(360deg); } }
        @keyframes go-spin-rev { to { transform: rotate(-360deg); } }
        @keyframes go-breathe { 0%,100% { transform: scale(1); opacity:.85 } 50% { transform: scale(1.07); opacity:1 } }
        @keyframes go-letter { 0%,55%,100% { opacity: var(--go-rest); transform: scale(1); } 22% { opacity: 1; transform: scale(var(--go-pop)); } }
        @media (prefers-reduced-motion: reduce) { .go-anim { animation: none !important; } }
      `}</style>

      {/* Halo */}
      <div
        className="go-anim absolute rounded-full"
        style={{
          inset: -size * 0.12,
          background: `radial-gradient(circle, ${haloColor}66 0%, ${haloColorAlt}22 45%, transparent 70%)`,
          filter: `blur(${size * 0.08}px)`,
          animation: `go-breathe ${spin(4)} ease-in-out infinite`,
          animationPlayState: state,
        }}
      />

      {/* Sphere */}
      <div
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 55%, ${coreColor} 0%, ${coreColorAlt} 55%, #0b0720 100%)`,
          boxShadow: `inset 0 ${-size * 0.06 * d}px ${size * 0.15 * d}px ${coreColorAlt}, 0 0 ${size * 0.2}px ${haloColor}55`,
        }}
      >
        {/* Colour currents */}
        <div
          className="go-anim absolute"
          style={{
            inset: '-25%',
            background: `conic-gradient(from 0deg, transparent 0 20%, ${haloColor}cc 35%, transparent 55%, ${haloColorAlt}aa 75%, transparent 90%)`,
            filter: `blur(${size * 0.09}px)`,
            mixBlendMode: 'screen',
            opacity: 0.55 * (0.5 + d / 2),
            animation: `go-spin ${spin(9)} linear infinite`,
            animationPlayState: state,
          }}
        />
        <div
          className="go-anim absolute"
          style={{
            inset: '-10%',
            background: `radial-gradient(circle at 30% 70%, ${haloColorAlt}99 0%, transparent 45%), radial-gradient(circle at 72% 30%, ${haloColor}99 0%, transparent 42%)`,
            filter: `blur(${size * 0.06}px)`,
            mixBlendMode: 'screen',
            opacity: 0.6,
            animation: `go-spin-rev ${spin(13)} linear infinite`,
            animationPlayState: state,
          }}
        />
        {/* Specular highlight */}
        <div
          className="absolute rounded-full"
          style={{
            left: '16%', top: '8%', width: '48%', height: '30%',
            background: `radial-gradient(ellipse at 50% 40%, ${highlightColor}88 0%, transparent 70%)`,
            filter: `blur(${size * 0.025}px)`,
            opacity: 0.35 + 0.25 * d,
            transform: 'rotate(-18deg)',
          }}
        />
        {/* Rim */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `inset 0 0 ${size * 0.05}px ${highlightColor}55`, border: `1px solid ${highlightColor}22` }}
        />
      </div>

      {showText && (
        <div
          className="relative z-10 flex"
          style={{
            color: textColor,
            fontSize: size * 0.055 * textSize,
            letterSpacing: `${tracking}em`,
            fontWeight: 600,
            textShadow: '0 1px 8px rgba(0,0,0,0.35)',
          }}
        >
          {letters.map((ch, i) => (
            <span
              key={i}
              className="go-anim inline-block"
              style={{
                ['--go-rest' as any]: restOpacity,
                ['--go-pop' as any]: pop,
                animation: `go-letter ${duration + stagger * letters.length}ms ease-in-out ${i * stagger}ms infinite`,
                animationPlayState: state,
                whiteSpace: 'pre',
              }}
            >
              {ch}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeneratingOrb;
