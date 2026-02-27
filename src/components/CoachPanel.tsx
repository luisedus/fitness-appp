import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Routine, getRoutines, addRoutine, deleteRoutine, updateRoutine } from '../lib/data';
import { type AuthUser } from '../lib/auth';

interface CoachPanelProps {
  user: AuthUser;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch?: string;
  muscleFilter?: string;
}

const MUSCLE_KEYWORDS: Record<string, string[]> = {
  'Pecho': ['pecho', 'press de banca', 'press', 'flexiones', 'aperturas', 'fondos', 'chest', 'bench'],
  'Espalda': ['espalda', 'remo', 'dominadas', 'jalón', 'pull', 'dorsal', 'back'],
  'Hombros': ['hombros', 'press militar', 'elevaciones laterales', 'deltoides', 'shoulder'],
  'Bíceps': ['bíceps', 'biceps', 'curl', 'martillo'],
  'Tríceps': ['tríceps', 'triceps', 'fondos', 'extensión', 'extensiones', 'press francés'],
  'Abdomen': ['abdomen', 'abdominal', 'plancha', 'crunch', 'core', 'oblicuos', 'torsión'],
  'Glúteos': ['glúteo', 'gluteo', 'hip thrust', 'patadas', 'abducción', 'sentadilla sumo', 'glúteos'],
  'Cuádriceps': ['cuádriceps', 'cuadriceps', 'sentadilla', 'zancadas', 'estocadas', 'prensa', 'extensión de pierna', 'squat'],
  'Isquiotibiales': ['isquiotibiales', 'curl de isquio', 'peso muerto rumano', 'femoral', 'isquio'],
  'Gemelos': ['gemelos', 'pantorrilla', 'elevación de talón', 'calf'],
  'Full Body': ['fullbody', 'full body', 'cuerpo completo', 'funcional', 'burpees', 'crossfit', 'hiit', 'metcon'],
};

const EXERCISE_SUGGESTIONS: Record<string, string[]> = {
  Principiante: ['Sentadillas', 'Flexiones', 'Plancha 30s', 'Jumping Jacks', 'Curl de bíceps', 'Caminar 20 min'],
  Intermedio: ['Peso muerto', 'Press de banca', 'Dominadas', 'Burpees x10', 'Fondos en paralelas', 'Remo con barra'],
  Pro: ['Sentadilla búlgara', 'Muscle-up', 'Clean & Press', 'Snatch', 'Pistol Squat', 'Sprint 100m x8'],
};

