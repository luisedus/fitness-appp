import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  const [backMsg, setBackMsg] = useState(false);

  useEffect(() => {
    const on = () => { setOnline(true); setBackMsg(true); setTimeout(() => setBackMsg(false), 3500); };
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (online && !backMsg) return null;
  return (
    <div
      role="status"
      style={{
        position: 'fixed', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 2000,
        padding: '0.6rem 1.1rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600,
        background: 'hsl(var(--graphite))',
        border: `1px solid ${online ? 'hsl(var(--neon))' : 'hsl(var(--destructive))'}`,
        color: online ? 'hsl(var(--neon))' : 'hsl(var(--foreground))',
      }}
    >
      {online
        ? '✅ Conexión recuperada — cambios sincronizados'
        : '📴 Sin conexión — puedes consultar tus rutinas guardadas'}
    </div>
  );
}
