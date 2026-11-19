/*
 * Actividad del dia en linea de tiempo (referencia "Today's Activity"): puntos unidos por una linea,
 * titulo y detalle a la izquierda, hora a la derecha y la proxima pendiente marcada con la pildora "Ahora".
 * Junta rutinas programadas (con hora), tareas del dia y bloques de foco registrados.
 */
import Icon from './Icon.jsx';
import { isRoutineDone } from '../lib/posters.js';
import { routinesForDay, tasksForDay } from '../lib/stats.js';
import { todayISO } from '../lib/dates.js';
import { formatNumber } from '../lib/utils.js';

const KIND_ICON = { gym: 'dumbbell', running: 'run', lectura: 'book', task: 'briefcase', focus: 'timer' };

function localTime(isoDateTime) {
  const date = new Date(isoDateTime);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function buildTimeline(db, settings, date) {
  const items = [];
  routinesForDay(db, date).forEach((routine) => items.push({
    id: routine.id, kind: routine.kind, title: routine.name, time: routine.time || '',
    detail: routine.kind === 'running' ? `${formatNumber(routine.km)} km` : routine.kind === 'gym' ? `${routine.exercises.length} ejercicios` : `${routine.minutes} min`,
    isDone: isRoutineDone(db, settings, routine, date), source: routine
  }));
  tasksForDay(db, date).forEach((task) => items.push({
    id: task.id, kind: 'task', title: task.title, time: task.time || '', detail: task.project ? `#${task.project}` : 'Tarea',
    isDone: task.status === 'done', source: task
  }));
  db.focusSessions.filter((session) => session.date === date).forEach((session) => items.push({
    id: session.id, kind: 'focus', title: session.label || 'Bloque de foco', time: session.createdAt ? localTime(session.createdAt) : '',
    detail: `${session.minutes} min de foco`, isDone: true, source: session
  }));
  return items.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
}

export default function DayTimeline({ items, date, onOpen }) {
  const now = new Date();
  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const nextId = date === todayISO() ? items.find((item) => !item.isDone && (!item.time || item.time >= clock))?.id : '';

  if (!items.length) return <p className="empty">Nada en la línea de tiempo de este día.</p>;

  return (
    <ol className="timeline">
      {items.map((item) => {
        const isNext = item.id === nextId;
        return (
          <li key={item.id} className={`timeline__item${item.isDone ? ' timeline__item--done' : ''}${isNext ? ' timeline__item--next' : ''}`}>
            <span className="timeline__dot" aria-hidden="true">{item.isDone && <Icon name="check" />}</span>
            <button type="button" className="timeline__body" onClick={() => onOpen(item)}>
              <span className="timeline__title"><Icon name={KIND_ICON[item.kind]} />{item.title}</span>
              <span className="timeline__detail">{item.detail}{item.isDone ? ' · hecho' : ''}</span>
            </button>
            {isNext ? <span className="timeline__now">Ahora</span> : <span className="timeline__time">{item.time || '—'}</span>}
          </li>
        );
      })}
    </ol>
  );
}
