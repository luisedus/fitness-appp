import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type AuthUser, logoutUser } from '../lib/auth';
import { type Member, updateMember } from '../lib/data';
import { MemberManager } from './MemberManager';
import { CoachPanel } from './CoachPanel';
import { MuscleCarousel } from './MuscleCarousel';

interface DashboardProps {
  user: AuthUser;
  onLogout: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type Tab = 'members' | 'routines' | 'profile';

export function Dashboard({ user, onLogout, addToast }: DashboardProps) {
  const [tab, setTab] = useState<Tab>(user.role === 'coach' ? 'members' : 'routines');
  const [genderFilter, setGenderFilter] = useState<'todos' | 'hombre' | 'mujer'>('todos');
  const [search, setSearch] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [levelChangeWarn, setLevelChangeWarn] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<Member['level'] | null>(null);
  const [userLevel, setUserLevel] = useState<Member['level']>(user.level || 'Principiante');
  const [muscleFilter, setMuscleFilter] = useState('');

  const handleLogout = () => {
    logoutUser();
    addToast('Sesión cerrada. ¡Hasta pronto! 👋', 'info');
    onLogout();
  };

  const handleLevelChange = (newLevel: Member['level']) => {
    setPendingLevel(newLevel);
    setLevelChangeWarn(true);
  };

  const confirmLevelChange = () => {
    if (pendingLevel) {
      updateMember(user.id, { level: pendingLevel });
      setUserLevel(pendingLevel);
      addToast(`✅ Nivel actualizado a ${pendingLevel}`, 'success');
    }
    setLevelChangeWarn(false);
    setPendingLevel(null);
  };

  const isCoach = user.role === 'coach';

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--carbon))', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{
        background: 'hsl(var(--graphite))',
        borderBottom: '1px solid hsl(var(--border))',
        padding: '0 1.5rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        {/* Logo */}
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '0.08em', flexShrink: 0 }}>
          <span style={{ color: 'hsl(var(--foreground))' }}>GYMBRO</span>
          <span style={{ color: 'hsl(var(--neon))' }}>'S</span>
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: '420px', position: 'relative', minWidth: '160px' }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', opacity: 0.5 }}>🔍</span>
          <input
            className="input-dark"
            type="text"
            placeholder={tab === 'members' ? 'Buscar socio...' : 'Buscar rutina, ejercicio, coach...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.2rem', height: '36px' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--smoke))', fontSize: '0.85rem', lineHeight: 1 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => setTab('routines')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: tab === 'routines' ? 'hsl(var(--neon))' : 'hsl(var(--smoke))',
              fontSize: '0.85rem',
              padding: '0.4rem 0.75rem',
              fontFamily: "'Inter', sans-serif",
              transition: 'color 0.2s',
            }}
          >
            {isCoach ? 'Rutinas ▾' : 'Rutinas'}
          </button>
          {isCoach && (
            <button
              onClick={() => setTab('members')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: tab === 'members' ? 'hsl(var(--neon))' : 'hsl(var(--smoke))',
                fontSize: '0.85rem',
                padding: '0.4rem 0.75rem',
                fontFamily: "'Inter', sans-serif",
                transition: 'color 0.2s',
              }}
            >
              Socios
            </button>
          )}
          <button
            onClick={() => setShowProfile(p => !p)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--smoke))',
              fontSize: '0.85rem',
              padding: '0.4rem 0.75rem',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Mi Perfil ▾
          </button>
          <button
            className="btn-ghost"
            onClick={handleLogout}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
          >
            Salir
          </button>
        </div>
      </nav>

      {/* Profile Dropdown */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card"
            style={{
              position: 'fixed',
              top: '68px',
              right: '1.5rem',
              zIndex: 200,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              minWidth: '280px',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid hsl(var(--border))' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'hsl(var(--neon) / 0.15)',
                border: '2px solid hsl(var(--neon))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem', flexShrink: 0,
              }}>
                {isCoach ? '🎯' : '🏋️'}
              </div>
              <div>
                <div style={{ fontWeight: '700', color: 'hsl(var(--foreground))' }}>{user.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'hsl(var(--neon))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isCoach ? 'Coach' : 'Socio'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--smoke))' }}>{user.email}</div>
              </div>
            </div>

            {isCoach ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {[
                  { label: 'Especialidad', value: user.specialty },
                  { label: 'Certificación', value: user.certification },
                  { label: 'Experiencia', value: user.experience },
                ].map(({ label, value }) => value && (
                  <div key={label}>
                    <div style={{ fontSize: '0.68rem', color: 'hsl(var(--smoke))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                    <div style={{ fontSize: '0.85rem', color: 'hsl(var(--foreground))' }}>{value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[
                    { label: 'Género', value: user.gender === 'hombre' ? '♂ Hombre' : '♀ Mujer' },
                    { label: 'Edad', value: user.age ? `${user.age} años` : undefined },
                  ].map(({ label, value }) => value && (
                    <div key={label}>
                      <div style={{ fontSize: '0.68rem', color: 'hsl(var(--smoke))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                      <div style={{ fontSize: '0.85rem', color: 'hsl(var(--foreground))' }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'hsl(var(--smoke))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                    Nivel de entrenamiento
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {(['Principiante', 'Intermedio', 'Pro'] as const).map(l => (
                      <button
                        key={l}
                        onClick={() => l !== userLevel && handleLevelChange(l)}
                        style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          cursor: l === userLevel ? 'default' : 'pointer',
                          border: `1px solid ${l === userLevel ? 'hsl(var(--neon))' : 'hsl(var(--border))'}`,
                          background: l === userLevel ? 'hsl(var(--neon) / 0.15)' : 'transparent',
                          color: l === userLevel ? 'hsl(var(--neon))' : 'hsl(var(--smoke))',
                          transition: 'all 0.2s',
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              className="btn-danger"
              style={{ width: '100%', marginTop: '1.25rem', textAlign: 'center', padding: '0.5rem' }}
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Tab Indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0' }}>
          {(isCoach
            ? [{ key: 'members', label: '👥 Socios' }, { key: 'routines', label: '📋 Mis Rutinas' }]
            : [{ key: 'routines', label: '📋 Rutinas' }]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: tab === key ? 'hsl(var(--neon))' : 'hsl(var(--smoke))',
                fontFamily: "'Inter', sans-serif",
                fontWeight: '600',
                fontSize: '0.9rem',
                padding: '0.75rem 1rem',
                borderBottom: tab === key ? '2px solid hsl(var(--neon))' : '2px solid transparent',
                transition: 'all 0.2s',
                letterSpacing: '0.02em',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'members' && isCoach && (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <MemberManager addToast={addToast} />
            </motion.div>
          )}
          {tab === 'routines' && (
            <motion.div
              key="routines"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {!isCoach && (
                <MuscleCarousel
                  onSelectMuscle={(m) => setMuscleFilter(m)}
                  activeMuscle={muscleFilter}
                />
              )}
              <CoachPanel user={user} addToast={addToast} globalSearch={search} muscleFilter={muscleFilter} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Level Change Warning Modal */}
      <AnimatePresence>
        {levelChangeWarn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card"
              style={{ padding: '2rem', borderRadius: '1rem', maxWidth: '380px', width: '90%', textAlign: 'center' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', marginBottom: '0.5rem' }}>
                ¿CAMBIAR NIVEL?
              </h3>
              <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                Estás a punto de cambiar tu nivel de entrenamiento a
              </p>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'hsl(var(--neon))', marginBottom: '1rem' }}>
                {pendingLevel}
              </div>
              <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                Esto ajustará las rutinas y contenido mostrado según tu nuevo nivel.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn-neon" style={{ padding: '0.6rem 1.5rem' }} onClick={confirmLevelChange}>
                  Confirmar
                </button>
                <button className="btn-ghost" onClick={() => { setLevelChangeWarn(false); setPendingLevel(null); }}>
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
