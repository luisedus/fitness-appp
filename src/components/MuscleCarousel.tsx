import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MuscleCarouselProps {
  onSelectMuscle: (muscle: string) => void;
  activeMuscle: string;
}

const MUSCLE_GROUPS = [
  { name: 'Pecho', image: '/muscles/pecho.jpg' },
  { name: 'Espalda', image: '/muscles/espalda.jpg' },
  { name: 'Hombros', image: '/muscles/hombros.jpg' },
  { name: 'Bíceps', image: '/muscles/biceps.jpg' },
  { name: 'Tríceps', image: '/muscles/triceps.jpg' },
  { name: 'Abdomen', image: '/muscles/abdomen.jpg' },
  { name: 'Glúteos', image: '/muscles/gluteos.jpg' },
  { name: 'Cuádriceps', image: '/muscles/cuadriceps.jpg' },
  { name: 'Isquiotibiales', image: '/muscles/isquiotibiales.jpg' },
  { name: 'Gemelos', image: '/muscles/gemelos.jpg' },
  { name: 'Full Body', image: '/muscles/fullbody.jpg' },
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
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            style={{
              position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'hsl(var(--graphite) / 0.95)', border: '1px solid hsl(var(--neon) / 0.4)',
              color: 'hsl(var(--neon))', cursor: 'pointer', fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)',
            }}
          >‹</button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            style={{
              position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'hsl(var(--graphite) / 0.95)', border: '1px solid hsl(var(--neon) / 0.4)',
              color: 'hsl(var(--neon))', cursor: 'pointer', fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)',
            }}
          >›</button>
        )}

        <div
          ref={scrollRef}
          style={{
            display: 'flex', gap: '0.85rem', overflowX: 'auto', scrollbarWidth: 'none',
            padding: '0.25rem 0', scrollSnapType: 'x mandatory',
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
                  flexShrink: 0, width: '140px', height: '180px', borderRadius: '0.85rem',
                  border: isActive ? '2px solid hsl(var(--neon))' : '1px solid hsl(var(--border))',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'flex-end',
                  scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden',
                  padding: 0, background: 'transparent',
                  boxShadow: isActive
                    ? '0 0 20px hsl(var(--neon) / 0.35), inset 0 0 30px hsl(var(--neon) / 0.1)'
                    : '0 4px 16px rgba(0,0,0,0.4)',
                  transition: 'border-color 0.2s, box-shadow 0.3s',
                }}
              >
                {/* Background image */}
                <img
                  src={mg.image}
                  alt={mg.name}
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover',
                    filter: isActive ? 'brightness(0.7) saturate(1.2)' : 'brightness(0.45) saturate(0.8)',
                    transition: 'filter 0.3s',
                  }}
                />
                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: isActive
                    ? 'linear-gradient(to top, hsl(var(--neon) / 0.4) 0%, transparent 60%)'
                    : 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
                }} />
                {/* Label */}
                <span style={{
                  position: 'relative', zIndex: 2,
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.05rem',
                  letterSpacing: '0.06em',
                  color: isActive ? 'hsl(var(--neon))' : 'hsl(var(--foreground))',
                  textAlign: 'center', lineHeight: 1.1, padding: '0.6rem 0.3rem',
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                }}>
                  {mg.name}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="muscle-active"
                    style={{
                      position: 'absolute', bottom: '6px', width: '24px', height: '3px',
                      borderRadius: '2px', background: 'hsl(var(--neon))', zIndex: 3,
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
          style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--smoke))' }}>
            Filtrando por: <strong style={{ color: 'hsl(var(--neon))' }}>{activeMuscle}</strong>
          </span>
          <button
            onClick={() => onSelectMuscle('')}
            style={{
              background: 'hsl(var(--neon) / 0.1)', border: '1px solid hsl(var(--neon) / 0.3)',
              color: 'hsl(var(--neon))', borderRadius: '9999px',
              padding: '0.15rem 0.6rem', fontSize: '0.72rem', cursor: 'pointer',
            }}
          >
            ✕ Quitar filtro
          </button>
        </motion.div>
      )}
    </div>
  );
}
