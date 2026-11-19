/* Crear o editar una tarea: estado, prioridad, proyecto, fecha, subtareas y bloqueo */
import { useState } from 'react';
import { useData } from '../../session/DataContext.jsx';
import { useUi } from '../../ui/UiContext.jsx';
import { todayISO } from '../../lib/dates.js';
import { uid } from '../../lib/utils.js';
import Icon from '../Icon.jsx';

const PRIORITIES = [{ value: 1, label: 'Alta' }, { value: 2, label: 'Media' }, { value: 3, label: 'Baja' }];

export default function TaskForm({ task = {}, onDone }) {
  const { db, save, remove } = useData();
  const { showToast, confirm } = useUi();
  const [draft, setDraft] = useState({ title: '', notes: '', status: 'todo', priority: 2, area: 'trabajo', project: '', due: '', subtasks: [], isBlocked: false, blockedReason: '', ...task });
  const [subtask, setSubtask] = useState('');
  const projects = [...new Set(db.tasks.map((item) => item.project).filter(Boolean))];

  const changeHandler = (field) => (event) => setDraft({ ...draft, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value });

  const addSubtaskHandler = () => {
    if (!subtask.trim()) return;
    setDraft({ ...draft, subtasks: [...draft.subtasks, { id: uid(), title: subtask.trim(), done: false }] });
    setSubtask('');
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    const isAlreadyDone = task.status === 'done';
    const isDone = draft.status === 'done';
    await save('tasks', { ...draft, title: draft.title.trim(), priority: Number(draft.priority), doneAt: isDone ? (isAlreadyDone ? task.doneAt : todayISO()) : '' });
    showToast(task.id ? 'Tarea actualizada' : 'Tarea creada');
    onDone();
  };

  const deleteHandler = async () => {
    if (!(await confirm(`Se borrará «${task.title}».`))) return;
    await remove('tasks', task.id);
    showToast('Tarea borrada');
    onDone();
  };

  return (
    <form className="form" onSubmit={submitHandler}>
      <div className="field">
        <label className="field__label" htmlFor="task-title">Tarea</label>
        <input id="task-title" className="field__input" value={draft.title} onChange={changeHandler('title')} placeholder="¿Qué hay que hacer?" required />
      </div>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="task-status">Estado</label>
          <select id="task-status" className="field__input" value={draft.status} onChange={changeHandler('status')}>
            <option value="todo">Por hacer</option>
            <option value="doing">En curso</option>
            <option value="done">Hecha</option>
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="task-due">Fecha límite</label>
          <input id="task-due" type="date" className="field__input" value={draft.due} onChange={changeHandler('due')} />
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="task-time">Hora (para la vista Hoy)</label>
        <input id="task-time" type="time" className="field__input" value={draft.time || ''} onChange={changeHandler('time')} />
      </div>
      <fieldset className="field field--chips">
        <legend className="field__label">Prioridad</legend>
        <div className="chip-group">
          {PRIORITIES.map((option) => (
            <label key={option.value} className={`chip chip--priority-${option.value}${Number(draft.priority) === option.value ? ' chip--active' : ''}`}>
              <input type="radio" name="priority" className="visually-hidden" value={option.value} checked={Number(draft.priority) === option.value} onChange={changeHandler('priority')} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="task-project">Proyecto</label>
          <input id="task-project" className="field__input" list="task-projects" value={draft.project} onChange={changeHandler('project')} placeholder="api, frontend…" />
          <datalist id="task-projects">{projects.map((project) => <option key={project} value={project} />)}</datalist>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="task-area">Área</label>
          <select id="task-area" className="field__input" value={draft.area} onChange={changeHandler('area')}>
            <option value="trabajo">Trabajo</option>
            <option value="personal">Personal</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="task-subtask">Subtareas</label>
        <ul className="subtask-list">
          {draft.subtasks.map((item) => (
            <li key={item.id} className="subtask-list__item">
              <label className="check">
                <input type="checkbox" checked={item.done} onChange={() => setDraft({ ...draft, subtasks: draft.subtasks.map((entry) => (entry.id === item.id ? { ...entry, done: !entry.done } : entry)) })} />
                <span>{item.title}</span>
              </label>
              <button type="button" className="icon-button icon-button--small icon-button--bare" aria-label={`Quitar ${item.title}`} onClick={() => setDraft({ ...draft, subtasks: draft.subtasks.filter((entry) => entry.id !== item.id) })}>
                <Icon name="x" />
              </button>
            </li>
          ))}
        </ul>
        <div className="field__inline">
          <input id="task-subtask" className="field__input" value={subtask} onChange={(event) => setSubtask(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSubtaskHandler(); } }} placeholder="Añadir paso y pulsar Enter" />
          <button type="button" className="icon-button" aria-label="Añadir subtarea" onClick={addSubtaskHandler}><Icon name="plus" /></button>
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="task-notes">Notas</label>
        <textarea id="task-notes" className="field__input field__input--area" rows="3" value={draft.notes} onChange={changeHandler('notes')} placeholder="Enlaces, contexto, criterios de aceptación…" />
      </div>
      <label className="check">
        <input type="checkbox" checked={draft.isBlocked} onChange={changeHandler('isBlocked')} />
        <span>Bloqueada</span>
      </label>
      {draft.isBlocked && (
        <div className="field">
          <label className="field__label" htmlFor="task-blocked">¿Qué la bloquea?</label>
          <input id="task-blocked" className="field__input" value={draft.blockedReason} onChange={changeHandler('blockedReason')} placeholder="Esperando a…" />
        </div>
      )}
      <div className="form__actions">
        {task.id && <button type="button" className="button button--ghost button--danger-text" onClick={deleteHandler}>Borrar</button>}
        <button type="submit" className="button button--primary">{task.id ? 'Guardar' : 'Crear tarea'}</button>
      </div>
    </form>
  );
}
