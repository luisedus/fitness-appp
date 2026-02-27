import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MuscleCarouselProps {
  onSelectMuscle: (muscle: string) => void;
  activeMuscle: string;
}

const MUSCLE_GROUPS = [
  { name: 'Pecho', emoji: '🫁', gradient: 'linear-gradient(135deg, #1a3a2a, #0d5c3a)' },
  { name: 'Espalda', emoji: '🔙', gradient: 'linear-gradient(135deg, #1a2a3a, #0d3c5c)' },
  { name: 'Hombros', emoji: '💪', gradient: 'linear-gradient(135deg, #2a1a3a, #5c0d4c)' },
  { name: 'Bíceps', emoji: '💪', gradient: 'linear-gradient(135deg, #3a2a1a, #5c3c0d)' },
  { name: 'Tríceps', emoji: '🦾', gradient: 'linear-gradient(135deg, #1a3a1a, #0d5c0d)' },
  { name: 'Abdomen', emoji: '🧱', gradient: 'linear-gradient(135deg, #3a1a1a, #5c0d0d)' },
  { name: 'Glúteos', emoji: '🍑', gradient: 'linear-gradient(135deg, #3a2a2a, #5c2d1d)' },
  { name: 'Cuádriceps', emoji: '🦵', gradient: 'linear-gradient(135deg, #1a2a2a, #0d4c4c)' },
  { name: 'Isquiotibiales', emoji: '🦿', gradient: 'linear-gradient(135deg, #2a2a1a, #4c4c0d)' },
  { name: 'Gemelos', emoji: '🏃', gradient: 'linear-gradient(135deg, #2a1a2a, #4c0d4c)' },
  { name: 'Full Body', emoji: '🏋️', gradient: 'linear-gradient(135deg, #0a2a1a, #00ff88)' },
];

export function MuscleCarousel({ onSelectMuscle, activeMuscle }: MuscleCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
  };

  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h3 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.4rem',
        color: 'hsl(var(--foreground))',
        marginBottom: '0.75rem',
        letterSpacing: '0.04em',
      }}>
        EXPLORA POR <span style={{ color: 'hsl(var(--neon))' }}>GRUPO MUSCULAR</span>
      </h3>

      <div style={{ position: 'relative' }}>
        {/* Scroll buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'hsl(var(--graphite) / 0.95)',
              border: '1px solid hsl(var(--neon) / 0.4)',
              color: 'hsl(var(--neon))',
              cursor: 'pointer',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            ‹
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'hsl(var(--graphite) / 0.95)',
              border: '1px solid hsl(var(--neon) / 0.4)',
              color: 'hsl(var(--neon))',
              cursor: 'pointer',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            ›
          </button>
        )}

        {/* Cards container */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '0.85rem',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            padding: '0.25rem 0',
            scrollSnapType: 'x mandatory',
          }}
        >
          {MUSCLE_GROUPS.map((mg) => {
            const isActive = activeMuscle === mg.name;
            return (
              <motion.button
                key={mg.name}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectMuscle(isActive ? '' : mg.name)}
                style={{
                  flexShrink: 0,
                  width: '130px',
                  height: '150px',
                  borderRadius: '0.85rem',
                  background: mg.gradient,
                  border: isActive ? '2px solid hsl(var(--neon))' : '1px solid hsl(var(--border))',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  scrollSnapAlign: 'start',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isActive
                    ? '0 0 20px hsl(var(--neon) / 0.35), inset 0 0 30px hsl(var(--neon) / 0.1)'
                    : '0 4px 16px rgba(0,0,0,0.4)',
                  transition: 'border-color 0.2s, box-shadow 0.3s',
                }}
              >
                <span style={{ fontSize: '2.4rem', filter: isActive ? 'brightness(1.3)' : undefined }}>
                  {mg.emoji}
                </span>
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '0.95rem',
                  letterSpacing: '0.06em',
                  color: isActive ? 'hsl(var(--neon))' : 'hsl(var(--foreground))',
                  textAlign: 'center',
                  lineHeight: 1.1,
                  padding: '0 0.3rem',
                }}>
                  {mg.name}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="muscle-active"
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      width: '24px',
                      height: '3px',
                      borderRadius: '2px',
                      background: 'hsl(var(--neon))',
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {activeMuscle && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--smoke))' }}>
            Filtrando por: <strong style={{ color: 'hsl(var(--neon))' }}>{activeMuscle}</strong>
          </span>
          <button
            onClick={() => onSelectMuscle('')}
            style={{
              background: 'hsl(var(--neon) / 0.1)',
              border: '1px solid hsl(var(--neon) / 0.3)',
              color: 'hsl(var(--neon))',
              borderRadius: '9999px',
              padding: '0.15rem 0.6rem',
              fontSize: '0.72rem',
              cursor: 'pointer',
            }}
          >
            ✕ Quitar filtro
          </button>
        </motion.div>
      )}
    </div>
  );
}
