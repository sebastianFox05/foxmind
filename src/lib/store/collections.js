/*
 * Colecciones de datos de FoxMind. Cada registro es un objeto con id, createdAt y updatedAt.
 * La misma lista valida las copias de seguridad y coincide con el CHECK de supabase/schema.sql.
 */
export const COLLECTIONS = [
  'tasks',          // trabajo y pendientes: { title, status: todo|doing|done, priority 1-3, project, area, due, subtasks[] }
  'habits',         // actividades diarias: { name, icon, days[0-6], moment, log[iso] }
  'challenges',     // retos: { title, period, start, end, metric, target, unit, habitId, manual }
  'workouts',       // sesiones de gym: { date, routineId, name, minutes, exercises[{ name, sets[{ reps, weight }] }] }
  'routines',       // rutinas: { kind: gym|running|lectura, name, days[], exercises[], plan }
  'runs',           // carreras: { date, km, minutes, type, feel }
  'records',        // tablero / marcas manuales: { name, value, unit, category, date }
  'books',          // libros: { title, author, pages, page, status: leyendo|por-leer|terminado }
  'readingLogs',    // sesiones de lectura: { date, bookId, pages, minutes }
  'focusSessions',  // bloques de foco: { date, minutes, taskId, label }
  'journal',        // diario: { date, mood, energy, intention, wins, gratitude, notes }
  'notes',          // ideas, aprendizajes y snippets: { kind, title, body, tags[] }
  'meals',          // nutricion: { date, type: desayuno|almuerzo|cena|snack, name, kcal, carbs, protein, fat }
  'settings'        // ajustes (un unico registro)
];

export function emptyDb() {
  return Object.fromEntries(COLLECTIONS.map((name) => [name, []]));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isDate = (value) => typeof value === 'string' && ISO_DATE.test(value);
const isText = (value) => typeof value === 'string' && value.trim() !== '';
const isOptionalDate = (value) => value === undefined || value === '' || value === null || isDate(value);
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

/* Campos imprescindibles de cada coleccion: sin ellos las vistas fallarian al calcular */
const RULES = {
  tasks: (item) => isText(item.title) && ['todo', 'doing', 'done'].includes(item.status) && isOptionalDate(item.due) && isOptionalDate(item.doneAt),
  habits: (item) => isText(item.name) && Array.isArray(item.log || []) && (item.log || []).every(isDate) && Array.isArray(item.days || []),
  challenges: (item) => isText(item.title) && isDate(item.start) && isDate(item.end) && item.start <= item.end && isText(item.metric) && isNumber(Number(item.target)),
  workouts: (item) => isDate(item.date) && Array.isArray(item.exercises) && item.exercises.every((exercise) => isText(exercise.name) && Array.isArray(exercise.sets)),
  routines: (item) => isText(item.name) && ['gym', 'running', 'lectura'].includes(item.kind) && Array.isArray(item.days) && Array.isArray(item.exercises || []),
  runs: (item) => isDate(item.date) && isNumber(item.km) && isNumber(item.minutes),
  records: (item) => isText(item.name) && isOptionalDate(item.date),
  books: (item) => isText(item.title) && ['leyendo', 'por-leer', 'terminado'].includes(item.status) && isOptionalDate(item.finishedAt),
  readingLogs: (item) => isDate(item.date),
  focusSessions: (item) => isDate(item.date) && isNumber(item.minutes),
  journal: (item) => isDate(item.date),
  notes: (item) => isText(item.title),
  meals: (item) => isDate(item.date) && isText(item.name) && isNumber(Number(item.kcal)),
  settings: () => true
};

/*
 * Comprueba y normaliza una copia de seguridad antes de importarla.
 * Devuelve { error } si algo no encaja, o { data } con las colecciones listas (arrays por defecto y fechas de creacion).
 */
export function parseBackup(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: 'El archivo no es una copia de FoxMind.' };
  const source = raw.collections || raw;
  const data = emptyDb();
  const now = new Date().toISOString();
  for (const name of Object.keys(source)) {
    if (!COLLECTIONS.includes(name)) return { error: `Colección desconocida: ${name}` };
    if (!Array.isArray(source[name])) return { error: `La colección ${name} no es una lista.` };
    for (const [index, item] of source[name].entries()) {
      if (!item || typeof item !== 'object' || !UUID.test(String(item.id))) return { error: `El registro ${index + 1} de ${name} no tiene un id válido.` };
      if (!RULES[name](item)) return { error: `El registro ${index + 1} de ${name} está incompleto o tiene fechas no válidas.` };
    }
    data[name] = source[name].map((item) => ({
      ...item,
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now,
      ...(name === 'routines' ? { exercises: item.exercises || [] } : {}),
      ...(name === 'habits' ? { log: item.log || [], days: item.days || [] } : {}),
      ...(name === 'tasks' ? { subtasks: item.subtasks || [] } : {}),
      ...(name === 'notes' ? { tags: item.tags || [] } : {})
    }));
  }
  if (data.settings.length > 1) data.settings = data.settings.slice(0, 1);
  return { data };
}
