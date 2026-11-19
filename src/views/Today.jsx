/*
 * Hoy, en clave de cartelera (reel del cine): chips Ayer / Hoy / Mañana centrados, fecha gigante,
 * posters de lo programado (rutinas, tarea prioritaria, lectura) con su ficha a pantalla completa.
 * Debajo: semana en circulos, puntuacion, tarjetas, acceso a la Rutina del dia, agenda, retos y constancia.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../session/DataContext.jsx';
import { useUi } from '../ui/UiContext.jsx';
import { useActions } from '../ui/useActions.jsx';
import Segmented from '../components/Segmented.jsx';
import WeekStrip from '../components/WeekStrip.jsx';
import TaskCard from '../components/TaskCard.jsx';
import ChallengeCard from '../components/ChallengeCard.jsx';
import InsightList from '../components/InsightList.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import FeatureCarousel from '../components/FeatureCarousel.jsx';
import PosterDetail from '../components/PosterDetail.jsx';
import Photo from '../components/Photo.jsx';
import DailyChallenge from '../components/DailyChallenge.jsx';
import DayTimeline, { buildTimeline } from '../components/DayTimeline.jsx';
import PlanGrid, { upcomingSessions } from '../components/PlanGrid.jsx';
import TrainingToday from '../components/TrainingToday.jsx';
import WeekCapsules from '../components/WeekCapsules.jsx';
import Icon from '../components/Icon.jsx';
import { Heatmap, Ring } from '../components/Charts.jsx';
import { addDays, capitalize, isoWeekNumber, MONTHS_SHORT, parseISO, todayISO, WEEKDAYS, weekRange } from '../lib/dates.js';
import { challengeProgress, dailyScore, dayActivity, insights, isHabitDue, isHabitDone, tasksForDay } from '../lib/stats.js';
import { buildPosters } from '../lib/posters.js';
import { withStatus, compareTasks } from '../lib/tasks.js';
import { formatNumber, sum } from '../lib/utils.js';
import { HERO_PHOTOS } from '../lib/photos.js';

/* Pildoras de categoria con miniatura (referencia: "Hiking", "Sky tours") */
const CATEGORIES = [
  { value: 'todo', label: 'Todo', photo: HERO_PHOTOS.bosque },
  { value: 'gym', label: 'Gym', photo: HERO_PHOTOS.gym },
  { value: 'running', label: 'Running', photo: HERO_PHOTOS.running },
  { value: 'lectura', label: 'Lectura', photo: HERO_PHOTOS.lectura },
  { value: 'task', label: 'Trabajo', photo: HERO_PHOTOS.trabajo }
];

