export interface Member {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: 'hombre' | 'mujer';
  level: 'Principiante' | 'Intermedio' | 'Pro';
  joinDate: string;
}

export interface Routine {
  id: string;
  coachId: string;
  coachName: string;
  title: string;
  description: string;
  level: 'Principiante' | 'Intermedio' | 'Pro';
  gender: 'todos' | 'hombre' | 'mujer';
  exercises: string[];
  createdAt: string;
}

const MEMBERS_KEY = 'gymbros_members';
const ROUTINES_KEY = 'gymbros_routines';

// --- Members CRUD ---
export function getMembers(): Member[] {
  try {
    return JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addMember(data: Omit<Member, 'id' | 'joinDate'>): Member {
  const members = getMembers();
  const newMember: Member = {
    ...data,
    id: `m-${Date.now()}`,
    joinDate: new Date().toLocaleDateString('es-ES'),
  };
  localStorage.setItem(MEMBERS_KEY, JSON.stringify([...members, newMember]));
  return newMember;
}

export function updateMember(id: string, data: Partial<Omit<Member, 'id' | 'joinDate'>>): Member | null {
  const members = getMembers();
  const idx = members.findIndex(m => m.id === id);
  if (idx === -1) return null;
  members[idx] = { ...members[idx], ...data };
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  return members[idx];
}

export function deleteMember(id: string): boolean {
  const members = getMembers();
  const filtered = members.filter(m => m.id !== id);
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(filtered));
  return filtered.length < members.length;
}

// --- Routines CRUD ---
export function getRoutines(): Routine[] {
  try {
    return JSON.parse(localStorage.getItem(ROUTINES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addRoutine(data: Omit<Routine, 'id' | 'createdAt'>): Routine {
  const routines = getRoutines();
  const newRoutine: Routine = {
    ...data,
    id: `r-${Date.now()}`,
    createdAt: new Date().toLocaleDateString('es-ES'),
  };
  localStorage.setItem(ROUTINES_KEY, JSON.stringify([...routines, newRoutine]));
  return newRoutine;
}

export function deleteRoutine(id: string): boolean {
  const routines = getRoutines();
  const filtered = routines.filter(r => r.id !== id);
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(filtered));
  return filtered.length < routines.length;
}

export function updateRoutine(id: string, data: Partial<Omit<Routine, 'id' | 'createdAt'>>): Routine | null {
  const routines = getRoutines();
  const idx = routines.findIndex(r => r.id === id);
  if (idx === -1) return null;
  routines[idx] = { ...routines[idx], ...data };
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  return routines[idx];
}
