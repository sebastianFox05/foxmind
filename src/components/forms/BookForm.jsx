/* Crear o editar un libro */
import { useState } from 'react';
import { useData } from '../../session/DataContext.jsx';
import { useUi } from '../../ui/UiContext.jsx';
import { todayISO } from '../../lib/dates.js';

const TONES = ['blue', 'amber', 'green', 'violet', 'rose'];

export default function BookForm({ book = {}, onDone }) {
  const { save, remove } = useData();
  const { showToast, confirm } = useUi();
  const [draft, setDraft] = useState({ title: '', author: '', pages: '', page: 0, status: 'por-leer', rating: 0, notes: '', tone: TONES[Math.floor(Math.random() * TONES.length)], ...book });
  const changeHandler = (field) => (event) => setDraft({ ...draft, [field]: event.target.value });

  const submitHandler = async (event) => {
    event.preventDefault();
    const today = todayISO();
    const isFinished = draft.status === 'terminado';
    await save('books', {
      ...draft,
      pages: Number(draft.pages) || 0,
      page: isFinished ? Number(draft.pages) || 0 : Number(draft.page) || 0,
      rating: Number(draft.rating) || 0,
      startedAt: draft.startedAt || (draft.status !== 'por-leer' ? today : ''),
      finishedAt: isFinished ? draft.finishedAt || today : ''
    });
    showToast(book.id ? 'Libro actualizado' : 'Libro añadido');
    onDone();
  };

  const deleteHandler = async () => {
    if (!(await confirm(`Se borrará «${book.title}».`))) return;
    await remove('books', book.id);
    onDone();
  };

  return (
    <form className="form" onSubmit={submitHandler}>
      <div className="field">
        <label className="field__label" htmlFor="book-title">Título</label>
        <input id="book-title" className="field__input" value={draft.title} onChange={changeHandler('title')} required />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="book-author">Autor</label>
        <input id="book-author" className="field__input" value={draft.author} onChange={changeHandler('author')} />
      </div>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="book-pages">Páginas totales</label>
          <input id="book-pages" type="number" min="1" className="field__input" value={draft.pages} onChange={changeHandler('pages')} required />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="book-page">Voy por la página</label>
          <input id="book-page" type="number" min="0" className="field__input" value={draft.page} onChange={changeHandler('page')} />
        </div>
      </div>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="book-status">Estado</label>
          <select id="book-status" className="field__input" value={draft.status} onChange={changeHandler('status')}>
            <option value="por-leer">Por leer</option>
            <option value="leyendo">Leyendo</option>
            <option value="terminado">Terminado</option>
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="book-rating">Valoración</label>
          <select id="book-rating" className="field__input" value={draft.rating} onChange={changeHandler('rating')}>
            {[0, 1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value ? '★'.repeat(value) : 'Sin valorar'}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="book-notes">Ideas y citas</label>
        <textarea id="book-notes" rows="3" className="field__input field__input--area" value={draft.notes} onChange={changeHandler('notes')} />
      </div>
      <div className="form__actions">
        {book.id && <button type="button" className="button button--ghost button--danger-text" onClick={deleteHandler}>Borrar</button>}
        <button type="submit" className="button button--primary">Guardar libro</button>
      </div>
    </form>
  );
}
