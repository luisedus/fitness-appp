import { isUserBlocked } from './blocking';

export type UserRole = 'coach' | 'member';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  specialty?: string;
  certification?: string;
  experience?: string;
  age?: number;
  gender?: 'hombre' | 'mujer';
  level?: 'Principiante' | 'Intermedio' | 'Pro';
  // MFA
  mfaEnabled?: boolean;
  // Recovery
  secretQuestion?: string;
  secretAnswerHash?: string;
  phone?: string;
}

const SESSION_KEY = 'gymbros_session';
const PENDING_OTP_KEY = 'gymbros_pending_otp';
const USERS_KEY = 'gymbros_users';
const MFA_PENDING_KEY = 'gymbros_mfa_pending';
const RECOVERY_KEY = 'gymbros_recovery_pending';
const SSO_TOKEN_KEY = 'gymbros_sso_token';
const SESSIONS_KEY = 'gymbros_sessions';

// ─── Helpers ────────────────────────────────
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getUsers(): AuthUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}

function saveUsers(users: AuthUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ─── Session tracking ───────────────────────
export interface SessionRecord {
  id: string;
  userId: string;
  device: string;
  ip: string;
  startedAt: string;
  active: boolean;
}

function getSessions(): SessionRecord[] {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'); } catch { return []; }
}

function saveSessions(sessions: SessionRecord[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function createSession(userId: string): SessionRecord {
  const sessions = getSessions();
  // Deactivate previous sessions for this user
  sessions.forEach(s => { if (s.userId === userId) s.active = false; });
  const newSession: SessionRecord = {
    id: `sess-${Date.now()}`,
    userId,
    device: navigator.userAgent.includes('Mobile') ? '📱 Dispositivo Móvil' : '💻 Escritorio (Navegador)',
    ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    startedAt: new Date().toLocaleString('es-ES'),
    active: true,
  };
  saveSessions([...sessions, newSession]);
  return newSession;
}

export function getUserSessions(userId: string): SessionRecord[] {
  return getSessions().filter(s => s.userId === userId);
}

export function revokeSession(sessionId: string) {
  const sessions = getSessions();
  const s = sessions.find(s => s.id === sessionId);
  if (s) { s.active = false; saveSessions(sessions); }
}

export function revokeAllSessions(userId: string) {
  const sessions = getSessions();
  sessions.forEach(s => { if (s.userId === userId) s.active = false; });
  saveSessions(sessions);
}

// ─── Seed defaults ──────────────────────────
function seedDefaultUsers() {
  const users = getUsers();
  if (!users.find(u => u.email === 'admin@gymbros.com')) {
    const defaults: AuthUser[] = [{
      id: 'admin-1', email: 'admin@gymbros.com', name: 'Admin Coach', role: 'coach',
      specialty: 'Entrenamiento Funcional', certification: 'NSCA-CPT', experience: '5 años',
      mfaEnabled: false,
    }];
    saveUsers([...users, ...defaults]);
  }
}
seedDefaultUsers();

// ─── Registration with OTP ──────────────────
export function startRegistration(data: Omit<AuthUser, 'id'> & { password: string; secretQuestion?: string; secretAnswer?: string }): { success: boolean; message: string; code?: string } {
  const users = getUsers();
  if (users.find(u => u.email === data.email)) {
    return { success: false, message: 'El email ya está registrado.' };
  }
  const code = generateOtp();
  localStorage.setItem(PENDING_OTP_KEY, JSON.stringify({ data, code }));
  return { success: true, message: `Código de verificación enviado a ${data.email}`, code };
}

export function verifyOtp(inputCode: string): { success: boolean; message: string } {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_OTP_KEY) || 'null');
    if (!pending) return { success: false, message: 'No hay registro pendiente.' };
    if (pending.code !== inputCode) return { success: false, message: 'Código incorrecto.' };
    const result = registerUser(pending.data);
    localStorage.removeItem(PENDING_OTP_KEY);
    return result;
  } catch {
    return { success: false, message: 'Error al verificar el código.' };
  }
}

function registerUser(data: Omit<AuthUser, 'id'> & { password: string; secretQuestion?: string; secretAnswer?: string }): { success: boolean; message: string } {
  const users = getUsers();
  if (users.find(u => u.email === data.email)) {
    return { success: false, message: 'El email ya está registrado.' };
  }
  const newUser: AuthUser = {
    id: `user-${Date.now()}`,
    email: data.email, name: data.name, role: data.role,
    specialty: data.specialty, certification: data.certification, experience: data.experience,
    age: data.age, gender: data.gender, level: data.level,
    mfaEnabled: false,
    secretQuestion: data.secretQuestion,
    secretAnswerHash: data.secretAnswer ? simpleHash(data.secretAnswer.toLowerCase().trim()) : undefined,
    phone: undefined,
  };
  const passwords = JSON.parse(localStorage.getItem('gymbros_passwords') || '{}');
  passwords[data.email] = data.password;
  localStorage.setItem('gymbros_passwords', JSON.stringify(passwords));
  saveUsers([...users, newUser]);
  return { success: true, message: '¡Cuenta creada exitosamente!' };
}

