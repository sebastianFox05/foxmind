/*
 * Entreno de hoy en Hoy (referencia "Good Day, John!"): tarjeta naranja "Plan de entreno" con la lista del dia,
 * tarjeta verde lima "Cardio de hoy" con foto y boton "Empezar ▶", y tarjeta blanca de progreso semanal con anillo.
 */
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import Photo from './Photo.jsx';
import { Ring } from './Charts.jsx';
import { HERO_PHOTOS } from '../lib/photos.js';
import { isRoutineDone } from '../lib/posters.js';
import { routinesForDay } from '../lib/stats.js';
import { weekRange, todayISO } from '../lib/dates.js';
import { formatNumber } from '../lib/utils.js';

export default function TrainingToday({ db, settings, date, onCardio }) {
  const routines = routinesForDay(db, date).filter((routine) => routine.kind !== 'lectura');
  const running = routines.find((routine) => routine.kind === 'running') || db.routines.find((routine) => routine.kind === 'running');
  const week = weekRange(todayISO());
  const done = db.workouts.filter((item) => item.date >= week.start && item.date <= week.end).length;
  const goal = Number(settings.weeklyGymGoal) || 4;

  return (
    <div className="today-training">
      <div className="today-training__row">
        <section className="plan-list-card" aria-labelledby="plan-list-title">
          <header className="plan-list-card__head">
            <h3 className="plan-list-card__title" id="plan-list-title">Plan de<br />entreno</h3>
            <Link to="/entreno" className="plan-list-card__edit" aria-label="Abrir entreno"><Icon name="edit" /></Link>
          </header>
          <ul className="plan-list-card__list">
            {routines.length ? routines.map((routine) => {
              const isDone = isRoutineDone(db, settings, routine, date);
              return (
                <li key={routine.id} className={`plan-list-card__item${isDone ? ' plan-list-card__item--done' : ''}`}>
                  <span className="plan-list-card__check" aria-hidden="true">{isDone && <Icon name="check" />}</span>
                  <span><strong>{routine.name}</strong><small>{routine.time || 'sin hora'}</small></span>
                  <span className="visually-hidden">{isDone ? 'hecho' : 'pendiente'}</span>
                </li>
              );
            }) : <li className="plan-list-card__rest">Hoy toca descanso</li>}
          </ul>
        </section>

        <section className="cardio-card" aria-labelledby="cardio-title">
          <h3 className="cardio-card__title" id="cardio-title">Tu cardio<br />de hoy</h3>
          <Photo photo={HERO_PHOTOS.running} className="cardio-card__photo" isDecorative />
          <button type="button" className="cardio-card__start" onClick={() => onCardio(running)}>
            Empezar <span className="cardio-card__play"><Icon name="play" /></span>
          </button>
        </section>
      </div>

      <section className="week-progress-card" aria-labelledby="week-progress-title">
        <span className="week-progress-card__icon"><Icon name="dumbbell" /></span>
        <span className="week-progress-card__text">
          <h3 className="week-progress-card__title" id="week-progress-title">Gym de la semana</h3>
          <span>{done} de {goal} completadas{running ? ` · ${formatNumber(running.km)} km de cardio` : ''}</span>
        </span>
        <Ring value={done / goal} size={58} stroke={6} label={`${Math.round((done / goal) * 100)} %`}>
          <strong className="week-progress-card__pct">{Math.min(100, Math.round((done / goal) * 100))}%</strong>
        </Ring>
      </section>
    </div>
  );
}
