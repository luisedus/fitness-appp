import { useState } from 'react';
import { motion } from 'framer-motion';
import { requestPasswordReset } from '../lib/supabase-auth';

interface RecoveryFlowProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onClose: () => void;
}

export function RecoveryFlow({ addToast, onClose }: RecoveryFlowProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addToast('Ingresa un email válido.', 'error');
      return;
    }
    setLoading(true);
    const result = await requestPasswordReset(email);
    addToast(result.message, result.success ? 'success' : 'error');
    if (result.success) setSent(true);
    setLoading(false);
  };

  return (
    <motion.div
      key="recovery"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.3 }}
      className="glass-card"
      style={{ width: '100%', maxWidth: '440px', borderRadius: '1rem', padding: '2.5rem 2rem', textAlign: 'center' }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔑</div>
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', marginBottom: '0.5rem' }}>
        <span style={{ color: 'hsl(var(--foreground))' }}>RECUPERAR </span>
        <span style={{ color: 'hsl(var(--neon))' }}>CONTRASEÑA</span>
      </h2>

      {sent ? (
        <div>
          <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            📧 Hemos enviado un enlace de recuperación a <strong style={{ color: 'hsl(var(--neon))' }}>{email}</strong>.
            Revisa tu bandeja de entrada y la carpeta de spam.
          </p>
          <button className="btn-neon" onClick={onClose} style={{ width: '100%' }}>
            VOLVER AL LOGIN
          </button>
        </div>
      ) : (
        <div>
          <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', marginBottom: '2rem' }}>
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                className="input-dark"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <button className="btn-neon" type="submit" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
              {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE DE RECUPERACIÓN'}
            </button>
          </form>
          <button className="btn-ghost" onClick={onClose} style={{ width: '100%' }}>
            ← Volver al Login
          </button>
        </div>
      )}
    </motion.div>
  );
}
