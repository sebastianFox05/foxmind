/*
 * Tablero del cuarto: pega tus marcas (una por linea) y la app las convierte en records.
 */
import { useMemo, useState } from 'react';
import { useData } from '../../session/DataContext.jsx';
import { useUi } from '../../ui/UiContext.jsx';
import { parseBoard } from '../../lib/parse.js';

const EXAMPLE = 'Press banca: 85 kg\nSentadilla 115 kg\nDominadas 15 reps\n5K 23:40\nPlancha 3 min';

export default function BoardForm({ onDone }) {
  const { db, save, remove } = useData();
  const { showToast } = useUi();
  const [text, setText] = useState('');
  const [isReplacingDemo, setIsReplacingDemo] = useState(true);
  const parsed = useMemo(() => parseBoard(text), [text]);
  const demoRecords = db.records.filter((record) => record.isDemo);

  const submitHandler = async (event) => {
    event.preventDefault();
    if (!parsed.length) return;
    if (isReplacingDemo) await Promise.all(demoRecords.map((record) => remove('records', record.id)));
    for (const record of parsed) {
      const existing = db.records.find((item) => !item.isDemo && item.name.toLowerCase() === record.name.toLowerCase());
      await save('records', { ...existing, ...record, isDemo: false });
    }
    showToast(`${parsed.length} marcas cargadas del tablero 📋`, 'success');
    onDone();
  };

  return (
    <form className="form" onSubmit={submitHandler}>
      <p className="form__hint">Escribe o pega lo que tienes en el tablero, una marca por línea. Reconozco kg, reps, km, minutos y tiempos (23:40).</p>
      <div className="field">
        <label className="field__label" htmlFor="board-text">Tablero</label>
        <textarea id="board-text" rows="7" className="field__input field__input--area field__input--code" value={text} onChange={(event) => setText(event.target.value)} placeholder={EXAMPLE} />
      </div>
      {parsed.length > 0 && (
        <ul className="board-preview" aria-label="Vista previa">
          {parsed.map((record, index) => (
            <li key={index} className="board-preview__item">
              <span className={`tag tag--${record.category}`}>{record.category}</span>
              <span className="board-preview__name">{record.name}</span>
              <strong>{record.value} {record.unit !== 'tiempo' ? record.unit : ''}</strong>
            </li>
          ))}
        </ul>
      )}
      {demoRecords.length > 0 && (
        <label className="check">
          <input type="checkbox" checked={isReplacingDemo} onChange={(event) => setIsReplacingDemo(event.target.checked)} />
          <span>Quitar las {demoRecords.length} marcas de ejemplo</span>
        </label>
      )}
      <div className="form__actions">
        <button type="submit" className="button button--primary" disabled={!parsed.length}>Cargar {parsed.length || ''} marcas</button>
      </div>
    </form>
  );
}
