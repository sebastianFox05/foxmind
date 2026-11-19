/*
 * Mente: lectura (meta anual, rutina diaria, libros en curso como tarjetas tipo "Your Legend")
 * y diario agrupado por dias (referencia de la galeria: Hoy, Ayer, viernes…).
 */
import { useState } from 'react';
import { useData } from '../session/DataContext.jsx';
import { useActions } from '../ui/useActions.jsx';
import Segmented from '../components/Segmented.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import Icon from '../components/Icon.jsx';
import { BarChart, Ring, TrendChart } from '../components/Charts.jsx';
import { addDays, capitalize, formatDay, relativeDay, todayISO } from '../lib/dates.js';
import { bookProgress, readingMinutesOn, weeklySeries } from '../lib/stats.js';
import { sortBy } from '../lib/utils.js';

const MOODS = ['😞', '😕', '😐', '🙂', '😄'];

function readingStreak(db, today) {
  let streak = 0;
  let cursor = readingMinutesOn(db, today) > 0 ? today : addDays(today, -1);
  while (readingMinutesOn(db, cursor) > 0 && streak < 400) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function BookCard({ book, onOpen, onLog }) {
  const pct = bookProgress(book);
  return (
    <article className={`book-card book-card--${book.tone || 'blue'}`}>
      <button type="button" className="book-card__main" onClick={() => onOpen(book)}>
        <span className="book-card__cover" aria-hidden="true"><span>{book.title}</span></span>
        <span className="book-card__eyebrow">{Math.round(pct * 100)} % · pág. {book.page} de {book.pages}</span>
        <span className="book-card__title">{book.title}</span>
        <span className="book-card__author">{book.author}</span>
      </button>
      <span className="progress progress--light" style={{ '--progress': `${Math.round(pct * 100)}%` }} aria-hidden="true"><span className="progress__fill" /></span>
      <button type="button" className="button button--small button--pill" onClick={() => onLog(book)}>Registrar lectura</button>
    </article>
  );
}

function Reading() {
  const { db, settings } = useData();
  const actions = useActions();
  const today = todayISO();
  const year = today.slice(0, 4);
  const reading = db.books.filter((book) => book.status === 'leyendo');
  const queue = db.books.filter((book) => book.status === 'por-leer');
  const finished = sortBy(db.books.filter((book) => book.status === 'terminado'), (book) => book.finishedAt || '', 'desc');
  const finishedThisYear = finished.filter((book) => (book.finishedAt || '').startsWith(year)).length;
  const todayMinutes = readingMinutesOn(db, today);
  const goal = Number(settings.dailyReadingMin) || 20;
  const routine = db.routines.find((item) => item.kind === 'lectura');

  return (
    <div className="stack">
      <div className="reading-goals">
        <div className="reading-goal glass">
          <Ring value={finishedThisYear / Math.max(1, settings.yearBooksGoal)} size={96} stroke={6} label={`${finishedThisYear} de ${settings.yearBooksGoal} libros este año`}>
            <strong className="reading-goal__number">{finishedThisYear}<small>/{settings.yearBooksGoal}</small></strong>
          </Ring>
          <span className="reading-goal__label">Libros en {year}</span>
        </div>
        <div className="reading-goal glass">
          <Ring value={todayMinutes / goal} size={96} stroke={6} label={`${todayMinutes} de ${goal} minutos hoy`}>
            <strong className="reading-goal__number">{todayMinutes}<small>′</small></strong>
          </Ring>
          <span className="reading-goal__label">{routine ? routine.name : 'Rutina diaria'} · {goal} min</span>
        </div>
        <div className="reading-goal glass">
          <strong className="reading-goal__big">{readingStreak(db, today)}</strong>
          <span className="reading-goal__label">días seguidos leyendo</span>
        </div>
      </div>

      <SectionHeader title="Leyendo ahora" action={<button type="button" className="section-header__link" onClick={() => actions.openBook()}>+ Libro</button>} />
      <div className="book-carousel" role="list">
        {reading.map((book) => (
          <div role="listitem" key={book.id}>
            <BookCard book={book} onOpen={actions.openBook} onLog={(item) => actions.openReading({ bookId: item.id })} />
          </div>
        ))}
        {!reading.length && <p className="empty">Elige un libro de tu lista para empezar.</p>}
      </div>

      <div className="glass glass--padded">
        <SectionHeader title="Páginas por semana" />
        <BarChart data={weeklySeries(db, 'pages')} unit="páginas" label="Páginas leídas por semana" />
      </div>

      <SectionHeader title={`Por leer · ${queue.length}`} />
      <ul className="book-list">
        {queue.map((book) => (
          <li key={book.id}>
            <button type="button" className="book-row glass" onClick={() => actions.openBook(book)}>
              <span className={`book-row__spine book-row__spine--${book.tone || 'blue'}`} aria-hidden="true" />
              <span className="book-row__text"><strong>{book.title}</strong><span>{book.author} · {book.pages} págs.</span></span>
              <Icon name="chevron-right" />
            </button>
          </li>
        ))}
      </ul>

      <SectionHeader title={`Terminados · ${finished.length}`} />
      <ul className="book-list">
        {finished.map((book) => (
          <li key={book.id}>
            <button type="button" className="book-row glass" onClick={() => actions.openBook(book)}>
              <span className={`book-row__spine book-row__spine--${book.tone || 'blue'}`} aria-hidden="true" />
              <span className="book-row__text"><strong>{book.title}</strong><span>{book.author} · {book.finishedAt ? formatDay(book.finishedAt) : ''}</span></span>
              <span className="book-row__rating" aria-label={`${book.rating || 0} estrellas`}>{'★'.repeat(book.rating || 0)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Journal() {
  const { db } = useData();
  const actions = useActions();
  const today = todayISO();
  const entries = sortBy(db.journal, (entry) => entry.date, 'desc');
  const hasToday = entries.some((entry) => entry.date === today);
  const moodSeries = Array.from({ length: 14 }, (_, index) => {
    const date = addDays(today, index - 13);
    return { date, value: db.journal.find((entry) => entry.date === date)?.mood || 0 };
  });
  return (
    <div className="stack">
      {!hasToday && (
        <button type="button" className="journal-card glass" onClick={() => actions.openJournal(today)}>
          <span className="journal-card__quote">¿Cómo va tu día?</span>
          <span className="journal-card__meta">Escribe la entrada de hoy · 2 minutos</span>
        </button>
      )}
      <div className="glass glass--padded">
        <SectionHeader title="Ánimo · últimos 14 días" />
        <TrendChart data={moodSeries} label="Evolución del ánimo en los últimos 14 días" />
      </div>
      {entries.map((entry) => (
        <section key={entry.id} className="journal-day" aria-label={formatDay(entry.date)}>
          <h2 className="journal-day__title">{capitalize(relativeDay(entry.date, today))}</h2>
          <button type="button" className="journal-entry glass" onClick={() => actions.openJournal(entry.date)}>
            <span className="journal-entry__mood" aria-label={`Ánimo ${entry.mood} de 5`}>{MOODS[(entry.mood || 3) - 1]}</span>
            <span className="journal-entry__text">
              {entry.intention && <strong className="journal-entry__intention">«{entry.intention}»</strong>}
              {entry.wins && <span>✓ {entry.wins}</span>}
              {entry.gratitude && <span>♡ {entry.gratitude}</span>}
              {entry.improve && <span>→ {entry.improve}</span>}
            </span>
          </button>
        </section>
      ))}
    </div>
  );
}

export default function Mind() {
  const [tab, setTab] = useState('lectura');
  return (
    <div className="view mind">
      <header className="view__header">
        <h1 className="view__title">Tu <strong>mente</strong><br />lectura y diario</h1>
        <p className="view__lead">Libros, rutina de lectura y diario personal.</p>
      </header>
      <Segmented label="Secciones de mente" value={tab} onChange={setTab} options={[{ value: 'lectura', label: 'Lectura' }, { value: 'diario', label: 'Diario' }]} />
      {tab === 'lectura' ? <Reading /> : <Journal />}
    </div>
  );
}
