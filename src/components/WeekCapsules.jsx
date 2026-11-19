/*
 * Semana en capsulas altas (referencia "Daily challenge": Sun 22 · Mon 23 …):
 * nombre arriba, numero abajo, punto si ese dia tiene actividad y la capsula elegida en negro.
 */
import { WEEKDAYS_SHORT, parseISO, todayISO, weekDays } from '../lib/dates.js';

export default function WeekCapsules({ selected, onSelect, hasActivity, label = 'Elegir día' }) {
  const today = todayISO();
  return (
    <div className="capsules" role="group" aria-label={label}>
      {weekDays(selected).map((date) => {
        const day = parseISO(date);
        const isSelected = date === selected;
        return (
          <button
            key={date}
            type="button"
            className={`capsule${isSelected ? ' capsule--selected' : ''}${date === today ? ' capsule--today' : ''}`}
            aria-pressed={isSelected}
            aria-label={`${WEEKDAYS_SHORT[day.getDay()]} ${day.getDate()}${hasActivity(date) ? ', con actividad' : ''}`}
            onClick={() => onSelect(date)}
          >
            <span className={`capsule__dot${hasActivity(date) ? ' capsule__dot--on' : ''}`} aria-hidden="true" />
            <span className="capsule__name" aria-hidden="true">{WEEKDAYS_SHORT[day.getDay()]}</span>
            <span className="capsule__number" aria-hidden="true">{day.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}
