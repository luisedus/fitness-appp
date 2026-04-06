import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface MemberManagerProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  age: number | null;
  gender: string | null;
  level: string | null;
  created_at: string | null;
}

export function MemberManager({ addToast }: MemberManagerProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockReasons, setBlockReasons] = useState<Record<string, string>>({});
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, blockedRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('blocked_users').select('user_id'),
    ]);

    if (profilesRes.error) {
      addToast('Error al cargar perfiles: ' + profilesRes.error.message, 'error');
    } else {
      setProfiles(profilesRes.data || []);
    }
    setBlockedIds((blockedRes.data || []).map(b => b.user_id));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBlock = async (userId: string, userName: string) => {
    const reason = blockReasons[userId] || 'Bloqueado por el administrador';
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('blocked_users')
      .insert({ user_id: userId, blocked_by: user.id, reason });

    if (error) {
      addToast('Error al bloquear: ' + error.message, 'error');
    } else {
      addToast(`🚫 ${userName} bloqueado`, 'success');
      fetchData();
    }
  };

  const handleUnblock = async (userId: string, userName: string) => {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('user_id', userId);

    if (error) {
      addToast('Error al desbloquear: ' + error.message, 'error');
    } else {
      addToast(`✅ ${userName} desbloqueado`, 'success');
      fetchData();
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--smoke))' }}>
        Cargando perfiles...
      </div>
    );
  }

  return (
    <div>
      <h2 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.6rem',
        marginBottom: '1.5rem',
      }}>
        <span style={{ color: 'hsl(var(--foreground))' }}>👥 GESTIÓN DE </span>
        <span style={{ color: 'hsl(var(--neon))' }}>SOCIOS</span>
      </h2>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {profiles.map((profile) => {
          const isBlocked = blockedIds.includes(profile.id);
          return (
            <motion.div
              key={profile.id}
              className="glass-card"
              style={{
                padding: '1.25rem',
                borderRadius: '0.75rem',
                border: isBlocked ? '1px solid hsl(var(--destructive) / 0.5)' : '1px solid hsl(var(--border))',
                opacity: isBlocked ? 0.7 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1rem' }}>{profile.role === 'coach' ? '🎯' : '🏋️'}</span>
                    <span style={{ fontWeight: '700', color: 'hsl(var(--foreground))' }}>{profile.name}</span>
                    {isBlocked && (
                      <span style={{
                        background: 'hsl(var(--destructive) / 0.2)',
                        color: 'hsl(var(--destructive))',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                      }}>
                        BLOQUEADO
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--smoke))' }}>{profile.email}</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--neon))', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                    {profile.role} {profile.level && `• ${profile.level}`} {profile.age && `• ${profile.age} años`}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {!isBlocked ? (
                    <>
                      <input
                        className="input-dark"
                        placeholder="Razón del bloqueo..."
                        value={blockReasons[profile.id] || ''}
                        onChange={e => setBlockReasons(p => ({ ...p, [profile.id]: e.target.value }))}
                        style={{ width: '180px', height: '32px', fontSize: '0.75rem' }}
                      />
                      <button
                        className="btn-danger"
                        onClick={() => handleBlock(profile.id, profile.name)}
                        style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}
                      >
                        🚫 Bloquear
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-neon"
                      onClick={() => handleUnblock(profile.id, profile.name)}
                      style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}
                    >
                      ✅ Desbloquear
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {profiles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--smoke))' }}>
          No hay usuarios registrados aún.
        </div>
      )}
    </div>
  );
}
