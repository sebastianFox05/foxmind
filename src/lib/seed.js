/*
 * Datos de ejemplo para estrenar la app (se pueden borrar en Perfil → Datos).
 * Se generan relativos a hoy y con un aleatorio con semilla, para que siempre se vean igual.
 * Las marcas del "tablero" son provisionales hasta cargar las reales.
 */
import { addDays, monthRange, quarterRange, yearRange, todayISO, weekday, parseISO, quarterOf } from './dates.js';
import { uid } from './utils.js';

function seededRandom(seed) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function stamp(item, date) {
  const time = `${date}T08:00:00.000Z`;
  return { id: uid(), createdAt: time, updatedAt: time, ...item };
}

const GYM_ROUTINES = [
  { name: 'Push · pecho y hombro', day: 1, exercises: [['Press banca', 4, 8, 72.5], ['Press militar', 3, 10, 40], ['Fondos', 3, 12, 0], ['Extensión de tríceps', 3, 12, 22.5]] },
  { name: 'Pull · espalda y bíceps', day: 2, exercises: [['Dominadas', 4, 8, 0], ['Remo con barra', 4, 8, 60], ['Curl de bíceps', 3, 12, 14], ['Face pull', 3, 15, 20]] },
  { name: 'Pierna', day: 4, exercises: [['Sentadilla', 4, 6, 95], ['Peso muerto rumano', 3, 10, 75], ['Prensa', 3, 12, 160], ['Gemelos', 4, 15, 60]] },
  { name: 'Torso completo', day: 5, exercises: [['Press inclinado con mancuernas', 3, 10, 26], ['Jalón al pecho', 3, 10, 55], ['Elevaciones laterales', 3, 15, 10], ['Press banca', 3, 5, 77.5]] }
];

