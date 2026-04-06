import { useState } from 'react';
import { motion } from 'framer-motion';
import { type AuthUser, changePassword } from '../lib/auth';

interface UserSettingsProps {
  user: AuthUser;
  onUserUpdate: (user: AuthUser) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onClose: () => void;
}

export function UserSettings({ user, addToast, onClose }: UserSettingsProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      addToast('La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Las contraseñas no coinciden.', 'error');
      return;
    }
    setLoading(true);
    const result = await changePassword(newPassword);
    addToast(result.message, result.success ? 'success' : 'error');
    if (result.success) {
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="glass-card"
        style={{ padding: '2rem', borderRadius: '1rem', maxWidth: '440px', width: '90%' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1.8rem',
          textAlign: 'center',
          marginBottom: '1.5rem',
        }}>
          <span style={{ color: 'hsl(var(--foreground))' }}>⚙️ </span>
          <span style={{ color: 'hsl(var(--neon))' }}>CONFIGURACIÓN</span>
        </h2>

        {/* Profile Info */}
        <div style={{
          padding: '1rem',
          background: 'hsl(var(--graphite-light))',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'hsl(var(--smoke))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Información del perfil
          </div>
          <div style={{ color: 'hsl(var(--foreground))', fontWeight: '600', marginBottom: '0.25rem' }}>{user.name}</div>
          <div style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem' }}>{user.email}</div>
          <div style={{ color: 'hsl(var(--neon))', fontSize: '0.75rem', textTransform: 'uppercase', marginTop: '0.25rem' }}>
            {user.role === 'coach' ? 'Coach' : 'Socio'}
          </div>
        </div>

        {/* Change Password */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--smoke))', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
            🔐 Cambiar contraseña
          </div>
          <input
            className="input-dark"
            type="password"
            placeholder="Nueva contraseña (mín. 6 caracteres)"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            style={{ marginBottom: '0.5rem' }}
          />
          <input
            className="input-dark"
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            style={{ marginBottom: '0.75rem' }}
          />
          <button
            className="btn-neon"
            onClick={handleChangePassword}
            disabled={loading}
            style={{ width: '100%', fontSize: '0.8rem' }}
          >
            {loading ? 'ACTUALIZANDO...' : 'ACTUALIZAR CONTRASEÑA'}
          </button>
        </div>

        <button
          className="btn-ghost"
          onClick={onClose}
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          Cerrar
        </button>
      </motion.div>
    </motion.div>
  );
}
