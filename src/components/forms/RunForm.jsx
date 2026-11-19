/* Registrar una carrera: distancia, tiempo (ritmo automatico), tipo y sensaciones */
import { useState } from 'react';
import { useData } from '../../session/DataContext.jsx';
import { useUi } from '../../ui/UiContext.jsx';
import { formatPace, todayISO } from '../../lib/dates.js';

const TYPES = [['rodaje', 'Rodaje'], ['series', 'Series'], ['fondo', 'Fondo'], ['tempo', 'Tempo'], ['carrera', 'Competición']];
const FEELINGS = ['😫', '😕', '🙂', '😃', '🔥'];

export default function RunForm({ run = {}, onDone }) {
  const { save, remove } = useData();
  const { showToast, confirm } = useUi();
  const [draft, setDraft] = useState({ date: todayISO(), km: '', minutes: '', type: 'rodaje', feel: 3, notes: '', ...run });
  const changeHandler = (field) => (event) => setDraft({ ...draft, [field]: event.target.value });
  const pace = Number(draft.km) > 0 && Number(draft.minutes) > 0 ? Number(draft.minutes) / Number(draft.km) : 0;

  const submitHandler = async (event) => {
    event.preventDefault();
    await save('runs', { ...draft, km: Number(draft.km), minutes: Number(draft.minutes), feel: Number(draft.feel) });
    showToast(`Carrera guardada: ${draft.km} km 🏃`);
    onDone();
  };

  const deleteHandler = async () => {
    if (!(await confirm('Se borrará esta carrera.'))) return;
    await remove('runs', run.id);
    onDone();
  };

  return (
    <form className="form" onSubmit={submitHandler}>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="run-km">Distancia (km)</label>
          <input id="run-km" type="number" inputMode="decimal" step="0.01" min="0.1" className="field__input" value={draft.km} onChange={changeHandler('km')} required />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="run-minutes">Tiempo (min)</label>
          <input id="run-minutes" type="number" inputMode="decimal" step="0.1" min="1" className="field__input" value={draft.minutes} onChange={changeHandler('minutes')} required />
        </div>
      </div>
      <p className="form__hint">Ritmo: <strong>{formatPace(pace)} /km</strong></p>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="run-date">Fecha</label>
          <input id="run-date" type="date" className="field__input" value={draft.date} onChange={changeHandler('date')} required />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="run-type">Tipo</label>
          <select id="run-type" className="field__input" value={draft.type} onChange={changeHandler('type')}>
            {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>
      <fieldset className="field field--chips">
        <legend className="field__label">Sensaciones</legend>
        <div className="chip-group">
          {FEELINGS.map((emoji, index) => (
            <label key={emoji} className={`chip chip--emoji${Number(draft.feel) === index + 1 ? ' chip--active' : ''}`}>
              <input type="radio" name="feel" className="visually-hidden" value={index + 1} checked={Number(draft.feel) === index + 1} onChange={changeHandler('feel')} />
              <span aria-hidden="true">{emoji}</span><span className="visually-hidden">{index + 1} de 5</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label className="field__label" htmlFor="run-notes">Notas</label>
        <input id="run-notes" className="field__input" value={draft.notes} onChange={changeHandler('notes')} placeholder="Ruta, clima, pulsaciones…" />
      </div>
      <div className="form__actions">
        {run.id && <button type="button" className="button button--ghost button--danger-text" onClick={deleteHandler}>Borrar</button>}
        <button type="submit" className="button button--primary">Guardar carrera</button>
      </div>
    </form>
  );
}
