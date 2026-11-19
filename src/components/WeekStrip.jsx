/*
 * Tira semanal de circulos (referencia "Jan, Week 1"): cada dia con su numero y color segun la puntuacion.
 * Los dias futuros salen punteados; el seleccionado, resaltado.
 */
import { WEEKDAYS_SHORT, parseISO, todayISO, weekDays } from '../lib/dates.js';

function toneFor(score) {
  if (score >= 80) return 'green';
  if (score >= 55) return 'amber';
  if (score > 0) return 'rose';
  return 'empty';
}

export default function WeekStrip({ selected, onSelect, getScore }) {
  const today = todayISO();
  return (
    <ol className="week-strip" aria-label="Semana">
      {weekDays(selected).map((date) => {
        const isFuture = date > today;
        const score = isFuture ? 0 : getScore(date);
        const isSelected = date === selected;
        return (
          <li key={date} className="week-strip__day">
            <button
              type="button"
              className={`week-strip__button week-strip__button--${isFuture ? 'future' : toneFor(score)}${isSelected ? ' week-strip__button--selected' : ''}${date === today ? ' week-strip__button--today' : ''}`}
              aria-pressed={isSelected}
              aria-label={`${WEEKDAYS_SHORT[parseISO(date).getDay()]} ${parseISO(date).getDate()}${isFuture ? '' : `, puntuación ${score}`}`}
              onClick={() => onSelect(date)}
            >
              <span className="week-strip__name" aria-hidden="true">{WEEKDAYS_SHORT[parseISO(date).getDay()]}</span>
              <span className="week-strip__circle" aria-hidden="true">{parseISO(date).getDate()}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
