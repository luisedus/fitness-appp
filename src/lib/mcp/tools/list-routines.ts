import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const ROUTINES = [
  { id: "seed-1", title: "Fullbody Quema Grasa — 4 Semanas", level: "Principiante", gender: "todos", coach: "Carlos Mendoza",
    exercises: ["Sentadillas 3x15", "Flexiones 3x10", "Jumping Jacks 3x30s", "Plancha 3x30s", "Zancadas 3x12", "Burpees 3x8"] },
  { id: "seed-2", title: "Hipertrofia Upper/Lower — 6 Semanas", level: "Intermedio", gender: "hombre", coach: "Carlos Mendoza",
    exercises: ["Press de banca 4x8", "Remo con barra 4x10", "Press militar 3x10", "Dominadas 3x8", "Sentadilla 4x8", "Peso muerto rumano 3x10"] },
  { id: "seed-3", title: "Glúteos & Core — Programa Femenino", level: "Principiante", gender: "mujer", coach: "Laura Gómez",
    exercises: ["Hip thrust 4x15", "Sentadilla sumo 4x12", "Patadas de glúteo 3x20", "Plancha lateral 3x30s", "Abducción con banda 3x15", "Curl de isquio 3x12"] },
  { id: "seed-4", title: "Yoga Funcional & Flexibilidad", level: "Principiante", gender: "mujer", coach: "Laura Gómez",
    exercises: ["Saludo al sol x5", "Guerrero I y II", "Perro boca abajo", "Paloma", "Torsión espinal", "Relajación 5min"] },
  { id: "seed-5", title: "Powerlifting Base — Fuerza Máxima", level: "Pro", gender: "todos", coach: "Diego Vargas",
    exercises: ["Sentadilla trasera 5x3", "Peso muerto 5x3", "Press de banca 5x3", "Good mornings 3x8", "Hip thrust pesado 3x6", "Fondos lastrados 3x8"] },
  { id: "seed-6", title: "CrossFit Metcon — Alta Intensidad", level: "Pro", gender: "todos", coach: "Diego Vargas",
    exercises: ["Clean & Jerk 5x3", "Muscle-up 3x5", "Snatch 4x3", "Pistol Squat 3x8", "Sprint 100m x8", "Double Unders 3x50"] },
  { id: "seed-7", title: "Cardio & Resistencia — Corredor", level: "Intermedio", gender: "todos", coach: "Carlos Mendoza",
    exercises: ["Calentamiento 10min", "Rodaje suave 30min", "Intervalos 6x400m", "Fartlek 20min", "Plancha", "Estiramientos"] },
  { id: "seed-8", title: "Tonificación Integral — Mujer Activa", level: "Intermedio", gender: "mujer", coach: "Laura Gómez",
    exercises: ["Sentadilla goblet 3x15", "Press mancuernas 3x12", "Remo mancuerna 3x12", "Elevaciones laterales 3x15", "Estocadas inversas 3x12", "Plancha con rotación 3x10"] },
];

export default defineTool({
  name: "list_routines",
  title: "List GYMBRO'S routines",
  description: "List public GYMBRO'S workout routines. Filter by training level (Principiante, Intermedio, Pro) and/or target gender (hombre, mujer, todos).",
  inputSchema: {
    level: z.enum(["Principiante", "Intermedio", "Pro"]).optional().describe("Filter by difficulty level."),
    gender: z.enum(["hombre", "mujer", "todos"]).optional().describe("Filter by target gender."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ level, gender }) => {
    let results = ROUTINES;
    if (level) results = results.filter(r => r.level === level);
    if (gender) results = results.filter(r => r.gender === gender || r.gender === "todos");
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { routines: results, count: results.length },
    };
  },
});
