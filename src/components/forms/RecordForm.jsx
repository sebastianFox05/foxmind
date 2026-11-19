/* Crear o editar una marca suelta del tablero del cuarto */
import { useState } from 'react';
import { useData } from '../../session/DataContext.jsx';
import { useUi } from '../../ui/UiContext.jsx';
import { todayISO } from '../../lib/dates.js';

export default function RecordForm({ record = {}, onDone }) {
  const { save, remove } = useData();
  const { showToast, confirm } = useUi();
  const [draft, setDraft] = useState({ name: '', value: '', unit: 'kg', category: 'gym', date: todayISO(), ...record });
  const changeHandler = (field) => (event) => setDraft({ ...draft, [field]: event.target.value });

  const submitHandler = async (event) => {
    event.preventDefault();
    const isNumeric = draft.unit !== 'tiempo' && draft.value !== '' && !Number.isNaN(Number(draft.value));
    await save('records', { ...draft, value: isNumeric ? Number(draft.value) : draft.value, isDemo: false });
    showToast('Marca guardada en el tablero');
    onDone();
  };

  const deleteHandler = async () => {
    if (!(await confirm(`Se borrará «${record.name}» del tablero.`))) return;
    await remove('records', record.id);
    onDone();
  };

  return (
    <form className="form" onSubmit={submitHandler}>
      <div className="field">
        <label className="field__label" htmlFor="record-name">Marca</label>
        <input id="record-name" className="field__input" value={draft.name} onChange={changeHandler('name')} placeholder="Press banca" required />
      </div>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="record-value">Valor</label>
          <input id="record-value" className="field__input" value={draft.value} onChange={changeHandler('value')} placeholder="85 o 23:40" required />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="record-unit">Unidad</label>
          <select id="record-unit" className="field__input" value={draft.unit} onChange={changeHandler('unit')}>
            {['kg', 'lb', 'reps', 'km', 'min', 'tiempo', 'veces', 'páginas', 'libros', ''].map((unit) => <option key={unit} value={unit}>{unit || 'sin unidad'}</option>)}
          </select>
        </div>
      </div>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="record-category">Categoría</label>
          <select id="record-category" className="field__input" value={draft.category} onChange={changeHandler('category')}>
            <option value="gym">Gym</option>
            <option value="running">Running</option>
            <option value="lectura">Lectura</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="record-date">Fecha</label>
          <input id="record-date" type="date" className="field__input" value={draft.date} onChange={changeHandler('date')} />
        </div>
      </div>
      <div className="form__actions">
        {record.id && <button type="button" className="button button--ghost button--danger-text" onClick={deleteHandler}>Borrar</button>}
        <button type="submit" className="button button--primary">Guardar</button>
      </div>
    </form>
  );
}
