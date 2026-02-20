import { useState } from 'react';
import { getSession, type AuthUser } from '../lib/auth';
import { LoginScreen } from '../components/LoginScreen';
import { Dashboard } from '../components/Dashboard';
import { ToastContainer, useToasts } from '../components/ToastSystem';

const Index = () => {
  const [user, setUser] = useState<AuthUser | null>(getSession);
  const { toasts, addToast, removeToast } = useToasts();

  const handleLogin = () => {
    setUser(getSession());
  };

  const handleLogout = () => {
    setUser(null);
  };

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
