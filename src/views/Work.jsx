/*
 * Trabajo: tablero por hacer / en curso / hecho (lo que falta y lo que ya hice), lista por fechas,
 * captura rapida, foco (pomodoro), standup automatico e inbox de ideas, aprendizajes y snippets.
 */
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../session/DataContext.jsx';
import { useUi } from '../ui/UiContext.jsx';
import { useActions } from '../ui/useActions.jsx';
import Segmented from '../components/Segmented.jsx';
import TaskCard from '../components/TaskCard.jsx';
import FocusTimer from '../components/FocusTimer.jsx';
import WorkToday from '../components/WorkToday.jsx';
import Waves from '../components/Waves.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import Icon from '../components/Icon.jsx';
import { BarChart } from '../components/Charts.jsx';
import { quickParse } from '../lib/parse.js';
import { standupText, weeklySeries } from '../lib/stats.js';
import { withStatus, compareTasks } from '../lib/tasks.js';
import { addDays, formatDay, startOfWeek, todayISO, toISO } from '../lib/dates.js';

const PROJECT_ICONS = ['code', 'bolt', 'chart', 'sparkle', 'briefcase', 'target'];

const COLUMNS = [
  { status: 'todo', title: 'Por hacer', hint: 'Lo que me falta' },
  { status: 'doing', title: 'En curso', hint: 'Máximo 3 a la vez' },
  { status: 'done', title: 'Hecho', hint: 'Lo que ya hice' }
];

function groupByDate(tasks, today) {
  const weekEnd = addDays(startOfWeek(today), 6);
  const groups = [
    ['Vencidas', (task) => task.due && task.due < today],
    ['Hoy', (task) => task.due === today],
    ['Mañana', (task) => task.due === addDays(today, 1)],
    ['Esta semana', (task) => task.due > addDays(today, 1) && task.due <= weekEnd],
    ['Más adelante', (task) => task.due > weekEnd],
    ['Sin fecha', (task) => !task.due]
  ];
  return groups.map(([title, test]) => ({ title, tasks: tasks.filter(test) })).filter((group) => group.tasks.length);
}

