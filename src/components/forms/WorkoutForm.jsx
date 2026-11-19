/*
 * Registrar una sesion de gym. Al elegir una rutina se cargan sus ejercicios con el ultimo peso usado
 * (sobrecarga progresiva: la app recuerda lo que levantaste la vez anterior).
 */
import { useState } from 'react';
import { useData } from '../../session/DataContext.jsx';
import { useUi } from '../../ui/UiContext.jsx';
import { todayISO, weekday } from '../../lib/dates.js';
import { exerciseRecords } from '../../lib/stats.js';
import { formatNumber } from '../../lib/utils.js';
import Icon from '../Icon.jsx';

function lastWeight(db, name) {
  const sessions = [...db.workouts].sort((a, b) => b.date.localeCompare(a.date));
  for (const session of sessions) {
    const exercise = (session.exercises || []).find((item) => item.name.toLowerCase() === name.toLowerCase());
    if (exercise?.sets?.length) return exercise.sets[0].weight;
  }
  return '';
}

function exercisesFromRoutine(db, routine) {
  return (routine?.exercises || []).map((exercise) => ({
    name: exercise.name,
    sets: Array.from({ length: Number(exercise.sets) || 3 }, () => ({ reps: exercise.reps, weight: lastWeight(db, exercise.name) || exercise.weight || '' }))
  }));
}