// ─── Login ──────────────────────────────────
export function loginUser(email: string, password: string): { success: boolean; user?: AuthUser; message: string; requiresMfa?: boolean } {
  const users = getUsers();
  const passwords = JSON.parse(localStorage.getItem('gymbros_passwords') || '{}');

  // Admin bypass
  if (email === 'admin' && password === '1234') {
    const adminUser = users.find(u => u.email === 'admin@gymbros.com') || {
      id: 'admin-1', email: 'admin@gymbros.com', name: 'Admin Coach', role: 'coach' as UserRole,
    };
    if (adminUser.mfaEnabled) {
      const code = generateOtp();
      localStorage.setItem(MFA_PENDING_KEY, JSON.stringify({ userId: adminUser.id, code }));
      return { success: true, requiresMfa: true, user: adminUser, message: `Código MFA: ${code}` };
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
    createSession(adminUser.id);
    return { success: true, user: adminUser, message: '¡Bienvenido de vuelta!' };
  }

  const user = users.find(u => u.email === email);
  if (!user) return { success: false, message: 'Usuario no encontrado.' };
  if (passwords[email] !== password) return { success: false, message: 'Contraseña incorrecta.' };

  // Check if blocked
  const { isUserBlocked } = await import('./blocking');
  if (isUserBlocked(user.id)) {
    return { success: false, message: '🚫 Tu cuenta ha sido bloqueada. Contacta al administrador.' };
  }

  if (user.mfaEnabled) {
    const code = generateOtp();
    localStorage.setItem(MFA_PENDING_KEY, JSON.stringify({ userId: user.id, code }));
    return { success: true, requiresMfa: true, user, message: `Código MFA: ${code}` };
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  createSession(user.id);
  return { success: true, user, message: '¡Bienvenido de vuelta!' };
}

// ─── MFA Verification ───────────────────────
export function verifyMfaCode(inputCode: string): { success: boolean; user?: AuthUser; message: string } {
  try {
    const pending = JSON.parse(localStorage.getItem(MFA_PENDING_KEY) || 'null');
    if (!pending) return { success: false, message: 'No hay verificación MFA pendiente.' };
    if (pending.code !== inputCode) return { success: false, message: 'Código MFA incorrecto.' };

    const users = getUsers();
    const user = users.find(u => u.id === pending.userId);
    if (!user) return { success: false, message: 'Usuario no encontrado.' };

    localStorage.removeItem(MFA_PENDING_KEY);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    createSession(user.id);
    return { success: true, user, message: '¡Autenticación MFA completada!' };
  } catch {
    return { success: false, message: 'Error en verificación MFA.' };
  }
}

// ─── Recovery Mechanisms ────────────────────
export type RecoveryMethod = 'email' | 'secret-question' | 'sms' | 'call';

export function startRecovery(email: string, method: RecoveryMethod): { success: boolean; message: string; code?: string; question?: string } {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) return { success: false, message: 'Email no registrado.' };

  const code = generateOtp();

  switch (method) {
    case 'email':
      localStorage.setItem(RECOVERY_KEY, JSON.stringify({ userId: user.id, method, code }));
      return { success: true, message: `Enlace de recuperación enviado a ${email}`, code };
    case 'secret-question':
      if (!user.secretQuestion) return { success: false, message: 'No tienes una pregunta secreta configurada.' };
      localStorage.setItem(RECOVERY_KEY, JSON.stringify({ userId: user.id, method }));
      return { success: true, message: 'Responde tu pregunta secreta.', question: user.secretQuestion };
    case 'sms':
      localStorage.setItem(RECOVERY_KEY, JSON.stringify({ userId: user.id, method, code }));
      return { success: true, message: `SMS enviado al número asociado a ${email}`, code };
    case 'call':
      localStorage.setItem(RECOVERY_KEY, JSON.stringify({ userId: user.id, method, code }));
      return { success: true, message: `Llamada realizada al número asociado a ${email}`, code };
  }
}

export function verifyRecovery(input: string): { success: boolean; message: string; userId?: string } {
  try {
    const pending = JSON.parse(localStorage.getItem(RECOVERY_KEY) || 'null');
    if (!pending) return { success: false, message: 'No hay recuperación pendiente.' };

    if (pending.method === 'secret-question') {
      const users = getUsers();
      const user = users.find(u => u.id === pending.userId);
      if (!user || !user.secretAnswerHash) return { success: false, message: 'Error al verificar.' };
      if (simpleHash(input.toLowerCase().trim()) !== user.secretAnswerHash) {
        return { success: false, message: 'Respuesta incorrecta.' };
      }
    } else {
      if (pending.code !== input) return { success: false, message: 'Código incorrecto.' };
    }

    localStorage.removeItem(RECOVERY_KEY);
    return { success: true, message: 'Verificación exitosa. Establece tu nueva contraseña.', userId: pending.userId };
  } catch {
    return { success: false, message: 'Error en la recuperación.' };
  }
}

export function resetPassword(userId: string, newPassword: string): { success: boolean; message: string } {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'Usuario no encontrado.' };
  const passwords = JSON.parse(localStorage.getItem('gymbros_passwords') || '{}');
  passwords[user.email] = newPassword;
  localStorage.setItem('gymbros_passwords', JSON.stringify(passwords));
  return { success: true, message: '¡Contraseña actualizada exitosamente!' };
}

