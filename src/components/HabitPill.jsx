/*
 * Actividad diaria como pildora grande de cristal (referencia "Curious? Just ask"):
 * icono en circulo, nombre, racha y casilla redonda a la derecha.
 */
import Icon from './Icon.jsx';
import { habitStreak, isHabitDone } from '../lib/stats.js';

export default function HabitPill({ habit, date, onToggle, onEdit }) {
  const isDone = isHabitDone(habit, date);
  const streak = habitStreak(habit, date);
  return (
    <li className={`habit-pill${isDone ? ' habit-pill--done' : ''}`}>
      <button type="button" className="habit-pill__main" onClick={() => onEdit(habit)} aria-label={`Editar ${habit.name}`}>
        <span className="habit-pill__icon"><Icon name={habit.icon} /></span>
        <span className="habit-pill__text">
          <span className="habit-pill__name">{habit.name}</span>
          <span className="habit-pill__meta">{streak > 0 ? `🔥 ${streak} ${streak === 1 ? 'día seguido' : 'días seguidos'}` : `Sin racha · ${habit.moment}`}</span>
        </span>
      </button>
      <button type="button" className="habit-pill__check" aria-pressed={isDone} aria-label={`${isDone ? 'Desmarcar' : 'Marcar'} ${habit.name}`} onClick={() => onToggle(habit)}>
        <Icon name="check" />
      </button>
    </li>
  );
}
