import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser, onAuthStateChange, type AppUser } from '../lib/supabase-auth';
import { LoginScreen } from '../components/LoginScreen';
import { Dashboard } from '../components/Dashboard';
import { ToastContainer, useToasts } from '../components/ToastSystem';

const Index = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaPending, setMfaPending] = useState(false);
  const { toasts, addToast, removeToast } = useToasts();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = onAuthStateChange(async (appUser, event) => {
      // Don't auto-set user on SIGNED_IN if MFA is pending
      if (event === 'SIGNED_IN' && mfaPending) return;
      setUser(appUser);
      setLoading(false);
    });

    // Then check current session
    const checkSession = async () => {
      const appUser = await getCurrentUser();
      setUser(appUser);
      setLoading(false);
    };
    checkSession();

    return () => subscription.unsubscribe();
  }, [mfaPending]);

  const handleLogin = async () => {
    setMfaPending(false);
    const appUser = await getCurrentUser();
    setUser(appUser);
  };

  const handleMfaPending = () => {
    setMfaPending(true);
  };

  const handleLogout = () => {
    setUser(null);
    setMfaPending(false);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'hsl(var(--carbon))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>🏋️</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: 'hsl(var(--neon))' }}>
            CARGANDO...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {user && !mfaPending ? (
        <Dashboard user={user} onLogout={handleLogout} addToast={addToast} />
      ) : (
        <LoginScreen onLogin={handleLogin} onMfaPending={handleMfaPending} addToast={addToast} />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default Index;
