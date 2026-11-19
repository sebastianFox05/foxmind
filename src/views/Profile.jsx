/*
 * Perfil: revision semanal automatica (comparada con la semana anterior), objetivos, actividades diarias,
 * copia de seguridad, modo de datos, atajos de teclado y creditos de las fotos.
 */
import { useRef, useState } from 'react';
import { useData } from '../session/DataContext.jsx';
import { useUi } from '../ui/UiContext.jsx';
import { useActions } from '../ui/useActions.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import Icon from '../components/Icon.jsx';
import { addDays, formatDay, isoWeekNumber, startOfWeek, todayISO } from '../lib/dates.js';
import { habitStreak, weekSummary } from '../lib/stats.js';
import { downloadFile, formatNumber, uid } from '../lib/utils.js';
import { parseBackup } from '../lib/store/collections.js';
import { createSeed } from '../lib/seed.js';
import { HERO_PHOTOS, MONTH_PHOTOS, coverPhoto } from '../lib/photos.js';
import Photo from '../components/Photo.jsx';
import Avatar from '../components/Avatar.jsx';
import ProfileCustomizer from '../components/ProfileCustomizer.jsx';
import InstallApp from '../components/InstallApp.jsx';

const SUMMARY_ROWS = [
  ['tasksDone', 'Tareas cerradas', ''],
  ['gymSessions', 'Sesiones de gym', ''],
  ['runKm', 'Kilómetros', ' km'],
  ['pages', 'Páginas leídas', ''],
  ['focusMin', 'Minutos de foco', ' min'],
  ['habitRate', 'Actividades cumplidas', ' %']
];

function WeeklyReview() {
  const { db, save } = useData();
  const { showToast } = useUi();
  const [weekStart, setWeekStart] = useState(startOfWeek(todayISO()));
  const current = weekSummary(db, weekStart);
  const previous = weekSummary(db, addDays(weekStart, -7));
  const title = `Semana ${isoWeekNumber(weekStart)}`;
  const existing = db.notes.find((note) => note.kind === 'revision' && note.weekStart === weekStart);
  const [text, setText] = useState(existing?.body || '');

  const weekHandler = (amount) => {
    const next = addDays(weekStart, amount * 7);
    setWeekStart(next);
    setText(db.notes.find((note) => note.kind === 'revision' && note.weekStart === next)?.body || '');
  };

  const saveHandler = async () => {
    await save('notes', { ...existing, kind: 'revision', weekStart, title, body: text, tags: ['revision'] });
    showToast('Revisión guardada');
  };

  const valueOf = (summary, key) => (key === 'habitRate' ? Math.round(summary[key] * 100) : summary[key]);

  return (
    <section className="glass glass--padded" aria-labelledby="review-title">
      <div className="section-header">
        <h2 className="section-header__title" id="review-title">Revisión semanal · {title}</h2>
        <span className="section-header__controls">
          <button type="button" className="icon-button icon-button--small" aria-label="Semana anterior" onClick={() => weekHandler(-1)}><Icon name="chevron-left" /></button>
          <button type="button" className="icon-button icon-button--small" aria-label="Semana siguiente" onClick={() => weekHandler(1)} disabled={weekStart >= startOfWeek(todayISO())}><Icon name="chevron-right" /></button>
        </span>
      </div>
      <p className="form__hint">{formatDay(current.start)} – {formatDay(current.end)}</p>
      <ul className="review-grid">
        {SUMMARY_ROWS.map(([key, label, unit]) => {
          const value = valueOf(current, key);
          const delta = value - valueOf(previous, key);
          return (
            <li key={key} className="review-grid__item">
              <strong className="review-grid__value">{formatNumber(value)}{unit}</strong>
              <span className="review-grid__label">{label}</span>
              <span className={`review-grid__delta review-grid__delta--${delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'}`}>{delta > 0 ? '▲' : delta < 0 ? '▼' : '='} {formatNumber(Math.abs(delta))} vs. anterior</span>
            </li>
          );
        })}
      </ul>
      <div className="field">
        <label className="field__label" htmlFor="review-text">¿Qué salió bien, qué mejorarás y cuál es el foco de la próxima semana?</label>
        <textarea id="review-text" rows="4" className="field__input field__input--area" value={text} onChange={(event) => setText(event.target.value)} />
      </div>
      <button type="button" className="button button--primary" onClick={saveHandler}>Guardar revisión</button>
    </section>
  );
}

