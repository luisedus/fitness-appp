export type UserRole = 'coach' | 'member';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  // Coach specific
  specialty?: string;
  certification?: string;
  experience?: string;
  // Member specific
  age?: number;
  gender?: 'hombre' | 'mujer';
  level?: 'Principiante' | 'Intermedio' | 'Pro';
}

const SESSION_KEY = 'gymbros_session';
const PENDING_OTP_KEY = 'gymbros_pending_otp';

// Simulated user DB (stored in localStorage)
const USERS_KEY = 'gymbros_users';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function startRegistration(data: Omit<AuthUser, 'id'> & { password: string }): { success: boolean; message: string; code?: string } {
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
    // Code matches — complete registration
    const result = registerUser(pending.data);
    localStorage.removeItem(PENDING_OTP_KEY);
    return result;
  } catch {
    return { success: false, message: 'Error al verificar el código.' };
  }
}

function getUsers(): AuthUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users: AuthUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Seed default admin/coach user
function seedDefaultUsers() {
  const users = getUsers();
  if (!users.find(u => u.email === 'admin@gymbros.com')) {
    const defaults: AuthUser[] = [
      {
        id: 'admin-1',
        email: 'admin@gymbros.com',
        name: 'Admin Coach',
        role: 'coach',
        specialty: 'Entrenamiento Funcional',
        certification: 'NSCA-CPT',
        experience: '5 años',
      },
    ];
    saveUsers([...users, ...defaults]);
  }
}

seedDefaultUsers();

export function registerUser(data: Omit<AuthUser, 'id'> & { password: string }): { success: boolean; message: string } {
  const users = getUsers();
  if (users.find(u => u.email === data.email)) {
    return { success: false, message: 'El email ya está registrado.' };
  }
  const newUser: AuthUser = {
    id: `user-${Date.now()}`,
    email: data.email,
    name: data.name,
    role: data.role,
    specialty: data.specialty,
    certification: data.certification,
    experience: data.experience,
    age: data.age,
    gender: data.gender,
    level: data.level,
  };
  // Store password separately (in real app, this would be hashed)
  const passwords = JSON.parse(localStorage.getItem('gymbros_passwords') || '{}');
  passwords[data.email] = data.password;
  localStorage.setItem('gymbros_passwords', JSON.stringify(passwords));
  saveUsers([...users, newUser]);
  return { success: true, message: '¡Cuenta creada exitosamente!' };
}

export function loginUser(email: string, password: string): { success: boolean; user?: AuthUser; message: string } {
  const users = getUsers();
  const passwords = JSON.parse(localStorage.getItem('gymbros_passwords') || '{}');

  // Default admin bypass
  if (email === 'admin' && password === '1234') {
    const adminUser = users.find(u => u.email === 'admin@gymbros.com') || {
      id: 'admin-1',
      email: 'admin@gymbros.com',
      name: 'Admin Coach',
      role: 'coach' as UserRole,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
    return { success: true, user: adminUser, message: '¡Bienvenido de vuelta!' };
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return { success: false, message: 'Usuario no encontrado.' };
  }
  if (passwords[email] !== password) {
    return { success: false, message: 'Contraseña incorrecta.' };
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { success: true, user, message: '¡Bienvenido de vuelta!' };
}

export function logoutUser() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}
