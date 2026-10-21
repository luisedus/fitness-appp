import { supabase } from '@/integrations/supabase/client';
import { getPrivacyConsentError } from './privacy';

export type UserRole = 'coach' | 'member' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isAdminMaster?: boolean;
  specialty?: string;
  certification?: string;
  experience?: string;
  age?: number;
  gender?: string;
  level?: string;
}

function buildAuthUser(id: string, email: string, profile: any, metadata: any): AuthUser {
  const role = (profile?.role as UserRole) || 'member';
  return {
    id,
    email,
    name: profile?.name || metadata?.name || email,
    role,
    isAdminMaster: role === 'admin',
    specialty: profile?.specialty || undefined,
    certification: profile?.certification || undefined,
    experience: profile?.experience || undefined,
    age: profile?.age || undefined,
    gender: profile?.gender || undefined,
    level: profile?.level || undefined,
  };
}

// ─── Log activity ───────────────────────────
export async function logActivity(userId: string, action: string, details?: string) {
  try {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      details,
      user_agent: navigator.userAgent,
    });
  } catch {}
}

// ─── Registration ───────────────────────────
export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  privacyAccepted: boolean;
  age?: number;
  gender?: string;
  level?: string;
  specialty?: string;
  certification?: string;
  experience?: string;
}): Promise<{ success: boolean; message: string }> {
  const consentError = getPrivacyConsentError(data.privacyAccepted);
  if (consentError) return { success: false, message: consentError };

  if (data.email.toLowerCase() === 'admin@admin.com') {
    return { success: false, message: 'Este email está reservado.' };
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
        role: data.role,
        age: data.age,
        gender: data.gender,
        level: data.level,
        specialty: data.specialty,
        certification: data.certification,
        experience: data.experience,
      },
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return { success: false, message: 'Este email ya está registrado.' };
    }
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: '📧 Te hemos enviado un email de verificación. Revisa tu bandeja de entrada (y spam) para confirmar tu cuenta.',
  };
}

// ─── Login ──────────────────────────────────
export async function loginUser(email: string, password: string): Promise<{
  success: boolean;
  user?: AuthUser;
  message: string;
}> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return { success: false, message: '📧 Tu email no ha sido verificado. Revisa tu correo para confirmarlo.' };
    }
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, message: 'Email o contraseña incorrectos.' };
    }
    return { success: false, message: error.message };
  }

  if (!data.user) {
    return { success: false, message: 'Error al iniciar sesión.' };
  }

  // Admin bypasses block check
  if (data.user.email?.toLowerCase() !== 'admin@admin.com') {
    const { data: blocked } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (blocked) {
      await supabase.auth.signOut();
      return { success: false, message: '🚫 Tu cuenta ha sido bloqueada. Contacta al administrador.' };
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  const user = buildAuthUser(data.user.id, data.user.email || email, profile, data.user.user_metadata);

  // Log login
  await logActivity(user.id, 'LOGIN', `Inicio de sesión: ${email}`);

  return { success: true, user, message: '¡Bienvenido de vuelta!' };
}

// ─── Resend verification email ──────────────
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: window.location.origin },
  });

  if (error) return { success: false, message: error.message };
  return { success: true, message: '📧 Email de verificación reenviado. Revisa tu correo.' };
}

// ─── Password Recovery ─────────────────────
export async function sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) return { success: false, message: error.message };
  return { success: true, message: '📧 Se ha enviado un enlace de recuperación a tu correo.' };
}

export async function updatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, message: error.message };
  return { success: true, message: '¡Contraseña actualizada exitosamente!' };
}

export async function changePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
  if (newPassword.length < 6) {
    return { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
  }
  return updatePassword(newPassword);
}

// ─── Session ────────────────────────────────
export async function getSession(): Promise<AuthUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return buildAuthUser(session.user.id, session.user.email || '', profile, session.user.user_metadata);
}

export async function logoutUser() {
  await supabase.auth.signOut();
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      callback(buildAuthUser(session.user.id, session.user.email || '', profile, session.user.user_metadata));
    } else {
      callback(null);
    }
  });
}
