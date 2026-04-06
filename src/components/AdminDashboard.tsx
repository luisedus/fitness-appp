import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { type AuthUser, logoutUser, logActivity } from '../lib/auth';

interface AdminDashboardProps {
  user: AuthUser;
  onLogout: () => void;
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
  specialty: string | null;
  certification: string | null;
  experience: string | null;
  created_at: string | null;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: string | null;
  user_agent: string | null;
  created_at: string;
}

type AdminTab = 'users' | 'content' | 'activity';

export function AdminDashboard({ user, onLogout, addToast }: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ name: '', role: '' as string, level: '', age: '' });
  const [blockReasons, setBlockReasons] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, blockedRes, logsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('blocked_users').select('user_id'),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    setProfiles((profilesRes.data as Profile[]) || []);
    setBlockedIds((blockedRes.data || []).map(b => b.user_id));
    setLogs((logsRes.data as ActivityLog[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleBlock = async (userId: string, userName: string) => {
    const reason = blockReasons[userId] || 'Bloqueado por el administrador';
    const { error } = await supabase
      .from('blocked_users')
      .insert({ user_id: userId, blocked_by: user.id, reason });

    if (error) {
      addToast('Error: ' + error.message, 'error');
    } else {
      addToast(`🚫 ${userName} bloqueado`, 'success');
      await logActivity(user.id, 'BLOCK_USER', `Bloqueó a ${userName} (${userId})`);
      fetchData();
    }
  };

  const handleUnblock = async (userId: string, userName: string) => {
    const { error } = await supabase.from('blocked_users').delete().eq('user_id', userId);
    if (error) {
      addToast('Error: ' + error.message, 'error');
    } else {
      addToast(`✅ ${userName} desbloqueado`, 'success');
      await logActivity(user.id, 'UNBLOCK_USER', `Desbloqueó a ${userName}`);
      fetchData();
    }
  };

  const handleDelete = async (profile: Profile) => {
    // Delete profile (cascade will handle related data)
    const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
    if (error) {
      addToast('Error al eliminar: ' + error.message, 'error');
    } else {
      addToast(`🗑️ ${profile.name} eliminado`, 'success');
      await logActivity(user.id, 'DELETE_USER', `Eliminó cuenta de ${profile.name} (${profile.email})`);
      fetchData();
    }
    setConfirmDelete(null);
  };

  const handleEditSave = async () => {
    if (!editingProfile) return;
    const updates: any = { name: editForm.name };
    if (editForm.level) updates.level = editForm.level;
    if (editForm.age) updates.age = parseInt(editForm.age);

    const { error } = await supabase.from('profiles').update(updates).eq('id', editingProfile.id);
    if (error) {
      addToast('Error: ' + error.message, 'error');
    } else {
      addToast(`✏️ Perfil de ${editForm.name} actualizado`, 'success');
      await logActivity(user.id, 'EDIT_USER', `Editó perfil de ${editForm.name}`);
      fetchData();
    }
    setEditingProfile(null);
  };

  const openEdit = (p: Profile) => {
    setEditingProfile(p);
    setEditForm({
      name: p.name,
      role: p.role,
      level: p.level || '',
      age: p.age?.toString() || '',
    });
  };

  const handleLogout = async () => {
    await logoutUser();
    addToast('Sesión de admin cerrada 👋', 'info');
    onLogout();
  };

  const filteredProfiles = profiles.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLogs = logs.filter(l =>
    !search || l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.details || '').toLowerCase().includes(search.toLowerCase())
  );

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.7rem', color: 'hsl(var(--smoke))',
    letterSpacing: '0.1em', marginBottom: '0.35rem', textTransform: 'uppercase',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--carbon))', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Navbar */}
      <nav style={{
        background: 'linear-gradient(90deg, hsl(var(--graphite)), hsl(0 70% 20%))',
        borderBottom: '2px solid hsl(0 70% 40%)',
        padding: '0 1.5rem', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '0.08em' }}>
            <span style={{ color: 'hsl(var(--foreground))' }}>GYMBRO</span>
            <span style={{ color: 'hsl(0 70% 50%)' }}>'S</span>
          </div>
          <span style={{
            background: 'hsl(0 70% 50% / 0.2)', border: '1px solid hsl(0 70% 50%)',
            color: 'hsl(0 70% 60%)', padding: '0.15rem 0.6rem', borderRadius: '4px',
            fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.15em',
          }}>
            ADMIN MASTER
          </span>
        </div>

        <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', opacity: 0.5 }}>🔍</span>
          <input
            className="input-dark"
            placeholder="Buscar usuarios, acciones..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.2rem', height: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'hsl(var(--smoke))', fontSize: '0.8rem' }}>🔑 {user.email}</span>
          <button className="btn-ghost" onClick={handleLogout} style={{ fontSize: '0.78rem' }}>Salir</button>
        </div>
      </nav>

      {/* Stats Bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem', padding: '1.5rem', maxWidth: '1400px', width: '100%', margin: '0 auto',
      }}>
        {[
          { label: 'Total Usuarios', value: profiles.length, icon: '👥', color: 'hsl(var(--neon))' },
          { label: 'Bloqueados', value: blockedIds.length, icon: '🚫', color: 'hsl(0 70% 50%)' },
          { label: 'Coaches', value: profiles.filter(p => p.role === 'coach').length, icon: '🎯', color: 'hsl(200 70% 50%)' },
          { label: 'Actividades', value: logs.length, icon: '📊', color: 'hsl(45 70% 50%)' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{
            padding: '1rem 1.25rem', borderRadius: '0.75rem',
            border: `1px solid ${s.color}33`,
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: s.color, fontFamily: "'Bebas Neue', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'hsl(var(--smoke))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
          {([
            { key: 'users', label: '👥 Usuarios', icon: '' },
            { key: 'content', label: '📋 Contenido', icon: '' },
            { key: 'activity', label: '📊 Actividad', icon: '' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: tab === t.key ? 'hsl(0 70% 50%)' : 'hsl(var(--smoke))',
                fontFamily: "'Inter', sans-serif", fontWeight: '600', fontSize: '0.9rem',
                padding: '0.75rem 1rem',
                borderBottom: tab === t.key ? '2px solid hsl(0 70% 50%)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--smoke))' }}>Cargando datos...</div>
        ) : (
          <AnimatePresence mode="wait">
            {/* USERS TAB */}
            {tab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        {['Usuario', 'Email', 'Rol', 'Nivel', 'Edad', 'Estado', 'Registro', 'Acciones'].map(h => (
                          <th key={h} style={{
                            padding: '0.75rem 0.5rem', textAlign: 'left', color: 'hsl(var(--smoke))',
                            fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProfiles.map(p => {
                        const isBlocked = blockedIds.includes(p.id);
                        const isAdmin = p.email === 'admin@admin.com';
                        return (
                          <tr key={p.id} style={{
                            borderBottom: '1px solid hsl(var(--border) / 0.5)',
                            opacity: isBlocked ? 0.6 : 1,
                            background: isAdmin ? 'hsl(0 70% 50% / 0.05)' : undefined,
                          }}>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>
                              {p.role === 'coach' ? '🎯' : '🏋️'} {p.name}
                              {isAdmin && <span style={{ color: 'hsl(0 70% 50%)', fontSize: '0.65rem', marginLeft: '0.4rem' }}>ADMIN</span>}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'hsl(var(--smoke))' }}>{p.email}</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span style={{
                                padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600',
                                background: p.role === 'coach' ? 'hsl(200 70% 50% / 0.15)' : 'hsl(var(--neon) / 0.15)',
                                color: p.role === 'coach' ? 'hsl(200 70% 50%)' : 'hsl(var(--neon))',
                                textTransform: 'uppercase',
                              }}>{p.role}</span>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'hsl(var(--neon))' }}>{p.level || '—'}</td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'hsl(var(--smoke))' }}>{p.age || '—'}</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              {isBlocked ? (
                                <span style={{ color: 'hsl(var(--destructive))', fontSize: '0.72rem', fontWeight: '700' }}>🚫 BLOQUEADO</span>
                              ) : (
                                <span style={{ color: 'hsl(var(--neon))', fontSize: '0.72rem' }}>✅ Activo</span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'hsl(var(--smoke))', fontSize: '0.75rem' }}>
                              {p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES') : '—'}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              {!isAdmin && (
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => openEdit(p)}
                                    style={{
                                      padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: '600',
                                      background: 'hsl(200 70% 50% / 0.15)', border: '1px solid hsl(200 70% 50% / 0.3)',
                                      color: 'hsl(200 70% 50%)', cursor: 'pointer',
                                    }}
                                  >✏️ Editar</button>
                                  {!isBlocked ? (
                                    <button
                                      onClick={() => handleBlock(p.id, p.name)}
                                      style={{
                                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: '600',
                                        background: 'hsl(30 80% 50% / 0.15)', border: '1px solid hsl(30 80% 50% / 0.3)',
                                        color: 'hsl(30 80% 50%)', cursor: 'pointer',
                                      }}
                                    >🚫 Bloquear</button>
                                  ) : (
                                    <button
                                      onClick={() => handleUnblock(p.id, p.name)}
                                      style={{
                                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: '600',
                                        background: 'hsl(var(--neon) / 0.15)', border: '1px solid hsl(var(--neon) / 0.3)',
                                        color: 'hsl(var(--neon))', cursor: 'pointer',
                                      }}
                                    >✅ Desbloquear</button>
                                  )}
                                  <button
                                    onClick={() => setConfirmDelete(p.id)}
                                    style={{
                                      padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: '600',
                                      background: 'hsl(var(--destructive) / 0.15)', border: '1px solid hsl(var(--destructive) / 0.3)',
                                      color: 'hsl(var(--destructive))', cursor: 'pointer',
                                    }}
                                  >🗑️ Eliminar</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredProfiles.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--smoke))' }}>No se encontraron usuarios.</div>
                )}
              </motion.div>
            )}

            {/* CONTENT TAB */}
            {tab === 'content' && (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--smoke))' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                  <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Gestión de contenido</p>
                  <p style={{ fontSize: '0.85rem' }}>Las rutinas se gestionan desde localStorage. El admin puede ver y administrar todo el contenido desde la pestaña de Usuarios.</p>
                </div>
              </motion.div>
            )}

            {/* ACTIVITY TAB */}
            {tab === 'activity' && (
              <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', marginBottom: '1rem' }}>
                  <span style={{ color: 'hsl(var(--foreground))' }}>📊 REGISTRO DE </span>
                  <span style={{ color: 'hsl(0 70% 50%)' }}>ACTIVIDAD</span>
                </h3>
                {filteredLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--smoke))' }}>No hay registros de actividad aún.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                          {['Fecha', 'Acción', 'Detalles', 'Dispositivo'].map(h => (
                            <th key={h} style={{
                              padding: '0.75rem 0.5rem', textAlign: 'left', color: 'hsl(var(--smoke))',
                              fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map(log => (
                          <tr key={log.id} style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                            <td style={{ padding: '0.6rem 0.5rem', color: 'hsl(var(--smoke))', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                              {new Date(log.created_at).toLocaleString('es-ES')}
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem' }}>
                              <span style={{
                                padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: '600',
                                background: log.action === 'LOGIN' ? 'hsl(var(--neon) / 0.15)' : 'hsl(200 70% 50% / 0.15)',
                                color: log.action === 'LOGIN' ? 'hsl(var(--neon))' : 'hsl(200 70% 50%)',
                              }}>{log.action}</span>
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', color: 'hsl(var(--foreground))', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.details || '—'}
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', color: 'hsl(var(--smoke))', fontSize: '0.7rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.user_agent ? log.user_agent.substring(0, 50) + '...' : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editingProfile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={() => setEditingProfile(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-card"
              style={{ padding: '2rem', borderRadius: '1rem', maxWidth: '420px', width: '90%' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                <span style={{ color: 'hsl(var(--foreground))' }}>✏️ EDITAR </span>
                <span style={{ color: 'hsl(0 70% 50%)' }}>PERFIL</span>
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Nombre</label>
                <input className="input-dark" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Nivel</label>
                  <select className="input-dark" value={editForm.level} onChange={e => setEditForm(p => ({ ...p, level: e.target.value }))}>
                    <option value="">—</option>
                    <option>Principiante</option>
                    <option>Intermedio</option>
                    <option>Pro</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Edad</label>
                  <input className="input-dark" type="number" value={editForm.age} onChange={e => setEditForm(p => ({ ...p, age: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-neon" style={{ flex: 1 }} onClick={handleEditSave}>Guardar</button>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setEditingProfile(null)}>Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-card"
              style={{ padding: '2rem', borderRadius: '1rem', maxWidth: '380px', width: '90%', textAlign: 'center' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', marginBottom: '0.5rem', color: 'hsl(var(--destructive))' }}>
                ¿ELIMINAR CUENTA?
              </h3>
              <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Esto eliminará permanentemente el perfil de:
              </p>
              <p style={{ color: 'hsl(var(--foreground))', fontWeight: '700', marginBottom: '1.5rem' }}>
                {profiles.find(p => p.id === confirmDelete)?.name} ({profiles.find(p => p.id === confirmDelete)?.email})
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  className="btn-danger"
                  onClick={() => {
                    const p = profiles.find(pr => pr.id === confirmDelete);
                    if (p) handleDelete(p);
                  }}
                >
                  🗑️ Eliminar
                </button>
                <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
