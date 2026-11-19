/*
 * "Tu plan" (referencia "Your plan"): las proximas sesiones programadas en tarjetas de color con intensidad,
 * fecha, hora y tipo, mas una tarjetita rosa con accesos rapidos (paleta, diario y tablero).
 */
import Icon from './Icon.jsx';
import { addDays, formatDay, todayISO } from '../lib/dates.js';
import { routineEstimate, routinesForDay } from '../lib/stats.js';
import { formatNumber } from '../lib/utils.js';

const KIND_LABEL = { gym: 'Gym', running: 'Running', lectura: 'Lectura' };
const TONES = ['orange', 'sky'];

function intensity(routine) {
  if (routine.kind === 'lectura') return 'Ligera';
  if (routine.kind === 'running') return routine.name.toLowerCase().includes('serie') ? 'Alta' : 'Media';
  return 'Media';
}

function endTime(start, minutes) {
  if (!start) return '';
  const [hours, mins] = start.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function upcomingSessions(db, from = todayISO(), limit = 2) {
  const list = [];
  for (let offset = 1; offset <= 7 && list.length < limit; offset += 1) {
    const date = addDays(from, offset);
    routinesForDay(db, date).filter((routine) => routine.kind !== 'lectura').sort((a, b) => (a.time || '').localeCompare(b.time || ''))
      .forEach((routine) => { if (list.length < limit) list.push({ date, routine }); });
  }
  return list;
}

export default function PlanGrid({ sessions, onOpen, onPalette, onJournal, onBoard }) {
  return (
    <div className="plan-grid">
      {sessions.map(({ date, routine }, index) => {
        const minutes = routine.kind === 'lectura' ? Number(routine.minutes) || 20 : routineEstimate(routine).minutes;
        return (
          <button key={`${date}-${routine.id}`} type="button" className={`plan-card plan-card--${TONES[index % TONES.length]}${index === 0 ? ' plan-card--tall' : ''}`} onClick={() => onOpen(routine)}>
            <span className="plan-card__chip">{intensity(routine)}</span>
            <span className="plan-card__title">{routine.name}</span>
            <span className="plan-card__line">{formatDay(date)}</span>
            {routine.time && <span className="plan-card__line">{routine.time}–{endTime(routine.time, minutes)}</span>}
            <span className="plan-card__line">{routine.kind === 'running' ? `${formatNumber(routine.km)} km` : `${routine.exercises.length} ejercicios`}</span>
            {index === 0 && (
              <span className="plan-card__coach">
                <span className="plan-card__avatar"><Icon name={routine.kind === 'running' ? 'run' : 'dumbbell'} /></span>
                <span><small>Rutina</small><br />{KIND_LABEL[routine.kind]}</span>
              </span>
            )}
            {index === 1 && <span className="plan-card__blob" aria-hidden="true" />}
          </button>
        );
      })}
      <div className="plan-card plan-card--pink" role="group" aria-label="Accesos rápidos">
        <button type="button" className="plan-card__icon" aria-label="Captura rápida" onClick={onPalette}><Icon name="sparkle" /></button>
        <button type="button" className="plan-card__icon" aria-label="Diario de hoy" onClick={onJournal}><Icon name="note" /></button>
        <button type="button" className="plan-card__icon" aria-label="Cargar el tablero" onClick={onBoard}><Icon name="board" /></button>
      </div>
      {!sessions.length && <p className="empty">Sin sesiones en los próximos 7 días.</p>}
    </div>
  );
}