function ScoreBreakdown({ result }) {
  const rows = [
    ['Actividades diarias', result.parts.habitPart, 40],
    ['Tareas del día', result.parts.taskPart, 25],
    ['Entreno', result.parts.trainingPart, 20],
    ['Rutina de lectura', result.parts.readingPart, 15]
  ];
  return (
    <div className="form">
      <p className="form__hint">La puntuación se calcula sola con lo que registras. Sin entreno programado, el día cuenta como descanso.</p>
      <ul className="breakdown">
        {rows.map(([label, part, weight]) => (
          <li key={label} className="breakdown__row">
            <span>{label}</span>
            <span className="breakdown__bar" style={{ '--progress': `${Math.round(part * 100)}%` }} aria-hidden="true" />
            <strong>{Math.round(part * weight)}/{weight}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Today() {
  const { db, settings, save } = useData();
  const { openModal, showToast, setIsPaletteOpen } = useUi();
  const actions = useActions();
  const navigate = useNavigate();
  const today = todayISO();
  const [date, setDate] = useState(today);
  const dateObject = parseISO(date);
  const offset = date === today ? 'hoy' : date === addDays(today, -1) ? 'ayer' : date === addDays(today, 1) ? 'manana' : 'otro';

  const result = dailyScore(db, settings, date);
  const [filter, setFilter] = useState('todo');
  const [section, setSection] = useState('resumen');
  const posters = buildPosters(db, settings, date);
  const visiblePosters = filter === 'todo' ? posters : posters.filter((poster) => poster.kind === filter);
  const habits = db.habits.filter((habit) => isHabitDue(habit, date));
  const habitsDone = habits.filter((habit) => isHabitDone(habit, date)).length;
  const nextHabits = habits.filter((habit) => !isHabitDone(habit, date)).slice(0, 3);
  const agenda = tasksForDay(db, date).sort(compareTasks);
  const pendingCount = agenda.filter((task) => task.status !== 'done').length;
  const week = weekRange(today);
  const weekGym = db.workouts.filter((item) => item.date >= week.start && item.date <= week.end).length;
  const weekKm = sum(db.runs.filter((item) => item.date >= week.start && item.date <= week.end), (run) => run.km);
  const activeChallenges = db.challenges
    .map((challenge) => ({ challenge, progress: challengeProgress(challenge, db, today) }))
    .filter(({ progress }) => progress.status === 'activo')
    .sort((a, b) => Number(b.progress.isBehind) - Number(a.progress.isBehind) || a.progress.daysLeft - b.progress.daysLeft)
    .slice(0, 3);
  const journal = db.journal.find((entry) => entry.date === date);
  const alerts = insights(db, settings);

  const moveTaskHandler = (task, status) => {
    save('tasks', withStatus(task, status));
    if (status === 'done') showToast('¡Tarea completada! ✓', 'success');
  };

  const offsetHandler = (value) => setDate(value === 'ayer' ? addDays(today, -1) : value === 'manana' ? addDays(today, 1) : today);

  /* El boton "Empezar" de la ficha: abre el registro adecuado */
  const posterActionHandler = (poster) => {
    const source = poster.source;
    if (poster.kind === 'gym') actions.openWorkout(null, { name: source.name });
    else if (poster.kind === 'running') actions.openRun(null, { date, km: source.km, type: source.name.toLowerCase().includes('serie') ? 'series' : 'fondo' });
    else if (poster.kind === 'lectura') actions.openReading({ minutes: source.minutes, bookId: source.title ? source.id : undefined });
    else if (poster.kind === 'task') navigate('/trabajo', { state: { tab: 'foco', taskId: source.id } });
  };

  /* Linea de tiempo: rutinas abren su registro, tareas su ficha y el foco la pestaña Foco */
  const timelineHandler = (item) => {
    if (item.kind === 'task') actions.openTask(item.source);
    else if (item.kind === 'focus') navigate('/trabajo', { state: { tab: 'foco' } });
    else posterActionHandler({ kind: item.kind, source: item.source });
  };

  const openPosterHandler = (poster) => openModal({
    title: poster.title,
    size: 'poster',
    render: (close) => <PosterDetail poster={poster} onClose={close} onAction={(item) => { close(); posterActionHandler(item); }} />
  });

  return (
    <div className="view today">
      <section className="home-hero" aria-labelledby="today-title">
        <h1 className="home-hero__title" id="today-title">Hola, {settings.name.split(' ')[0]} <span aria-hidden="true">👋</span></h1>
        <div className="home-hero__row">
          <p className="home-hero__date">{capitalize(WEEKDAYS[dateObject.getDay()])} {dateObject.getDate()} {MONTHS_SHORT[dateObject.getMonth()]} · semana {isoWeekNumber(date)}</p>
          <Segmented
            label="Día"
            isCompact
            value={offset}
            onChange={offsetHandler}
            options={[{ value: 'ayer', label: 'Ayer' }, { value: 'hoy', label: 'Hoy' }, { value: 'manana', label: 'Mañana' }]}
          />
        </div>
        <div className="category-row" role="group" aria-label="Filtrar lo programado">
          {CATEGORIES.map((category) => {
            const count = category.value === 'todo' ? posters.length : posters.filter((poster) => poster.kind === category.value).length;
            return (
              <button key={category.value} type="button" className={`category-pill${filter === category.value ? ' category-pill--active' : ''}`} aria-pressed={filter === category.value} onClick={() => setFilter(category.value)}>
                <Photo photo={category.photo} className="category-pill__thumb" isDecorative />
                {category.label}
                {count > 0 && <span className="category-pill__count">{count}</span>}
              </button>
            );
          })}
        </div>
        <FeatureCarousel posters={visiblePosters} onOpen={openPosterHandler} onAction={posterActionHandler} />
      </section>

      <Segmented label="Secciones de hoy" value={section} onChange={setSection} options={[
        { value: 'resumen', label: 'Resumen' }, { value: 'agenda', label: 'Agenda' }, { value: 'plan', label: 'Plan' }, { value: 'progreso', label: 'Progreso' }
      ]} />

      {section === 'resumen' && (
      <div className="today__grid">
        <div className="today__column">
          <DailyChallenge db={db} />
          <WeekStrip selected={date} onSelect={setDate} getScore={(day) => dailyScore(db, settings, day).score} />

          <button type="button" className="score-card glass" onClick={() => openModal({ title: 'Cómo se calcula tu puntuación', render: () => <ScoreBreakdown result={result} /> })}>
            <span className="score-card__number">{result.score}</span>
            <span className="score-card__label">Tu puntuación<br />{date === today ? 'de hoy' : 'del día'}</span>
            <Ring value={result.score / 100} size={58} stroke={5} label={`Puntuación ${result.score} de 100`}>
              <Icon name="flame" />
            </Ring>
          </button>
        </div>

        <div className="today__column">
          <div className="tile-grid">
            <Link to="/trabajo" className="tile tile--accent">
              <span className="tile__label">Pendientes<br />{date === today ? 'hoy' : 'del día'}</span>
              <span className="tile__icon"><Icon name="briefcase" /></span>
              <strong className="tile__number">{pendingCount}</strong>
              <span className="tile__footer">{pendingCount === 1 ? 'tarea' : 'tareas'} <Icon name="arrow-right" /></span>
            </Link>
            <Link to="/entreno" className="tile">
              <span className="tile__label">Entreno<br />esta semana</span>
              <span className="tile__icon"><Icon name="dumbbell" /></span>
              <strong className="tile__number">{weekGym}<small>/{settings.weeklyGymGoal}</small></strong>
              <span className="tile__footer">gym · {formatNumber(weekKm)} km <Icon name="arrow-right" /></span>
            </Link>
          </div>

          <Link to="/rutina" state={{ date }} className="ritual-card">
            <span className="ritual-card__glow" aria-hidden="true" />
            <span className="ritual-card__head">
              <span className="ritual-card__eyebrow">Actividades diarias</span>
              <Ring value={habits.length ? habitsDone / habits.length : 0} size={54} stroke={4} label={`${habitsDone} de ${habits.length} actividades`}>
                <strong className="ritual-card__count">{habitsDone}/{habits.length}</strong>
              </Ring>
            </span>
            <strong className="ritual-card__title">{habitsDone === habits.length ? '¡Rutina completa!' : 'Tu rutina del día'}</strong>
            <span className="ritual-card__next">
              {nextHabits.length ? nextHabits.map((habit) => (
                <span key={habit.id} className="ritual-card__habit"><Icon name={habit.icon} />{habit.name}</span>
              )) : <span className="ritual-card__habit">Todo marcado. Cierra el día con el diario.</span>}
            </span>
            <span className="ritual-card__cta">Abrir rutina <Icon name="arrow-right" /></span>
          </Link>
        </div>
      </div>
      )}

      {section === 'agenda' && (
        <div className="today__grid">
          <section className="today__section" aria-labelledby="timeline-title">
            <SectionHeader id="timeline-title" title="Actividad del día" />
            <WeekCapsules selected={date} onSelect={setDate} hasActivity={(day) => buildTimeline(db, settings, day).length > 0} />
            <DayTimeline items={buildTimeline(db, settings, date)} date={date} onOpen={timelineHandler} />
          </section>
          <section className="today__section" aria-labelledby="agenda-title">
            <SectionHeader id="agenda-title" title="Tareas" action={<button type="button" className="section-header__link" onClick={() => actions.openTask(null, { due: date })}>+ Tarea</button>} />
            {agenda.length ? (
              <div className="stack">
                {agenda.map((task) => <TaskCard key={task.id} task={task} onOpen={actions.openTask} onMove={moveTaskHandler} isCompact />)}
              </div>
            ) : <p className="empty">Nada con fecha para este día. Elige tus 3 prioridades.</p>}
          </section>
        </div>
      )}

      {section === 'plan' && (
        <div className="today__grid">
          <section className="today__section" aria-labelledby="training-today-title">
            <SectionHeader id="training-today-title" title="Entreno de hoy" to="/entreno" linkLabel="Ver entreno" />
            <TrainingToday db={db} settings={settings} date={date} onCardio={(routine) => actions.openRun(null, { date, km: routine?.km || 5, type: 'rodaje' })} />
          </section>
          <section className="today__section" aria-labelledby="your-plan-title">
            <SectionHeader id="your-plan-title" title="Tu plan" />
            <PlanGrid sessions={upcomingSessions(db, today)} onOpen={(routine) => actions.openRoutine(routine)} onPalette={() => setIsPaletteOpen(true)} onJournal={() => actions.openJournal(today)} onBoard={() => actions.openBoard()} />
          </section>
        </div>
      )}

      {section === 'progreso' && (
        <div className="today__grid">
          <div className="today__column">
            <section className="today__section" aria-labelledby="alerts-title">
              <SectionHeader id="alerts-title" title="Para ser proactivo" />
              <InsightList items={alerts} limit={4} />
            </section>
            <section className="today__section" aria-labelledby="journal-title">
              <SectionHeader id="journal-title" title="Intención y diario" />
              <button type="button" className="journal-card glass" onClick={() => actions.openJournal(date)}>
                <span className="journal-card__quote">{journal?.intention || 'Escribe la intención del día'}</span>
                <span className="journal-card__meta">{journal ? `Ánimo ${'●'.repeat(journal.mood)}${'○'.repeat(5 - journal.mood)} · editar` : 'Toca para abrir el diario'}</span>
              </button>
            </section>
          </div>
          <div className="today__column">
            <section className="today__section" aria-labelledby="challenges-title">
              <SectionHeader id="challenges-title" title="Retos en marcha" to="/retos" />
              <div className="stack">
                {activeChallenges.map(({ challenge }) => <ChallengeCard key={challenge.id} challenge={challenge} onOpen={actions.openChallenge} isCompact />)}
              </div>
            </section>
            <section className="today__section" aria-labelledby="heatmap-title">
              <SectionHeader id="heatmap-title" title="Constancia" />
              <div className="glass glass--padded">
                <Heatmap getValue={(day) => dayActivity(db, day)} />
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