export default function WorkoutForm({ workout = {}, preset = {}, onDone }) {
  const { db, save, remove } = useData();
  const { showToast, confirm } = useUi();
  const gymRoutines = db.routines.filter((routine) => routine.kind === 'gym');
  const todayRoutine = gymRoutines.find((routine) => routine.days?.includes(weekday(todayISO())));
  const initialRoutine = workout.routineId ? gymRoutines.find((routine) => routine.id === workout.routineId) : (gymRoutines.find((routine) => preset.name && routine.name.toLowerCase().includes(preset.name.toLowerCase())) || todayRoutine);
  const [draft, setDraft] = useState(() => ({
    date: todayISO(), minutes: 60, rpe: 8, notes: '',
    routineId: initialRoutine?.id || '', name: initialRoutine?.name || 'Sesión libre',
    exercises: exercisesFromRoutine(db, initialRoutine),
    ...workout
  }));
  const records = exerciseRecords(db);

  const routineHandler = (event) => {
    const routine = gymRoutines.find((item) => item.id === event.target.value);
    setDraft({ ...draft, routineId: routine?.id || '', name: routine?.name || 'Sesión libre', exercises: exercisesFromRoutine(db, routine) });
  };

  const updateSetHandler = (exerciseIndex, setIndex, field, value) => {
    setDraft({
      ...draft,
      exercises: draft.exercises.map((exercise, index) => (index !== exerciseIndex ? exercise : {
        ...exercise,
        sets: exercise.sets.map((set, position) => (position === setIndex ? { ...set, [field]: value } : set))
      }))
    });
  };

  const addSetHandler = (exerciseIndex) => setDraft({
    ...draft,
    exercises: draft.exercises.map((exercise, index) => (index === exerciseIndex ? { ...exercise, sets: [...exercise.sets, { ...(exercise.sets.at(-1) || { reps: 10, weight: '' }) }] } : exercise))
  });

  const addExerciseHandler = () => setDraft({ ...draft, exercises: [...draft.exercises, { name: '', sets: [{ reps: 10, weight: '' }] }] });

  const submitHandler = async (event) => {
    event.preventDefault();
    const exercises = draft.exercises.filter((exercise) => exercise.name.trim()).map((exercise) => ({
      name: exercise.name.trim(),
      sets: exercise.sets.filter((set) => Number(set.reps) > 0).map((set) => ({ reps: Number(set.reps), weight: Number(set.weight) || 0 }))
    }));
    const newRecords = exercises.filter((exercise) => {
      const best = records.find((record) => record.name.toLowerCase() === exercise.name.toLowerCase());
      const top = Math.max(0, ...exercise.sets.map((set) => set.weight));
      return top > 0 && (!best || top > best.weight);
    });
    await save('workouts', { ...draft, minutes: Number(draft.minutes), rpe: Number(draft.rpe), exercises });
    showToast(newRecords.length ? `¡Nuevo récord en ${newRecords.map((item) => item.name).join(', ')}! 🏆` : 'Sesión guardada 💪', newRecords.length ? 'success' : 'default');
    onDone();
  };

  const deleteHandler = async () => {
    if (!(await confirm('Se borrará esta sesión.'))) return;
    await remove('workouts', workout.id);
    onDone();
  };

  return (
    <form className="form" onSubmit={submitHandler}>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="workout-routine">Rutina</label>
          <select id="workout-routine" className="field__input" value={draft.routineId} onChange={routineHandler}>
            <option value="">Sesión libre</option>
            {gymRoutines.map((routine) => <option key={routine.id} value={routine.id}>{routine.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="workout-date">Fecha</label>
          <input id="workout-date" type="date" className="field__input" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} required />
        </div>
      </div>
      <div className="exercise-list">
        {draft.exercises.map((exercise, exerciseIndex) => {
          const best = records.find((record) => record.name.toLowerCase() === exercise.name.toLowerCase());
          return (
            <fieldset key={exerciseIndex} className="exercise">
              <legend className="visually-hidden">Ejercicio {exerciseIndex + 1}</legend>
              <div className="exercise__head">
                <label className="visually-hidden" htmlFor={`exercise-${exerciseIndex}`}>Nombre del ejercicio</label>
                <input id={`exercise-${exerciseIndex}`} className="exercise__name" value={exercise.name} placeholder="Ejercicio" onChange={(event) => setDraft({ ...draft, exercises: draft.exercises.map((item, index) => (index === exerciseIndex ? { ...item, name: event.target.value } : item)) })} />
                {best && <span className="exercise__best">Récord {formatNumber(best.weight)} kg</span>}
                <button type="button" className="icon-button icon-button--small icon-button--bare" aria-label={`Quitar ${exercise.name || 'ejercicio'}`} onClick={() => setDraft({ ...draft, exercises: draft.exercises.filter((_, index) => index !== exerciseIndex) })}>
                  <Icon name="x" />
                </button>
              </div>
              <ol className="exercise__sets">
                {exercise.sets.map((set, setIndex) => (
                  <li key={setIndex} className="exercise__set">
                    <span className="exercise__set-number" aria-hidden="true">{setIndex + 1}</span>
                    <label className="exercise__field">
                      <span className="visually-hidden">Serie {setIndex + 1}: repeticiones</span>
                      <input type="number" inputMode="numeric" min="0" value={set.reps} onChange={(event) => updateSetHandler(exerciseIndex, setIndex, 'reps', event.target.value)} />
                      <span aria-hidden="true">reps</span>
                    </label>
                    <label className="exercise__field">
                      <span className="visually-hidden">Serie {setIndex + 1}: peso</span>
                      <input type="number" inputMode="decimal" min="0" step="0.5" value={set.weight} onChange={(event) => updateSetHandler(exerciseIndex, setIndex, 'weight', event.target.value)} />
                      <span aria-hidden="true">kg</span>
                    </label>
                  </li>
                ))}
              </ol>
              <button type="button" className="button button--small button--ghost" onClick={() => addSetHandler(exerciseIndex)}>+ Serie</button>
            </fieldset>
          );
        })}
      </div>
      <button type="button" className="button button--ghost" onClick={addExerciseHandler}><Icon name="plus" /> Añadir ejercicio</button>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="workout-minutes">Duración (min)</label>
          <input id="workout-minutes" type="number" min="1" className="field__input" value={draft.minutes} onChange={(event) => setDraft({ ...draft, minutes: event.target.value })} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="workout-rpe">Esfuerzo (RPE 1-10)</label>
          <input id="workout-rpe" type="number" min="1" max="10" className="field__input" value={draft.rpe} onChange={(event) => setDraft({ ...draft, rpe: event.target.value })} />
        </div>
      </div>
      <div className="form__actions">
        {workout.id && <button type="button" className="button button--ghost button--danger-text" onClick={deleteHandler}>Borrar</button>}
        <button type="submit" className="button button--primary">Guardar sesión</button>
      </div>
    </form>
  );
}
