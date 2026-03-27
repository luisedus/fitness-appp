import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginUser, startRegistration, verifyOtp, verifyMfaCode, type UserRole } from '../lib/auth';
import { RobotVerify } from './RobotVerify';
import { RecoveryFlow } from './RecoveryFlow';

interface LoginScreenProps {
  onLogin: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type Mode = 'login' | 'register-select' | 'register-member' | 'register-coach' | 'verify-otp' | 'mfa-verify' | 'recovery';

export function LoginScreen({ onLogin, addToast }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifiedReg, setIsVerifiedReg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

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
    if (!memberData.password || memberData.password.length < 4) errs.password = 'Mínimo 4 caracteres';
    const age = parseInt(memberData.age);
    if (!memberData.age || isNaN(age) || age < 14 || age > 99) errs.age = 'Edad entre 14 y 99 años';
    if (!isVerifiedReg) errs.robot = 'Completa la verificación';
    return errs;
  };

  const validateCoach = () => {
    const errs: Record<string, string> = {};
    if (!coachData.name.trim() || coachData.name.trim().length < 3) errs.name = 'Mínimo 3 caracteres';
    if (!coachData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coachData.email)) errs.email = 'Email inválido';
    if (!coachData.password || coachData.password.length < 4) errs.password = 'Mínimo 4 caracteres';
    if (!coachData.specialty.trim()) errs.specialty = 'Especialidad requerida';
    if (!coachData.certification.trim()) errs.certification = 'Certificación requerida';
    if (!coachData.experience.trim()) errs.experience = 'Experiencia requerida';
    if (!isVerifiedReg) errs.robot = 'Completa la verificación';
    return errs;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateLogin();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => {
      const result = loginUser(loginData.email, loginData.password);
      if (result.success) {
        addToast(`¡Bienvenido, ${result.user?.name || 'Usuario'}! 💪`, 'success');
        onLogin();
      } else {
        addToast(result.message, 'error');
        setErrors({ general: result.message });
      }
      setLoading(false);
    }, 600);
  };

  const handleRegisterMember = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateMember();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const result = startRegistration({
      name: memberData.name,
      email: memberData.email,
      password: memberData.password,
      role: 'member' as UserRole,
      age: parseInt(memberData.age),
      gender: memberData.gender,
      level: memberData.level,
    });
    if (result.success) {
      setPendingEmail(memberData.email);
      alert(`📧 Código de verificación enviado a ${memberData.email}:\n\n🔑 ${result.code}\n\n(Simulación — en producción se enviaría por email real)`);
      setMode('verify-otp');
    } else {
      addToast(result.message, 'error');
    }
  };

  const handleRegisterCoach = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateCoach();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const result = startRegistration({
      name: coachData.name,
      email: coachData.email,
      password: coachData.password,
      role: 'coach' as UserRole,
      specialty: coachData.specialty,
      certification: coachData.certification,
      experience: coachData.experience,
    });
    if (result.success) {
      setPendingEmail(coachData.email);
      alert(`📧 Código de verificación enviado a ${coachData.email}:\n\n🔑 ${result.code}\n\n(Simulación — en producción se enviaría por email real)`);
      setMode('verify-otp');
    } else {
      addToast(result.message, 'error');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrors({ otp: 'El código debe tener 6 dígitos' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const result = verifyOtp(otpCode);
      if (result.success) {
        addToast('✅ ¡Cuenta verificada y creada! Ahora puedes iniciar sesión.', 'success');
        setMode('login');
        setOtpCode('');
      } else {
        addToast(result.message, 'error');
        setErrors({ otp: result.message });
      }
      setLoading(false);
    }, 600);
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
    <div
      style={{
        minHeight: '100vh',
        background: 'hsl(var(--carbon))',
        display: 'flex',
        flexDirection: 'column' as const,
      }}
    >
      {/* Navbar */}
      <nav style={{
        background: 'hsl(var(--graphite))',
        borderBottom: '1px solid hsl(var(--border))',
        padding: '0 2rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '0.08em' }}>
          <span style={{ color: 'hsl(var(--foreground))' }}>GYMBRO</span>
          <span style={{ color: 'hsl(var(--neon))' }}>'S</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['TODOS', 'HOMBRE', 'MUJER'].map((f, i) => (
            <span key={f} className={`filter-chip ${i === 0 ? 'active' : 'inactive'}`} style={{ fontSize: '0.72rem' }}>
              {f}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <span style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', cursor: 'pointer' }}>Inicio</span>
          <span style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', cursor: 'pointer' }}>Rutinas ▾</span>
          <span style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', cursor: 'pointer' }}>Mi Perfil ▾</span>
        </div>
      </nav>

      {/* Main */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
      }}>
        <AnimatePresence mode="wait">

          {/* LOGIN */}
          {mode === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '440px', borderRadius: '1rem', padding: '2.5rem 2rem' }}
            >
              <h1 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '2.4rem',
                textAlign: 'center',
                marginBottom: '2rem',
                letterSpacing: '0.05em',
              }}>
                <span style={{ color: 'hsl(var(--foreground))' }}>GYMBRO </span>
                <span style={{ color: 'hsl(var(--neon))' }}>LOGIN</span>
              </h1>

              <form onSubmit={handleLogin} noValidate>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))', letterSpacing: '0.12em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Email
                  </label>
                  <input
                    className="input-dark"
                    type="text"
                    placeholder="tu@correo.com o 'admin'"
                    value={loginData.email}
                    onChange={e => { setLoginData(p => ({ ...p, email: e.target.value })); setErrors({}); }}
                    style={inputStyle('email')}
                  />
                  <FieldError field="email" />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))', letterSpacing: '0.12em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Contraseña
                  </label>
                  <input
                    className="input-dark"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={e => { setLoginData(p => ({ ...p, password: e.target.value })); setErrors({}); }}
                    style={inputStyle('password')}
                  />
                  <FieldError field="password" />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <RobotVerify onVerified={() => setIsVerified(true)} />
                  <FieldError field="robot" />
                </div>

                {errors.general && (
                  <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1rem' }}>
                    {errors.general}
                  </p>
                )}

                <button className="btn-neon" type="submit" disabled={loading} style={{ width: '100%', marginBottom: '1.25rem' }}>
                  {loading ? 'ENTRANDO...' : 'ENTRAR'}
                </button>
              </form>

              <div style={{ textAlign: 'center' }}>
                <span style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem' }}>
                  ¿No tienes cuenta?{' '}
                </span>
                <button
                  onClick={() => { setMode('register-select'); setErrors({}); }}
                  style={{ color: 'hsl(var(--neon))', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  Regístrate
                </button>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'hsl(var(--neon) / 0.05)', borderRadius: '0.5rem', border: '1px solid hsl(var(--neon) / 0.2)' }}>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--smoke))', textAlign: 'center' }}>
                  🔑 Admin: <strong style={{ color: 'hsl(var(--neon))' }}>admin</strong> / <strong style={{ color: 'hsl(var(--neon))' }}>1234</strong>
                </p>
              </div>
            </motion.div>
          )}

          {/* ROLE SELECT */}
          {mode === 'register-select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}
            >
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: 'hsl(var(--foreground))', marginBottom: '0.5rem' }}>
                ¿CÓMO DESEAS REGISTRARTE?
              </h2>
              <p style={{ color: 'hsl(var(--smoke))', marginBottom: '2rem', fontSize: '0.9rem' }}>
                Selecciona tu tipo de cuenta
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { role: 'member', icon: '🏋️', title: 'SOCIO', desc: 'Accede a rutinas y registra tu progreso' },
                  { role: 'coach', icon: '🎯', title: 'COACH', desc: 'Sube y gestiona programas de entrenamiento' },
                ].map(({ role, icon, title, desc }) => (
                  <motion.button
                    key={role}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="glass-card"
                    onClick={() => setMode(role === 'coach' ? 'register-coach' : 'register-member')}
                    style={{
                      padding: '2rem 1rem',
                      borderRadius: '1rem',
                      cursor: 'pointer',
                      border: '1px solid hsl(var(--border))',
                      background: 'none',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{icon}</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: 'hsl(var(--neon))', marginBottom: '0.4rem' }}>
                      {title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--smoke))' }}>{desc}</div>
                  </motion.button>
                ))}
              </div>
              <button
                className="btn-ghost"
                onClick={() => { setMode('login'); setErrors({}); }}
              >
                ← Volver al Login
              </button>
            </motion.div>
          )}

          {/* REGISTER MEMBER */}
          {mode === 'register-member' && (
            <motion.div
              key="reg-member"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '440px', borderRadius: '1rem', padding: '2.5rem 2rem' }}
            >
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', textAlign: 'center', marginBottom: '1.75rem' }}>
                <span style={{ color: 'hsl(var(--foreground))' }}>NUEVO </span>
                <span style={{ color: 'hsl(var(--neon))' }}>SOCIO</span>
              </h2>
              <form onSubmit={handleRegisterMember} noValidate>
                {[
                  { label: 'Nombre completo', key: 'name', type: 'text', placeholder: 'Tu nombre...' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'tu@correo.com' },
                  { label: 'Contraseña', key: 'password', type: 'password', placeholder: '••••••••' },
                  { label: 'Edad', key: 'age', type: 'number', placeholder: 'Tu edad...' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))', letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      {label}
                    </label>
                    <input
                      className="input-dark"
                      type={type}
                      placeholder={placeholder}
                      value={memberData[key as keyof typeof memberData] as string}
                      onChange={e => { setMemberData(p => ({ ...p, [key]: e.target.value })); setErrors(prev => ({ ...prev, [key]: '' })); }}
                      style={inputStyle(key)}
                    />
                    <FieldError field={key} />
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))', letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Género</label>
                    <select
                      className="input-dark"
                      value={memberData.gender}
                      onChange={e => setMemberData(p => ({ ...p, gender: e.target.value as 'hombre' | 'mujer' }))}
                    >
                      <option value="hombre">Hombre</option>
                      <option value="mujer">Mujer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))', letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Nivel</label>
                    <select
                      className="input-dark"
                      value={memberData.level}
                      onChange={e => setMemberData(p => ({ ...p, level: e.target.value as 'Principiante' | 'Intermedio' | 'Pro' }))}
                    >
                      <option>Principiante</option>
                      <option>Intermedio</option>
                      <option>Pro</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <RobotVerify onVerified={() => setIsVerifiedReg(true)} />
                  <FieldError field="robot" />
                </div>
                <button className="btn-neon" type="submit" style={{ width: '100%', marginBottom: '1rem' }}>
                  CREAR CUENTA
                </button>
              </form>
              <button className="btn-ghost" onClick={() => { setMode('register-select'); setErrors({}); }} style={{ width: '100%' }}>
                ← Volver
              </button>
            </motion.div>
          )}

          {/* REGISTER COACH */}
          {mode === 'register-coach' && (
            <motion.div
              key="reg-coach"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '440px', borderRadius: '1rem', padding: '2.5rem 2rem' }}
            >
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', textAlign: 'center', marginBottom: '1.75rem' }}>
                <span style={{ color: 'hsl(var(--foreground))' }}>REGISTRO </span>
                <span style={{ color: 'hsl(var(--neon))' }}>COACH</span>
              </h2>
              <form onSubmit={handleRegisterCoach} noValidate>
                {[
                  { label: 'Nombre completo', key: 'name', type: 'text', placeholder: 'Tu nombre...' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'tu@correo.com' },
                  { label: 'Contraseña', key: 'password', type: 'password', placeholder: '••••••••' },
                  { label: 'Especialidad', key: 'specialty', type: 'text', placeholder: 'Ej: Crossfit, Musculación...' },
                  { label: 'Certificación', key: 'certification', type: 'text', placeholder: 'Ej: NSCA-CPT, ACE...' },
                  { label: 'Años de experiencia', key: 'experience', type: 'text', placeholder: 'Ej: 3 años...' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--smoke))', letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      {label}
                    </label>
                    <input
                      className="input-dark"
                      type={type}
                      placeholder={placeholder}
                      value={coachData[key as keyof typeof coachData]}
                      onChange={e => { setCoachData(p => ({ ...p, [key]: e.target.value })); setErrors(prev => ({ ...prev, [key]: '' })); }}
                      style={inputStyle(key)}
                    />
                    <FieldError field={key} />
                  </div>
                ))}
                <div style={{ marginBottom: '1.5rem' }}>
                  <RobotVerify onVerified={() => setIsVerifiedReg(true)} />
                  <FieldError field="robot" />
                </div>
                <button className="btn-neon" type="submit" style={{ width: '100%', marginBottom: '1rem' }}>
                  CREAR CUENTA COACH
                </button>
              </form>
              <button className="btn-ghost" onClick={() => { setMode('register-select'); setErrors({}); }} style={{ width: '100%' }}>
                ← Volver
              </button>
            </motion.div>
          )}

          {/* VERIFY OTP */}
          {mode === 'verify-otp' && (
            <motion.div
              key="verify-otp"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '440px', borderRadius: '1rem', padding: '2.5rem 2rem', textAlign: 'center' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'hsl(var(--foreground))' }}>VERIFICAR </span>
                <span style={{ color: 'hsl(var(--neon))' }}>EMAIL</span>
              </h2>
              <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', marginBottom: '2rem' }}>
                Ingresa el código de 6 dígitos enviado a{' '}
                <strong style={{ color: 'hsl(var(--neon))' }}>{pendingEmail}</strong>
              </p>
              <form onSubmit={handleVerifyOtp} noValidate>
                <div style={{ marginBottom: '1.5rem' }}>
                  <input
                    className="input-dark"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors({}); }}
                    style={{
                      textAlign: 'center',
                      fontSize: '2rem',
                      letterSpacing: '0.5em',
                      fontFamily: "'Bebas Neue', sans-serif",
                      ...(errors.otp ? { borderColor: 'hsl(var(--destructive))' } : {}),
                    }}
                  />
                  {errors.otp && (
                    <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                      {errors.otp}
                    </p>
                  )}
                </div>
                <button className="btn-neon" type="submit" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
                  {loading ? 'VERIFICANDO...' : 'VERIFICAR CÓDIGO'}
                </button>
              </form>
              <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.75rem', marginBottom: '1rem' }}>
                💡 El código apareció en un alert al registrarte (simulación)
              </p>
              <button className="btn-ghost" onClick={() => { setMode('register-select'); setErrors({}); setOtpCode(''); }} style={{ width: '100%' }}>
                ← Volver al registro
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
