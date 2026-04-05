import { useState } from 'react';
import { motion } from 'framer-motion';
import { type AuthUser, generateSSOToken, validateSSOToken, getActiveSSOToken, type SSOToken } from '../lib/auth';

interface SSODemoProps {
  user: AuthUser;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onClose: () => void;
}

const SIMULATED_APPS = [
  { id: 'app-a', name: "GYMBRO'S Fitness", domain: 'fitness.gymbros.app', icon: '🏋️', color: 'hsl(var(--neon))' },
  { id: 'app-b', name: "GYMBRO'S Nutrition", domain: 'nutrition.gymbros.app', icon: '🥗', color: 'hsl(45 100% 60%)' },
  { id: 'app-c', name: "GYMBRO'S Store", domain: 'store.gymbros.app', icon: '🛒', color: 'hsl(200 100% 65%)' },
];

export function SSODemo({ user, addToast, onClose }: SSODemoProps) {
  const [ssoToken, setSsoToken] = useState<SSOToken | null>(getActiveSSOToken);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [accessGranted, setAccessGranted] = useState<string[]>(['app-a']);

  const handleGenerateToken = () => {
    const token = generateSSOToken(user.id);
    if (token) {
      setSsoToken(token);
      addToast('🔗 Token SSO generado (válido 30 min)', 'success');
    }
  };

  const handleAccessApp = (appId: string) => {
    if (accessGranted.includes(appId)) {
      addToast('Ya tienes acceso a esta app.', 'info');
      return;
    }
    if (!ssoToken) {
      addToast('Genera un token SSO primero.', 'error');
      return;
    }
    setSelectedApp(appId);
    setValidating(true);
    setTimeout(() => {
      const result = validateSSOToken(ssoToken.token);
      if (result.success) {
        setAccessGranted(prev => [...prev, appId]);
        addToast(`✅ Acceso SSO concedido a ${SIMULATED_APPS.find(a => a.id === appId)?.name}`, 'success');
      } else {
        addToast(result.message, 'error');
      }
      setValidating(false);
      setSelectedApp(null);
    }, 1200);
  };

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
        style={{ width: '100%', maxWidth: '580px', borderRadius: '1rem', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem' }}>
            <span style={{ color: 'hsl(var(--foreground))' }}>SSO </span>
            <span style={{ color: 'hsl(var(--neon))' }}>SIMULADO</span>
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'hsl(var(--smoke))', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'hsl(var(--neon) / 0.05)', border: '1px solid hsl(var(--neon) / 0.2)', marginBottom: '1.5rem', fontSize: '0.78rem', color: 'hsl(var(--smoke))' }}>
          💡 <strong>Concepto:</strong> SSO permite autenticarse una vez y acceder a múltiples aplicaciones del mismo dominio sin re-autenticarse. El servidor central emite un token compartido.
        </div>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--border))' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'hsl(var(--neon) / 0.15)', border: '2px solid hsl(var(--neon))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            {user.role === 'coach' ? '🎯' : '🏋️'}
          </div>
          <div>
            <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))', fontSize: '0.9rem' }}>{user.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'hsl(var(--smoke))' }}>Sesión activa en dominio: gymbros.app</div>
          </div>
        </div>

        {/* Token */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'hsl(var(--smoke))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Token SSO</span>
            <button className="btn-neon" onClick={handleGenerateToken} style={{ fontSize: '0.68rem', padding: '0.35rem 0.8rem' }}>
              {ssoToken ? 'REGENERAR' : 'GENERAR TOKEN'}
            </button>
          </div>
          {ssoToken ? (
            <div style={{ padding: '0.6rem 0.75rem', borderRadius: '0.4rem', background: 'hsl(var(--input))', fontSize: '0.72rem', fontFamily: 'monospace', color: 'hsl(var(--neon))', wordBreak: 'break-all' }}>
              {ssoToken.token}
              <div style={{ color: 'hsl(var(--smoke))', marginTop: '0.3rem', fontFamily: "'Inter', sans-serif" }}>
                Expira: {new Date(ssoToken.expiresAt).toLocaleString('es-ES')}
              </div>
            </div>
          ) : (
            <div style={{ padding: '0.6rem', borderRadius: '0.4rem', background: 'hsl(var(--input))', fontSize: '0.78rem', color: 'hsl(var(--smoke))', textAlign: 'center' }}>
              No hay token activo
            </div>
          )}
        </div>

        {/* Apps */}
        <div style={{ fontSize: '0.72rem', color: 'hsl(var(--smoke))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
          Aplicaciones del ecosistema
        </div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {SIMULATED_APPS.map(app => {
            const hasAccess = accessGranted.includes(app.id);
            const isValidating = validating && selectedApp === app.id;
            return (
              <div key={app.id} style={{
                padding: '1rem', borderRadius: '0.75rem',
                border: `1px solid ${hasAccess ? 'hsl(var(--neon) / 0.3)' : 'hsl(var(--border))'}`,
                background: hasAccess ? 'hsl(var(--neon) / 0.05)' : 'transparent',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{app.icon}</span>
                  <div>
                    <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))', fontSize: '0.85rem' }}>{app.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--smoke))' }}>{app.domain}</div>
                  </div>
                </div>
                {hasAccess ? (
                  <span style={{ fontSize: '0.72rem', color: 'hsl(var(--neon))', fontWeight: '600' }}>✅ Conectado</span>
                ) : (
                  <button
                    className="btn-ghost"
                    onClick={() => handleAccessApp(app.id)}
                    disabled={isValidating}
                    style={{ fontSize: '0.68rem', padding: '0.3rem 0.6rem' }}
                  >
                    {isValidating ? '⏳ Validando...' : '🔗 Acceder via SSO'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Flow Diagram */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--graphite-light) / 0.3)' }}>
          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--smoke))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Flujo SSO
          </div>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--smoke))', lineHeight: '1.8' }}>
            <div>1️⃣ Usuario inicia sesión en <strong style={{ color: 'hsl(var(--neon))' }}>App A</strong> (autenticación completa)</div>
            <div>2️⃣ Servidor central emite un <strong style={{ color: 'hsl(var(--neon))' }}>Token SSO</strong> firmado</div>
            <div>3️⃣ Al acceder a <strong style={{ color: 'hsl(var(--neon))' }}>App B</strong>, se envía el token al servidor</div>
            <div>4️⃣ Servidor valida token → concede acceso <strong style={{ color: 'hsl(var(--neon))' }}>sin re-autenticación</strong></div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
