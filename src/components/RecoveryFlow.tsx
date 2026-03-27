import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type RecoveryMethod, startRecovery, verifyRecovery, resetPassword } from '../lib/auth';

interface RecoveryFlowProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onClose: () => void;
}

type Step = 'email' | 'method' | 'verify' | 'new-password';

const METHODS: { key: RecoveryMethod; icon: string; title: string; desc: string }[] = [
  { key: 'email', icon: '📧', title: 'Enlace por Email', desc: 'Se envía un código de recuperación a tu correo electrónico.' },
  { key: 'secret-question', icon: '🔐', title: 'Pregunta Secreta', desc: 'Responde la pregunta secreta configurada en tu perfil.' },
  { key: 'sms', icon: '📱', title: 'SMS', desc: 'Recibe un código por mensaje de texto a tu número registrado.' },
  { key: 'call', icon: '📞', title: 'Llamada Telefónica', desc: 'Recibe una llamada con el código de recuperación.' },
];

export function RecoveryFlow({ addToast, onClose }: RecoveryFlowProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<RecoveryMethod | null>(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [question, setQuestion] = useState('');
  const [recoveredUserId, setRecoveredUserId] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addToast('Ingresa un email válido.', 'error');
      return;
    }
    setStep('method');
  };

  const handleSelectMethod = (method: RecoveryMethod) => {
    setSelectedMethod(method);
    setLoading(true);
    setTimeout(() => {
      const result = startRecovery(email, method);
      if (result.success) {
        if (method === 'secret-question' && result.question) {
          setQuestion(result.question);
        } else if (result.code) {
          const labels: Record<string, string> = {
            'email': '📧 Email',
            'sms': '📱 SMS',
            'call': '📞 Llamada',
          };
          alert(`${labels[method]} — Código de recuperación:\n\n🔑 ${result.code}\n\n(Simulación)`);
        }
        setStep('verify');
        addToast(result.message, 'info');
      } else {
        addToast(result.message, 'error');
      }
      setLoading(false);
    }, 800);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyInput.trim()) { addToast('Completa el campo.', 'error'); return; }
    setLoading(true);
    setTimeout(() => {
      const result = verifyRecovery(verifyInput);
      if (result.success && result.userId) {
        setRecoveredUserId(result.userId);
        setStep('new-password');
        addToast(result.message, 'success');
      } else {
        addToast(result.message, 'error');
      }
      setLoading(false);
    }, 600);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 4) { addToast('Mínimo 4 caracteres.', 'error'); return; }
    if (newPwd !== confirmPwd) { addToast('Las contraseñas no coinciden.', 'error'); return; }
    const result = resetPassword(recoveredUserId, newPwd);
    addToast(result.message, result.success ? 'success' : 'error');
    if (result.success) onClose();
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))',
    letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase',
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
        style={{ width: '100%', maxWidth: '460px', borderRadius: '1rem', padding: '2rem' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔓</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem' }}>
            <span style={{ color: 'hsl(var(--foreground))' }}>RECUPERAR </span>
            <span style={{ color: 'hsl(var(--neon))' }}>CUENTA</span>
          </h2>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Email */}
          {step === 'email' && (
            <motion.form key="email" onSubmit={handleEmailSubmit} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Email de tu cuenta</label>
                <input className="input-dark" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" />
              </div>
              <button className="btn-neon" type="submit" style={{ width: '100%', marginBottom: '1rem' }}>CONTINUAR</button>
              <button type="button" className="btn-ghost" onClick={onClose} style={{ width: '100%' }}>← Volver al Login</button>
            </motion.form>
          )}

          {/* Step 2: Method selection */}
          {step === 'method' && (
            <motion.div key="method" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                Elige tu método de recuperación:
              </p>
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                {METHODS.map(m => (
                  <button
                    key={m.key}
                    onClick={() => !loading && handleSelectMethod(m.key)}
                    disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem',
                      borderRadius: '0.75rem', border: '1px solid hsl(var(--border))',
                      background: 'transparent', cursor: loading ? 'wait' : 'pointer',
                      textAlign: 'left', width: '100%', transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'hsl(var(--neon))')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{m.icon}</span>
                    <div>
                      <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))', fontSize: '0.85rem' }}>{m.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'hsl(var(--smoke))' }}>{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button className="btn-ghost" onClick={() => setStep('email')} style={{ width: '100%', marginTop: '1rem' }}>← Cambiar email</button>
            </motion.div>
          )}

          {/* Step 3: Verify */}
          {step === 'verify' && (
            <motion.form key="verify" onSubmit={handleVerify} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              {selectedMethod === 'secret-question' ? (
                <>
                  <p style={{ color: 'hsl(var(--neon))', fontWeight: '600', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>
                    {question}
                  </p>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Tu respuesta</label>
                    <input className="input-dark" type="text" value={verifyInput} onChange={e => setVerifyInput(e.target.value)} placeholder="Escribe tu respuesta..." />
                  </div>
                </>
              ) : (
                <>
                  <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem' }}>
                    Ingresa el código de 6 dígitos recibido por {selectedMethod === 'email' ? 'email' : selectedMethod === 'sms' ? 'SMS' : 'llamada'}
                  </p>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <input
                      className="input-dark"
                      type="text"
                      maxLength={6}
                      value={verifyInput}
                      onChange={e => setVerifyInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5em', fontFamily: "'Bebas Neue', sans-serif" }}
                    />
                  </div>
                </>
              )}
              <button className="btn-neon" type="submit" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
                {loading ? 'VERIFICANDO...' : 'VERIFICAR'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => { setStep('method'); setVerifyInput(''); }} style={{ width: '100%' }}>
                ← Otro método
              </button>
            </motion.form>
          )}

          {/* Step 4: New password */}
          {step === 'new-password' && (
            <motion.form key="new-pwd" onSubmit={handleResetPassword} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                Establece tu nueva contraseña
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Nueva contraseña</label>
                <input className="input-dark" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="••••••••" />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Confirmar contraseña</label>
                <input className="input-dark" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" />
              </div>
              <button className="btn-neon" type="submit" style={{ width: '100%' }}>
                RESTABLECER CONTRASEÑA
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
