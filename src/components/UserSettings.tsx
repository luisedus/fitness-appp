import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updatePassword, enrollMfa, verifyMfaEnrollment, unenrollMfa, hasMfaEnabled, type AppUser } from '../lib/supabase-auth';

interface UserSettingsProps {
  user: AppUser;
  onUserUpdate: (user: AppUser) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onClose: () => void;
}

type SettingsTab = 'password' | 'mfa';

export function UserSettings({ user, onUserUpdate, addToast, onClose }: UserSettingsProps) {
  const [tab, setTab] = useState<SettingsTab>('password');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  useEffect(() => {
    hasMfaEnabled().then(enabled => {
      setMfaEnabled(enabled);
      setMfaLoading(false);
    });
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { addToast('Las contraseñas no coinciden.', 'error'); return; }
    if (newPwd.length < 6) { addToast('Mínimo 6 caracteres.', 'error'); return; }
    setLoading(true);
    const result = await updatePassword(newPwd);
    addToast(result.message, result.success ? 'success' : 'error');
    if (result.success) { setNewPwd(''); setConfirmPwd(''); }
    setLoading(false);
  };

  const handleEnrollMfa = async () => {
    setEnrolling(true);
    const result = await enrollMfa();
    if (result.success) {
      setQrCode(result.qrCode || '');
      setMfaSecret(result.secret || '');
      setFactorId(result.factorId || '');
    } else {
      addToast(result.message, 'error');
      setEnrolling(false);
    }
  };

  const handleVerifyEnrollment = async () => {
    if (verifyCode.length !== 6) { addToast('El código debe tener 6 dígitos.', 'error'); return; }
    setLoading(true);
    const result = await verifyMfaEnrollment(factorId, verifyCode);
    if (result.success) {
      addToast(result.message, 'success');
      setMfaEnabled(true);
      setEnrolling(false);
      setQrCode('');
      setMfaSecret('');
      setVerifyCode('');
    } else {
      addToast(result.message, 'error');
    }
    setLoading(false);
  };

  const handleDisableMfa = async () => {
    setLoading(true);
    const result = await unenrollMfa();
    addToast(result.message, result.success ? 'success' : 'error');
    if (result.success) setMfaEnabled(false);
    setLoading(false);
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))',
    letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase',
  };

  const tabs: { key: SettingsTab; icon: string; label: string }[] = [
    { key: 'password', icon: '🔑', label: 'Contraseña' },
    { key: 'mfa', icon: '🛡️', label: 'MFA (TOTP)' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card" style={{ width: '100%', maxWidth: '560px', borderRadius: '1rem', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

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
                  <label style={labelStyle}>Nueva contraseña (mín. 6 caracteres)</label>
                  <input className="input-dark" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="••••••••" />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Confirmar nueva contraseña</label>
                  <input className="input-dark" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" />
                </div>
                <button className="btn-neon" type="submit" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'CAMBIANDO...' : 'CAMBIAR CONTRASEÑA'}
                </button>
              </form>
            </motion.div>
          )}

          {/* MFA TAB */}
          {tab === 'mfa' && (
            <motion.div key="mfa" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              {mfaLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--smoke))' }}>Cargando estado MFA...</div>
              ) : mfaEnabled ? (
                <div>
                  <div style={{ padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--neon) / 0.3)', background: 'hsl(var(--neon) / 0.05)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>✅</span>
                      <div>
                        <div style={{ fontWeight: '700', color: 'hsl(var(--neon))' }}>MFA ACTIVADO</div>
                        <div style={{ fontSize: '0.78rem', color: 'hsl(var(--smoke))' }}>Tu cuenta está protegida con Google Authenticator (TOTP)</div>
                      </div>
                    </div>
                  </div>
                  <button className="btn-danger" onClick={handleDisableMfa} disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'DESACTIVANDO...' : '🚫 DESACTIVAR MFA'}
                  </button>
                </div>
              ) : enrolling && qrCode ? (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', marginBottom: '1rem' }}>
                      1️⃣ Escanea este código QR con <strong style={{ color: 'hsl(var(--neon))' }}>Google Authenticator</strong>:
                    </p>
                    <div style={{ display: 'inline-block', padding: '1rem', background: 'white', borderRadius: '0.75rem' }}>
                      <img src={qrCode} alt="MFA QR Code" style={{ width: '200px', height: '200px' }} />
                    </div>
                  </div>
                  <div style={{
                    padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--graphite-light) / 0.5)',
                    border: '1px solid hsl(var(--border))', marginBottom: '1.5rem', textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '0.7rem', color: 'hsl(var(--smoke))', marginBottom: '0.25rem' }}>O ingresa esta clave manualmente:</p>
                    <code style={{ fontSize: '0.8rem', color: 'hsl(var(--neon))', letterSpacing: '0.1em', wordBreak: 'break-all' }}>{mfaSecret}</code>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>2️⃣ Ingresa el código de 6 dígitos de la app:</label>
                    <input className="input-dark" type="text" maxLength={6} placeholder="000000" value={verifyCode}
                      onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4em', fontFamily: "'Bebas Neue', sans-serif" }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-neon" onClick={handleVerifyEnrollment} disabled={loading} style={{ flex: 1 }}>
                      {loading ? 'VERIFICANDO...' : 'ACTIVAR MFA'}
                    </button>
                    <button className="btn-ghost" onClick={() => { setEnrolling(false); setQrCode(''); setMfaSecret(''); setVerifyCode(''); }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--graphite-light) / 0.5)', marginBottom: '1.5rem' }}>
                    <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))', marginBottom: '0.5rem' }}>🛡️ Autenticación Multifactor (TOTP)</div>
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--smoke))', lineHeight: '1.5' }}>
                      Protege tu cuenta con un código temporal generado por <strong>Google Authenticator</strong> u otra app compatible.
                      Cada vez que inicies sesión, se te pedirá un código de 6 dígitos además de tu contraseña.
                    </p>
                  </div>
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', background: 'hsl(var(--destructive) / 0.1)', fontSize: '0.75rem', color: 'hsl(var(--destructive))', marginBottom: '1.5rem' }}>
                    Estado: ❌ Desactivado
                  </div>
                  <button className="btn-neon" onClick={handleEnrollMfa} style={{ width: '100%' }}>🔐 CONFIGURAR MFA CON GOOGLE AUTHENTICATOR</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
