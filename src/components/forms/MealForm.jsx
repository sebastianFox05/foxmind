/* Registrar una comida: tipo, nombre, calorias y macros (carbohidratos, proteina, grasa) */
import { useState } from 'react';
import { useData } from '../../session/DataContext.jsx';
import { useUi } from '../../ui/UiContext.jsx';
import { todayISO } from '../../lib/dates.js';

const TYPES = [['desayuno', 'Desayuno'], ['almuerzo', 'Almuerzo'], ['cena', 'Cena'], ['snack', 'Snack']];

export default function MealForm({ meal = {}, preset = {}, onDone }) {
  const { save, remove } = useData();
  const { showToast, confirm } = useUi();
  const [draft, setDraft] = useState({ date: todayISO(), type: 'almuerzo', name: '', kcal: '', carbs: '', protein: '', fat: '', ...preset, ...meal });
  const changeHandler = (field) => (event) => setDraft({ ...draft, [field]: event.target.value });

  const submitHandler = async (event) => {
    event.preventDefault();
    await save('meals', { ...draft, name: draft.name.trim(), kcal: Number(draft.kcal) || 0, carbs: Number(draft.carbs) || 0, protein: Number(draft.protein) || 0, fat: Number(draft.fat) || 0 });
    showToast(meal.id ? 'Comida actualizada' : 'Comida registrada 🥗');
    onDone();
  };

  const deleteHandler = async () => {
    if (!(await confirm(`Se borrará «${meal.name}».`))) return;
    await remove('meals', meal.id);
    onDone();
  };

  return (
    <form className="form" onSubmit={submitHandler}>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="meal-type">Comida</label>
          <select id="meal-type" className="field__input" value={draft.type} onChange={changeHandler('type')}>
            {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="meal-date">Fecha</label>
          <input id="meal-date" type="date" className="field__input" value={draft.date} onChange={changeHandler('date')} required />
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="meal-name">¿Qué comiste?</label>
        <input id="meal-name" className="field__input" value={draft.name} onChange={changeHandler('name')} placeholder="Pollo con arroz y ensalada" required />
      </div>
      <div className="form__grid">
        <div className="field">
          <label className="field__label" htmlFor="meal-kcal">Calorías (kcal)</label>
          <input id="meal-kcal" type="number" min="0" inputMode="numeric" className="field__input" value={draft.kcal} onChange={changeHandler('kcal')} required />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="meal-carbs">Carbohidratos (g)</label>
          <input id="meal-carbs" type="number" min="0" inputMode="numeric" className="field__input" value={draft.carbs} onChange={changeHandler('carbs')} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="meal-protein">Proteína (g)</label>
          <input id="meal-protein" type="number" min="0" inputMode="numeric" className="field__input" value={draft.protein} onChange={changeHandler('protein')} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="meal-fat">Grasa (g)</label>
          <input id="meal-fat" type="number" min="0" inputMode="numeric" className="field__input" value={draft.fat} onChange={changeHandler('fat')} />
        </div>
      </div>
      <div className="form__actions">
        {meal.id && <button type="button" className="button button--ghost button--danger-text" onClick={deleteHandler}>Borrar</button>}
        <button type="submit" className="button button--primary">Guardar comida</button>
      </div>
    </form>
  );
}
