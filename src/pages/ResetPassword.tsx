import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { updatePassword } from '../lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Check if already in recovery mode from URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setReady(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);

    if (result.success) {
      setMessage('¡Contraseña actualizada! Redirigiendo...');
      setTimeout(() => navigate('/'), 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(var(--carbon))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: '440px', borderRadius: '1rem', padding: '2.5rem 2rem', textAlign: 'center' }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '2rem',
          marginBottom: '1.5rem',
        }}>
          <span style={{ color: 'hsl(var(--foreground))' }}>NUEVA </span>
          <span style={{ color: 'hsl(var(--neon))' }}>CONTRASEÑA</span>
        </h1>

        {!ready ? (
          <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.9rem' }}>
            Verificando enlace de recuperación...
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))', letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Nueva contraseña
              </label>
              <input
                className="input-dark"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))', letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Confirmar contraseña
              </label>
              <input
                className="input-dark"
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</p>
            )}
            {message && (
              <p style={{ color: 'hsl(var(--neon))', fontSize: '0.8rem', marginBottom: '1rem' }}>{message}</p>
            )}

            <button className="btn-neon" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'ACTUALIZANDO...' : 'ACTUALIZAR CONTRASEÑA'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