export function CoachPanel({ user, addToast, globalSearch = '', muscleFilter = '' }: CoachPanelProps) {
  const [routines, setRoutines] = useState<Routine[]>(getRoutines);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filterLevel, setFilterLevel] = useState<'Todos' | Routine['level']>('Todos');
  const [filterGender, setFilterGender] = useState<'todos' | 'hombre' | 'mujer'>('todos');
  const [localSearch, setLocalSearch] = useState('');

  const isCoach = user.role === 'coach';

  // Combined search: navbar global OR local panel search
  const activeSearch = globalSearch || localSearch;

  const emptyForm = { title: '', description: '', level: 'Principiante' as Routine['level'], gender: 'todos' as Routine['gender'], exercises: [''] };
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const refresh = () => setRoutines(getRoutines());

  const sorted = useMemo(() => {
    let list = [...routines];

    // Advanced search: title, description, exercises, level, coach name
    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase().trim();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.exercises.some(ex => ex.toLowerCase().includes(q)) ||
        r.level.toLowerCase().includes(q) ||
        r.coachName.toLowerCase().includes(q)
      );
    }

    // Muscle group filter
    if (muscleFilter && MUSCLE_KEYWORDS[muscleFilter]) {
      const keywords = MUSCLE_KEYWORDS[muscleFilter];
      list = list.filter(r => {
        const blob = `${r.title} ${r.description} ${r.exercises.join(' ')}`.toLowerCase();
        return keywords.some(kw => blob.includes(kw));
      });
    }

    if (filterLevel !== 'Todos') list = list.filter(r => r.level === filterLevel);
    if (filterGender !== 'todos') list = list.filter(r => r.gender === filterGender || r.gender === 'todos');
    list.sort((a, b) => sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
    return list;
  }, [routines, filterLevel, filterGender, sortAsc, activeSearch, muscleFilter]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim() || form.title.trim().length < 3) errs.title = 'Mínimo 3 caracteres';
    if (!form.description.trim()) errs.description = 'Descripción requerida';
    if (form.exercises.filter(e => e.trim()).length === 0) errs.exercises = 'Al menos un ejercicio';
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    const exercises = form.exercises.filter(e => e.trim());
    if (editingId) {
      updateRoutine(editingId, { title: form.title, description: form.description, level: form.level, gender: form.gender, exercises });
      addToast('✏️ ¡Rutina actualizada!', 'success');
    } else {
      addRoutine({ coachId: user.id, coachName: user.name, title: form.title, description: form.description, level: form.level, gender: form.gender, exercises });
      addToast('🏋️ ¡Rutina publicada exitosamente!', 'success');
    }
    refresh();
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
  };

  const handleEdit = (r: Routine) => {
    setForm({ title: r.title, description: r.description, level: r.level, gender: r.gender, exercises: [...r.exercises, ''] });
    setEditingId(r.id);
    setShowForm(true);
    setFormErrors({});
  };

  const handleDelete = (id: string) => {
    deleteRoutine(id);
    refresh();
    setConfirmDeleteId(null);
    addToast('🗑️ Rutina eliminada.', 'info');
  };

  const addExercise = () => setForm(p => ({ ...p, exercises: [...p.exercises, ''] }));
  const removeExercise = (i: number) => setForm(p => ({ ...p, exercises: p.exercises.filter((_, idx) => idx !== i) }));
  const updateExercise = (i: number, val: string) => setForm(p => {
    const exercises = [...p.exercises];
    exercises[i] = val;
    return { ...p, exercises };
  });

  const levelBadgeClass = (level: string) =>
    level === 'Pro' ? 'badge-level badge-pro' : level === 'Intermedio' ? 'badge-level badge-intermediate' : 'badge-level badge-beginner';

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', color: 'hsl(var(--foreground))' }}>
            {isCoach ? 'MIS ' : ''}<span style={{ color: 'hsl(var(--neon))' }}>RUTINAS</span>
          </h2>
          <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem' }}>
            {sorted.length} rutina{sorted.length !== 1 ? 's' : ''} encontrada{sorted.length !== 1 ? 's' : ''}
            {activeSearch && <span style={{ color: 'hsl(var(--neon))', marginLeft: '0.4rem' }}>— "{activeSearch}"</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn-ghost" onClick={() => setSortAsc(a => !a)} style={{ fontSize: '0.8rem' }}>
            A-Z {sortAsc ? '↑' : '↓'}
          </button>
          {isCoach && (
            <button
              className="btn-neon"
              onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); setFormErrors({}); }}
            >
              {showForm ? '✕ CANCELAR' : '+ NUEVA RUTINA'}
            </button>
          )}
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Local search (visible when no global search active) */}
        {!globalSearch && (
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--smoke))', fontSize: '0.9rem' }}>🔍</span>
            <input
              className="input-dark"
              type="text"
              placeholder="Buscar por título, ejercicio, coach..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              style={{ paddingLeft: '2.4rem', paddingRight: localSearch ? '2rem' : undefined }}
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--smoke))', fontSize: '0.85rem' }}
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Gender filter — only for coaches */}
        {isCoach && (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {(['todos', 'hombre', 'mujer'] as const).map(g => (
              <button key={g} className={`filter-chip ${filterGender === g ? 'active' : 'inactive'}`} onClick={() => setFilterGender(g)}>
                {g === 'todos' ? 'Todos' : g === 'hombre' ? '♂ Hombre' : '♀ Mujer'}
              </button>
            ))}
          </div>
        )}

        <select
          className="input-dark"
          style={{ width: 'auto', minWidth: '160px' }}
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value as typeof filterLevel)}
        >
          <option value="Todos">Todos los niveles</option>
          <option>Principiante</option>
          <option>Intermedio</option>
          <option>Pro</option>
        </select>
      </div>

      {/* Form (coach only) */}
      <AnimatePresence>
        {showForm && isCoach && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden', marginBottom: '1.5rem' }}
          >
            <div className="glass-card" style={{ borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid hsl(var(--neon) / 0.2)' }}>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', color: 'hsl(var(--neon))', marginBottom: '1.25rem' }}>
                {editingId ? 'EDITAR RUTINA' : 'PUBLICAR NUEVA RUTINA'}
              </h3>
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--smoke))', letterSpacing: '0.1em', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Título de la rutina *
                    </label>
                    <input
                      className="input-dark"
                      type="text"
                      placeholder="Ej: Fullbody Quema Grasa — 4 semanas"
                      value={form.title}
                      onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setFormErrors(p => ({ ...p, title: '' })); }}
                      style={{ borderColor: formErrors.title ? 'hsl(var(--destructive))' : undefined }}
                    />
                    {formErrors.title && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.72rem', marginTop: '0.2rem' }}>{formErrors.title}</p>}
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--smoke))', letterSpacing: '0.1em', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Descripción *
                    </label>
                    <textarea
                      className="input-dark"
                      placeholder="Describe objetivos, días por semana, equipamiento..."
                      rows={3}
                      value={form.description}
                      onChange={e => { setForm(p => ({ ...p, description: e.target.value })); setFormErrors(p => ({ ...p, description: '' })); }}
                      style={{ resize: 'vertical', borderColor: formErrors.description ? 'hsl(var(--destructive))' : undefined }}
                    />
                    {formErrors.description && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.72rem', marginTop: '0.2rem' }}>{formErrors.description}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--smoke))', letterSpacing: '0.1em', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Nivel
                    </label>
                    <select className="input-dark" value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value as Routine['level'] }))}>
                      <option>Principiante</option>
                      <option>Intermedio</option>
                      <option>Pro</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--smoke))', letterSpacing: '0.1em', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Género objetivo
                    </label>
                    <select className="input-dark" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value as Routine['gender'] }))}>
                      <option value="todos">Todos</option>
                      <option value="hombre">Hombre</option>
                      <option value="mujer">Mujer</option>
                    </select>
                  </div>
                </div>

                {/* Exercises */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--smoke))', letterSpacing: '0.1em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Ejercicios *
                  </label>
                  {/* Suggestions */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {EXERCISE_SUGGESTIONS[form.level].map(ex => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => {
                          const emptyIdx = form.exercises.findIndex(e => !e.trim());
                          if (emptyIdx >= 0) updateExercise(emptyIdx, ex);
                          else setForm(p => ({ ...p, exercises: [...p.exercises, ex] }));
                        }}
                        style={{
                          padding: '0.2rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          background: 'hsl(var(--neon) / 0.08)',
                          border: '1px solid hsl(var(--neon) / 0.25)',
                          color: 'hsl(var(--neon))',
                          cursor: 'pointer',
                        }}
                      >
                        + {ex}
                      </button>
                    ))}
                  </div>
                  {form.exercises.map((ex, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        className="input-dark"
                        type="text"
                        placeholder={`Ejercicio ${i + 1}...`}
                        value={ex}
                        onChange={e => updateExercise(i, e.target.value)}
                      />
                      {form.exercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExercise(i)}
                          style={{
                            background: 'hsl(var(--destructive) / 0.15)',
                            border: '1px solid hsl(var(--destructive) / 0.3)',
                            color: 'hsl(var(--destructive))',
                            borderRadius: '0.4rem',
                            padding: '0 0.75rem',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {formErrors.exercises && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.72rem' }}>{formErrors.exercises}</p>}
                  <button type="button" className="btn-ghost" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }} onClick={addExercise}>
                    + Agregar ejercicio
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-neon" type="submit">
                    {editingId ? 'GUARDAR CAMBIOS' : 'PUBLICAR RUTINA'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); setFormErrors({}); }}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Routine Cards */}
      {sorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ borderRadius: '0.75rem', padding: '4rem 2rem', textAlign: 'center' }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
            {activeSearch ? '🔍' : '📋'}
          </div>
          {activeSearch ? (
            <>
              <p style={{ color: 'hsl(var(--foreground))', fontWeight: '600', fontSize: '1rem', marginBottom: '0.4rem' }}>
                Sin resultados para "{activeSearch}"
              </p>
              <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Intenta con otro término: nombre de ejercicio, nivel o coach.
              </p>
              <button className="btn-ghost" style={{ fontSize: '0.82rem' }} onClick={() => { setLocalSearch(''); }}>
                Limpiar búsqueda
              </button>
            </>
          ) : (
            <p style={{ color: 'hsl(var(--smoke))' }}>
              No hay rutinas publicadas aún. {isCoach ? '¡Crea la primera!' : ''}
            </p>
          )}
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          <AnimatePresence>
            {sorted.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card"
                style={{ borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid hsl(var(--border))' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className={levelBadgeClass(r.level)} style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>{r.level}</span>
                    <h4 style={{ fontWeight: '700', color: 'hsl(var(--foreground))', fontSize: '0.95rem', marginTop: '0.4rem', lineHeight: '1.3' }}>{r.title}</h4>
                    <div style={{ fontSize: '0.72rem', color: 'hsl(var(--neon) / 0.7)', marginTop: '0.2rem' }}>
                      por {r.coachName}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'hsl(var(--smoke))', whiteSpace: 'nowrap', marginLeft: '0.5rem', flexShrink: 0 }}>
                    {r.gender === 'todos' ? '♻ Todos' : r.gender === 'hombre' ? '♂ Hombre' : '♀ Mujer'}
                  </span>
                </div>
                <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.82rem', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                  {r.description}
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--smoke))', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Ejercicios ({r.exercises.length})
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {r.exercises.slice(0, 4).map((ex, j) => (
                      <span key={j} style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        background: 'hsl(var(--secondary))',
                        color: 'hsl(var(--secondary-foreground))',
                      }}>{ex}</span>
                    ))}
                    {r.exercises.length > 4 && (
                      <span style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem', color: 'hsl(var(--smoke))' }}>
                        +{r.exercises.length - 4} más
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'hsl(var(--smoke))' }}>📅 {r.createdAt}</span>
                  {isCoach && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn-edit" onClick={() => handleEdit(r)}>Editar</button>
                      <button className="btn-danger" onClick={() => setConfirmDeleteId(r.id)}>Eliminar</button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Confirm Delete */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card"
              style={{ padding: '2rem', borderRadius: '1rem', maxWidth: '360px', width: '90%', textAlign: 'center' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', marginBottom: '0.5rem' }}>¿ELIMINAR RUTINA?</h3>
              <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Esta acción no se puede deshacer.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn-danger" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }} onClick={() => handleDelete(confirmDeleteId)}>
                  Sí, eliminar
                </button>
                <button className="btn-ghost" onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
