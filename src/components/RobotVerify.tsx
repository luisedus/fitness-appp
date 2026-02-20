import { useState } from 'react';
import { motion } from 'framer-motion';

interface RobotVerifyProps {
  onVerified: () => void;
}

export function RobotVerify({ onVerified }: RobotVerifyProps) {
  const [checked, setChecked] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  // Simple math puzzle
  const [puzzle] = useState(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { question: `${a} + ${b} = ?`, answer: String(a + b) };
  });

  const handleCheck = () => {
    if (!checked) {
      setShowPuzzle(true);
    }
  };

  const handlePuzzleSubmit = () => {
    if (answer.trim() === puzzle.answer) {
      setChecked(true);
      setShowPuzzle(false);
      onVerified();
    } else {
      setError('Respuesta incorrecta. Intenta de nuevo.');
      setAnswer('');
    }
  };

  return (
    <div
      style={{
        background: 'hsl(var(--graphite-light))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
        cursor: checked ? 'default' : 'pointer',
      }}
      onClick={handleCheck}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '22px',
            height: '22px',
            border: `2px solid ${checked ? 'hsl(var(--neon))' : 'hsl(var(--steel))'}`,
            borderRadius: '3px',
            background: checked ? 'hsl(var(--neon))' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          {checked && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{ color: 'hsl(var(--primary-foreground))', fontSize: '0.75rem', fontWeight: 'bold' }}
            >
              ✓
            </motion.span>
          )}
        </div>
        <span style={{ color: 'hsl(var(--foreground))', fontSize: '0.9rem' }}>
          No soy un robot
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
        <span style={{ fontSize: '1.2rem' }}>🔒</span>
        <span style={{ fontSize: '0.6rem', color: 'hsl(var(--smoke))' }}>reCAPTCHA</span>
      </div>

      {showPuzzle && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div
            className="glass-card"
            style={{ padding: '2rem', borderRadius: '1rem', maxWidth: '320px', width: '90%' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', color: 'hsl(var(--neon))', marginBottom: '0.5rem' }}>
              VERIFICACIÓN
            </h3>
            <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Resuelve esta operación para confirmar que eres humano:
            </p>
            <div style={{
              background: 'hsl(var(--input))',
              borderRadius: '0.5rem',
              padding: '1rem',
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'hsl(var(--neon))',
              marginBottom: '1rem',
              letterSpacing: '0.1em',
            }}>
              {puzzle.question}
            </div>
            <input
              className="input-dark"
              type="number"
              placeholder="Tu respuesta..."
              value={answer}
              onChange={e => { setAnswer(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handlePuzzleSubmit()}
              style={{ marginBottom: '0.75rem' }}
              autoFocus
            />
            {error && (
              <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                {error}
              </p>
            )}
            <button className="btn-neon" style={{ width: '100%' }} onClick={handlePuzzleSubmit}>
              VERIFICAR
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
