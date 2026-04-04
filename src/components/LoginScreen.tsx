import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, signUp, verifyMfaLogin, requestPasswordReset, type UserRole } from '../lib/supabase-auth';
import { RobotVerify } from './RobotVerify';

interface LoginScreenProps {
  onLogin: () => void;
  onMfaPending?: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type Mode = 'login' | 'register-select' | 'register-member' | 'register-coach' | 'email-sent' | 'mfa-verify' | 'recovery';

export function LoginScreen({ onLogin, addToast }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifiedReg, setIsVerifiedReg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mfaCode, setMfaCode] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');

  // Recovery
  const [recoveryEmail, setRecoveryEmail] = useState('');

  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Register member form
  const [memberData, setMemberData] = useState({
    name: '', email: '', password: '', age: '', gender: 'hombre' as 'hombre' | 'mujer',
    level: 'Principiante' as 'Principiante' | 'Intermedio' | 'Pro',
  });

  // Register coach form
  const [coachData, setCoachData] = useState({
    name: '', email: '', password: '', specialty: '', certification: '', experience: '',
  });

  const validateLogin = () => {
    const errs: Record<string, string> = {};
    if (!loginData.email.trim()) errs.email = 'El email es requerido';
    if (!loginData.password) errs.password = 'La contraseña es requerida';
    if (!isVerified) errs.robot = 'Completa la verificación';
    return errs;
  };

  const validateMember = () => {
    const errs: Record<string, string> = {};
    if (!memberData.name.trim() || memberData.name.trim().length < 3) errs.name = 'Mínimo 3 caracteres';
    if (!memberData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberData.email)) errs.email = 'Email inválido';
    if (!memberData.password || memberData.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    const age = parseInt(memberData.age);
    if (!memberData.age || isNaN(age) || age < 14 || age > 99) errs.age = 'Edad entre 14 y 99 años';
    if (!isVerifiedReg) errs.robot = 'Completa la verificación';
    return errs;
  };

  const validateCoach = () => {
    const errs: Record<string, string> = {};
    if (!coachData.name.trim() || coachData.name.trim().length < 3) errs.name = 'Mínimo 3 caracteres';
    if (!coachData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coachData.email)) errs.email = 'Email inválido';
    if (!coachData.password || coachData.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (!coachData.specialty.trim()) errs.specialty = 'Especialidad requerida';
    if (!coachData.certification.trim()) errs.certification = 'Certificación requerida';
    if (!coachData.experience.trim()) errs.experience = 'Experiencia requerida';
    if (!isVerifiedReg) errs.robot = 'Completa la verificación';
    return errs;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateLogin();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    const result = await signIn(loginData.email, loginData.password);

    if (result.success) {
      if (result.mfaRequired) {
        setMode('mfa-verify');
      } else {
        addToast(result.message, 'success');
        onLogin();
      }
    } else {
      addToast(result.message, 'error');
      setErrors({ general: result.message });
    }
    setLoading(false);
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) { setErrors({ mfa: 'El código debe tener 6 dígitos' }); return; }
    setLoading(true);