// ─── User Settings ──────────────────────────
export function changePassword(userId: string, currentPassword: string, newPassword: string): { success: boolean; message: string } {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'Usuario no encontrado.' };
  const passwords = JSON.parse(localStorage.getItem('gymbros_passwords') || '{}');
  if (passwords[user.email] !== currentPassword) return { success: false, message: 'Contraseña actual incorrecta.' };
  if (newPassword.length < 4) return { success: false, message: 'La nueva contraseña debe tener al menos 4 caracteres.' };
  passwords[user.email] = newPassword;
  localStorage.setItem('gymbros_passwords', JSON.stringify(passwords));
  return { success: true, message: '¡Contraseña cambiada exitosamente!' };
}

export function toggleMfa(userId: string): { success: boolean; enabled: boolean; message: string } {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, enabled: false, message: 'Usuario no encontrado.' };
  user.mfaEnabled = !user.mfaEnabled;
  saveUsers(users);
  // Update session
  const session = getSession();
  if (session && session.id === userId) {
    session.mfaEnabled = user.mfaEnabled;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return { success: true, enabled: user.mfaEnabled, message: user.mfaEnabled ? 'MFA activado ✅' : 'MFA desactivado' };
}

export function updateSecretQuestion(userId: string, question: string, answer: string): { success: boolean; message: string } {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'Usuario no encontrado.' };
  user.secretQuestion = question;
  user.secretAnswerHash = simpleHash(answer.toLowerCase().trim());
  saveUsers(users);
  return { success: true, message: 'Pregunta secreta actualizada.' };
}

// ─── SSO Simulation ─────────────────────────
export interface SSOToken {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  token: string;
  issuedAt: number;
  expiresAt: number;
  domain: string;
}

export function generateSSOToken(userId: string): SSOToken | null {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  const token: SSOToken = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    token: `sso-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
    domain: 'gymbros.app',
  };
  localStorage.setItem(SSO_TOKEN_KEY, JSON.stringify(token));
  return token;
}

export function validateSSOToken(tokenStr: string): { success: boolean; user?: AuthUser; message: string } {
  try {
    const stored = JSON.parse(localStorage.getItem(SSO_TOKEN_KEY) || 'null') as SSOToken | null;
    if (!stored || stored.token !== tokenStr) return { success: false, message: 'Token SSO inválido.' };
    if (Date.now() > stored.expiresAt) {
      localStorage.removeItem(SSO_TOKEN_KEY);
      return { success: false, message: 'Token SSO expirado.' };
    }
    const users = getUsers();
    const user = users.find(u => u.id === stored.userId);
    if (!user) return { success: false, message: 'Usuario no encontrado.' };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    createSession(user.id);
    return { success: true, user, message: '¡Acceso SSO concedido!' };
  } catch {
    return { success: false, message: 'Error al validar token SSO.' };
  }
}

export function getActiveSSOToken(): SSOToken | null {
  try {
    const stored = JSON.parse(localStorage.getItem(SSO_TOKEN_KEY) || 'null') as SSOToken | null;
    if (stored && Date.now() < stored.expiresAt) return stored;
    return null;
  } catch { return null; }
}

// ─── Basic session ──────────────────────────
export function logoutUser() {
  const session = getSession();
  if (session) {
    const sessions = getSessions();
    const active = sessions.find(s => s.userId === session.id && s.active);
    if (active) { active.active = false; saveSessions(sessions); }
  }
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}
