import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Member, getMembers, addMember, updateMember, deleteMember } from '../lib/data';
import { blockUser, unblockUser, isUserBlocked, getBlockedUsers, type BlockRecord } from '../lib/blocking';
import { getUsers, type AuthUser } from '../lib/auth';

// Helper to get registered users (non-coach) for blocking
function getRegisteredMembers(): { id: string; name: string; email: string }[] {
  return getUsers().filter(u => u.role === 'member');
}

interface MemberManagerProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type SortField = 'name' | 'level' | 'joinDate';

export function MemberManager({ addToast }: MemberManagerProps) {
  const [members, setMembers] = useState<Member[]>(getMembers);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'todos' | 'hombre' | 'mujer'>('todos');
  const [levelFilter, setLevelFilter] = useState<'Todos' | 'Principiante' | 'Intermedio' | 'Pro'>('Todos');
  const [blockReason, setBlockReason] = useState('');
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [blockedList, setBlockedList] = useState<BlockRecord[]>(getBlockedUsers);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const emptyForm = { name: '', email: '', age: '', gender: 'hombre' as 'hombre' | 'mujer', level: 'Principiante' as Member['level'] };
  const [form, setForm] = useState(emptyForm);

  const refresh = () => setMembers(getMembers());

  const filtered = useMemo(() => {
    let list = [...members];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    }
    if (genderFilter !== 'todos') list = list.filter(m => m.gender === genderFilter);
    if (levelFilter !== 'Todos') list = list.filter(m => m.level === levelFilter);
    list.sort((a, b) => {
      const va = a[sortField]?.toString().toLowerCase() ?? '';
      const vb = b[sortField]?.toString().toLowerCase() ?? '';
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [members, search, genderFilter, levelFilter, sortField, sortAsc]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 3) errs.name = 'Mínimo 3 caracteres';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email inválido';
    const age = parseInt(form.age);
    if (!form.age || isNaN(age) || age < 14 || age > 99) errs.age = 'Edad entre 14 y 99 años';
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    if (editingId) {
      updateMember(editingId, { name: form.name, email: form.email, age: parseInt(form.age), gender: form.gender, level: form.level });
      addToast('✏️ ¡Socio actualizado correctamente!', 'success');
    } else {
      addMember({ name: form.name, email: form.email, age: parseInt(form.age), gender: form.gender, level: form.level });
      addToast('✅ ¡Socio registrado exitosamente!', 'success');
    }
    refresh();
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
  };

  const handleEdit = (m: Member) => {
    setForm({ name: m.name, email: m.email, age: String(m.age), gender: m.gender, level: m.level });
    setEditingId(m.id);
    setShowForm(true);
    setFormErrors({});
  };

  const handleDelete = (id: string) => {
    deleteMember(id);
    refresh();
    setConfirmDeleteId(null);
    addToast('🗑️ Socio eliminado.', 'info');
  };

  const handleBlock = (userId: string) => {
    if (!blockReason.trim()) { addToast('Debes indicar una razón para bloquear.', 'error'); return; }
    blockUser(userId, 'admin', blockReason.trim());
    setBlockedList(getBlockedUsers());
    setBlockingUserId(null);
    setBlockReason('');
    addToast('🚫 Usuario bloqueado exitosamente.', 'info');
  };

  const handleUnblock = (userId: string) => {
    unblockUser(userId);
    setBlockedList(getBlockedUsers());
    addToast('✅ Usuario desbloqueado.', 'success');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(a => !a);
    else { setSortField(field); setSortAsc(true); }
  };

  const levelBadgeClass = (level: string) =>
    level === 'Pro' ? 'badge-level badge-pro' : level === 'Intermedio' ? 'badge-level badge-intermediate' : 'badge-level badge-beginner';

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (sortAsc ? ' ↑' : ' ↓') : ' ↕';

  return (
    <div className="animate-fade-in">
      {/* Header + Add button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', color: 'hsl(var(--foreground))' }}>
            GESTIÓN DE <span style={{ color: 'hsl(var(--neon))' }}>SOCIOS</span>
          </h2>
          <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem' }}>
            {filtered.length} socio{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="btn-neon"
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); setFormErrors({}); }}
        >
          {showForm ? '✕ CANCELAR' : '+ NUEVO SOCIO'}
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden', marginBottom: '1.5rem' }}
          >
            <div className="glass-card" style={{ borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid hsl(var(--neon) / 0.2)' }}>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', color: 'hsl(var(--neon))', marginBottom: '1.25rem' }}>
                {editingId ? 'EDITAR SOCIO' : 'REGISTRAR NUEVO SOCIO'}
              </h3>
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: 'Nombre *', key: 'name', type: 'text', placeholder: 'Nombre completo' },
                    { label: 'Email *', key: 'email', type: 'email', placeholder: 'email@ejemplo.com' },
                    { label: 'Edad *', key: 'age', type: 'number', placeholder: 'Ej: 25' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--smoke))', letterSpacing: '0.1em', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                        {label}
                      </label>
                      <input
                        className="input-dark"
                        type={type}
                        placeholder={placeholder}
                        value={form[key as keyof typeof form] as string}
                        onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setFormErrors(p => ({ ...p, [key]: '' })); }}
                        style={{ borderColor: formErrors[key] ? 'hsl(var(--destructive))' : undefined }}
                      />
                      {formErrors[key] && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.72rem', marginTop: '0.2rem' }}>{formErrors[key]}</p>}
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--smoke))', letterSpacing: '0.1em', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Género
                    </label>
                    <select className="input-dark" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value as 'hombre' | 'mujer' }))}>
                      <option value="hombre">Hombre</option>
                      <option value="mujer">Mujer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--smoke))', letterSpacing: '0.1em', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Nivel
                    </label>
                    <select className="input-dark" value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value as Member['level'] }))}>
                      <option>Principiante</option>
                      <option>Intermedio</option>
                      <option>Pro</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-neon" type="submit">
                    {editingId ? 'GUARDAR CAMBIOS' : 'REGISTRAR SOCIO'}
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

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--smoke))', fontSize: '0.9rem' }}>🔍</span>
          <input
            className="input-dark"
            type="text"
            placeholder="Buscar socio por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['todos', 'hombre', 'mujer'] as const).map(g => (
            <button
              key={g}
              className={`filter-chip ${genderFilter === g ? 'active' : 'inactive'}`}
              onClick={() => setGenderFilter(g)}
            >
              {g === 'todos' ? 'Todos' : g === 'hombre' ? '♂ Hombre' : '♀ Mujer'}
            </button>
          ))}
        </div>
        <select
          className="input-dark"
          style={{ width: 'auto', minWidth: '150px' }}
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value as typeof levelFilter)}
        >
          <option value="Todos">Todos los niveles</option>
          <option>Principiante</option>
          <option>Intermedio</option>
          <option>Pro</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card scrollbar-dark" style={{ borderRadius: '0.75rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              {[
                { label: 'Nombre', field: 'name' as SortField },
                { label: 'Email', field: null },
                { label: 'Edad', field: null },
                { label: 'Género', field: null },
                { label: 'Nivel', field: 'level' as SortField },
                { label: 'Alta', field: 'joinDate' as SortField },
                { label: 'Acciones', field: null },
              ].map(({ label, field }) => (
                <th
                  key={label}
                  onClick={() => field && toggleSort(field)}
                  style={{
                    padding: '0.9rem 1rem',
                    textAlign: 'left',
                    fontSize: '0.7rem',
                    color: 'hsl(var(--smoke))',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: field ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}{field && <SortIcon field={field} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--smoke))' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏋️</div>
                    <div>No se encontraron socios</div>
                  </td>
                </tr>
              ) : (
                filtered.map((m, i) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.03 }}
                    className="table-row-hover"
                    style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>
                      {m.name}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'hsl(var(--smoke))', fontSize: '0.85rem' }}>
                      {m.email}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'hsl(var(--smoke))', fontSize: '0.85rem' }}>
                      {m.age} años
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'hsl(var(--smoke))' }}>
                      {m.gender === 'hombre' ? '♂ Hombre' : '♀ Mujer'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={levelBadgeClass(m.level)}>{m.level}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'hsl(var(--smoke))', fontSize: '0.82rem' }}>
                      {m.joinDate}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn-edit" onClick={() => handleEdit(m)}>Editar</button>
                        <button className="btn-danger" onClick={() => setConfirmDeleteId(m.id)}>Eliminar</button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card"
              style={{ padding: '2rem', borderRadius: '1rem', maxWidth: '360px', width: '90%', textAlign: 'center' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', marginBottom: '0.5rem' }}>
                ¿ELIMINAR SOCIO?
              </h3>
              <p style={{ color: 'hsl(var(--smoke))', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Esta acción no se puede deshacer. El socio será eliminado permanentemente.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn-danger" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }} onClick={() => handleDelete(confirmDeleteId)}>
                  Sí, eliminar
                </button>
                <button className="btn-ghost" onClick={() => setConfirmDeleteId(null)}>
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