    const result = await verifyMfaLogin(mfaCode);
    if (result.success) {
      addToast(result.message, 'success');
      onLogin();
    } else {
      addToast(result.message, 'error');
      setErrors({ mfa: result.message });
    }
    setLoading(false);
  };

  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateMember();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    const result = await signUp({
      name: memberData.name,
      email: memberData.email,
      password: memberData.password,
      role: 'member' as UserRole,
      age: parseInt(memberData.age),
      gender: memberData.gender,
      level: memberData.level,
    });

    if (result.success) {
      if (result.needsConfirmation) {
        setConfirmEmail(memberData.email);
        setMode('email-sent');
      } else {
        addToast(result.message, 'success');
        onLogin();
      }
    } else {
      addToast(result.message, 'error');
    }
    setLoading(false);
  };

  const handleRegisterCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateCoach();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    const result = await signUp({
      name: coachData.name,
      email: coachData.email,
      password: coachData.password,
      role: 'coach' as UserRole,
      specialty: coachData.specialty,
      certification: coachData.certification,
      experience: coachData.experience,
    });

    if (result.success) {
      if (result.needsConfirmation) {
        setConfirmEmail(coachData.email);
        setMode('email-sent');
      } else {
        addToast(result.message, 'success');
        onLogin();
      }
    } else {
      addToast(result.message, 'error');
    }
    setLoading(false);
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) { setErrors({ recovery: 'El email es requerido' }); return; }
    setLoading(true);
    const result = await requestPasswordReset(recoveryEmail);
    addToast(result.message, result.success ? 'success' : 'error');
    if (result.success) setMode('login');
    setLoading(false);
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? (
      <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.25rem' }}>
        {errors[field]}
      </p>
    ) : null;

  const inputStyle = (field: string) => ({
    borderColor: errors[field] ? 'hsl(var(--destructive))' : undefined,
  });

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--carbon))', display: 'flex', flexDirection: 'column' as const }}>
      {/* Navbar */}
      <nav style={{
        background: 'hsl(var(--graphite))', borderBottom: '1px solid hsl(var(--border))',
        padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '0.08em' }}>
          <span style={{ color: 'hsl(var(--foreground))' }}>GYMBRO</span>
          <span style={{ color: 'hsl(var(--neon))' }}>'S</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['TODOS', 'HOMBRE', 'MUJER'].map((f, i) => (
            <span key={f} className={`filter-chip ${i === 0 ? 'active' : 'inactive'}`} style={{ fontSize: '0.72rem' }}>{f}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <span style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', cursor: 'pointer' }}>Inicio</span>
          <span style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', cursor: 'pointer' }}>Rutinas ▾</span>
          <span style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', cursor: 'pointer' }}>Mi Perfil ▾</span>
        </div>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        <AnimatePresence mode="wait">

          {/* LOGIN */}
          {mode === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.3 }}
              className="glass-card" style={{ width: '100%', maxWidth: '440px', borderRadius: '1rem', padding: '2.5rem 2rem' }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.4rem', textAlign: 'center', marginBottom: '2rem', letterSpacing: '0.05em' }}>
                <span style={{ color: 'hsl(var(--foreground))' }}>GYMBRO </span>
                <span style={{ color: 'hsl(var(--neon))' }}>LOGIN</span>
              </h1>
              <form onSubmit={handleLogin} noValidate>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))', letterSpacing: '0.12em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Email</label>
                  <input className="input-dark" type="email" placeholder="tu@correo.com" value={loginData.email}
                    onChange={e => { setLoginData(p => ({ ...p, email: e.target.value })); setErrors({}); }} style={inputStyle('email')} />
                  <FieldError field="email" />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))', letterSpacing: '0.12em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Contraseña</label>
                  <input className="input-dark" type="password" placeholder="••••••••" value={loginData.password}
                    onChange={e => { setLoginData(p => ({ ...p, password: e.target.value })); setErrors({}); }} style={inputStyle('password')} />
                  <FieldError field="password" />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <RobotVerify onVerified={() => setIsVerified(true)} />
                  <FieldError field="robot" />
                </div>
                {errors.general && (
                  <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1rem' }}>{errors.general}</p>
                )}
                <button className="btn-neon" type="submit" disabled={loading} style={{ width: '100%', marginBottom: '1.25rem' }}>
                  {loading ? 'ENTRANDO...' : 'ENTRAR'}
                </button>
              </form>
              <div style={{ textAlign: 'center' }}>
                <span style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem' }}>¿No tienes cuenta? </span>
                <button onClick={() => { setMode('register-select'); setErrors({}); }}
                  style={{ color: 'hsl(var(--neon))', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>Regístrate</button>
              </div>
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <button onClick={() => setMode('recovery')}
                  style={{ color: 'hsl(var(--smoke))', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </motion.div>
          )}

          {/* ROLE SELECT */}
          {mode === 'register-select' && (
            <motion.div key="select" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: 'hsl(var(--foreground))', marginBottom: '0.5rem' }}>¿CÓMO DESEAS REGISTRARTE?</h2>
              <p style={{ color: 'hsl(var(--smoke))', marginBottom: '2rem', fontSize: '0.9rem' }}>Selecciona tu tipo de cuenta</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { role: 'member', icon: '🏋️', title: 'SOCIO', desc: 'Accede a rutinas y registra tu progreso' },
                  { role: 'coach', icon: '🎯', title: 'COACH', desc: 'Sube y gestiona programas de entrenamiento' },
                ].map(({ role, icon, title, desc }) => (
                  <motion.button key={role} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="glass-card"
                    onClick={() => setMode(role === 'coach' ? 'register-coach' : 'register-member')}
                    style={{ padding: '2rem 1rem', borderRadius: '1rem', cursor: 'pointer', border: '1px solid hsl(var(--border))', background: 'none', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{icon}</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: 'hsl(var(--neon))', marginBottom: '0.4rem' }}>{title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--smoke))' }}>{desc}</div>
                  </motion.button>
                ))}
              </div>
              <button className="btn-ghost" onClick={() => { setMode('login'); setErrors({}); }}>← Volver al Login</button>
            </motion.div>
          )}

          {/* REGISTER MEMBER */}
          {mode === 'register-member' && (
            <motion.div key="reg-member" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.3 }}
              className="glass-card" style={{ width: '100%', maxWidth: '440px', borderRadius: '1rem', padding: '2.5rem 2rem' }}>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', textAlign: 'center', marginBottom: '1.75rem' }}>
                <span style={{ color: 'hsl(var(--foreground))' }}>NUEVO </span><span style={{ color: 'hsl(var(--neon))' }}>SOCIO</span>
              </h2>
              <form onSubmit={handleRegisterMember} noValidate>
                {[
                  { label: 'Nombre completo', key: 'name', type: 'text', placeholder: 'Tu nombre...' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'tu@correo.com' },
                  { label: 'Contraseña (mín. 6 caracteres)', key: 'password', type: 'password', placeholder: '••••••••' },
                  { label: 'Edad', key: 'age', type: 'number', placeholder: 'Tu edad...' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))', letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' }}>{label}</label>
                    <input className="input-dark" type={type} placeholder={placeholder}
                      value={memberData[key as keyof typeof memberData] as string}
                      onChange={e => { setMemberData(p => ({ ...p, [key]: e.target.value })); setErrors(prev => ({ ...prev, [key]: '' })); }}
                      style={inputStyle(key)} />
                    <FieldError field={key} />
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))', letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Género</label>
                    <select className="input-dark" value={memberData.gender} onChange={e => setMemberData(p => ({ ...p, gender: e.target.value as 'hombre' | 'mujer' }))}>
                      <option value="hombre">Hombre</option>
                      <option value="mujer">Mujer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))', letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Nivel</label>
                    <select className="input-dark" value={memberData.level} onChange={e => setMemberData(p => ({ ...p, level: e.target.value as 'Principiante' | 'Intermedio' | 'Pro' }))}>
                      <option>Principiante</option><option>Intermedio</option><option>Pro</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <RobotVerify onVerified={() => setIsVerifiedReg(true)} />
                  <FieldError field="robot" />
                </div>
                <button className="btn-neon" type="submit" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
                  {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
                </button>
              </form>
              <button className="btn-ghost" onClick={() => { setMode('register-select'); setErrors({}); }} style={{ width: '100%' }}>← Volver</button>
            </motion.div>
          )}

          {/* REGISTER COACH */}
          {mode === 'register-coach' && (
            <motion.div key="reg-coach" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.3 }}
              className="glass-card" style={{ width: '100%', maxWidth: '440px', borderRadius: '1rem', padding: '2.5rem 2rem' }}>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', textAlign: 'center', marginBottom: '1.75rem' }}>
                <span style={{ color: 'hsl(var(--foreground))' }}>REGISTRO </span><span style={{ color: 'hsl(var(--neon))' }}>COACH</span>
              </h2>
              <form onSubmit={handleRegisterCoach} noValidate>
                {[
                  { label: 'Nombre completo', key: 'name', type: 'text', placeholder: 'Tu nombre...' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'tu@correo.com' },
                  { label: 'Contraseña (mín. 6 caracteres)', key: 'password', type: 'password', placeholder: '••••••••' },
                  { label: 'Especialidad', key: 'specialty', type: 'text', placeholder: 'Ej: Crossfit, Musculación...' },
                  { label: 'Certificación', key: 'certification', type: 'text', placeholder: 'Ej: NSCA-CPT, ACE...' },
                  { label: 'Años de experiencia', key: 'experience', type: 'text', placeholder: 'Ej: 3 años...' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))', letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' }}>{label}</label>
                    <input className="input-dark" type={type} placeholder={placeholder} value={coachData[key as keyof typeof coachData]}
                      onChange={e => { setCoachData(p => ({ ...p, [key]: e.target.value })); setErrors(prev => ({ ...prev, [key]: '' })); }}
                      style={inputStyle(key)} />
                    <FieldError field={key} />
                  </div>
                ))}
                <div style={{ marginBottom: '1.5rem' }}>
                  <RobotVerify onVerified={() => setIsVerifiedReg(true)} />
                  <FieldError field="robot" />
                </div>
                <button className="btn-neon" type="submit" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
                  {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA COACH'}
                </button>
              </form>
              <button className="btn-ghost" onClick={() => { setMode('register-select'); setErrors({}); }} style={{ width: '100%' }}>← Volver</button>
            </motion.div>
          )}

          {/* EMAIL SENT CONFIRMATION */}
          {mode === 'email-sent' && (
            <motion.div key="email-sent" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.3 }}
              className="glass-card" style={{ width: '100%', maxWidth: '440px', borderRadius: '1rem', padding: '2.5rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📧</div>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'hsl(var(--foreground))' }}>VERIFICA TU </span>
                <span style={{ color: 'hsl(var(--neon))' }}>EMAIL</span>
              </h2>
              <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                Hemos enviado un enlace de verificación a:
              </p>
              <p style={{ color: 'hsl(var(--neon))', fontWeight: '700', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                {confirmEmail}
              </p>
              <div style={{
                padding: '1rem', borderRadius: '0.75rem', background: 'hsl(var(--neon) / 0.05)',
                border: '1px solid hsl(var(--neon) / 0.2)', marginBottom: '1.5rem', textAlign: 'left'
              }}>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--smoke))', marginBottom: '0.5rem' }}>📌 <strong>Pasos a seguir:</strong></p>
                <ol style={{ fontSize: '0.78rem', color: 'hsl(var(--smoke))', paddingLeft: '1.25rem', lineHeight: '1.8' }}>
                  <li>Abre tu bandeja de entrada</li>
                  <li>Busca el correo de verificación (revisa spam)</li>
                  <li>Haz clic en el enlace de confirmación</li>
                  <li>Regresa aquí e inicia sesión</li>
                </ol>
              </div>
              <button className="btn-neon" onClick={() => setMode('login')} style={{ width: '100%', marginBottom: '0.75rem' }}>
                IR AL LOGIN
              </button>
              <p style={{ fontSize: '0.72rem', color: 'hsl(var(--smoke))' }}>
                🔒 Tu cuenta estará activa después de verificar tu email
              </p>
            </motion.div>
          )}

          {/* MFA VERIFY */}
          {mode === 'mfa-verify' && (
            <motion.div key="mfa-verify" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.3 }}
              className="glass-card" style={{ width: '100%', maxWidth: '440px', borderRadius: '1rem', padding: '2.5rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'hsl(var(--foreground))' }}>VERIFICACIÓN </span>
                <span style={{ color: 'hsl(var(--neon))' }}>MFA</span>
              </h2>
              <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', marginBottom: '2rem' }}>
                Ingresa el código de 6 dígitos de tu app de autenticación (Google Authenticator)
              </p>
              <form onSubmit={handleMfaVerify} noValidate>
                <div style={{ marginBottom: '1.5rem' }}>
                  <input className="input-dark" type="text" maxLength={6} placeholder="000000" value={mfaCode}
                    onChange={e => { setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors({}); }}
                    style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5em', fontFamily: "'Bebas Neue', sans-serif", ...(errors.mfa ? { borderColor: 'hsl(var(--destructive))' } : {}) }} />
                  {errors.mfa && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.5rem' }}>{errors.mfa}</p>}
                </div>
                <button className="btn-neon" type="submit" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
                  {loading ? 'VERIFICANDO...' : 'VERIFICAR MFA'}
                </button>
              </form>
              <button className="btn-ghost" onClick={() => { setMode('login'); setMfaCode(''); setErrors({}); }} style={{ width: '100%' }}>← Volver al Login</button>
            </motion.div>
          )}

          {/* RECOVERY */}
          {mode === 'recovery' && (
            <motion.div key="recovery" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.3 }}
              className="glass-card" style={{ width: '100%', maxWidth: '440px', borderRadius: '1rem', padding: '2.5rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔑</div>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'hsl(var(--foreground))' }}>RECUPERAR </span>
                <span style={{ color: 'hsl(var(--neon))' }}>CONTRASEÑA</span>
              </h2>
              <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', marginBottom: '2rem' }}>
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
              </p>
              <form onSubmit={handleRecovery} noValidate>
                <div style={{ marginBottom: '1.5rem' }}>
                  <input className="input-dark" type="email" placeholder="tu@correo.com" value={recoveryEmail}
                    onChange={e => { setRecoveryEmail(e.target.value); setErrors({}); }}
                    style={inputStyle('recovery')} />
                  <FieldError field="recovery" />
                </div>
                <button className="btn-neon" type="submit" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
                  {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE DE RECUPERACIÓN'}
                </button>
              </form>
              <button className="btn-ghost" onClick={() => { setMode('login'); setErrors({}); }} style={{ width: '100%' }}>← Volver al Login</button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