function Board({ tasks, onOpen, onMove }) {
  const [mobileColumn, setMobileColumn] = useState('todo');
  const [dropTarget, setDropTarget] = useState('');

  const dropHandler = (status) => (event) => {
    event.preventDefault();
    setDropTarget('');
    const task = tasks.find((item) => item.id === event.dataTransfer.getData('text/plain'));
    if (task && task.status !== status) onMove(task, status);
  };

  return (
    <>
      <div className="board__switch">
        <Segmented label="Columna" value={mobileColumn} onChange={setMobileColumn} options={COLUMNS.map((column) => ({ value: column.status, label: column.title, count: tasks.filter((task) => task.status === column.status).length }))} />
      </div>
      <div className="board">
        {COLUMNS.map((column) => {
          const list = tasks.filter((task) => task.status === column.status).sort(compareTasks);
          const visible = column.status === 'done' ? list.slice(0, 12) : list;
          return (
            <section
              key={column.status}
              className={`board__column${mobileColumn === column.status ? ' board__column--current' : ''}${dropTarget === column.status ? ' board__column--drop' : ''}`}
              aria-labelledby={`column-${column.status}`}
              onDragOver={(event) => { event.preventDefault(); setDropTarget(column.status); }}
              onDragLeave={() => setDropTarget('')}
              onDrop={dropHandler(column.status)}
            >
              <header className="board__header">
                <h2 className="board__title" id={`column-${column.status}`}>{column.title} <span className="board__count">{list.length}</span></h2>
                <p className="board__hint">{column.hint}</p>
              </header>
              <div className="stack">
                {visible.map((task) => <TaskCard key={task.id} task={task} onOpen={onOpen} onMove={onMove} isDraggable />)}
                {!visible.length && <p className="empty empty--small">Arrastra aquí una tarea</p>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function TaskList({ tasks, onOpen, onMove, today }) {
  const pending = tasks.filter((task) => task.status !== 'done').sort(compareTasks);
  const done = tasks.filter((task) => task.status === 'done').sort(compareTasks).slice(0, 10);
  return (
    <div className="task-groups">
      {groupByDate(pending, today).map((group) => (
        <section key={group.title} className="task-groups__group" aria-label={group.title}>
          <h2 className={`task-groups__title${group.title === 'Vencidas' ? ' task-groups__title--late' : ''}`}>{group.title} <span>{group.tasks.length}</span></h2>
          <div className="stack">{group.tasks.map((task) => <TaskCard key={task.id} task={task} onOpen={onOpen} onMove={onMove} />)}</div>
        </section>
      ))}
      {done.length > 0 && (
        <section className="task-groups__group" aria-label="Hechas recientemente">
          <h2 className="task-groups__title">Hechas recientemente <span>{done.length}</span></h2>
          <div className="stack">{done.map((task) => <TaskCard key={task.id} task={task} onOpen={onOpen} onMove={onMove} />)}</div>
        </section>
      )}
    </div>
  );
}

function Standup() {
  const { db } = useData();
  const { showToast } = useUi();
  const text = standupText(db);
  const copyHandler = async () => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Standup copiado: pégalo en Slack o Teams');
    } catch {
      showToast('No se pudo copiar', 'danger');
    }
  };
  return (
    <div className="stack">
      <div className="glass glass--padded">
        <SectionHeader title="Tu standup, ya escrito" action={<button type="button" className="button button--small button--primary" onClick={copyHandler}><Icon name="copy" /> Copiar</button>} />
        <pre className="code-block">{text}</pre>
        <p className="form__hint">Sale de tus tareas: lo que cerraste el último día laborable, lo que está en curso o vence hoy, y lo marcado como bloqueado.</p>
      </div>
      <div className="glass glass--padded">
        <SectionHeader title="Tareas cerradas por semana" />
        <BarChart data={weeklySeries(db, 'tasks')} unit="tareas" label="Tareas cerradas por semana" />
      </div>
    </div>
  );
}

function Notes() {
  const { db } = useData();
  const { showToast } = useUi();
  const actions = useActions();
  const [kind, setKind] = useState('idea');
  const notes = db.notes.filter((note) => note.kind === kind).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const copyHandler = async (note) => {
    await navigator.clipboard.writeText(note.body);
    showToast('Snippet copiado');
  };
  return (
    <div className="stack">
      <div className="toolbar">
        <Segmented label="Tipo de nota" value={kind} onChange={setKind} isCompact options={[
          { value: 'idea', label: 'Ideas', count: db.notes.filter((note) => note.kind === 'idea').length },
          { value: 'aprendizaje', label: 'Aprendizajes', count: db.notes.filter((note) => note.kind === 'aprendizaje').length },
          { value: 'snippet', label: 'Snippets', count: db.notes.filter((note) => note.kind === 'snippet').length }
        ]} />
        <button type="button" className="button button--small button--primary" onClick={() => actions.openNote(null, kind)}><Icon name="plus" /> Nueva</button>
      </div>
      <div className="note-grid">
        {notes.map((note) => (
          <article key={note.id} className="note-card glass">
            <button type="button" className="note-card__main" onClick={() => actions.openNote(note)}>
              <span className="note-card__date">{note.createdAt ? formatDay(toISO(new Date(note.createdAt))) : ''}</span>
              <span className="note-card__title">{note.title}</span>
              {note.kind === 'snippet' ? <code className="note-card__code">{note.body}</code> : <p className="note-card__body">{note.body}</p>}
            </button>
            <footer className="note-card__footer">
              {(note.tags || []).map((tag) => <span key={tag} className="tag">#{tag}</span>)}
              {note.kind === 'snippet' && <button type="button" className="icon-button icon-button--small" aria-label={`Copiar ${note.title}`} onClick={() => copyHandler(note)}><Icon name="copy" /></button>}
            </footer>
          </article>
        ))}
        {!notes.length && <p className="empty">Aún no hay notas de este tipo. Prueba en la paleta: «idea: …» o «aprendí: …».</p>}
      </div>
    </div>
  );
}

export default function Work() {
  const { db, save, settings } = useData();
  const { showToast } = useUi();
  const actions = useActions();
  const today = todayISO();
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || 'tareas');
  const [view, setView] = useState('tablero');
  const [area, setArea] = useState('todas');
  const [quick, setQuick] = useState('');

  const [search, setSearch] = useState('');
  const [project, setProject] = useState('');
  const [isUrgentOnly, setIsUrgentOnly] = useState(false);
  const plainSearch = search.trim().toLowerCase();
  const tasks = db.tasks.filter((task) => (area === 'todas' || task.area === area)
    && (!project || task.project === project)
    && (!isUrgentOnly || task.priority === 1)
    && (!plainSearch || `${task.title} ${task.project} ${task.notes || ''}`.toLowerCase().includes(plainSearch)));
  const pending = db.tasks.filter((task) => task.status !== 'done');
  /* Proyectos con tareas pendientes, el de mas trabajo primero */
  const projects = Object.entries(pending.reduce((groups, task) => {
    if (task.project) (groups[task.project] ||= []).push(task);
    return groups;
  }, {})).sort((a, b) => b[1].length - a[1].length);
  const doneThisWeek = db.tasks.filter((task) => task.status === 'done' && task.doneAt >= startOfWeek(today)).length;
  const overdue = pending.filter((task) => task.due && task.due < today).length;

  const moveHandler = (task, status) => {
    save('tasks', withStatus(task, status));
    if (status === 'done') showToast('¡Hecha! Una menos ✓', 'success');
  };

  const quickHandler = async (event) => {
    event.preventDefault();
    const parsed = quickParse(quick, today);
    if (!parsed) return;
    if (parsed.type !== 'task') {
      showToast('Para carreras, lecturas o ideas usa la paleta (Ctrl + K)');
      return;
    }
    await save('tasks', { ...parsed.data, area: area === 'personal' ? 'personal' : parsed.data.area });
    setQuick('');
    showToast('Tarea añadida');
  };

  return (
    <div className="view work">
      <header className="work-hero">
        <Waves />
        <p className="work-hero__hello">¡Hola, {settings.name.split(' ')[0]}!</p>
        <h1 className="work-hero__title">Hagamos tu mejor<br />trabajo hoy</h1>
        <p className="work-hero__lead">{pending.length} pendientes · {doneThisWeek} hechas esta semana{overdue ? ` · ${overdue} vencidas` : ''}</p>
        <div className="work-hero__search">
          <label className="work-search" htmlFor="work-search">
            <Icon name="search" />
            <span className="visually-hidden">Buscar tareas</span>
            <input id="work-search" value={search} onChange={(event) => { setSearch(event.target.value); setTab('tareas'); }} placeholder="Buscar tareas o proyectos" autoComplete="off" />
          </label>
          <button type="button" className={`work-filter${isUrgentOnly ? ' work-filter--active' : ''}`} aria-pressed={isUrgentOnly} aria-label="Solo prioridad alta" onClick={() => { setIsUrgentOnly(!isUrgentOnly); setTab('tareas'); }}>
            <Icon name="flag" />
          </button>
        </div>
      </header>

      {projects.length > 0 && (
        <section className="stack" aria-labelledby="projects-title">
          <SectionHeader id="projects-title" title="Proyectos" action={project ? <button type="button" className="section-header__link" onClick={() => setProject('')}>Ver todo</button> : null} />
          <ul className="project-row">
            {projects.map(([name, list], index) => {
              const next = [...list].sort(compareTasks)[0];
              const isActive = project === name;
              return (
                <li key={name}>
                  <button type="button" className={`project-card${index === 0 ? ' project-card--dark' : ''}${isActive ? ' project-card--active' : ''}`} aria-pressed={isActive} onClick={() => { setProject(isActive ? '' : name); setTab('tareas'); }}>
                    <span className="project-card__icon"><Icon name={PROJECT_ICONS[index % PROJECT_ICONS.length]} /></span>
                    <span className="project-card__name">#{name}</span>
                    <span className="project-card__text">{next.title}</span>
                    <span className="project-card__foot">
                      <span>{list.length} {list.length === 1 ? 'pendiente' : 'pendientes'}</span>
                      <span className="project-card__go" aria-hidden="true"><Icon name="chevron-right" /></span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Segmented label="Secciones de trabajo" value={tab} onChange={setTab} options={[
        { value: 'tareas', label: 'Tareas' }, { value: 'foco', label: 'Foco' }, { value: 'standup', label: 'Standup' }, { value: 'notas', label: 'Notas' }
      ]} />

      {tab === 'tareas' && (
        <section className="stack" aria-label="Tareas">
          <form className="quick-add glass" onSubmit={quickHandler}>
            <label htmlFor="quick-task" className="visually-hidden">Añadir tarea rápida</label>
            <Icon name="plus" />
            <input id="quick-task" className="quick-add__input" value={quick} onChange={(event) => setQuick(event.target.value)} placeholder="Añadir tarea… prueba «Deploy a staging !alta mañana #api»" autoComplete="off" />
            <button type="submit" className="quick-add__button" aria-label="Añadir"><Icon name="arrow-right" /></button>
          </form>
          <div className="toolbar">
            <Segmented label="Área" isCompact value={area} onChange={setArea} options={[{ value: 'todas', label: 'Todo' }, { value: 'trabajo', label: 'Trabajo' }, { value: 'personal', label: 'Personal' }]} />
            <div className="toolbar__end">
              <button type="button" className={`icon-button${view === 'tablero' ? ' icon-button--active' : ''}`} aria-pressed={view === 'tablero'} aria-label="Vista tablero" onClick={() => setView('tablero')}><Icon name="columns" /></button>
              <button type="button" className={`icon-button${view === 'lista' ? ' icon-button--active' : ''}`} aria-pressed={view === 'lista'} aria-label="Vista lista" onClick={() => setView('lista')}><Icon name="list" /></button>
              <button type="button" className={`icon-button${view === 'hoy' ? ' icon-button--active' : ''}`} aria-pressed={view === 'hoy'} aria-label="Vista Hoy con línea de tiempo" onClick={() => setView('hoy')}><Icon name="calendar" /></button>
            </div>
          </div>
          {view === 'tablero' && <Board tasks={tasks} onOpen={actions.openTask} onMove={moveHandler} />}
          {view === 'lista' && <TaskList tasks={tasks} onOpen={actions.openTask} onMove={moveHandler} today={today} />}
          {view === 'hoy' && <WorkToday tasks={tasks} onOpen={actions.openTask} onMove={moveHandler} />}
        </section>
      )}

      {tab === 'foco' && (
        <section className="work__focus" aria-label="Foco">
          <FocusTimer initialTaskId={location.state?.taskId} />
          <div className="glass glass--padded">
            <SectionHeader title="Minutos de foco por semana" />
            <BarChart data={weeklySeries(db, 'focus')} unit="min" label="Minutos de foco por semana" />
          </div>
        </section>
      )}

      {tab === 'standup' && <Standup />}
      {tab === 'notas' && <Notes />}
    </div>
  );
}