export function createSeed(today = todayISO(), name = 'Sebastián') {
  const random = seededRandom(20261118);
  const year = Number(today.slice(0, 4));
  const month = parseISO(today).getMonth();
  const quarter = quarterOf(today);

  const settings = [stamp({ name, role: 'Desarrollador full stack', dailyReadingMin: 20, weeklyGymGoal: 4, weeklyKmGoal: 20, yearBooksGoal: 12, focusMinutes: 25, calorieGoal: 2200, carbsGoal: 250, proteinGoal: 150, fatGoal: 70, weeklyActiveGoal: 240, isDemo: true }, today)];

  /* Rutinas: gym (push/pull/pierna/torso), running (series y fondo) y lectura */
  const routines = [
    ...GYM_ROUTINES.map((routine) => stamp({
      kind: 'gym', name: routine.name, days: [routine.day], time: '18:30',
      exercises: routine.exercises.map(([name, sets, reps, weight]) => ({ name, sets, reps, weight }))
    }, today)),
    stamp({ kind: 'running', name: 'Series 6×800 m', days: [3], time: '06:30', plan: '6×800 m a ritmo 10K con 2 min de trote entre series. Calentar 2 km.', km: 7 }, today),
    stamp({ kind: 'running', name: 'Fondo en zona 2', days: [6], time: '07:00', plan: 'Rodaje largo y cómodo, puedes hablar mientras corres.', km: 12 }, today),
    stamp({ kind: 'lectura', name: 'Lectura antes de dormir', days: [0, 1, 2, 3, 4, 5, 6], time: '22:00', plan: '20 minutos sin móvil, con el libro principal.', minutes: 20 }, today)
  ];

  /* Habitos con historial de 50 dias */
  const habitDefs = [
    ['Despertar a las 6:00', 'sunrise', 'mañana', [1, 2, 3, 4, 5], 0.82],
    ['Beber 2 L de agua', 'water', 'todo el día', [], 0.75],
    ['Meditar 10 min', 'meditation', 'mañana', [], 0.7],
    ['1 h de proyecto propio', 'code', 'tarde', [1, 2, 3, 4, 5], 0.6],
    ['Inglés 15 min', 'english', 'tarde', [], 0.65],
    ['Leer 20 min', 'book', 'noche', [], 0.78],
    ['Creatina', 'pill', 'mañana', [], 0.9],
    ['Sin pantallas después de las 23:00', 'moon', 'noche', [], 0.5]
  ];
  const habits = habitDefs.map(([name, icon, moment, days, rate]) => {
    const log = [];
    for (let back = 50; back >= 1; back -= 1) {
      const date = addDays(today, -back);
      if ((!days.length || days.includes(weekday(date))) && random() < rate) log.push(date);
    }
    if (random() < 0.5) log.push(today);
    return stamp({ name, icon, moment, days, log }, addDays(today, -50));
  });

  /* Sesiones de gym de las ultimas 7 semanas, con progresion */
  const workouts = [];
  for (let back = 49; back >= 0; back -= 1) {
    const date = addDays(today, -back);
    const routine = GYM_ROUTINES.find((item) => item.day === weekday(date));
    if (!routine || random() < 0.15 || back === 0) continue;
    const progress = Math.floor((49 - back) / 14) * 2.5;
    const routineId = routines.find((item) => item.name === routine.name).id;
    workouts.push(stamp({
      date, routineId, name: routine.name, minutes: 55 + Math.round(random() * 25), rpe: 7 + Math.round(random() * 2),
      exercises: routine.exercises.map(([name, sets, reps, weight]) => ({
        name,
        sets: Array.from({ length: sets }, (_, index) => ({ reps: reps - (index === sets - 1 && random() < 0.4 ? 1 : 0), weight: weight ? weight + progress : 0 }))
      }))
    }, date));
  }

  /* Carreras: series los miercoles, fondo los sabados y algun rodaje suelto */
  const runs = [];
  for (let back = 70; back >= 1; back -= 1) {
    const date = addDays(today, -back);
    const day = weekday(date);
    if (day === 3 && random() > 0.15) runs.push(stamp({ date, km: 7 + Math.round(random() * 10) / 10, minutes: 0, type: 'series', feel: 4 }, date));
    else if (day === 6 && random() > 0.1) runs.push(stamp({ date, km: 10 + Math.round(random() * 40) / 10, minutes: 0, type: 'fondo', feel: 3 + Math.round(random()) }, date));
    else if (day === 0 && random() < 0.35) runs.push(stamp({ date, km: 5 + Math.round(random() * 20) / 10, minutes: 0, type: 'rodaje', feel: 4 }, date));
  }
  runs.forEach((run, index) => {
    const pace = { series: 4.9, fondo: 5.7, rodaje: 5.45 }[run.type] - index * 0.004 + random() * 0.25;
    run.minutes = Math.round(run.km * pace);
  });

  /* Libros y sesiones de lectura */
  const current = stamp({ title: 'Clean Architecture', author: 'Robert C. Martin', pages: 432, page: 0, status: 'leyendo', startedAt: addDays(today, -26), tone: 'blue' }, addDays(today, -26));
  const almost = stamp({ title: 'Hábitos atómicos', author: 'James Clear', pages: 328, page: 296, status: 'leyendo', startedAt: addDays(today, -40), tone: 'amber' }, addDays(today, -40));
  const books = [
    current, almost,
    stamp({ title: 'The Pragmatic Programmer', author: 'Andrew Hunt y David Thomas', pages: 352, page: 352, status: 'terminado', startedAt: `${year}-09-20`, finishedAt: `${year}-10-24`, rating: 5, tone: 'green' }, `${year}-09-20`),
    stamp({ title: 'Deep Work', author: 'Cal Newport', pages: 296, page: 296, status: 'terminado', startedAt: `${year}-08-10`, finishedAt: `${year}-09-12`, rating: 5, tone: 'violet' }, `${year}-08-10`),
    stamp({ title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', pages: 616, page: 616, status: 'terminado', startedAt: `${year}-05-02`, finishedAt: `${year}-07-30`, rating: 5, tone: 'rose' }, `${year}-05-02`),
    stamp({ title: 'El hombre en busca de sentido', author: 'Viktor Frankl', pages: 168, page: 168, status: 'terminado', startedAt: `${year}-03-01`, finishedAt: `${year}-03-15`, rating: 4, tone: 'amber' }, `${year}-03-01`),
    stamp({ title: 'Refactoring', author: 'Martin Fowler', pages: 448, page: 0, status: 'por-leer', tone: 'green' }, today),
    stamp({ title: "Can't Hurt Me", author: 'David Goggins', pages: 364, page: 0, status: 'por-leer', tone: 'rose' }, today),
    stamp({ title: 'Sapiens', author: 'Yuval Noah Harari', pages: 496, page: 0, status: 'por-leer', tone: 'violet' }, today)
  ];
  const readingLogs = [];
  for (let back = 26; back >= 1; back -= 1) {
    if (random() < 0.2) continue;
    const date = addDays(today, -back);
    const minutes = 15 + Math.round(random() * 25);
    const pages = Math.round(minutes * 0.75);
    current.page += pages;
    readingLogs.push(stamp({ date, bookId: current.id, pages, minutes }, date));
  }

  /* Trabajo: tareas de desarrollo y algunas personales */
  const task = (title, extra) => stamp({ title, status: 'todo', priority: 2, area: 'trabajo', project: '', due: '', subtasks: [], tags: [], ...extra }, addDays(today, -5));
  const tasks = [
    task('Migrar endpoints de pagos a la API v2', { priority: 1, project: 'api', due: today, time: '10:00', notes: 'Webhooks y tests de integración pendientes.', subtasks: [{ id: uid(), title: 'POST /payments', done: true }, { id: uid(), title: 'Webhooks', done: false }, { id: uid(), title: 'Tests de integración', done: false }] }),
    task('Revisar PR #142 (filtros del dashboard)', { priority: 1, project: 'frontend', due: today, time: '12:00', notes: 'Comprobar rendimiento de los filtros.' }),
    task('Daily con el equipo', { project: 'equipo', due: today, time: '09:00', notes: 'Repasar bloqueos y prioridades del día.' }),
    task('Escribir tests del servicio de autenticación', { project: 'api', due: addDays(today, 1), time: '10:30' }),
    task('Documentar el flujo de despliegue', { project: 'devops', due: addDays(today, 3), priority: 3 }),
    task('Actualizar dependencias y revisar npm audit', { project: 'frontend', priority: 3 }),
    task('Preparar la demo del sprint', { project: 'equipo', due: addDays(today, 2) }),
    task('Configurar alertas de errores en Sentry', { project: 'devops', due: addDays(today, -2), priority: 1 }),
    task('Refactor del módulo de reportes', { status: 'doing', project: 'backend', priority: 2 }),
    task('Diseñar el esquema de notificaciones', { status: 'doing', project: 'api', isBlocked: true, blockedReason: 'esperando la definición de producto' }),
    task('Renovar el pasaporte', { area: 'personal', due: addDays(today, 10), project: 'personal' }),
    task('Comprar zapatillas de running nuevas', { area: 'personal', project: 'personal', priority: 3 })
  ];
  [['Corregir bug de zona horaria en reportes', 'backend', -1], ['Optimizar consulta lenta del listado de pedidos', 'backend', -1], ['Pair programming con el equipo de móvil', 'equipo', -3], ['Añadir paginación al endpoint de usuarios', 'api', -4], ['Configurar CI con caché de dependencias', 'devops', -5], ['Revisar PR #138', 'frontend', -6], ['Daily y planificación del sprint', 'equipo', -7], ['Migrar estilos a variables CSS', 'frontend', -8], ['Investigar colas con Redis', 'backend', -10]]
    .forEach(([title, project, back]) => tasks.push(task(title, { status: 'done', project, doneAt: addDays(today, back), due: addDays(today, back) })));

  /* Foco, diario y notas */
  const focusSessions = [];
  for (let back = 14; back >= 0; back -= 1) {
    const date = addDays(today, -back);
    if (weekday(date) === 0 || weekday(date) === 6) continue;
    const count = back === 0 ? 1 : 1 + Math.floor(random() * 4);
    for (let index = 0; index < count; index += 1) focusSessions.push(stamp({ date, minutes: random() < 0.7 ? 25 : 50, label: 'Bloque de foco' }, date));
  }
  const journal = [];
  for (let back = 9; back >= 1; back -= 1) {
    const date = addDays(today, -back);
    if (random() < 0.25) continue;
    journal.push(stamp({ date, mood: 3 + Math.round(random() * 2), energy: 2 + Math.round(random() * 3), intention: 'Terminar lo importante antes de abrir el correo', wins: 'Cerré tareas pendientes y entrené', gratitude: 'Salud y tiempo para mis proyectos', notes: '' }, date));
  }
  const notes = [
    stamp({ kind: 'idea', title: 'CLI que genere el standup desde git log', body: 'Leer los commits de ayer y agruparlos por repositorio.', tags: ['side-project'] }, addDays(today, -3)),
    stamp({ kind: 'idea', title: 'Bot de Telegram para registrar carreras', body: '"corrí 8 km 44 min" → FoxMind.', tags: ['bot'] }, addDays(today, -9)),
    stamp({ kind: 'aprendizaje', title: 'useDeferredValue para filtros pesados', body: 'Deja que el input responda mientras la lista se recalcula con prioridad baja.', tags: ['react'] }, addDays(today, -2)),
    stamp({ kind: 'aprendizaje', title: 'Índices parciales en Postgres', body: 'CREATE INDEX ... WHERE status = \'pending\' reduce el tamaño y acelera las consultas de pendientes.', tags: ['postgres'] }, addDays(today, -6)),
    stamp({ kind: 'snippet', title: 'Mis commits de ayer', body: 'git log --since=yesterday --author="$(git config user.name)" --oneline', tags: ['git'] }, addDays(today, -12))
  ];

  /* Tablero del cuarto (provisional hasta cargar los datos reales) */
  const records = [
    ['Press banca', 85, 'kg', 'gym'], ['Sentadilla', 115, 'kg', 'gym'], ['Peso muerto', 140, 'kg', 'gym'], ['Dominadas', 15, 'reps', 'gym'],
    ['5K', '23:40', 'tiempo', 'running'], ['10K', '50:15', 'tiempo', 'running'], ['Plancha', 3, 'min', 'gym']
  ].map(([name, value, unit, category]) => stamp({ name, value, unit, category, date: addDays(today, -30), isDemo: true }, addDays(today, -30)));

  /* Retos: del mes, del trimestre, del año, futuros y pasados */
  const thisMonth = monthRange(year, month);
  const nextMonth = monthRange(month === 11 ? year + 1 : year, (month + 1) % 12);
  const previousMonth = monthRange(month === 0 ? year - 1 : year, (month + 11) % 12);
  const thisQuarter = quarterRange(year, quarter);
  const nextQuarter = quarter === 4 ? quarterRange(year + 1, 1) : quarterRange(year, quarter + 1);
  const meditar = habits.find((habit) => habit.icon === 'meditation');
  const challenge = (title, period, range, metric, target, extra = {}) => stamp({ title, period, ...range, metric, target, ...extra }, range.start);
  const challenges = [
    challenge('Correr 80 km este mes', 'mes', thisMonth, 'run_km', 80),
    challenge('16 sesiones de gym', 'mes', thisMonth, 'gym_sessions', 16),
    challenge('Leer 600 páginas', 'mes', thisMonth, 'pages', 600),
    challenge('Meditar 25 días', 'mes', thisMonth, 'habit_days', 25, { habitId: meditar.id }),
    challenge('Cerrar 30 tareas de trabajo', 'mes', thisMonth, 'tasks_done', 30),
    challenge('250 km en el trimestre', 'trimestre', thisQuarter, 'run_km', 250),
    challenge('Press banca a 100 kg', 'trimestre', thisQuarter, 'exercise_weight', 100, { exercise: 'Press banca', unit: 'kg' }),
    challenge('3 libros en el trimestre', 'trimestre', thisQuarter, 'books_done', 3),
    challenge('2.000 minutos de foco profundo', 'trimestre', thisQuarter, 'focus_min', 2000),
    challenge(`${12} libros en ${year}`, 'año', yearRange(year), 'books_done', 12),
    challenge(`1.000 km en ${year}`, 'año', yearRange(year), 'run_km', 1000),
    challenge('Correr 70 km', 'mes', previousMonth, 'run_km', 70),
    challenge('Mes sin azúcar añadido', 'mes', nextMonth, 'manual', 30, { unit: 'días', manual: 0 }),
    challenge('Correr 100 km', 'mes', nextMonth, 'run_km', 100),
    challenge('Media maratón por debajo de 1:50', 'trimestre', nextQuarter, 'manual', 1, { unit: 'carrera', manual: 0, notes: 'Plan de 12 semanas: 4 salidas por semana.' }),
    challenge('Publicar mi side project', 'trimestre', nextQuarter, 'manual', 1, { unit: 'lanzamiento', manual: 0 })
  ];

  /* Nutricion: comidas de la ultima semana (hoy solo desayuno y almuerzo) */
  const MEALS = [
    ['desayuno', 'Avena con frutas y yogur', 420, 62, 18, 10],
    ['almuerzo', 'Ensalada de pollo a la plancha', 560, 38, 48, 22],
    ['cena', 'Salmón con verduras asadas', 610, 24, 44, 34],
    ['snack', 'Yogur griego con nueces', 240, 12, 18, 13]
  ];
  const meals = [];
  for (let back = 6; back >= 0; back -= 1) {
    const date = addDays(today, -back);
    MEALS.forEach(([type, mealName, kcal, carbs, protein, fat], position) => {
      if (back === 0 && position > 1) return;
      const factor = 0.85 + random() * 0.3;
      meals.push(stamp({ date, type, name: mealName, kcal: Math.round(kcal * factor), carbs: Math.round(carbs * factor), protein: Math.round(protein * factor), fat: Math.round(fat * factor) }, date));
    });
  }

  return { settings, routines, habits, meals, workouts, runs, books, readingLogs, tasks, focusSessions, journal, notes, records, challenges };
}
