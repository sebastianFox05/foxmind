/* Rutinas de gym (ejercicios, series, reps y peso), running (plan y km) y lectura (minutos), con sus dias */
import { useState } from 'react';
import { useData } from '../../session/DataContext.jsx';
import { useUi } from '../../ui/UiContext.jsx';
import { WEEK_ORDER, WEEKDAYS_SHORT } from '../../lib/dates.js';
import Icon from '../Icon.jsx';

export default function RoutineForm({ routine = {}, kind = 'gym', onDone }) {
  const { save, remove } = useData();
  const { showToast, confirm } = useUi();
  const [draft, setDraft] = useState({ kind, name: '', days: [], exercises: [{ name: '', sets: 3, reps: 10, weight: '' }], plan: '', km: '', minutes: 20, ...routine });

  const toggleDayHandler = (day) => setDraft({ ...draft, days: draft.days.includes(day) ? draft.days.filter((item) => item !== day) : [...draft.days, day] });
  const updateExerciseHandler = (index, field, value) => setDraft({ ...draft, exercises: draft.exercises.map((item, position) => (position === index ? { ...item, [field]: value } : item)) });

  const submitHandler = async (event) => {
    event.preventDefault();
    const exercises = draft.kind === 'gym'
      ? draft.exercises.filter((item) => item.name.trim()).map((item) => ({ name: item.name.trim(), sets: Number(item.sets) || 3, reps: Number(item.reps) || 10, weight: Number(item.weight) || 0 }))
      : [];
    await save('routines', { ...draft, exercises, km: Number(draft.km) || 0, minutes: Number(draft.minutes) || 0 });
    showToast('Rutina guardada');
    onDone();
  };

  const deleteHandler = async () => {
    if (!(await confirm(`Se borrará la rutina «${routine.name}».`))) return;
    await remove('routines', routine.id);
    onDone();
  };

  return (
    <form className="form" onSubmit={submitHandler}>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="routine-name">Nombre</label>
          <input id="routine-name" className="field__input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Push · pecho y hombro" required />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="routine-kind">Tipo</label>
          <select id="routine-kind" className="field__input" value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value })}>
            <option value="gym">Gym</option>
            <option value="running">Running</option>
            <option value="lectura">Lectura</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="routine-time">Hora (para la cartelera de Hoy)</label>
        <input id="routine-time" type="time" className="field__input" value={draft.time || ''} onChange={(event) => setDraft({ ...draft, time: event.target.value })} />
      </div>
      <fieldset className="field field--chips">
        <legend className="field__label">Días</legend>
        <div className="chip-group">
          {WEEK_ORDER.map((day) => (
            <label key={day} className={`chip${draft.days.includes(day) ? ' chip--active' : ''}`}>
              <input type="checkbox" className="visually-hidden" checked={draft.days.includes(day)} onChange={() => toggleDayHandler(day)} />
              {WEEKDAYS_SHORT[day]}
            </label>
          ))}
        </div>
      </fieldset>
      {draft.kind === 'gym' && (
        <div className="field">
          <span className="field__label">Ejercicios</span>
          <ul className="routine-exercises">
            {draft.exercises.map((exercise, index) => (
              <li key={index} className="routine-exercises__row">
                <label className="visually-hidden" htmlFor={`routine-ex-${index}`}>Ejercicio {index + 1}</label>
                <input id={`routine-ex-${index}`} className="field__input" value={exercise.name} placeholder="Ejercicio" onChange={(event) => updateExerciseHandler(index, 'name', event.target.value)} />
                <label className="routine-exercises__num"><span className="visually-hidden">Series</span><input type="number" min="1" value={exercise.sets} onChange={(event) => updateExerciseHandler(index, 'sets', event.target.value)} /><span aria-hidden="true">×</span></label>
                <label className="routine-exercises__num"><span className="visually-hidden">Repeticiones</span><input type="number" min="1" value={exercise.reps} onChange={(event) => updateExerciseHandler(index, 'reps', event.target.value)} /><span aria-hidden="true">reps</span></label>
                <label className="routine-exercises__num"><span className="visually-hidden">Peso</span><input type="number" min="0" step="0.5" value={exercise.weight} onChange={(event) => updateExerciseHandler(index, 'weight', event.target.value)} /><span aria-hidden="true">kg</span></label>
                <button type="button" className="icon-button icon-button--small icon-button--bare" aria-label={`Quitar ${exercise.name || 'ejercicio'}`} onClick={() => setDraft({ ...draft, exercises: draft.exercises.filter((_, position) => position !== index) })}><Icon name="x" /></button>
              </li>
            ))}
          </ul>
          <button type="button" className="button button--ghost button--small" onClick={() => setDraft({ ...draft, exercises: [...draft.exercises, { name: '', sets: 3, reps: 10, weight: '' }] })}>+ Ejercicio</button>
        </div>
      )}
      {draft.kind === 'running' && (
        <div className="field">
          <label className="field__label" htmlFor="routine-km">Distancia objetivo (km)</label>
          <input id="routine-km" type="number" min="0" step="0.1" className="field__input" value={draft.km} onChange={(event) => setDraft({ ...draft, km: event.target.value })} />
        </div>
      )}
      {draft.kind === 'lectura' && (
        <div className="field">
          <label className="field__label" htmlFor="routine-minutes">Minutos al día</label>
          <input id="routine-minutes" type="number" min="1" className="field__input" value={draft.minutes} onChange={(event) => setDraft({ ...draft, minutes: event.target.value })} />
        </div>
      )}
      {draft.kind !== 'gym' && (
        <div className="field">
          <label className="field__label" htmlFor="routine-plan">Plan</label>
          <textarea id="routine-plan" rows="2" className="field__input field__input--area" value={draft.plan} onChange={(event) => setDraft({ ...draft, plan: event.target.value })} placeholder="6×800 m a ritmo 10K…" />
        </div>
      )}
      <div className="form__actions">
        {routine.id && <button type="button" className="button button--ghost button--danger-text" onClick={deleteHandler}>Borrar</button>}
        <button type="submit" className="button button--primary">Guardar rutina</button>
      </div>
    </form>
  );
}
