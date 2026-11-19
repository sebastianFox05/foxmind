/* Crear o editar una actividad diaria (habito): icono, momento del dia y dias de la semana */
import { useState } from 'react';
import { useData } from '../../session/DataContext.jsx';
import { useUi } from '../../ui/UiContext.jsx';
import { WEEK_ORDER, WEEKDAYS_SHORT } from '../../lib/dates.js';
import { HABIT_ICONS } from '../../lib/icons.js';
import Icon from '../Icon.jsx';

const MOMENTS = ['mañana', 'tarde', 'noche', 'todo el día'];

export default function HabitForm({ habit = {}, onDone }) {
  const { save, remove } = useData();
  const { showToast, confirm } = useUi();
  const [draft, setDraft] = useState({ name: '', icon: 'leaf', moment: 'mañana', days: [], log: [], ...habit });

  const toggleDayHandler = (day) => setDraft({ ...draft, days: draft.days.includes(day) ? draft.days.filter((item) => item !== day) : [...draft.days, day] });

  const submitHandler = async (event) => {
    event.preventDefault();
    await save('habits', { ...draft, name: draft.name.trim() });
    showToast(habit.id ? 'Hábito actualizado' : 'Hábito creado');
    onDone();
  };

  const deleteHandler = async () => {
    if (!(await confirm(`Se borrará «${habit.name}» y su historial.`))) return;
    await remove('habits', habit.id);
    onDone();
  };

  return (
    <form className="form" onSubmit={submitHandler}>
      <div className="field">
        <label className="field__label" htmlFor="habit-name">Actividad</label>
        <input id="habit-name" className="field__input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Meditar 10 min" required />
      </div>
      <fieldset className="field field--chips">
        <legend className="field__label">Icono</legend>
        <div className="chip-group chip-group--icons">
          {HABIT_ICONS.map((icon) => (
            <label key={icon} className={`chip chip--icon${draft.icon === icon ? ' chip--active' : ''}`}>
              <input type="radio" name="habit-icon" className="visually-hidden" checked={draft.icon === icon} onChange={() => setDraft({ ...draft, icon })} />
              <Icon name={icon} /><span className="visually-hidden">{icon}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label className="field__label" htmlFor="habit-moment">Momento</label>
        <select id="habit-moment" className="field__input" value={draft.moment} onChange={(event) => setDraft({ ...draft, moment: event.target.value })}>
          {MOMENTS.map((moment) => <option key={moment} value={moment}>{moment}</option>)}
        </select>
      </div>
      <fieldset className="field field--chips">
        <legend className="field__label">Días (sin marcar = todos)</legend>
        <div className="chip-group">
          {WEEK_ORDER.map((day) => (
            <label key={day} className={`chip${draft.days.includes(day) ? ' chip--active' : ''}`}>
              <input type="checkbox" className="visually-hidden" checked={draft.days.includes(day)} onChange={() => toggleDayHandler(day)} />
              {WEEKDAYS_SHORT[day]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form__actions">
        {habit.id && <button type="button" className="button button--ghost button--danger-text" onClick={deleteHandler}>Borrar</button>}
        <button type="submit" className="button button--primary">Guardar</button>
      </div>
    </form>
  );
}
