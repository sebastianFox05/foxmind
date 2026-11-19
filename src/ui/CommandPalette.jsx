/*
 * Paleta de comandos (Ctrl/Cmd + K o el boton +): captura en lenguaje natural, acciones rapidas,
 * navegacion y busqueda en tareas, libros, notas y retos. Flechas para moverse, Enter para ejecutar.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../session/DataContext.jsx';
import { useUi } from './UiContext.jsx';
import { useActions } from './useActions.jsx';
import { quickParse } from '../lib/parse.js';
import { todayISO } from '../lib/dates.js';
import Icon from '../components/Icon.jsx';

const PAGES = [
  { label: 'Ir a Hoy', to: '/', icon: 'home' },
  { label: 'Ir a Rutina del día (actividades diarias)', to: '/rutina', icon: 'leaf' },
  { label: 'Ir a Trabajo', to: '/trabajo', icon: 'briefcase' },
  { label: 'Ir a Entreno', to: '/entreno', icon: 'dumbbell' },
  { label: 'Ir a Mente (lectura y diario)', to: '/mente', icon: 'book' },
  { label: 'Ir a Retos', to: '/retos', icon: 'trophy' },
  { label: 'Ir a Perfil y revisión semanal', to: '/perfil', icon: 'user' }
];

function matches(text, query) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(query);
}

export default function CommandPalette() {
  const { db, save } = useData();
  const { isPaletteOpen, setIsPaletteOpen, showToast } = useUi();
  const actions = useActions();
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const closeHandler = () => {
    setIsPaletteOpen(false);
    setQuery('');
    setActive(0);
  };

  /* Atajo global: Ctrl/Cmd + K */
  useEffect(() => {
    const keyHandler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsPaletteOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [setIsPaletteOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const previous = document.activeElement;
    if (isPaletteOpen && !dialog.open) dialog.showModal();
    if (!isPaletteOpen && dialog.open) dialog.close();
    return () => { if (isPaletteOpen && previous?.focus) previous.focus(); };
  }, [isPaletteOpen]);

  const runParsedHandler = async (parsed) => {
    if (parsed.type === 'task') {
      await save('tasks', parsed.data);
      showToast('Tarea creada ✓');
    } else if (parsed.type === 'run') {
      if (parsed.data.minutes) {
        await save('runs', parsed.data);
        showToast(`Carrera de ${parsed.data.km} km guardada 🏃`);
      } else {
        actions.openRun(null, parsed.data);
      }
    } else if (parsed.type === 'reading') {
      const book = db.books.find((item) => item.status === 'leyendo');
      actions.openReading({ ...parsed.data, bookId: book?.id });
    } else if (parsed.type === 'note') {
      await save('notes', parsed.data);
      showToast('Nota guardada 💡');
    } else if (parsed.type === 'workout') {
      actions.openWorkout(null, parsed.data);
    } else if (parsed.type === 'challenge') {
      actions.openChallenge(null, parsed.data);
    }
  };

  const items = useMemo(() => {
    const text = query.trim();
    const plain = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const list = [];
    const parsed = text ? quickParse(text, todayISO()) : null;
    if (parsed) list.push({ id: 'parsed', icon: 'sparkle', label: parsed.label, hint: 'Enter', run: () => runParsedHandler(parsed) });

    const quick = [
      { id: 'q-task', icon: 'check', label: 'Nueva tarea', run: () => actions.openTask() },
      { id: 'q-run', icon: 'run', label: 'Registrar carrera', run: () => actions.openRun() },
      { id: 'q-gym', icon: 'dumbbell', label: 'Registrar sesión de gym', run: () => actions.openWorkout() },
      { id: 'q-read', icon: 'book', label: 'Registrar lectura', run: () => actions.openReading() },
      { id: 'q-idea', icon: 'bulb', label: 'Nueva idea o aprendizaje', run: () => actions.openNote(null, 'idea') },
      { id: 'q-journal', icon: 'note', label: 'Escribir el diario de hoy', run: () => actions.openJournal(todayISO()) },
      { id: 'q-challenge', icon: 'trophy', label: 'Nuevo reto', run: () => actions.openChallenge() },
      { id: 'q-board', icon: 'board', label: 'Cargar marcas del tablero', run: () => actions.openBoard() }
    ];
    list.push(...quick.filter((item) => !plain || matches(item.label, plain)));
    list.push(...PAGES.filter((page) => !plain || matches(page.label, plain)).map((page) => ({ id: page.to, icon: page.icon, label: page.label, run: () => navigate(page.to) })));

    if (plain.length >= 2) {
      db.tasks.filter((task) => matches(task.title, plain)).slice(0, 5).forEach((task) => list.push({ id: task.id, icon: task.status === 'done' ? 'check' : 'briefcase', label: task.title, hint: 'Tarea', run: () => actions.openTask(task) }));
      db.books.filter((book) => matches(`${book.title} ${book.author}`, plain)).slice(0, 3).forEach((book) => list.push({ id: book.id, icon: 'book', label: book.title, hint: 'Libro', run: () => actions.openBook(book) }));
      db.notes.filter((note) => matches(`${note.title} ${note.body}`, plain)).slice(0, 4).forEach((note) => list.push({ id: note.id, icon: note.kind === 'snippet' ? 'code' : 'bulb', label: note.title, hint: note.kind, run: () => actions.openNote(note) }));
      db.challenges.filter((challenge) => matches(challenge.title, plain)).slice(0, 3).forEach((challenge) => list.push({ id: challenge.id, icon: 'trophy', label: challenge.title, hint: 'Reto', run: () => actions.openChallenge(challenge) }));
    }
    return list;
  }, [query, db, actions, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  /* La opcion activa siempre visible al moverse con las flechas */
  useEffect(() => {
    if (isPaletteOpen) document.getElementById(`palette-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, isPaletteOpen]);

  const executeHandler = (item) => {
    closeHandler();
    item.run();
  };

  const keyHandler = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((value) => (value + 1) % Math.max(1, items.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((value) => (value - 1 + items.length) % Math.max(1, items.length));
    } else if (event.key === 'Enter' && items[active]) {
      event.preventDefault();
      executeHandler(items[active]);
    }
  };

  const cancelHandler = (event) => {
    event.preventDefault();
    closeHandler();
  };

  return (
    <dialog ref={dialogRef} className="palette" aria-label="Paleta de comandos" onCancel={cancelHandler} onClick={(event) => { if (event.target === dialogRef.current) closeHandler(); }}>
      {isPaletteOpen && (
        <div className="palette__panel">
          <div className="palette__search">
            <Icon name="sparkle" />
            <label htmlFor="palette-input" className="visually-hidden">Escribe un comando o una tarea</label>
            <input
              id="palette-input"
              className="palette__input"
              autoFocus
              autoComplete="off"
              value={query}
              placeholder="«Revisar PR !alta mañana #api» · «corrí 8 km 44 min» · «leí 30 pág»"
              role="combobox"
              aria-expanded={items.length > 0}
              aria-autocomplete="list"
              aria-controls="palette-list"
              aria-activedescendant={items[active] ? `palette-${active}` : undefined}
              onChange={(event) => { setQuery(event.target.value); setActive(0); }}
              onKeyDown={keyHandler}
            />
            <kbd className="palette__kbd">Esc</kbd>
          </div>
          <ul id="palette-list" className="palette__list" role="listbox" aria-label="Resultados">
            {items.map((item, index) => (
              <li
                key={item.id}
                id={`palette-${index}`}
                role="option"
                aria-selected={index === active}
                className={`palette__item${index === active ? ' palette__item--active' : ''}${item.id === 'parsed' ? ' palette__item--parsed' : ''}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => executeHandler(item)}
              >
                <span className="palette__icon"><Icon name={item.icon} /></span>
                <span className="palette__label">{item.label}</span>
                {item.hint && <span className="palette__hint">{item.hint}</span>}
              </li>
            ))}
          </ul>
          <p className="palette__footer">↑ ↓ para moverte · Enter para ejecutar · Ctrl + K para abrir desde cualquier sitio</p>
        </div>
      )}
    </dialog>
  );
}
