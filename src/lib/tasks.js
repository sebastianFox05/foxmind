/* Reglas de las tareas: cambio de estado (con fecha de cierre) y orden por prioridad y fecha */
import { todayISO } from './dates.js';

export function withStatus(task, status) {
  return { ...task, status, doneAt: status === 'done' ? todayISO() : '' };
}

export function compareTasks(a, b) {
  if (a.status === 'done' && b.status === 'done') return (b.doneAt || '').localeCompare(a.doneAt || '');
  if (a.priority !== b.priority) return a.priority - b.priority;
  return (a.due || '9999').localeCompare(b.due || '9999');
}
