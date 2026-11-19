/* Tarjeta de tarea: prioridad, proyecto, fecha, subtareas y botones para avanzar de estado */
import Icon from './Icon.jsx';
import { relativeDay, todayISO } from '../lib/dates.js';

const NEXT = { todo: { status: 'doing', label: 'Empezar', icon: 'play' }, doing: { status: 'done', label: 'Terminar', icon: 'check' }, done: { status: 'todo', label: 'Reabrir', icon: 'reset' } };

export default function TaskCard({ task, onOpen, onMove, isCompact = false, isDraggable = false }) {
  const today = todayISO();
  const isOverdue = task.status !== 'done' && task.due && task.due < today;
  const doneSubtasks = (task.subtasks || []).filter((item) => item.done).length;
  const next = NEXT[task.status];

  const dragHandler = (event) => {
    event.dataTransfer.setData('text/plain', task.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <article className={`task-card task-card--p${task.priority}${task.status === 'done' ? ' task-card--done' : ''}${isCompact ? ' task-card--compact' : ''}`} draggable={isDraggable} onDragStart={isDraggable ? dragHandler : undefined}>
      <button type="button" className={`task-card__check${task.status === 'done' ? ' task-card__check--done' : ''}`} aria-label={task.status === 'done' ? `Reabrir ${task.title}` : `Completar ${task.title}`} onClick={() => onMove(task, task.status === 'done' ? 'todo' : 'done')}>
        <Icon name="check" />
      </button>
      <button type="button" className="task-card__body" onClick={() => onOpen(task)}>
        <span className="task-card__title">{task.title}</span>
        <span className="task-card__meta">
          {task.project && <span className="tag">#{task.project}</span>}
          {task.area === 'personal' && <span className="tag tag--personal">personal</span>}
          {task.due && <span className={`task-card__due${isOverdue ? ' task-card__due--late' : ''}`}><Icon name="calendar" />{isOverdue ? `Vencida · ${relativeDay(task.due, today)}` : relativeDay(task.due, today)}</span>}
          {task.subtasks?.length > 0 && <span className="task-card__subtasks"><Icon name="list" />{doneSubtasks}/{task.subtasks.length}</span>}
          {task.isBlocked && task.status !== 'done' && <span className="tag tag--blocked">bloqueada</span>}
        </span>
      </button>
      {!isCompact && next && (
        <button type="button" className="icon-button icon-button--small task-card__next" aria-label={`${next.label}: ${task.title}`} onClick={() => onMove(task, next.status)}>
          <Icon name={next.icon} />
        </button>
      )}
    </article>
  );
}
