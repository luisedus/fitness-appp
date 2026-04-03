import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { updatePassword } from '../lib/supabase-auth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 6) { setMessage('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (newPwd !== confirmPwd) { setMessage('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    const result = await updatePassword(newPwd);
    setMessage(result.message);
    setSuccess(result.success);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'hsl(var(--carbon))',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', borderRadius: '1rem', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', marginBottom: '0.5rem' }}>
          <span style={{ color: 'hsl(var(--foreground))' }}>NUEVA </span>
          <span style={{ color: 'hsl(var(--neon))' }}>CONTRASEÑA</span>
        </h1>

        {success ? (
          <div>
            <p style={{ color: 'hsl(var(--neon))', fontSize: '0.9rem', marginBottom: '1.5rem' }}>✅ {message}</p>
            <a href="/" className="btn-neon" style={{ display: 'inline-block', textDecoration: 'none', padding: '0.75rem 2rem' }}>
              IR AL LOGIN
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', marginBottom: '2rem' }}>
              Ingresa tu nueva contraseña (mínimo 6 caracteres)
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <input className="input-dark" type="password" placeholder="Nueva contraseña" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <input className="input-dark" type="password" placeholder="Confirmar contraseña" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
            </div>
            {message && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.8rem', marginBottom: '1rem' }}>{message}</p>}
            <button className="btn-neon" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'ACTUALIZANDO...' : 'ACTUALIZAR CONTRASEÑA'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
