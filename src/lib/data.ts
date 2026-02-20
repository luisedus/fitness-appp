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

const SEED_ROUTINES: Routine[] = [
  {
    id: 'seed-1',
    coachId: 'coach-demo',
    coachName: 'Carlos Mendoza',
    title: 'Fullbody Quema Grasa — 4 Semanas',
    description: 'Rutina de cuerpo completo enfocada en la pérdida de grasa. 4 días por semana, sin equipamiento. Ideal para comenzar tu transformación física con ejercicios funcionales y cardio HIIT.',
    level: 'Principiante',
    gender: 'todos',
    exercises: ['Sentadillas 3x15', 'Flexiones 3x10', 'Jumping Jacks 3x30s', 'Plancha 3x30s', 'Zancadas 3x12', 'Burpees 3x8'],
    createdAt: '01/01/2025',
  },
  {
    id: 'seed-2',
    coachId: 'coach-demo',
    coachName: 'Carlos Mendoza',
    title: 'Hipertrofia Upper/Lower — 6 Semanas',
    description: 'Programa de hipertrofia dividido en tren superior e inferior. 4 días a la semana con énfasis en el volumen progresivo. Requiere acceso a pesas y máquinas de gimnasio.',
    level: 'Intermedio',
    gender: 'hombre',
    exercises: ['Press de banca 4x8', 'Remo con barra 4x10', 'Press militar 3x10', 'Dominadas 3x8', 'Sentadilla 4x8', 'Peso muerto rumano 3x10'],
    createdAt: '10/01/2025',
  },
  {
    id: 'seed-3',
    coachId: 'coach-demo2',
    coachName: 'Laura Gómez',
    title: 'Glúteos & Core — Programa Femenino',
    description: 'Rutina enfocada en el desarrollo de glúteos, abdomen y caderas. 3 días por semana alternando zonas. Incluye bandas elásticas y mancuernas ligeras. Resultados visibles en 3 semanas.',
    level: 'Principiante',
    gender: 'mujer',
    exercises: ['Hip thrust 4x15', 'Sentadilla sumo 4x12', 'Patadas de glúteo 3x20', 'Plancha lateral 3x30s', 'Abducción con banda 3x15', 'Curl de isquio 3x12'],
    createdAt: '15/01/2025',
  },
  {
    id: 'seed-4',
    coachId: 'coach-demo2',
    coachName: 'Laura Gómez',
    title: 'Yoga Funcional & Flexibilidad',
    description: 'Secuencia de yoga y movilidad articular para mejorar la flexibilidad y reducir lesiones. Perfecta como complemento a cualquier rutina de fuerza. Sesiones de 40-50 minutos.',
    level: 'Principiante',
    gender: 'mujer',
    exercises: ['Saludo al sol x5', 'Guerrero I y II', 'Postura del perro boca abajo', 'Paloma (cadera)', 'Torsión espinal', 'Relajación final 5min'],
    createdAt: '20/01/2025',
  },
  {
    id: 'seed-5',
    coachId: 'coach-demo3',
    coachName: 'Diego Vargas',
    title: 'Powerlifting Base — Fuerza Máxima',
    description: 'Programa de fuerza máxima basado en los tres levantamientos principales. Periodización lineal de 8 semanas con testeo de 1RM al final. Solo para atletas con experiencia sólida.',
    level: 'Pro',
    gender: 'todos',
    exercises: ['Sentadilla trasera 5x3', 'Peso muerto 5x3', 'Press de banca 5x3', 'Good mornings 3x8', 'Hip thrust pesado 3x6', 'Fondos lastrados 3x8'],
    createdAt: '05/02/2025',
  },
  {
    id: 'seed-6',
    coachId: 'coach-demo3',
    coachName: 'Diego Vargas',
    title: 'CrossFit Metcon — Alta Intensidad',
    description: 'WODs de alta intensidad metabólica con ejercicios olímpicos y funcionales. 5 días a la semana con escalado para cada nivel. Mejora la capacidad cardiovascular y fuerza explosiva.',
    level: 'Pro',
    gender: 'todos',
    exercises: ['Clean & Jerk 5x3', 'Muscle-up 3x5', 'Snatch 4x3', 'Pistol Squat 3x8', 'Sprint 100m x8', 'Double Unders 3x50'],
    createdAt: '12/02/2025',
  },
  {
    id: 'seed-7',
    coachId: 'coach-demo',
    coachName: 'Carlos Mendoza',
    title: 'Cardio & Resistencia — Corredor',
    description: 'Plan de 8 semanas para mejorar la resistencia cardiovascular. Incluye rodajes suaves, intervalos y fartlek. Apto para runners que quieren bajar su tiempo en 5K o 10K.',
    level: 'Intermedio',
    gender: 'todos',
    exercises: ['Calentamiento 10min', 'Rodaje suave 30min', 'Intervalos 6x400m', 'Fartlek 20min', 'Abdominales plancha', 'Estiramiento final 10min'],
    createdAt: '18/02/2025',
  },
  {
    id: 'seed-8',
    coachId: 'coach-demo2',
    coachName: 'Laura Gómez',
    title: 'Tonificación Integral — Mujer Activa',
    description: 'Rutina de tonificación total pensada para mujeres activas que buscan definir sin voluminizar. 3-4 días por semana con mancuernas y peso corporal. Resultados en 4 semanas.',
    level: 'Intermedio',
    gender: 'mujer',
    exercises: ['Sentadilla goblet 3x15', 'Press con mancuernas 3x12', 'Remo con mancuerna 3x12', 'Elevaciones laterales 3x15', 'Estocadas inversas 3x12', 'Plancha con rotación 3x10'],
    createdAt: '01/03/2025',
  },
];

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
    const raw = localStorage.getItem(ROUTINES_KEY);
    const stored: Routine[] | null = raw ? JSON.parse(raw) : null;
    // Seed if never set OR if previously empty (migration to pre-loaded data)
    if (!stored || stored.length === 0) {
      localStorage.setItem(ROUTINES_KEY, JSON.stringify(SEED_ROUTINES));
      return SEED_ROUTINES;
    }
    return stored;
  } catch {
    return SEED_ROUTINES;
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
