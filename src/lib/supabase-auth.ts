import { supabase } from '@/integrations/supabase/client';
import type { User, AuthError } from '@supabase/supabase-js';

export type UserRole = 'coach' | 'member';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  specialty?: string;
  certification?: string;
  experience?: string;
  age?: number;
  gender?: string;
  level?: string;
}

const ADMIN_EMAIL = 'admin@gymbros.com';

export function isAdmin(user: AppUser | null): boolean {
  return user?.email === ADMIN_EMAIL;
}

// ─── Sign Up ────────────────────────────────
export async function signUp(data: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  specialty?: string;
  certification?: string;
  experience?: string;
  age?: number;
  gender?: string;
  level?: string;
}): Promise<{ success: boolean; message: string; needsConfirmation?: boolean }> {
  const { data: result, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
        role: data.role,
        specialty: data.specialty,
        certification: data.certification,
        experience: data.experience,
        age: data.age,
        gender: data.gender,
        level: data.level || 'Principiante',
      },
    },
  });

  if (error) {
    return { success: false, message: mapAuthError(error) };
  }

  // If email confirmation is required
  if (result.user && !result.session) {
    return {
      success: true,
      needsConfirmation: true,
      message: '📧 Se ha enviado un enlace de verificación a tu correo electrónico. Revisa tu bandeja de entrada (y spam) para confirmar tu cuenta.',
    };
  }

  return { success: true, message: '¡Cuenta creada exitosamente!' };
}

// ─── Sign In ────────────────────────────────
export async function signIn(email: string, password: string): Promise<{
  success: boolean;
  message: string;
  user?: AppUser;
  mfaRequired?: boolean;
}> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, message: mapAuthError(error) };
  }

  // Check if MFA is required
  // After sign in, check for enrolled MFA factors
  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (factors && factors.totp && factors.totp.length > 0) {
    const verifiedFactors = factors.totp.filter(f => f.status === 'verified');
    if (verifiedFactors.length > 0) {
      return {
        success: true,
        mfaRequired: true,
        message: 'Se requiere verificación MFA.',
      };
    }
  }

  const appUser = await getAppUser(data.user);
  if (!appUser) {
    return { success: false, message: 'Error al obtener el perfil.' };
  }

  // Check if blocked
  const { data: blockData } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .single();

  // We'll check blocking from the blocked_users table once we create it

  return { success: true, user: appUser, message: `¡Bienvenido, ${appUser.name}! 💪` };
}

// ─── MFA ────────────────────────────────────
export async function enrollMfa(): Promise<{
  success: boolean;
  qrCode?: string;
  secret?: string;
  factorId?: string;
  message: string;
}> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'GYMBROS Authenticator',
  });

  if (error) {
    return { success: false, message: `Error al configurar MFA: ${error.message}` };
  }

  return {
    success: true,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    factorId: data.id,
    message: 'Escanea el código QR con tu app de autenticación.',
  };
}

export async function verifyMfaEnrollment(factorId: string, code: string): Promise<{
  success: boolean;
  message: string;
}> {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (challengeError) return { success: false, message: challengeError.message };

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (verifyError) return { success: false, message: 'Código incorrecto. Intenta de nuevo.' };

  return { success: true, message: '✅ MFA activado exitosamente con Google Authenticator.' };
}

export async function verifyMfaLogin(code: string): Promise<{
  success: boolean;
  user?: AppUser;
  message: string;
}> {
  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (!factors || !factors.totp || factors.totp.length === 0) {
    return { success: false, message: 'No hay factores MFA configurados.' };
  }

  const factor = factors.totp.find(f => f.status === 'verified');
  if (!factor) return { success: false, message: 'No hay factor MFA verificado.' };

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: factor.id,
  });
  if (challengeError) return { success: false, message: challengeError.message };

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code,
  });
  if (verifyError) return { success: false, message: 'Código MFA incorrecto.' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Error al obtener usuario.' };

  const appUser = await getAppUser(user);
  return appUser
    ? { success: true, user: appUser, message: '¡Autenticación MFA completada! 🛡️💪' }
    : { success: false, message: 'Error al obtener perfil.' };
}

export async function unenrollMfa(): Promise<{ success: boolean; message: string }> {
  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (!factors || !factors.totp || factors.totp.length === 0) {
    return { success: false, message: 'No hay MFA configurado.' };
  }

  for (const factor of factors.totp) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }

  return { success: true, message: 'MFA desactivado.' };
}

export async function hasMfaEnabled(): Promise<boolean> {
  const { data: factors } = await supabase.auth.mfa.listFactors();
  return !!(factors && factors.totp && factors.totp.filter(f => f.status === 'verified').length > 0);
}

// ─── Password Reset ─────────────────────────
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) return { success: false, message: mapAuthError(error) };
  return { success: true, message: '📧 Se ha enviado un enlace de recuperación a tu correo. Revisa tu bandeja de entrada.' };
}

export async function updatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, message: mapAuthError(error) };
  return { success: true, message: '¡Contraseña actualizada exitosamente!' };
}

// ─── Sign Out ───────────────────────────────
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ─── Get Current User ───────────────────────
export async function getCurrentUser(): Promise<AppUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return getAppUser(user);
}

async function getAppUser(user: User): Promise<AppUser | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role as UserRole,
    specialty: profile.specialty ?? undefined,
    certification: profile.certification ?? undefined,
    experience: profile.experience ?? undefined,
    age: profile.age ?? undefined,
    gender: profile.gender ?? undefined,
    level: profile.level ?? undefined,
  };
}

// ─── Auth State Listener ────────────────────
export function onAuthStateChange(callback: (user: AppUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const appUser = await getAppUser(session.user);
      callback(appUser);
    } else if (event === 'SIGNED_OUT') {
      callback(null);
    }
  });
}

// ─── Helpers ────────────────────────────────
function mapAuthError(error: AuthError): string {
  const msg = error.message.toLowerCase();
  if (msg.includes('invalid login')) return 'Email o contraseña incorrectos.';
  if (msg.includes('email not confirmed')) return 'Debes confirmar tu email antes de iniciar sesión. Revisa tu correo.';
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'Este email ya está registrado.';
  if (msg.includes('password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('rate limit')) return 'Demasiados intentos. Espera un momento.';
  if (msg.includes('email rate limit')) return 'Se han enviado demasiados correos. Espera unos minutos.';
  return error.message;
}
