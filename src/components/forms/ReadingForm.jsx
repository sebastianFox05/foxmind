/* Registrar lectura: suma paginas al libro y lo marca terminado al llegar al final */
import { useState } from 'react';
import { useData } from '../../session/DataContext.jsx';
import { useUi } from '../../ui/UiContext.jsx';
import { todayISO } from '../../lib/dates.js';

export default function ReadingForm({ preset = {}, onDone }) {
  const { db, save } = useData();
  const { showToast } = useUi();
  const reading = db.books.filter((book) => book.status === 'leyendo');
  const [draft, setDraft] = useState({ date: todayISO(), bookId: preset.bookId || reading[0]?.id || '', pages: preset.pages ?? '', minutes: preset.minutes ?? 20 });
  const changeHandler = (field) => (event) => setDraft({ ...draft, [field]: event.target.value });

  const submitHandler = async (event) => {
    event.preventDefault();
    const pages = Number(draft.pages) || 0;
    await save('readingLogs', { ...draft, pages, minutes: Number(draft.minutes) || 0 });
    const book = db.books.find((item) => item.id === draft.bookId);
    if (book && pages) {
      const page = Math.min(Number(book.pages) || Infinity, (Number(book.page) || 0) + pages);
      const isFinished = book.pages && page >= book.pages;
      await save('books', { ...book, page, status: isFinished ? 'terminado' : book.status, finishedAt: isFinished ? draft.date : book.finishedAt });
      showToast(isFinished ? `¡Terminaste «${book.title}»! 📚` : `+${pages} páginas en «${book.title}»`, isFinished ? 'success' : 'default');
    } else {
      showToast('Lectura registrada');
    }
    onDone();
  };

  return (
    <form className="form" onSubmit={submitHandler}>
      <div className="field">
        <label className="field__label" htmlFor="reading-book">Libro</label>
        <select id="reading-book" className="field__input" value={draft.bookId} onChange={changeHandler('bookId')}>
          <option value="">Sin libro (artículos, documentación…)</option>
          {reading.map((book) => <option key={book.id} value={book.id}>{book.title} · pág. {book.page}/{book.pages}</option>)}
        </select>
      </div>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="reading-pages">Páginas</label>
          <input id="reading-pages" type="number" min="0" inputMode="numeric" className="field__input" value={draft.pages} onChange={changeHandler('pages')} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="reading-minutes">Minutos</label>
          <input id="reading-minutes" type="number" min="0" inputMode="numeric" className="field__input" value={draft.minutes} onChange={changeHandler('minutes')} />
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="reading-date">Fecha</label>
        <input id="reading-date" type="date" className="field__input" value={draft.date} onChange={changeHandler('date')} required />
      </div>
      <div className="form__actions">
        <button type="submit" className="button button--primary">Guardar lectura</button>
      </div>
    </form>
  );
}
