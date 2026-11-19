/*
 * Vista "Hoy" de Trabajo (referencia "Today"): fecha, dias en pildora con el elegido en negro y una linea de
 * tiempo de las tareas del dia ordenadas por hora. La tarea actual (en curso o la proxima) va en tarjeta negra
 * con lineas en onda y su casilla para completarla.
 */
import { useState } from 'react';
import Icon from './Icon.jsx';
import Waves from './Waves.jsx';
import { MONTHS, WEEKDAYS_SHORT, parseISO, todayISO, weekDays } from '../lib/dates.js';
import { compareTasks } from '../lib/tasks.js';

export default function WorkToday({ tasks, onOpen, onMove }) {
  const today = todayISO();
  const [date, setDate] = useState(today);
  const day = parseISO(date);
  const list = tasks
    .filter((task) => (task.due === date) || (date === today && task.status === 'doing') || (task.status === 'done' && task.doneAt === date))
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99') || compareTasks(a, b));
  const current = list.find((task) => task.status === 'doing') || list.find((task) => task.status === 'todo');

  return (
    <section className="work-today" aria-labelledby="work-today-title">
      <p className="work-today__date">{day.getDate()} de {MONTHS[day.getMonth()]} de {day.getFullYear()}</p>
      <h2 className="work-today__title" id="work-today-title">{date === today ? 'Hoy' : WEEKDAYS_SHORT[day.getDay()]}</h2>

      <div className="day-pills" role="group" aria-label="Elegir día">
        {weekDays(date).map((iso) => {
          const item = parseISO(iso);
          const isSelected = iso === date;
          const hasTasks = tasks.some((task) => task.due === iso && task.status !== 'done');
          return (
            <button key={iso} type="button" className={`day-pill${isSelected ? ' day-pill--active' : ''}`} aria-pressed={isSelected} aria-label={`${WEEKDAYS_SHORT[item.getDay()]} ${item.getDate()}${hasTasks ? ', con tareas' : ''}`} onClick={() => setDate(iso)}>
              <span className="day-pill__number" aria-hidden="true">{item.getDate()}</span>
              <span className="day-pill__name" aria-hidden="true">{WEEKDAYS_SHORT[item.getDay()]}</span>
              <span className={`day-pill__dot${hasTasks ? ' day-pill__dot--on' : ''}`} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {list.length ? (
        <ol className="work-timeline">
          {list.map((task) => {
            const isCurrent = current?.id === task.id;
            const isDone = task.status === 'done';
            return (
              <li key={task.id} className={`work-timeline__item${isCurrent ? ' work-timeline__item--current' : ''}${isDone ? ' work-timeline__item--done' : ''}`}>
                <span className="work-timeline__dot" aria-hidden="true" />
                <article className="work-timeline__card">
                  {isCurrent && <Waves />}
                  <button type="button" className="work-timeline__main" onClick={() => onOpen(task)}>
                    <span className="work-timeline__head">
                      <span className="work-timeline__name">{task.title}</span>
                      <span className="work-timeline__time">{task.time || 'Sin hora'}</span>
                    </span>
                    <span className="work-timeline__notes">{task.notes || (task.project ? `#${task.project}` : 'Toca para añadir detalles')}</span>
                  </button>
                  {(isCurrent || isDone) && (
                    <button type="button" className={`work-timeline__check${isDone ? ' work-timeline__check--done' : ''}`} aria-label={isDone ? `Reabrir ${task.title}` : `Completar ${task.title}`} onClick={() => onMove(task, isDone ? 'todo' : 'done')}>
                      <Icon name="check" />
                    </button>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      ) : <p className="empty">Nada para este día.</p>}
    </section>
  );
}
