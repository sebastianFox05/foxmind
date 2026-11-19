/* Diario del dia: animo, energia, intencion, logros, gratitud y notas */
import { useState } from 'react';
import { useData } from '../../session/DataContext.jsx';
import { useUi } from '../../ui/UiContext.jsx';
import { todayISO, formatLongDay } from '../../lib/dates.js';

const MOODS = ['😞', '😕', '😐', '🙂', '😄'];
const ENERGY = ['🪫', '😴', '⚡', '⚡⚡', '🚀'];

function Scale({ name, legend, icons, value, onChange }) {
  return (
    <fieldset className="field field--chips">
      <legend className="field__label">{legend}</legend>
      <div className="chip-group">
        {icons.map((icon, index) => (
          <label key={icon} className={`chip chip--emoji${Number(value) === index + 1 ? ' chip--active' : ''}`}>
            <input type="radio" name={name} className="visually-hidden" checked={Number(value) === index + 1} onChange={() => onChange(index + 1)} />
            <span aria-hidden="true">{icon}</span><span className="visually-hidden">{index + 1} de 5</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function JournalForm({ date = todayISO(), onDone }) {
  const { db, save } = useData();
  const { showToast } = useUi();
  const existing = db.journal.find((entry) => entry.date === date);
  const [draft, setDraft] = useState({ date, mood: 4, energy: 3, intention: '', wins: '', gratitude: '', improve: '', notes: '', ...existing });
  const changeHandler = (field) => (event) => setDraft({ ...draft, [field]: event.target.value });

  const submitHandler = async (event) => {
    event.preventDefault();
    await save('journal', draft);
    showToast('Diario guardado');
    onDone();
  };

  return (
    <form className="form" onSubmit={submitHandler}>
      <p className="form__hint">{formatLongDay(date)}</p>
      <div className="field">
        <label className="field__label" htmlFor="journal-intention">Intención del día</label>
        <input id="journal-intention" className="field__input" value={draft.intention} onChange={changeHandler('intention')} placeholder="Lo único que haría el día un éxito" />
      </div>
      <Scale name="mood" legend="Ánimo" icons={MOODS} value={draft.mood} onChange={(mood) => setDraft({ ...draft, mood })} />
      <Scale name="energy" legend="Energía" icons={ENERGY} value={draft.energy} onChange={(energy) => setDraft({ ...draft, energy })} />
      <div className="field">
        <label className="field__label" htmlFor="journal-wins">Logros de hoy</label>
        <textarea id="journal-wins" rows="2" className="field__input field__input--area" value={draft.wins} onChange={changeHandler('wins')} />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="journal-gratitude">Agradezco…</label>
        <input id="journal-gratitude" className="field__input" value={draft.gratitude} onChange={changeHandler('gratitude')} />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="journal-improve">Mañana mejoraría…</label>
        <input id="journal-improve" className="field__input" value={draft.improve} onChange={changeHandler('improve')} />
      </div>
      <div className="form__actions">
        <button type="submit" className="button button--primary">Guardar</button>
      </div>
    </form>
  );
}