function SettingsForm() {
  const { settings, saveSettings } = useData();
  const { showToast } = useUi();
  const [draft, setDraft] = useState(settings);
  const change = (field) => (event) => setDraft({ ...draft, [field]: event.target.value });
  const fields = [
    ['dailyReadingMin', 'Lectura diaria (min)'], ['weeklyGymGoal', 'Gym por semana'], ['weeklyKmGoal', 'Km por semana'],
    ['weeklyActiveGoal', 'Minutos activos / semana'], ['yearBooksGoal', 'Libros al año'], ['focusMinutes', 'Bloque de foco (min)'],
    ['calorieGoal', 'Calorías al día'], ['proteinGoal', 'Proteína (g)'], ['carbsGoal', 'Carbohidratos (g)'], ['fatGoal', 'Grasa (g)']
  ];
  const submitHandler = async (event) => {
    event.preventDefault();
    /* Solo los objetivos: nombre, foto y demas los guarda "Personaliza tu perfil" */
    await saveSettings(Object.fromEntries(fields.map(([key]) => [key, Number(draft[key]) || 0])));
    showToast('Ajustes guardados');
  };
  return (
    <form className="glass glass--padded form" onSubmit={submitHandler} aria-labelledby="settings-title">
      <h2 className="section-header__title" id="settings-title">Tus objetivos</h2>
      <div className="form__grid">
        {fields.map(([key, label]) => (
          <div key={key} className="field">
            <label className="field__label" htmlFor={`settings-${key}`}>{label}</label>
            <input id={`settings-${key}`} type="number" min="0" className="field__input" value={draft[key]} onChange={change(key)} />
          </div>
        ))}
      </div>
      <div className="form__actions"><button type="submit" className="button button--primary">Guardar</button></div>
    </form>
  );
}

function DataSection() {
  const { db, replaceAll, mode, signOut, session } = useData();
  const { showToast, confirm } = useUi();
  const fileRef = useRef(null);
  const isDemo = db.settings[0]?.isDemo;

  const exportHandler = () => {
    downloadFile(`foxmind-${todayISO()}.json`, JSON.stringify({ app: 'foxmind', version: 1, exportedAt: new Date().toISOString(), collections: db }, null, 2));
    showToast('Copia descargada');
  };

  /* replaceAll revierte la pantalla si falla; aqui solo se avisa */
  const replaceSafely = async (next, message) => {
    try {
      await replaceAll(next);
      showToast(message, 'success');
    } catch (reason) {
      showToast(`No se pudo completar: ${reason.message || 'error de conexión'}. Tus datos siguen como estaban.`, 'danger');
    }
  };

  const importHandler = async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    let parsed;
    try {
      parsed = parseBackup(JSON.parse(await file.text()));
    } catch {
      showToast('El archivo no es un JSON válido', 'danger');
      return;
    }
    if (parsed.error) {
      showToast(parsed.error, 'danger');
      return;
    }
    if (!(await confirm('Se reemplazarán todos tus datos actuales por los de la copia.', { confirmLabel: 'Importar' }))) return;
    await replaceSafely(parsed.data, 'Copia importada');
  };

  const clearHandler = async () => {
    if (!(await confirm('Se borrarán TODOS los datos (también los de ejemplo) para empezar de cero. Descarga antes una copia si la necesitas.', { confirmLabel: 'Empezar de cero' }))) return;
    const now = new Date().toISOString();
    await replaceSafely({ settings: [{ createdAt: now, ...db.settings[0], id: db.settings[0]?.id || uid(), updatedAt: now, isDemo: false }] }, 'Listo: empieza a registrar tu día');
  };

  const demoHandler = async () => {
    if (!(await confirm('Se reemplazarán tus datos por los de ejemplo.', { confirmLabel: 'Cargar ejemplo', isDanger: false }))) return;
    await replaceSafely(createSeed(), 'Datos de ejemplo cargados');
  };

  return (
    <section className="glass glass--padded" aria-labelledby="data-title">
      <h2 className="section-header__title" id="data-title">Tus datos</h2>
      <p className="form__hint">
        {mode === 'cloud' ? `Sincronizado en la nube (Supabase) como ${session?.user?.email}.` : 'Modo local: los datos viven en este navegador. Descarga copias a menudo o activa la nube (README).'}
        {isDemo && ' Ahora mismo ves datos de ejemplo.'}
      </p>
      <div className="button-row">
        <button type="button" className="button button--ghost" onClick={exportHandler}><Icon name="download" /> Descargar copia</button>
        <button type="button" className="button button--ghost" onClick={() => fileRef.current.click()}><Icon name="upload" /> Importar copia</button>
        <input ref={fileRef} type="file" accept="application/json" className="visually-hidden" tabIndex={-1} aria-hidden="true" onChange={importHandler} />
        <button type="button" className="button button--ghost" onClick={demoHandler}>Cargar ejemplo</button>
        <button type="button" className="button button--ghost button--danger-text" onClick={clearHandler}><Icon name="trash" /> Empezar de cero</button>
        <button type="button" className="button button--ghost" onClick={signOut}><Icon name="logout" /> Cerrar sesión</button>
      </div>
    </section>
  );
}

