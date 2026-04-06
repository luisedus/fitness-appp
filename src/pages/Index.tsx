import { useState, useEffect } from 'react';
import { getSession, onAuthStateChange, type AuthUser } from '../lib/auth';
import { LoginScreen } from '../components/LoginScreen';
import { Dashboard } from '../components/Dashboard';
import { AdminDashboard } from '../components/AdminDashboard';
import { ToastContainer, useToasts } from '../components/ToastSystem';

const Index = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToasts();

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    getSession().then((session) => {
      setUser(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const session = await getSession();
    setUser(session);
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
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '2rem',
            letterSpacing: '0.08em',
            marginBottom: '1rem',
          }}>
            <span style={{ color: 'hsl(var(--foreground))' }}>GYMBRO</span>
            <span style={{ color: 'hsl(var(--neon))' }}>'S</span>
          </div>
          <div style={{ color: 'hsl(var(--smoke))', fontSize: '0.9rem' }}>Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {user ? (
        user.isAdminMaster ? (
          <AdminDashboard user={user} onLogout={handleLogout} addToast={addToast} />
        ) : (
          <Dashboard user={user} onLogout={handleLogout} addToast={addToast} />
        )
      ) : (
        <LoginScreen onLogin={handleLogin} addToast={addToast} />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default Index;
