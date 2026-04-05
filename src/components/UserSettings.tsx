import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type AuthUser, changePassword, toggleMfa, updateSecretQuestion,
  getUserSessions, revokeSession, revokeAllSessions, type SessionRecord,
} from '../lib/auth';

interface UserSettingsProps {
  user: AuthUser;
  onUserUpdate: (user: AuthUser) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onClose: () => void;
}

type SettingsTab = 'password' | 'mfa' | 'sessions';

export function UserSettings({ user, onUserUpdate, addToast, onClose }: UserSettingsProps) {
  const [tab, setTab] = useState<SettingsTab>('password');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [secretQ, setSecretQ] = useState(user.secretQuestion || '');
  const [secretA, setSecretA] = useState('');
  const [sessions, setSessions] = useState<SessionRecord[]>(() => getUserSessions(user.id));

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { addToast('Las contraseñas no coinciden.', 'error'); return; }
    const result = changePassword(user.id, currentPwd, newPwd);
    addToast(result.message, result.success ? 'success' : 'error');
    if (result.success) { setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); }
  };

  const handleToggleMfa = () => {
    const result = toggleMfa(user.id);
    addToast(result.message, result.success ? 'success' : 'error');
    if (result.success) onUserUpdate({ ...user, mfaEnabled: result.enabled });
  };

  const handleSaveQuestion = () => {
    if (!secretQ.trim() || !secretA.trim()) { addToast('Completa ambos campos.', 'error'); return; }
    const result = updateSecretQuestion(user.id, secretQ, secretA);
    addToast(result.message, result.success ? 'success' : 'error');
    if (result.success) setSecretA('');
  };

  const handleRevokeSession = (id: string) => {
    revokeSession(id);
    setSessions(getUserSessions(user.id));
    addToast('Sesión revocada.', 'info');
  };

  const handleRevokeAll = () => {
    revokeAllSessions(user.id);
    setSessions(getUserSessions(user.id));
    addToast('Todas las sesiones han sido revocadas.', 'info');
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))',
    letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase',
  };

  const tabs: { key: SettingsTab; icon: string; label: string }[] = [
    { key: 'password', icon: '🔑', label: 'Contraseña' },
    { key: 'mfa', icon: '🛡️', label: 'MFA' },
    { key: 'sessions', icon: '📱', label: 'Sesiones' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: '560px', borderRadius: '1rem', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem' }}>
            <span style={{ color: 'hsl(var(--foreground))' }}>CONFIGURACIÓN </span>
            <span style={{ color: 'hsl(var(--neon))' }}>⚙️</span>
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'hsl(var(--smoke))', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0.6rem 1rem',
              color: tab === t.key ? 'hsl(var(--neon))' : 'hsl(var(--smoke))',
              borderBottom: tab === t.key ? '2px solid hsl(var(--neon))' : '2px solid transparent',
              fontFamily: "'Inter', sans-serif", fontWeight: '600', fontSize: '0.8rem', transition: 'all 0.2s',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* PASSWORD TAB */}
          {tab === 'password' && (
            <motion.div key="pwd" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <form onSubmit={handleChangePassword}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Contraseña actual</label>
                  <input className="input-dark" type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="••••••••" />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Nueva contraseña</label>
                  <input className="input-dark" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="••••••••" />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Confirmar nueva contraseña</label>
                  <input className="input-dark" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" />
                </div>
                <button className="btn-neon" type="submit" style={{ width: '100%' }}>CAMBIAR CONTRASEÑA</button>
              </form>
            </motion.div>
          )}

          {/* MFA TAB */}
          {tab === 'mfa' && (
            <motion.div key="mfa" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <div style={{ padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', marginBottom: '1.5rem', background: 'hsl(var(--graphite-light) / 0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))', marginBottom: '0.25rem' }}>
                      Autenticación Multifactor (MFA)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--smoke))' }}>
                      Al activar MFA, se pedirá un código OTP por email al iniciar sesión.
                    </div>
                  </div>
                  <button
                    onClick={handleToggleMfa}
                    style={{
                      width: '52px', height: '28px', borderRadius: '14px', cursor: 'pointer', border: 'none',
                      background: user.mfaEnabled ? 'hsl(var(--neon))' : 'hsl(var(--steel))',
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', background: 'hsl(var(--foreground))',
                      position: 'absolute', top: '3px', transition: 'left 0.2s',
                      left: user.mfaEnabled ? '27px' : '3px',
                    }} />
                  </button>
                </div>
                <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', background: user.mfaEnabled ? 'hsl(var(--neon) / 0.1)' : 'hsl(var(--destructive) / 0.1)', fontSize: '0.75rem', color: user.mfaEnabled ? 'hsl(var(--neon))' : 'hsl(var(--destructive))' }}>
                  Estado: {user.mfaEnabled ? '✅ Activado' : '❌ Desactivado'}
                </div>
              </div>

              {/* Secret Question */}
              <div style={{ padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--graphite-light) / 0.5)' }}>
                <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))', marginBottom: '0.75rem' }}>
                  🔐 Pregunta Secreta (Recuperación)
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={labelStyle}>Pregunta</label>
                  <select className="input-dark" value={secretQ} onChange={e => setSecretQ(e.target.value)}>
                    <option value="">Selecciona una pregunta...</option>
                    <option>¿Cuál es el nombre de tu primera mascota?</option>
                    <option>¿En qué ciudad naciste?</option>
                    <option>¿Cuál es tu comida favorita?</option>
                    <option>¿Cómo se llama tu mejor amigo de la infancia?</option>
                  </select>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={labelStyle}>Respuesta (se cifra al guardar)</label>
                  <input className="input-dark" type="text" value={secretA} onChange={e => setSecretA(e.target.value)} placeholder="Tu respuesta secreta..." />
                </div>
                <button className="btn-neon" onClick={handleSaveQuestion} style={{ width: '100%', fontSize: '0.78rem', padding: '0.6rem' }}>
                  GUARDAR PREGUNTA
                </button>
              </div>
            </motion.div>
          )}

          {/* SESSIONS TAB */}
          {tab === 'sessions' && (
            <motion.div key="sessions" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'hsl(var(--smoke))' }}>
                  {sessions.length} sesión(es) registrada(s)
                </span>
                <button className="btn-danger" onClick={handleRevokeAll} style={{ fontSize: '0.72rem' }}>
                  Revocar todas
                </button>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {sessions.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'hsl(var(--smoke))', padding: '2rem', fontSize: '0.85rem' }}>
                    No hay sesiones registradas.
                  </div>
                )}
                {sessions.map(s => (
                  <div key={s.id} style={{
                    padding: '1rem', borderRadius: '0.75rem',
                    border: `1px solid ${s.active ? 'hsl(var(--neon) / 0.3)' : 'hsl(var(--border))'}`,
                    background: s.active ? 'hsl(var(--neon) / 0.05)' : 'hsl(var(--graphite-light) / 0.3)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))', fontSize: '0.85rem' }}>
                          {s.device} {s.active && <span style={{ color: 'hsl(var(--neon))', fontSize: '0.72rem' }}>(Actual)</span>}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'hsl(var(--smoke))', marginTop: '0.2rem' }}>
                          IP: {s.ip} · {s.startedAt}
                        </div>
                      </div>
                      {s.active && (
                        <button className="btn-danger" onClick={() => handleRevokeSession(s.id)} style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem' }}>
                          Revocar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