export default function Profile() {
  const { db, settings } = useData();
  const actions = useActions();
  const today = todayISO();
  return (
    <div className="view profile">
      <header className="profile-cover">
        <Photo photo={coverPhoto(settings.cover)} className="profile-cover__photo" isEager isDecorative />
        <div className="profile-cover__body">
          <Avatar settings={settings} className="avatar--large" />
          <div className="profile-cover__text">
            <h1 className="profile-cover__name">{settings.name}</h1>
            <p className="profile-cover__role">{settings.role || 'Tu sistema personal'}</p>
            {settings.bio && <p className="profile-cover__bio">«{settings.bio}»</p>}
          </div>
        </div>
      </header>

      <div className="profile__grid">
        <ProfileCustomizer />
        <InstallApp />
        <WeeklyReview />
        <SettingsForm />

        <section className="glass glass--padded" aria-labelledby="habits-admin-title">
          <SectionHeader id="habits-admin-title" title="Actividades diarias" action={<button type="button" className="section-header__link" onClick={() => actions.openHabit()}>+ Añadir</button>} />
          <ul className="admin-list">
            {db.habits.map((habit) => (
              <li key={habit.id}>
                <button type="button" className="admin-list__row" onClick={() => actions.openHabit(habit)}>
                  <span className="habit-pill__icon"><Icon name={habit.icon} /></span>
                  <span className="admin-list__name">{habit.name}</span>
                  <span className="admin-list__meta">🔥 {habitStreak(habit, today)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <DataSection />

        <section className="glass glass--padded" aria-labelledby="shortcuts-title">
          <h2 className="section-header__title" id="shortcuts-title">Atajos y captura rápida</h2>
          <dl className="shortcut-list">
            <div><dt><kbd>Ctrl</kbd> + <kbd>K</kbd></dt><dd>Paleta de comandos y búsqueda</dd></div>
            <div><dt>«Deploy !alta mañana #api»</dt><dd>Tarea con prioridad, fecha y proyecto</dd></div>
            <div><dt>«corrí 8 km 44 min»</dt><dd>Carrera con ritmo calculado</dd></div>
            <div><dt>«leí 30 pág 25 min»</dt><dd>Lectura del libro actual</dd></div>
            <div><dt>«idea: …» / «aprendí: …»</dt><dd>Inbox de ideas y aprendizajes</dd></div>
            <div><dt>«gym pierna»</dt><dd>Sesión con la rutina precargada</dd></div>
          </dl>
        </section>

        <section className="glass glass--padded" aria-labelledby="credits-title">
          <h2 className="section-header__title" id="credits-title">Créditos de las fotos</h2>
          <p className="form__hint">Wikimedia Commons.</p>
          <ul className="credits">
            {[...MONTH_PHOTOS, ...Object.values(HERO_PHOTOS)].map((photo) => <li key={photo.src}>{photo.alt} — {photo.author} ({photo.license})</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
