/*
 * Ficha de un entreno (referencia fitness, pantalla "Full Body Strength"): volver + titulo, foto grande con
 * boton de play, duracion / calorias / nivel estimados, lista de ejercicios y boton "Empezar entreno".
 */
import { useState } from 'react';
import Icon from './Icon.jsx';
import Photo from './Photo.jsx';
import ExerciseGuide from './ExerciseGuide.jsx';
import { findExercise } from '../lib/exercises.js';
import { HERO_PHOTOS } from '../lib/photos.js';
import { exerciseRecords, routineEstimate } from '../lib/stats.js';
import { formatNumber } from '../lib/utils.js';
import { WEEKDAYS_SHORT } from '../lib/dates.js';
import { useData } from '../session/DataContext.jsx';

export default function WorkoutDetail({ routine, onStart, onEdit, onClose }) {
  const { db } = useData();
  const [guide, setGuide] = useState(null);
  const estimate = routineEstimate(routine);
  const isGym = routine.kind === 'gym';
  const records = isGym ? exerciseRecords(db) : [];
  const rows = isGym
    ? routine.exercises.map((exercise) => {
      const best = records.find((record) => record.name.toLowerCase() === exercise.name.toLowerCase());
      return { name: exercise.name, detail: `${exercise.sets} series × ${exercise.reps} reps${best ? ` · récord ${formatNumber(best.weight)} kg` : ''}`, icon: 'dumbbell', guide: findExercise(exercise.name) };
    })
    : [
      { name: `${formatNumber(routine.km)} km`, detail: 'Distancia objetivo', icon: 'run' },
      { name: routine.time || 'Hora libre', detail: `Días: ${(routine.days || []).map((day) => WEEKDAYS_SHORT[day]).join(', ') || 'sin días'}`, icon: 'clock' },
      { name: 'Calentamiento', detail: '10 min de trote suave y movilidad', icon: 'flame' }
    ];

  /* La guia de un ejercicio se abre dentro de la misma ficha: "volver" regresa a la rutina */
  if (guide) return <ExerciseGuide exercise={guide} onClose={() => setGuide(null)} />;

  return (
    <article className="fit-detail">
      <header className="fit-detail__bar">
        <button type="button" className="fit-icon-button" aria-label="Volver" data-autofocus onClick={() => onClose(false)}><Icon name="arrow-left" /></button>
        <h3 className="fit-detail__title">{routine.name}</h3>
        <button type="button" className="fit-icon-button" aria-label={`Editar ${routine.name}`} onClick={() => onEdit(routine)}><Icon name="edit" /></button>
      </header>

      <figure className="fit-detail__media">
        <Photo photo={isGym ? HERO_PHOTOS.gym : HERO_PHOTOS.running} className="fit-detail__photo" isEager />
        <button type="button" className="fit-detail__play" aria-label={`Empezar ${routine.name}`} onClick={() => onStart(routine)}><Icon name="play" /></button>
      </figure>

      <dl className="fit-detail__stats">
        <div><dt>Duración</dt><dd>{estimate.minutes} min</dd></div>
        <div><dt>Calorías</dt><dd>{formatNumber(estimate.kcal, 0)} kcal</dd></div>
        <div><dt>Nivel</dt><dd>{estimate.level}</dd></div>
      </dl>
      {routine.plan && <p className="fit-detail__plan">{routine.plan}</p>}

      <section aria-labelledby="fit-exercises">
        <h4 className="fit-detail__subtitle" id="fit-exercises">{isGym ? 'Ejercicios' : 'Plan'}</h4>
        <ul className="fit-list">
          {rows.map((row) => (
            <li key={row.name}>
              {row.guide ? (
                <button type="button" className="fit-list__row fit-list__row--button" onClick={() => setGuide(row.guide)} aria-label={`${row.name}, ${row.detail}. Ver cómo se hace`}>
                  <img className="fit-list__photo" src={row.guide.images[0]} alt="" width="850" height="567" loading="lazy" />
                  <span className="fit-list__text"><strong>{row.name}</strong><span>{row.detail}</span></span>
                  <Icon name="chevron-right" className="fit-list__arrow" />
                </button>
              ) : (
                <div className="fit-list__row">
                  <span className={`fit-list__thumb fit-list__thumb--${routine.kind}`}><Icon name={row.icon} /></span>
                  <span className="fit-list__text"><strong>{row.name}</strong><span>{row.detail}</span></span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <button type="button" className="fit-button fit-button--block" onClick={() => onStart(routine)}>Empezar entreno</button>
    </article>
  );
}
