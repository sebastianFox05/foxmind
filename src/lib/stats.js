/*
 * Calculos derivados: TODO lo automatico de FoxMind sale de aqui.
 * Progreso de retos, rachas de habitos, records personales, puntuacion del dia, series semanales,
 * alertas proactivas y el texto del standup. Nada de esto se guarda: se recalcula desde los registros.
 */
import { addDays, daysBetween, formatDay, formatDuration, isInRange, startOfWeek, todayISO, weekday, formatPace, relativeDay } from './dates.js';

const POUND_IN_KG = 0.45359237;
import { clamp, round, sum, formatNumber } from './utils.js';

/* ---------- Metricas que alimentan los retos ---------- */

function inRange(list, start, end, pick = (item) => item.date) {
  return list.filter((item) => isInRange(pick(item), start, end));
}

function normalizeName(text) {
  return (text || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function trainingDates(db) {
  return new Set([...db.workouts.map((item) => item.date), ...db.runs.map((item) => item.date)]);
}

export const METRICS = {
  run_km: {
    label: 'Km corridos', unit: 'km', icon: 'run', source: 'Running',
    compute: (db, start, end) => round(sum(inRange(db.runs, start, end), (run) => run.km), 1)
  },
  run_count: {
    label: 'Carreras', unit: 'carreras', icon: 'run', source: 'Running',
    compute: (db, start, end) => inRange(db.runs, start, end).length
  },
  gym_sessions: {
    label: 'Sesiones de gym', unit: 'sesiones', icon: 'dumbbell', source: 'Gym',
    compute: (db, start, end) => inRange(db.workouts, start, end).length
  },
  training_days: {
    label: 'Días entrenados (gym o running)', unit: 'días', icon: 'flame', source: 'Entreno',
    compute: (db, start, end) => [...trainingDates(db)].filter((date) => isInRange(date, start, end)).length
  },
  exercise_weight: {
    label: 'Peso máximo en un ejercicio', unit: 'kg', icon: 'dumbbell', source: 'Gym + tablero', isLevel: true,
    compute: (db, start, end, challenge) => {
      const name = normalizeName(challenge.exercise);
      const fromWorkouts = db.workouts.filter((item) => item.date <= end)
        .flatMap((item) => item.exercises || [])
        .filter((exercise) => normalizeName(exercise.name) === name)
        .flatMap((exercise) => exercise.sets || [])
        .map((set) => Number(set.weight) || 0);
      /* Solo marcas de peso: kg tal cual y libras convertidas (una marca en reps o minutos no cuenta) */
      const fromBoard = db.records.filter((record) => normalizeName(record.name) === name && (record.date || '') <= end && ['kg', 'lb'].includes(record.unit))
        .map((record) => (Number(record.value) || 0) * (record.unit === 'lb' ? POUND_IN_KG : 1));
      return Math.max(0, ...fromWorkouts, ...fromBoard);
    }
  },
  pages: {
    label: 'Páginas leídas', unit: 'páginas', icon: 'book', source: 'Lectura',
    compute: (db, start, end) => sum(inRange(db.readingLogs, start, end), (log) => log.pages)
  },
  reading_min: {
    label: 'Minutos de lectura', unit: 'min', icon: 'book', source: 'Lectura',
    compute: (db, start, end) => sum(inRange(db.readingLogs, start, end), (log) => log.minutes)
  },
  books_done: {
    label: 'Libros terminados', unit: 'libros', icon: 'book', source: 'Lectura',
    compute: (db, start, end) => db.books.filter((book) => book.status === 'terminado' && isInRange(book.finishedAt, start, end)).length
  },
  tasks_done: {
    label: 'Tareas completadas', unit: 'tareas', icon: 'check', source: 'Trabajo',
    compute: (db, start, end) => db.tasks.filter((task) => task.status === 'done' && isInRange(task.doneAt, start, end)).length
  },
  focus_min: {
    label: 'Minutos de foco profundo', unit: 'min', icon: 'timer', source: 'Foco',
    compute: (db, start, end) => sum(inRange(db.focusSessions, start, end), (session) => session.minutes)
  },
  habit_days: {
    label: 'Días cumpliendo un hábito', unit: 'días', icon: 'leaf', source: 'Hábitos',
    compute: (db, start, end, challenge) => {
      const habit = db.habits.find((item) => item.id === challenge.habitId);
      return habit ? (habit.log || []).filter((date) => isInRange(date, start, end)).length : 0;
    }
  },
  journal_days: {
    label: 'Días con diario', unit: 'días', icon: 'note', source: 'Diario',
    compute: (db, start, end) => new Set(inRange(db.journal, start, end).map((entry) => entry.date)).size
  },
  manual: {
    label: 'Manual (lo cuento yo)', unit: '', icon: 'target', source: 'Manual',
    compute: (db, start, end, challenge) => Number(challenge.manual) || 0
  }
};

/* ---------- Retos ---------- */

export function challengeProgress(challenge, db, today = todayISO()) {
  const metric = METRICS[challenge.metric] || METRICS.manual;
  const value = metric.compute(db, challenge.start, challenge.end, challenge);
  const target = Number(challenge.target) || 1;
  const pct = clamp(value / target, 0, 1);
  const isDone = value >= target;
  const daysTotal = daysBetween(challenge.start, challenge.end) + 1;
  const daysElapsed = clamp(daysBetween(challenge.start, today) + 1, 0, daysTotal);
  const daysLeft = clamp(daysBetween(today, challenge.end) + 1, 0, daysTotal);

  let status = 'activo';
  if (today < challenge.start) status = 'futuro';
  else if (isDone) status = 'cumplido';
  else if (today > challenge.end) status = 'vencido';

  const expected = target * (daysElapsed / daysTotal);
  const isBehind = status === 'activo' && !metric.isLevel && daysElapsed > 1 && value < expected * 0.9;
  const perDay = status === 'activo' && !metric.isLevel ? Math.max(0, (target - value) / Math.max(1, daysLeft)) : 0;
  const unit = challenge.unit || metric.unit;

  return { value, target, pct, status, isDone, isBehind, daysLeft, daysTotal, daysElapsed, expectedPct: clamp(expected / target, 0, 1), perDay, unit, metric };
}

/* ---------- Habitos ---------- */

export function isHabitDue(habit, iso) {
  return !habit.archived && (!habit.days?.length || habit.days.includes(weekday(iso)));
}

export function isHabitDone(habit, iso) {
  return (habit.log || []).includes(iso);
}

export function habitStreak(habit, today = todayISO()) {
  let streak = 0;
  let cursor = isHabitDone(habit, today) ? today : addDays(today, -1);
  for (let guard = 0; guard < 400; guard += 1) {
    if (isHabitDue(habit, cursor)) {
      if (!isHabitDone(habit, cursor)) break;
      streak += 1;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function habitRate(habits, start, end) {
  let due = 0;
  let done = 0;
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    habits.forEach((habit) => {
      if (!isHabitDue(habit, cursor)) return;
      due += 1;
      if (isHabitDone(habit, cursor)) done += 1;
    });
  }
  return due ? done / due : 0;
}

/* ---------- Entreno ---------- */

export function runPace(run) {
  return run.km > 0 ? run.minutes / run.km : 0;
}

export function workoutVolume(workout) {
  return sum((workout.exercises || []).flatMap((exercise) => exercise.sets || []), (set) => (Number(set.reps) || 0) * (Number(set.weight) || 0));
}

export function routinesForDay(db, iso, kind) {
  return db.routines.filter((routine) => (!kind || routine.kind === kind) && (routine.days || []).includes(weekday(iso)));
}

/* Records automaticos por ejercicio: peso maximo y 1RM estimado (formula de Epley) */
export function exerciseRecords(db) {
  const records = new Map();
  db.workouts.forEach((workout) => {
    (workout.exercises || []).forEach((exercise) => {
      const key = normalizeName(exercise.name);
      (exercise.sets || []).forEach((set) => {
        const weight = Number(set.weight) || 0;
        const reps = Number(set.reps) || 0;
        if (!weight || !reps) return;
        const oneRepMax = round(weight * (1 + reps / 30), 1);
        const current = records.get(key);
        if (!current || weight > current.weight || (weight === current.weight && reps > current.reps)) {
          records.set(key, { name: exercise.name, weight, reps, date: workout.date, oneRepMax: Math.max(oneRepMax, current?.oneRepMax || 0) });
        } else if (oneRepMax > current.oneRepMax) {
          current.oneRepMax = oneRepMax;
        }
      });
    });
  });
  return [...records.values()].sort((a, b) => b.weight - a.weight);
}

export function runRecords(db) {
  const runs = db.runs.filter((run) => run.km > 0 && run.minutes > 0);
  if (!runs.length) return [];
  const longest = runs.reduce((best, run) => (run.km > best.km ? run : best));
  const paced = runs.filter((run) => run.km >= 3);
  const fastest = paced.length ? paced.reduce((best, run) => (runPace(run) < runPace(best) ? run : best)) : null;
  const fiveK = runs.filter((run) => run.km >= 5);
  const bestFive = fiveK.length ? fiveK.reduce((best, run) => (runPace(run) < runPace(best) ? run : best)) : null;
  const tenK = runs.filter((run) => run.km >= 10);
  const bestTen = tenK.length ? tenK.reduce((best, run) => (runPace(run) < runPace(best) ? run : best)) : null;
  const list = [{ name: 'Carrera más larga', value: `${formatNumber(longest.km)} km`, date: longest.date }];
  if (fastest) list.push({ name: 'Mejor ritmo (≥3 km)', value: `${formatPace(runPace(fastest))} /km`, date: fastest.date });
  if (bestFive) list.push({ name: '5K estimado', value: formatDuration(runPace(bestFive) * 5), date: bestFive.date, isTime: true });
  if (bestTen) list.push({ name: '10K estimado', value: formatDuration(runPace(bestTen) * 10), date: bestTen.date, isTime: true });
  return list;
}

export function lastTrainingDate(db) {
  return [...trainingDates(db)].sort().pop() || '';
}

/* ---------- Lectura ---------- */

export function readingMinutesOn(db, iso) {
  return sum(db.readingLogs.filter((log) => log.date === iso), (log) => Number(log.minutes) || (Number(log.pages) || 0) * 2);
}

export function bookProgress(book) {
  return book.pages ? clamp((Number(book.page) || 0) / Number(book.pages), 0, 1) : 0;
}

/* ---------- Dia ---------- */

export function tasksForDay(db, iso) {
  return db.tasks.filter((task) => (task.status !== 'done' && task.due && task.due <= iso) || (task.status === 'done' && task.doneAt === iso));
}

export function dailyScore(db, settings, iso) {
  const habits = db.habits.filter((habit) => isHabitDue(habit, iso));
  const habitPart = habits.length ? habits.filter((habit) => isHabitDone(habit, iso)).length / habits.length : 1;

  const dayTasks = tasksForDay(db, iso);
  const taskPart = dayTasks.length ? dayTasks.filter((task) => task.status === 'done').length / dayTasks.length : 1;

  const isTrainingDay = routinesForDay(db, iso).some((routine) => routine.kind !== 'lectura');
  const hasTrained = db.workouts.some((item) => item.date === iso) || db.runs.some((item) => item.date === iso);
  const trainingPart = hasTrained || !isTrainingDay ? 1 : 0;

  const readingGoal = Number(settings.dailyReadingMin) || 20;
  const readingPart = clamp(readingMinutesOn(db, iso) / readingGoal, 0, 1);

  const score = Math.round(habitPart * 40 + taskPart * 25 + trainingPart * 20 + readingPart * 15);
  return { score, parts: { habitPart, taskPart, trainingPart, readingPart }, isTrainingDay, hasTrained };
}

export function dayActivity(db, iso) {
  return db.habits.filter((habit) => isHabitDone(habit, iso)).length
    + db.tasks.filter((task) => task.doneAt === iso).length
    + db.workouts.filter((item) => item.date === iso).length * 2
    + db.runs.filter((item) => item.date === iso).length * 2
    + db.readingLogs.filter((item) => item.date === iso).length
    + db.focusSessions.filter((item) => item.date === iso).length
    + db.journal.filter((item) => item.date === iso).length;
}

/* ---------- Series para graficos ---------- */

export function weeklySeries(db, kind, weeks = 8, today = todayISO()) {
  const currentWeek = startOfWeek(today);
  return Array.from({ length: weeks }, (_, index) => {
    const start = addDays(currentWeek, (index - weeks + 1) * 7);
    const end = addDays(start, 6);
    const value = {
      runKm: () => round(sum(inRange(db.runs, start, end), (run) => run.km), 1),
      gym: () => inRange(db.workouts, start, end).length,
      volume: () => Math.round(sum(inRange(db.workouts, start, end), workoutVolume)),
      pages: () => sum(inRange(db.readingLogs, start, end), (log) => log.pages),
      focus: () => sum(inRange(db.focusSessions, start, end), (item) => item.minutes),
      tasks: () => db.tasks.filter((task) => task.status === 'done' && isInRange(task.doneAt, start, end)).length
    }[kind]();
    return { label: formatDay(start).split(' ').slice(1).join(' '), start, value };
  });
}

export function dailySeries(db, kind, days = 7, today = todayISO()) {
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(today, index - days + 1);
    const value = {
      runKm: () => sum(db.runs.filter((run) => run.date === date), (run) => run.km),
      score: () => dailyScore(db, db.settings[0] || {}, date).score,
      reading: () => readingMinutesOn(db, date),
      focus: () => sum(db.focusSessions.filter((item) => item.date === date), (item) => item.minutes)
    }[kind]();
    return { date, value };
  });
}

/* ---------- Resumen semanal ---------- */

export function weekSummary(db, weekStart) {
  const end = addDays(weekStart, 6);
  const runs = inRange(db.runs, weekStart, end);
  return {
    start: weekStart,
    end,
    tasksDone: db.tasks.filter((task) => task.status === 'done' && isInRange(task.doneAt, weekStart, end)).length,
    gymSessions: inRange(db.workouts, weekStart, end).length,
    runKm: round(sum(runs, (run) => run.km), 1),
    runs: runs.length,
    pages: sum(inRange(db.readingLogs, weekStart, end), (log) => log.pages),
    readingMin: sum(inRange(db.readingLogs, weekStart, end), (log) => log.minutes),
    focusMin: sum(inRange(db.focusSessions, weekStart, end), (item) => item.minutes),
    habitRate: habitRate(db.habits, weekStart, end),
    journalDays: new Set(inRange(db.journal, weekStart, end).map((entry) => entry.date)).size
  };
}

/* ---------- Standup para el trabajo ---------- */

export function standupText(db, today = todayISO()) {
  const work = db.tasks.filter((task) => task.area !== 'personal');
  let previous = addDays(today, -1);
  if (weekday(today) === 1) previous = addDays(today, -3);
  const done = work.filter((task) => task.status === 'done' && task.doneAt >= previous && task.doneAt < today);
  const doing = work.filter((task) => task.status === 'doing');
  const next = work.filter((task) => task.status === 'todo' && task.due && task.due <= today);
  const blocked = work.filter((task) => task.isBlocked && task.status !== 'done');
  const line = (task) => `- ${task.title}${task.project ? ` (${task.project})` : ''}`;
  return [
    `Standup · ${formatDay(today)}`,
    '',
    `✅ ${weekday(today) === 1 ? 'El viernes' : 'Ayer'}:`,
    ...(done.length ? done.map(line) : ['- (sin tareas cerradas)']),
    '',
    '🎯 Hoy:',
    ...([...doing, ...next].length ? [...doing, ...next].map(line) : ['- (define tu prioridad del día)']),
    '',
    '🚧 Bloqueos:',
    ...(blocked.length ? blocked.map((task) => `${line(task)}${task.blockedReason ? `: ${task.blockedReason}` : ''}`) : ['- Ninguno'])
  ].join('\n');
}

/* ---------- Alertas proactivas ---------- */

export function insights(db, settings, today = todayISO(), now = new Date()) {
  const list = [];
  const hour = now.getHours();
  const pending = db.tasks.filter((task) => task.status !== 'done');

  const overdue = pending.filter((task) => task.due && task.due < today);
  if (overdue.length) {
    list.push({ id: 'overdue', tone: 'rose', icon: 'alert', title: `${overdue.length} ${overdue.length === 1 ? 'tarea vencida' : 'tareas vencidas'}`, text: `La más antigua: «${overdue.sort((a, b) => a.due.localeCompare(b.due))[0].title}». Reprográmala o ciérrala.`, to: '/trabajo' });
  }

  const doing = pending.filter((task) => task.status === 'doing');
  if (doing.length > 3) {
    list.push({ id: 'wip', tone: 'amber', icon: 'columns', title: `${doing.length} tareas en curso a la vez`, text: 'Limita el trabajo en curso a 3: termina antes de empezar otra.', to: '/trabajo' });
  }

  db.challenges.forEach((challenge) => {
    const progress = challengeProgress(challenge, db, today);
    if (progress.isBehind) {
      list.push({ id: `behind-${challenge.id}`, tone: 'amber', icon: 'trophy', title: `Reto en riesgo: ${challenge.title}`, text: `Vas ${formatNumber(progress.value)}/${formatNumber(progress.target)} ${progress.unit}. Necesitas ${formatNumber(progress.perDay)} ${progress.unit} al día para llegar.`, to: '/retos' });
    } else if (progress.status === 'activo' && progress.daysLeft <= 3) {
      list.push({ id: `ending-${challenge.id}`, tone: 'blue', icon: 'clock', title: `Quedan ${progress.daysLeft} días: ${challenge.title}`, text: `Te faltan ${formatNumber(progress.target - progress.value)} ${progress.unit}.`, to: '/retos' });
    } else if (progress.status === 'futuro' && daysBetween(today, challenge.start) <= 7) {
      list.push({ id: `soon-${challenge.id}`, tone: 'violet', icon: 'sparkle', title: `Empieza pronto: ${challenge.title}`, text: `Arranca ${relativeDay(challenge.start, today).toLowerCase()}. Prepara la rutina desde ya.`, to: '/retos' });
    }
  });

  const lastTraining = lastTrainingDate(db);
  if (lastTraining && daysBetween(lastTraining, today) >= 3) {
    list.push({ id: 'training', tone: 'green', icon: 'dumbbell', title: `${daysBetween(lastTraining, today)} días sin entrenar`, text: 'Aunque sea un rodaje suave de 20 minutos: mantén la cadena.', to: '/entreno' });
  }

  const readingGoal = Number(settings.dailyReadingMin) || 20;
  if (hour >= 18 && readingMinutesOn(db, today) < readingGoal) {
    list.push({ id: 'reading', tone: 'amber', icon: 'book', title: 'Tu rutina de lectura sigue pendiente', text: `Objetivo diario: ${readingGoal} min. Llevas ${readingMinutesOn(db, today)}.`, to: '/mente' });
  }

  const habitsLeft = db.habits.filter((habit) => isHabitDue(habit, today) && !isHabitDone(habit, today));
  if (hour >= 20 && habitsLeft.length) {
    const atRisk = habitsLeft.filter((habit) => habitStreak(habit, today) >= 3);
    list.push({ id: 'habits', tone: 'rose', icon: 'flame', title: atRisk.length ? `Racha en riesgo: ${atRisk[0].name}` : `${habitsLeft.length} hábitos sin marcar hoy`, text: 'Aún estás a tiempo de cerrar el día.', to: '/' });
  }

  db.books.filter((book) => book.status === 'leyendo' && bookProgress(book) >= 0.85).forEach((book) => {
    list.push({ id: `book-${book.id}`, tone: 'green', icon: 'book', title: `Casi terminas «${book.title}»`, text: `Te quedan ${book.pages - book.page} páginas. Un empujón y suma a tu reto de libros.`, to: '/mente' });
  });

  const tomorrow = addDays(today, 1);
  if (hour >= 18 && !pending.some((task) => task.due === tomorrow)) {
    list.push({ id: 'plan', tone: 'violet', icon: 'calendar', title: 'Planifica mañana', text: 'No tienes tareas para mañana: elige tus 3 prioridades antes de dormir.', to: '/trabajo' });
  }

  if (weekday(today) === 0) {
    list.push({ id: 'review', tone: 'blue', icon: 'chart', title: 'Domingo de revisión semanal', text: 'Mira tu semana en números y escribe qué mejorar.', to: '/perfil' });
  }

  return list;
}

/* ---------- Fitness: calorias estimadas, minutos activos y nutricion ---------- */

/* Estimaciones sencillas (sin pulsometro): gym ≈ 6,5 kcal/min (fuerza moderada) y running ≈ 70 kcal/km */
const KCAL_PER_GYM_MINUTE = 6.5;
const KCAL_PER_KM = 70;

export function workoutKcal(workout) {
  return Math.round((Number(workout.minutes) || 0) * KCAL_PER_GYM_MINUTE);
}

export function runKcal(run) {
  return Math.round((Number(run.km) || 0) * KCAL_PER_KM);
}

export function routineEstimate(routine) {
  if (routine.kind === 'running') {
    const minutes = Math.round((Number(routine.km) || 5) * 5.6);
    return { minutes, kcal: Math.round((Number(routine.km) || 5) * KCAL_PER_KM), level: routine.name.toLowerCase().includes('serie') ? 'Intenso' : 'Moderado' };
  }
  const sets = sum(routine.exercises || [], (exercise) => exercise.sets);
  const minutes = Math.max(30, Math.round(sets * 3.2));
  return { minutes, kcal: Math.round(minutes * KCAL_PER_GYM_MINUTE), level: sets >= 14 ? 'Intermedio' : 'Básico' };
}

export function activitySummary(db, start, end) {
  const workouts = inRange(db.workouts, start, end);
  const runs = inRange(db.runs, start, end);
  return {
    kcal: sum(workouts, workoutKcal) + sum(runs, runKcal),
    activeMinutes: sum(workouts, (item) => item.minutes) + sum(runs, (item) => item.minutes),
    km: round(sum(runs, (run) => run.km), 1),
    sessions: workouts.length,
    runs: runs.length
  };
}

export function activitySeries(db, start, days) {
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(start, index);
    const summary = activitySummary(db, date, date);
    return { date, value: summary.kcal, km: summary.km, minutes: summary.activeMinutes };
  });
}

export function nutritionFor(db, date) {
  const meals = db.meals.filter((meal) => meal.date === date);
  return {
    meals,
    kcal: sum(meals, (meal) => meal.kcal),
    carbs: sum(meals, (meal) => meal.carbs),
    protein: sum(meals, (meal) => meal.protein),
    fat: sum(meals, (meal) => meal.fat)
  };
}
