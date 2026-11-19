/*
 * Guia de un ejercicio: las fotos de inicio y final se alternan como una animacion (se puede pausar),
 * musculos, material, nivel, pasos numerados, consejo y "Añadir a una rutina".
 */
import { useEffect, useState } from 'react';
import { useData } from '../session/DataContext.jsx';
import { useUi } from '../ui/UiContext.jsx';
import Icon from './Icon.jsx';

const FRAME_MS = 1100;

export default function ExerciseGuide({ exercise, onClose }) {
  const { db, save } = useData();
  const { showToast } = useUi();
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(() => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const gymRoutines = db.routines.filter((routine) => routine.kind === 'gym');
  const [routineId, setRoutineId] = useState(gymRoutines[0]?.id || '');

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = setInterval(() => setFrame((value) => (value + 1) % exercise.images.length), FRAME_MS);
    return () => clearInterval(timer);
  }, [isPlaying, exercise.images.length]);

  const addHandler = async () => {
    const routine = gymRoutines.find((item) => item.id === routineId);
    if (!routine) return;
    if (routine.exercises.some((item) => item.name.toLowerCase() === exercise.name.toLowerCase())) {
      showToast(`«${exercise.name}» ya está en ${routine.name}`);
      return;
    }
    await save('routines', { ...routine, exercises: [...routine.exercises, { name: exercise.name, sets: 3, reps: 10, weight: 0 }] });
    showToast(`Añadido a ${routine.name} ✓`, 'success');
  };

  return (
    <article className="fit-detail exercise-guide">
      <header className="fit-detail__bar">
        <button type="button" className="fit-icon-button" aria-label="Volver" data-autofocus onClick={() => onClose(false)}><Icon name="arrow-left" /></button>
        <h3 className="fit-detail__title">{exercise.name}</h3>
        <span className="fit-icon-button fit-icon-button--ghost" aria-hidden="true" />
      </header>

      <figure className="exercise-guide__media">
        {exercise.images.map((src, index) => (
          <img key={src} className={`exercise-guide__img${index === frame ? ' exercise-guide__img--visible' : ''}`} src={src} alt={index === 0 ? `${exercise.name}: posición inicial` : `${exercise.name}: posición final`} width="850" height="567" loading="eager" />
        ))}
        <figcaption className="exercise-guide__caption">{frame === 0 ? 'Inicio' : 'Final'}</figcaption>
        <button type="button" className="fit-detail__play" aria-label={isPlaying ? 'Pausar la animación' : 'Reproducir la animación'} onClick={() => setIsPlaying(!isPlaying)}>
          <Icon name={isPlaying ? 'pause' : 'play'} />
        </button>
      </figure>

      <dl className="fit-detail__stats">
        <div><dt>Músculos</dt><dd>{exercise.muscles}</dd></div>
        <div><dt>Material</dt><dd>{exercise.equipment}</dd></div>
        <div><dt>Nivel</dt><dd>{exercise.level}</dd></div>
      </dl>

      <section aria-labelledby="guide-steps">
        <h4 className="fit-detail__subtitle" id="guide-steps">Cómo se hace</h4>
        <ol className="guide-steps">
          {exercise.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </section>
      <p className="guide-tip"><Icon name="bulb" /> {exercise.tip}</p>

      {gymRoutines.length > 0 && (
        <div className="guide-add">
          <label className="visually-hidden" htmlFor="guide-routine">Rutina</label>
          <select id="guide-routine" className="field__input" value={routineId} onChange={(event) => setRoutineId(event.target.value)}>
            {gymRoutines.map((routine) => <option key={routine.id} value={routine.id}>{routine.name}</option>)}
          </select>
          <button type="button" className="fit-button" onClick={addHandler}>Añadir</button>
        </div>
      )}
      <p className="guide-credit">Fotos: free-exercise-db (dominio público).</p>
    </article>
  );
}
