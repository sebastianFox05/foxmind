/*
 * Crear o editar un reto. El periodo (mes, trimestre, año o fechas propias) fija el rango y la metrica
 * decide de donde sale el progreso automaticamente (carreras, gym, lectura, tareas, foco, habitos…).
 */
import { useState } from 'react';
import { useData } from '../../session/DataContext.jsx';
import { useUi } from '../../ui/UiContext.jsx';
import { MONTHS, monthRange, quarterRange, yearRange, todayISO, parseISO, quarterOf, capitalize } from '../../lib/dates.js';
import { METRICS } from '../../lib/stats.js';

function rangeFor(draft) {
  const year = Number(draft.year);
  if (draft.period === 'mes') return monthRange(year, Number(draft.month));
  if (draft.period === 'trimestre') return quarterRange(year, Number(draft.quarter));
  if (draft.period === 'año') return yearRange(year);
  return { start: draft.start, end: draft.end };
}

export default function ChallengeForm({ challenge = {}, preset = {}, onDone }) {
  const { db, save, remove } = useData();
  const { showToast, confirm } = useUi();
  const today = todayISO();
  const base = challenge.start ? parseISO(challenge.start) : parseISO(preset.start || today);
  const [draft, setDraft] = useState({
    title: '', period: 'mes', metric: 'run_km', target: '', unit: '', habitId: db.habits[0]?.id || '', exercise: 'Press banca', manual: 0, notes: '',
    year: base.getFullYear(), month: base.getMonth(), quarter: quarterOf(challenge.start || preset.start || today), start: today, end: today,
    ...preset, ...challenge
  });
  const changeHandler = (field) => (event) => setDraft({ ...draft, [field]: event.target.value });
  const metric = METRICS[draft.metric];
  const years = [base.getFullYear() - 1, base.getFullYear(), base.getFullYear() + 1, base.getFullYear() + 2];

  const submitHandler = async (event) => {
    event.preventDefault();
    const range = rangeFor(draft);
    if (!range.start || !range.end || range.end < range.start) {
      showToast('Revisa las fechas del reto', 'danger');
      return;
    }
    const { year, month, quarter, ...rest } = draft;
    await save('challenges', { ...rest, ...range, target: Number(draft.target), manual: Number(draft.manual) || 0, unit: draft.unit || metric.unit });
    showToast(challenge.id ? 'Reto actualizado' : 'Reto creado 🏁');
    onDone();
  };

  const deleteHandler = async () => {
    if (!(await confirm(`Se borrará el reto «${challenge.title}».`))) return;
    await remove('challenges', challenge.id);
    onDone();
  };

  return (
    <form className="form" onSubmit={submitHandler}>
      <div className="field">
        <label className="field__label" htmlFor="challenge-title">Reto</label>
        <input id="challenge-title" className="field__input" value={draft.title} onChange={changeHandler('title')} placeholder="Correr 80 km en noviembre" required />
      </div>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="challenge-period">Periodo</label>
          <select id="challenge-period" className="field__input" value={draft.period} onChange={changeHandler('period')}>
            <option value="mes">Mes</option>
            <option value="trimestre">Trimestre</option>
            <option value="año">Año</option>
            <option value="personalizado">Fechas propias</option>
          </select>
        </div>
        {draft.period !== 'personalizado' && (
          <div className="field">
            <label className="field__label" htmlFor="challenge-year">Año</label>
            <select id="challenge-year" className="field__input" value={draft.year} onChange={changeHandler('year')}>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        )}
      </div>
      {draft.period === 'mes' && (
        <div className="field">
          <label className="field__label" htmlFor="challenge-month">Mes</label>
          <select id="challenge-month" className="field__input" value={draft.month} onChange={changeHandler('month')}>
            {MONTHS.map((name, index) => <option key={name} value={index}>{capitalize(name)}</option>)}
          </select>
        </div>
      )}
      {draft.period === 'trimestre' && (
        <div className="field">
          <label className="field__label" htmlFor="challenge-quarter">Trimestre</label>
          <select id="challenge-quarter" className="field__input" value={draft.quarter} onChange={changeHandler('quarter')}>
            {[1, 2, 3, 4].map((quarter) => <option key={quarter} value={quarter}>Q{quarter} · {MONTHS[(quarter - 1) * 3].slice(0, 3)}–{MONTHS[(quarter - 1) * 3 + 2].slice(0, 3)}</option>)}
          </select>
        </div>
      )}
      {draft.period === 'personalizado' && (
        <div className="form__row">
          <div className="field">
            <label className="field__label" htmlFor="challenge-start">Desde</label>
            <input id="challenge-start" type="date" className="field__input" value={draft.start} onChange={changeHandler('start')} required />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="challenge-end">Hasta</label>
            <input id="challenge-end" type="date" className="field__input" value={draft.end} onChange={changeHandler('end')} required />
          </div>
        </div>
      )}
      <div className="field">
        <label className="field__label" htmlFor="challenge-metric">¿Cómo se mide? (automático)</label>
        <select id="challenge-metric" className="field__input" value={draft.metric} onChange={changeHandler('metric')}>
          {Object.entries(METRICS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
        </select>
      </div>
      {draft.metric === 'habit_days' && (
        <div className="field">
          <label className="field__label" htmlFor="challenge-habit">Hábito</label>
          <select id="challenge-habit" className="field__input" value={draft.habitId} onChange={changeHandler('habitId')}>
            {db.habits.map((habit) => <option key={habit.id} value={habit.id}>{habit.name}</option>)}
          </select>
        </div>
      )}
      {draft.metric === 'exercise_weight' && (
        <div className="field">
          <label className="field__label" htmlFor="challenge-exercise">Ejercicio</label>
          <input id="challenge-exercise" className="field__input" value={draft.exercise} onChange={changeHandler('exercise')} placeholder="Press banca" required />
        </div>
      )}
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="challenge-target">Meta</label>
          <input id="challenge-target" type="number" min="0.1" step="any" className="field__input" value={draft.target} onChange={changeHandler('target')} required />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="challenge-unit">Unidad</label>
          <input id="challenge-unit" className="field__input" value={draft.unit} onChange={changeHandler('unit')} placeholder={metric.unit || 'días, veces…'} />
        </div>
      </div>
      {draft.metric === 'manual' && (
        <div className="field">
          <label className="field__label" htmlFor="challenge-manual">Progreso actual</label>
          <input id="challenge-manual" type="number" min="0" step="any" className="field__input" value={draft.manual} onChange={changeHandler('manual')} />
        </div>
      )}
      <div className="field">
        <label className="field__label" htmlFor="challenge-notes">Plan o motivación</label>
        <textarea id="challenge-notes" rows="2" className="field__input field__input--area" value={draft.notes} onChange={changeHandler('notes')} />
      </div>
      <div className="form__actions">
        {challenge.id && <button type="button" className="button button--ghost button--danger-text" onClick={deleteHandler}>Borrar</button>}
        <button type="submit" className="button button--primary">{challenge.id ? 'Guardar' : 'Crear reto'}</button>
      </div>
    </form>
  );
}
