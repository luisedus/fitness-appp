import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser, onAuthStateChange, type AppUser } from '../lib/supabase-auth';
import { LoginScreen } from '../components/LoginScreen';
import { Dashboard } from '../components/Dashboard';
import { ToastContainer, useToasts } from '../components/ToastSystem';

const Index = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToasts();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = onAuthStateChange(async (appUser) => {
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
  }, []);

  const handleLogin = async () => {
    const appUser = await getCurrentUser();
    setUser(appUser);
  };

  const handleLogout = () => {
    setUser(null);
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
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} addToast={addToast} />
      ) : (
        <LoginScreen onLogin={handleLogin} addToast={addToast} />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default Index;
