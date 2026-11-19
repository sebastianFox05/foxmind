/*
 * Cartelera del dia (referencia del cine): convierte lo programado en "posters".
 * Rutinas del dia (gym, running, lectura), la tarea prioritaria, el libro en curso y un bloque de foco.
 * Cada poster lleva chips ("En 2 h", "Gym", "Prioridad alta") y su "reparto" (ejercicios, subtareas, datos).
 */
import { HERO_PHOTOS } from './photos.js';
import { bookProgress, readingMinutesOn, routinesForDay, exerciseRecords } from './stats.js';
import { compareTasks } from './tasks.js';
import { formatNumber } from './utils.js';
import { todayISO } from './dates.js';

const KIND_LABEL = { gym: 'Gym', running: 'Running', lectura: 'Lectura', task: 'Trabajo', focus: 'Foco' };
const KIND_ICON = { gym: 'dumbbell', running: 'run', lectura: 'book', task: 'briefcase', focus: 'timer' };

/* "18:30" → "En 2 h", "En 25 min", "Ahora" o "Hace 1 h" (solo para hoy) */
export function timeChip(time, date, now = new Date()) {
  if (!time) return '';
  if (date !== todayISO()) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const diff = Math.round((hours * 60 + minutes - (now.getHours() * 60 + now.getMinutes())));
  if (Math.abs(diff) <= 15) return 'Ahora';
  if (diff > 0) return diff < 60 ? `En ${diff} min` : `En ${Math.round(diff / 60)} h`;
  return -diff < 60 ? `Hace ${-diff} min` : `Hace ${Math.round(-diff / 60)} h`;
}

export function isRoutineDone(db, settings, routine, date) {
  if (routine.kind === 'gym') return db.workouts.some((item) => item.date === date);
  if (routine.kind === 'running') return db.runs.some((item) => item.date === date);
  return readingMinutesOn(db, date) >= (Number(routine.minutes) || Number(settings.dailyReadingMin) || 20);
}

function routinePoster(db, settings, routine, date) {
  const records = routine.kind === 'gym' ? exerciseRecords(db) : [];
  const cast = routine.kind === 'gym'
    ? routine.exercises.map((exercise) => {
      const best = records.find((record) => record.name.toLowerCase() === exercise.name.toLowerCase());
      return { name: exercise.name, detail: `${exercise.sets}×${exercise.reps}${best ? ` · récord ${formatNumber(best.weight)} kg` : ''}`, icon: 'dumbbell' };
    })
    : routine.kind === 'running'
      ? [{ name: `${formatNumber(routine.km)} km`, detail: 'distancia', icon: 'run' }, { name: routine.name.toLowerCase().includes('serie') ? 'Series' : 'Rodaje', detail: 'tipo', icon: 'flame' }, { name: routine.time || 'Libre', detail: 'hora', icon: 'clock' }]
      : [{ name: `${routine.minutes || settings.dailyReadingMin} min`, detail: 'objetivo', icon: 'timer' }, ...db.books.filter((book) => book.status === 'leyendo').map((book) => ({ name: book.title, detail: `pág. ${book.page}/${book.pages}`, icon: 'book' }))];
  const photo = routine.kind === 'gym' ? HERO_PHOTOS.gym : routine.kind === 'running' ? HERO_PHOTOS.running : HERO_PHOTOS.lectura;
  return {
    id: routine.id,
    kind: routine.kind,
    photo,
    title: routine.name,
    eyebrow: routine.kind === 'gym' ? `${routine.exercises.length} ejercicios` : routine.kind === 'running' ? `${formatNumber(routine.km)} km` : `${routine.minutes} min`,
    chips: [timeChip(routine.time, date), KIND_LABEL[routine.kind]].filter(Boolean),
    description: routine.plan || (routine.kind === 'gym' ? `Sesión de ${routine.exercises.map((exercise) => exercise.name.toLowerCase()).join(', ')}. La app recordará el último peso de cada ejercicio.` : ''),
    castTitle: routine.kind === 'gym' ? 'Ejercicios' : 'Detalles',
    cast,
    action: routine.kind === 'gym' ? 'Empezar sesión' : 'Registrar',
    isDone: isRoutineDone(db, settings, routine, date),
    icon: KIND_ICON[routine.kind],
    source: routine
  };
}

export function buildPosters(db, settings, date) {
  const posters = routinesForDay(db, date).sort((a, b) => (a.time || '99').localeCompare(b.time || '99')).map((routine) => routinePoster(db, settings, routine, date));

  const task = db.tasks.filter((item) => item.status !== 'done' && (!item.due || item.due <= date)).sort(compareTasks)[0];
  if (task) {
    const doneSubtasks = (task.subtasks || []).filter((item) => item.done).length;
    posters.push({
      id: task.id,
      kind: 'task',
      photo: HERO_PHOTOS.trabajo,
      title: task.title,
      eyebrow: task.project ? `#${task.project}` : 'Prioridad del día',
      chips: [task.priority === 1 ? 'Prioridad alta' : 'Prioridad', task.project ? `#${task.project}` : 'Trabajo'],
      description: task.notes || 'Tu tarea más importante ahora mismo según prioridad y fecha. Empieza un bloque de foco y ciérrala.',
      castTitle: task.subtasks?.length ? `Pasos · ${doneSubtasks}/${task.subtasks.length}` : 'Detalles',
      cast: task.subtasks?.length
        ? task.subtasks.map((item) => ({ name: item.title, detail: item.done ? 'hecho' : 'pendiente', icon: item.done ? 'check' : 'target' }))
        : [{ name: task.status === 'doing' ? 'En curso' : 'Por hacer', detail: 'estado', icon: 'columns' }, { name: task.due || 'Sin fecha', detail: 'fecha límite', icon: 'calendar' }],
      action: 'Empezar foco',
      isDone: false,
      icon: 'briefcase',
      source: task
    });
  }

  const hasReadingRoutine = posters.some((poster) => poster.kind === 'lectura');
  const book = db.books.find((item) => item.status === 'leyendo');
  if (book && !hasReadingRoutine) {
    posters.push({
      id: book.id,
      kind: 'lectura',
      photo: HERO_PHOTOS.lectura,
      title: book.title,
      eyebrow: book.author,
      chips: [`${Math.round(bookProgress(book) * 100)} %`, 'Lectura'],
      description: book.notes || `Vas por la página ${book.page} de ${book.pages}. Te quedan ${book.pages - book.page} páginas.`,
      castTitle: 'Detalles',
      cast: [{ name: `${book.page}/${book.pages}`, detail: 'páginas', icon: 'book' }, { name: book.author, detail: 'autor', icon: 'user' }],
      action: 'Registrar lectura',
      isDone: readingMinutesOn(db, date) >= (Number(settings.dailyReadingMin) || 20),
      icon: 'book',
      source: { ...book, kind: 'lectura', minutes: settings.dailyReadingMin }
    });
  }

  return posters;
}
