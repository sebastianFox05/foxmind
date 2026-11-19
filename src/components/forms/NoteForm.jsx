/* Ideas, aprendizajes (TIL) y snippets de codigo */
import { useState } from 'react';
import { useData } from '../../session/DataContext.jsx';
import { useUi } from '../../ui/UiContext.jsx';

export default function NoteForm({ note = {}, kind = 'idea', onDone }) {
  const { save, remove } = useData();
  const { showToast, confirm } = useUi();
  const [draft, setDraft] = useState({ kind, title: '', body: '', tags: [], ...note });
  const [tags, setTags] = useState((note.tags || []).join(', '));

  const submitHandler = async (event) => {
    event.preventDefault();
    await save('notes', { ...draft, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean) });
    showToast('Nota guardada');
    onDone();
  };

  const deleteHandler = async () => {
    if (!(await confirm('Se borrará esta nota.'))) return;
    await remove('notes', note.id);
    onDone();
  };

  return (
    <form className="form" onSubmit={submitHandler}>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="note-kind">Tipo</label>
          <select id="note-kind" className="field__input" value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value })}>
            <option value="idea">Idea</option>
            <option value="aprendizaje">Aprendizaje</option>
            <option value="snippet">Snippet</option>
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="note-tags">Etiquetas</label>
          <input id="note-tags" className="field__input" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="react, postgres" />
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="note-title">Título</label>
        <input id="note-title" className="field__input" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="note-body">{draft.kind === 'snippet' ? 'Código' : 'Detalle'}</label>
        <textarea id="note-body" rows="5" className={`field__input field__input--area${draft.kind === 'snippet' ? ' field__input--code' : ''}`} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} spellCheck={draft.kind !== 'snippet'} />
      </div>
      <div className="form__actions">
        {note.id && <button type="button" className="button button--ghost button--danger-text" onClick={deleteHandler}>Borrar</button>}
        <button type="submit" className="button button--primary">Guardar</button>
      </div>
    </form>
  );
}
