/*
 * Entreno con el diseño fitness (referencia menta): fondo menta-melocoton, tarjetas de cristal blanco y
 * acento turquesa. Pestañas:
 *   Resumen   → portada "Tu camino fitness", progreso de la semana con anillo, actividad semanal y accesos rapidos
 *   Entrenos  → buscador, filtros, tarjetas con foto y ficha; plan semanal e historial (gym + running)
 *   Actividad → Dia / Semana / Mes / Año: calorias estimadas, grafica, anillos de actividad y km
 *   Nutricion → meta de calorias, macros y comidas del dia
 *   Records   → tablero del cuarto y records automaticos
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../session/DataContext.jsx';
import { useUi } from '../ui/UiContext.jsx';
import { useActions } from '../ui/useActions.jsx';
import Segmented from '../components/Segmented.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import Photo from '../components/Photo.jsx';
import Icon from '../components/Icon.jsx';
import WeekCapsules from '../components/WeekCapsules.jsx';
import WorkoutDetail from '../components/WorkoutDetail.jsx';
import ExerciseGuide from '../components/ExerciseGuide.jsx';
import { EXERCISES, MUSCLE_GROUPS, findExercise } from '../lib/exercises.js';
import { Ring } from '../components/Charts.jsx';
import { HERO_PHOTOS } from '../lib/photos.js';
import { activitySeries, activitySummary, exerciseRecords, nutritionFor, routineEstimate, runKcal, runPace, runRecords, workoutKcal, workoutVolume } from '../lib/stats.js';
import { addDays, formatDay, formatMinutes, formatPace, MONTHS_SHORT, monthRange, parseISO, todayISO, WEEK_ORDER, WEEKDAYS_SHORT, weekDays, weekRange, weekday, yearRange } from '../lib/dates.js';
import { formatNumber, sortBy, sum } from '../lib/utils.js';

const RUN_TYPES = { rodaje: 'Rodaje', series: 'Series', fondo: 'Fondo', tempo: 'Tempo', carrera: 'Competición' };
const KIND_ICON = { gym: 'dumbbell', running: 'run', lectura: 'book' };
const FILTERS = [{ value: 'todos', label: 'Todos' }, { value: 'gym', label: 'Fuerza' }, { value: 'running', label: 'Cardio' }];
const MEAL_TYPES = [
  { value: 'desayuno', label: 'Desayuno', icon: 'sunrise' },
  { value: 'almuerzo', label: 'Almuerzo', icon: 'sun' },
  { value: 'cena', label: 'Cena', icon: 'moon' },
  { value: 'snack', label: 'Snack', icon: 'heart' }
];

/* ---------- Piezas pequeñas ---------- */

function WeekBars({ data, today, label }) {
  const max = Math.max(1, ...data.map((item) => item.minutes));
  return (
    <figure className="fit-bars">
      <div className="fit-bars__plot" role="img" aria-label={`${label}: ${data.map((item) => `${formatDay(item.date)} ${item.minutes} min`).join(', ')}`}>
        {data.map((item) => (
          <span key={item.date} className={`fit-bars__bar${item.date === today ? ' fit-bars__bar--today' : ''}`} style={{ '--value': `${Math.max(6, (item.minutes / max) * 100)}%` }} />
        ))}
      </div>
      <figcaption className="fit-bars__labels" aria-hidden="true">
        {data.map((item) => <span key={item.date} className={item.date === today ? 'fit-bars__label--today' : ''}>{WEEKDAYS_SHORT[parseISO(item.date).getDay()].charAt(0)}</span>)}
      </figcaption>
    </figure>
  );
}

function LineChart({ data, label, formatLabel }) {
  const width = 320;
  const height = 120;
  const max = Math.max(1, ...data.map((item) => item.value));
  const step = width / Math.max(1, data.length - 1);
  const points = data.map((item, index) => [index * step, height - 10 - (item.value / max) * (height - 30)]);
  const path = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const peak = data.reduce((best, item, index) => (item.value > data[best].value ? index : best), 0);
  return (
    <figure className="fit-line">
      <div className="fit-line__plot">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={label}>
          <defs>
            <linearGradient id="fit-line-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#ef8a6a" stopOpacity="0.35" />
              <stop offset="1" stopColor="#ef8a6a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L${width},${height} L0,${height} Z`} fill="url(#fit-line-fill)" />
          <path d={path} className="fit-line__path" />
          {points[peak] && <line x1={points[peak][0]} x2={points[peak][0]} y1={points[peak][1]} y2={height} className="fit-line__guide" />}
          {points[peak] && <circle cx={points[peak][0]} cy={points[peak][1]} r="5" className="fit-line__dot" />}
        </svg>
        {points[peak] && data[peak].value > 0 && (
          <span className="fit-line__tip" style={{ '--x': `${(points[peak][0] / width) * 100}%`, '--y': `${(points[peak][1] / height) * 100}%` }}>{formatNumber(data[peak].value, 0)}</span>
        )}
      </div>
      <figcaption className="fit-line__labels" aria-hidden="true">
        {data.filter((_, index) => data.length <= 12 || index % Math.ceil(data.length / 7) === 0).map((item) => <span key={item.date}>{formatLabel(item)}</span>)}
      </figcaption>
    </figure>
  );
}

function ActivityRings({ rings }) {
  const size = 150;
  return (
    <div className="fit-rings">
      <svg viewBox={`0 0 ${size} ${size}`} className="fit-rings__svg" role="img" aria-label={rings.map((ring) => `${ring.label}: ${Math.round(ring.pct * 100)} %`).join(', ')}>
        {rings.map((ring, index) => {
          const radius = 66 - index * 17;
          const circumference = 2 * Math.PI * radius;
          return (
            <g key={ring.label} className={`fit-rings__ring fit-rings__ring--${index}`}>
              <circle cx={size / 2} cy={size / 2} r={radius} className="fit-rings__track" />
              <circle cx={size / 2} cy={size / 2} r={radius} className="fit-rings__value" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - Math.min(1, ring.pct))} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
            </g>
          );
        })}
      </svg>
      <ul className="fit-rings__legend">
        {rings.map((ring, index) => (
          <li key={ring.label}><span className={`fit-rings__swatch fit-rings__swatch--${index}`} aria-hidden="true" /><span>{ring.label}</span><strong>{ring.value}</strong></li>
        ))}
      </ul>
    </div>
  );
}

function useGuide() {
  const { openModal } = useUi();
  return (exercise) => openModal({ title: exercise.name, size: 'fit', render: (close) => <ExerciseGuide exercise={exercise} onClose={close} /> });
}

/* Rutina del dia con la foto de cada ejercicio (toca para ver como se hace) */
function TodayRoutine() {
  const { db } = useData();
  const actions = useActions();
  const openGuide = useGuide();
  const today = todayISO();
  const routine = db.routines.find((item) => item.kind === 'gym' && item.days?.includes(weekday(today)));
  if (!routine) {
    return (
      <section className="fit-card" aria-labelledby="today-routine-title">
        <h2 className="fit-card__title" id="today-routine-title">Rutina de hoy</h2>
        <p className="fit-muted">Hoy no hay gym programado. Mira la biblioteca de ejercicios si quieres hacer algo extra.</p>
      </section>
    );
  }
  return (
    <section className="fit-card" aria-labelledby="today-routine-title">
      <SectionHeader id="today-routine-title" title={`Rutina de hoy · ${routine.name}`} action={<button type="button" className="section-header__link" onClick={() => actions.openWorkout(null, { name: routine.name })}>Empezar</button>} />
      <ul className="exercise-strip">
        {routine.exercises.map((exercise) => {
          const guide = findExercise(exercise.name);
          return (
            <li key={exercise.name}>
              <button type="button" className="exercise-tile" disabled={!guide} onClick={() => guide && openGuide(guide)} aria-label={`${exercise.name}, ${exercise.sets} series de ${exercise.reps}${guide ? '. Ver cómo se hace' : ''}`}>
                {guide ? <img className="exercise-tile__img" src={guide.images[0]} alt="" width="850" height="567" loading="lazy" /> : <span className="exercise-tile__img exercise-tile__img--empty"><Icon name="dumbbell" /></span>}
                <span className="exercise-tile__name">{exercise.name}</span>
                <span className="exercise-tile__meta">{exercise.sets} × {exercise.reps}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* Biblioteca de ejercicios con foto, filtro por musculo y buscador */
function Library() {
  const openGuide = useGuide();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('todos');
  const plain = query.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const list = EXERCISES.filter((exercise) => (group === 'todos' || exercise.group === group)
    && (!plain || `${exercise.name} ${exercise.muscles} ${exercise.aliases.join(' ')}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(plain)));
  return (
    <div className="stack fit-library">
      <label className="fit-search" htmlFor="library-search">
        <Icon name="search" />
        <span className="visually-hidden">Buscar ejercicio</span>
        <input id="library-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar entre ${EXERCISES.length} ejercicios…`} autoComplete="off" />
      </label>
      <div className="fit-chips" role="group" aria-label="Grupo muscular">
        {MUSCLE_GROUPS.map((option) => (
          <button key={option.value} type="button" className={`fit-chip${group === option.value ? ' fit-chip--active' : ''}`} aria-pressed={group === option.value} onClick={() => setGroup(option.value)}>{option.label}</button>
        ))}
      </div>
      <ul className="library-grid">
        {list.map((exercise) => (
          <li key={exercise.id}>
            <button type="button" className="library-card" onClick={() => openGuide(exercise)}>
              <img className="library-card__img" src={exercise.images[0]} alt="" width="850" height="567" loading="lazy" />
              <span className="library-card__name">{exercise.name}</span>
              <span className="library-card__meta">{exercise.muscles}</span>
            </button>
          </li>
        ))}
        {!list.length && <li className="empty">Ningún ejercicio coincide.</li>}
      </ul>
      <p className="guide-credit">Fotos: free-exercise-db (dominio público).</p>
    </div>
  );
}

/* ---------- Pestañas ---------- */

function Summary({ onTab }) {
  const { db, settings } = useData();
  const actions = useActions();
  const navigate = useNavigate();
  const today = todayISO();
  const week = weekRange(today);
  const weekSummary = activitySummary(db, week.start, week.end);
  const todaySummary = activitySummary(db, today, today);
  const goal = Number(settings.weeklyActiveGoal) || 240;
  const pct = weekSummary.activeMinutes / goal;
  const bars = weekDays(today).map((date) => ({ date, minutes: activitySummary(db, date, date).activeMinutes }));
  return (
    <div className="stack fit-summary">
      <section className="fit-hero" aria-labelledby="fit-hero-title">
        <Photo photo={HERO_PHOTOS.gym} className="fit-hero__photo" isEager isDecorative />
        <div className="fit-hero__content">
          <h2 className="fit-hero__title" id="fit-hero-title">Tu camino <em>fitness</em> empieza aquí</h2>
          <p className="fit-hero__text">Entrena, registra y supera tus marcas cada semana.</p>
          <button type="button" className="fit-button" onClick={() => actions.openWorkout()}>Empezar entreno <span className="fit-button__arrow"><Icon name="arrow-right" /></span></button>
        </div>
        <div className="fit-hero__join">
          <span>Esta semana<br /><strong>{weekSummary.sessions + weekSummary.runs} entrenos</strong></span>
          <span className="fit-hero__faces" aria-hidden="true">
            <span className="fit-face"><Icon name="dumbbell" /></span>
            <span className="fit-face"><Icon name="run" /></span>
            <span className="fit-face"><Icon name="flame" /></span>
          </span>
        </div>
      </section>

      <TodayRoutine />

      <section className="fit-card" aria-labelledby="fit-progress-title">
        <h2 className="fit-card__title" id="fit-progress-title">Progreso de la semana</h2>
        <div className="fit-progress">
          <Ring value={pct} size={118} stroke={10} tone="teal" label={`${Math.round(pct * 100)} % de tu meta de ${goal} minutos activos`}>
            <strong className="fit-progress__pct">{Math.round(pct * 100)}%</strong>
          </Ring>
          <ul className="fit-progress__list">
            <li><Icon name="dumbbell" /><span>Entreno hoy</span><strong>{todaySummary.activeMinutes} min</strong></li>
            <li><Icon name="flame" /><span>Calorías</span><strong>{formatNumber(todaySummary.kcal, 0)} kcal</strong></li>
            <li><Icon name="run" /><span>Km semana</span><strong>{formatNumber(weekSummary.km)}</strong></li>
            <li><Icon name="clock" /><span>Activo semana</span><strong>{formatMinutes(weekSummary.activeMinutes)}</strong></li>
          </ul>
        </div>
      </section>

      <section className="fit-card" aria-labelledby="fit-week-title">
        <h2 className="fit-card__title" id="fit-week-title">Actividad semanal</h2>
        <WeekBars data={bars} today={today} label="Minutos activos por día" />
      </section>

      <section className="fit-card" aria-labelledby="fit-quick-title">
        <h2 className="fit-card__title" id="fit-quick-title">Accesos rápidos</h2>
        <div className="fit-quick">
          <button type="button" className="fit-quick__item fit-quick__item--teal" onClick={() => actions.openWorkout()}><span className="fit-quick__icon"><Icon name="dumbbell" /></span>Empezar entreno</button>
          <button type="button" className="fit-quick__item fit-quick__item--peach" onClick={() => actions.openMeal()}><span className="fit-quick__icon"><Icon name="heart" /></span>Registrar comida</button>
          <button type="button" className="fit-quick__item fit-quick__item--violet" onClick={() => onTab('records')}><span className="fit-quick__icon"><Icon name="chart" /></span>Récords y tablero</button>
          <button type="button" className="fit-quick__item fit-quick__item--amber" onClick={() => navigate('/retos')}><span className="fit-quick__icon"><Icon name="trophy" /></span>Retos</button>
        </div>
      </section>
    </div>
  );
}

function Workouts() {
  const { db } = useData();
  const { openModal } = useUi();
  const actions = useActions();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('todos');
  const plain = query.trim().toLowerCase();
  const routines = db.routines.filter((routine) => routine.kind !== 'lectura'
    && (filter === 'todos' || routine.kind === filter)
    && (!plain || `${routine.name} ${(routine.exercises || []).map((exercise) => exercise.name).join(' ')}`.toLowerCase().includes(plain)));
  const history = sortBy([
    ...db.workouts.map((item) => ({ ...item, kind: 'gym' })),
    ...db.runs.map((item) => ({ ...item, kind: 'running' }))
  ], (item) => item.date, 'desc').slice(0, 20);
  const todayIndex = weekday(todayISO());

  const startHandler = (routine) => {
    if (routine.kind === 'gym') actions.openWorkout(null, { name: routine.name });
    else actions.openRun(null, { km: routine.km, type: routine.name.toLowerCase().includes('serie') ? 'series' : 'fondo' });
  };

  const detailHandler = (routine) => openModal({
    title: routine.name,
    size: 'fit',
    render: (close) => <WorkoutDetail routine={routine} onClose={close} onStart={(item) => { close(); startHandler(item); }} onEdit={(item) => { close(); actions.openRoutine(item); }} />
  });

  return (
    <div className="stack fit-workouts">
      <label className="fit-search" htmlFor="fit-search">
        <Icon name="search" />
        <span className="visually-hidden">Buscar entreno</span>
        <input id="fit-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar entreno o ejercicio…" autoComplete="off" />
      </label>
      <div className="fit-chips" role="group" aria-label="Tipo de entreno">
        {FILTERS.map((option) => (
          <button key={option.value} type="button" className={`fit-chip${filter === option.value ? ' fit-chip--active' : ''}`} aria-pressed={filter === option.value} onClick={() => setFilter(option.value)}>{option.label}</button>
        ))}
        <button type="button" className="fit-chip fit-chip--add" onClick={() => actions.openRoutine(null, filter === 'running' ? 'running' : 'gym')}><Icon name="plus" /> Rutina</button>
      </div>

      <ul className="workout-list">
        {routines.map((routine) => {
          const estimate = routineEstimate(routine);
          return (
            <li key={routine.id}>
              <button type="button" className="workout-card" onClick={() => detailHandler(routine)}>
                <span className="workout-card__text">
                  <span className="workout-card__title">{routine.name}</span>
                  <span className="workout-card__meta">{estimate.minutes} min · {formatNumber(estimate.kcal, 0)} kcal</span>
                  <span className="workout-card__go" aria-hidden="true"><Icon name="arrow-right" /></span>
                </span>
                <Photo photo={routine.kind === 'gym' ? HERO_PHOTOS.gym : HERO_PHOTOS.running} className="workout-card__photo" isDecorative />
              </button>
            </li>
          );
        })}
        {!routines.length && <li className="empty">No hay entrenos con ese filtro.</li>}
      </ul>

      <section className="fit-card" aria-labelledby="fit-plan-title">
        <SectionHeader id="fit-plan-title" title="Plan semanal" />
        <ol className="week-plan">
          {WEEK_ORDER.map((day) => {
            const list = db.routines.filter((routine) => routine.days?.includes(day) && routine.kind !== 'lectura');
            return (
              <li key={day} className={`week-plan__day${day === todayIndex ? ' week-plan__day--today' : ''}`}>
                <span className="week-plan__name">{WEEKDAYS_SHORT[day]}</span>
                <div className="week-plan__items">
                  {list.length ? list.map((routine) => (
                    <button key={routine.id} type="button" className={`plan-chip plan-chip--${routine.kind}`} onClick={() => detailHandler(routine)}>
                      <Icon name={KIND_ICON[routine.kind]} /> {routine.name}
                    </button>
                  )) : <span className="week-plan__rest">Descanso</span>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <SectionHeader title="Historial" action={<span className="section-header__controls">
        <button type="button" className="fit-chip" onClick={() => actions.openWorkout()}><Icon name="plus" /> Gym</button>
        <button type="button" className="fit-chip" onClick={() => actions.openRun()}><Icon name="plus" /> Carrera</button>
      </span>} />
      <ul className="log-list">
        {history.map((item) => (
          <li key={item.id}>
            <button type="button" className="log-row glass" onClick={() => (item.kind === 'gym' ? actions.openWorkout(item) : actions.openRun(item))}>
              <span className="log-row__date"><strong>{parseISO(item.date).getDate()}</strong>{formatDay(item.date).split(' ')[2]}</span>
              <span className="log-row__text">
                <strong>{item.kind === 'gym' ? item.name : `${formatNumber(item.km, 2)} km · ${RUN_TYPES[item.type] || item.type}`}</strong>
                <span>{item.kind === 'gym'
                  ? `${item.exercises.length} ejercicios · ${formatMinutes(item.minutes)} · ${formatNumber(workoutVolume(item) / 1000)} t`
                  : `${formatMinutes(item.minutes)} · ${formatPace(runPace(item))} /km`}</span>
              </span>
              <span className="log-row__value">{formatNumber(item.kind === 'gym' ? workoutKcal(item) : runKcal(item), 0)} kcal</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function periodRange(period, today) {
  if (period === 'dia') return { start: addDays(today, -6), end: today, previous: { start: addDays(today, -13), end: addDays(today, -7) }, label: 'Últimos 7 días', weeks: 1 };
  if (period === 'semana') {
    const week = weekRange(today);
    return { ...week, previous: weekRange(addDays(week.start, -7)), label: `${formatDay(week.start)} – ${formatDay(week.end)}`, weeks: 1 };
  }
  if (period === 'mes') {
    const date = parseISO(today);
    const range = monthRange(date.getFullYear(), date.getMonth());
    const previous = monthRange(date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear(), (date.getMonth() + 11) % 12);
    return { ...range, previous, label: `${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`, weeks: 4.3 };
  }
  const year = Number(today.slice(0, 4));
  return { ...yearRange(year), previous: yearRange(year - 1), label: String(year), weeks: 52 };
}

function Activity() {
  const { db, settings } = useData();
  const today = todayISO();
  const [period, setPeriod] = useState('semana');
  const range = periodRange(period, today);
  const current = activitySummary(db, range.start, range.end);
  const previous = activitySummary(db, range.previous.start, range.previous.end);
  const delta = previous.kcal ? Math.round(((current.kcal - previous.kcal) / previous.kcal) * 100) : 0;
  const series = period === 'año'
    ? Array.from({ length: 12 }, (_, month) => {
      const monthly = monthRange(Number(today.slice(0, 4)), month);
      return { date: monthly.start, value: activitySummary(db, monthly.start, monthly.end).kcal, label: MONTHS_SHORT[month].charAt(0).toUpperCase() };
    })
    : activitySeries(db, range.start, Math.round((parseISO(range.end) - parseISO(range.start)) / 86400000) + 1);
  const rings = [
    { label: 'Sesiones de gym', pct: current.sessions / (Number(settings.weeklyGymGoal) * range.weeks), value: `${current.sessions}/${Math.round(Number(settings.weeklyGymGoal) * range.weeks)}` },
    { label: 'Kilómetros', pct: current.km / (Number(settings.weeklyKmGoal) * range.weeks), value: `${formatNumber(current.km)}/${Math.round(Number(settings.weeklyKmGoal) * range.weeks)}` },
    { label: 'Minutos activos', pct: current.activeMinutes / ((Number(settings.weeklyActiveGoal) || 240) * range.weeks), value: `${current.activeMinutes}/${Math.round((Number(settings.weeklyActiveGoal) || 240) * range.weeks)}` }
  ];
  const kmSeries = period === 'año' ? series : series.map((item) => ({ ...item, minutes: item.km }));

  return (
    <div className="stack fit-activity">
      <Segmented label="Periodo" value={period} onChange={setPeriod} options={[{ value: 'dia', label: 'Día' }, { value: 'semana', label: 'Semana' }, { value: 'mes', label: 'Mes' }, { value: 'año', label: 'Año' }]} />
      <p className="fit-muted"><Icon name="calendar" /> {range.label}</p>

      <section className="fit-card" aria-labelledby="fit-kcal-title">
        <h2 className="fit-card__title" id="fit-kcal-title">Calorías quemadas <small>(estimadas)</small></h2>
        <p className="fit-big">{formatNumber(current.kcal, 0)} <small>kcal</small></p>
        {previous.kcal > 0 && <p className={`fit-delta${delta >= 0 ? ' fit-delta--up' : ' fit-delta--down'}`}>{delta >= 0 ? '↑' : '↓'} {Math.abs(delta)} % frente al periodo anterior</p>}
        <LineChart data={series} label="Calorías estimadas por día" formatLabel={(item) => item.label || WEEKDAYS_SHORT[parseISO(item.date).getDay()].charAt(0)} />
      </section>

      <section className="fit-card" aria-labelledby="fit-rings-title">
        <h2 className="fit-card__title" id="fit-rings-title">Anillos de actividad</h2>
        <ActivityRings rings={rings} />
      </section>

      {period !== 'año' && (
        <section className="fit-card" aria-labelledby="fit-km-title">
          <h2 className="fit-card__title" id="fit-km-title">Kilómetros</h2>
          <p className="fit-big">{formatNumber(current.km)} <small>km</small></p>
          <WeekBars data={kmSeries.slice(-7)} today={today} label="Kilómetros por día" />
        </section>
      )}
    </div>
  );
}

function Nutrition() {
  const { db, settings } = useData();
  const actions = useActions();
  const [date, setDate] = useState(todayISO());
  const day = nutritionFor(db, date);
  const goal = Number(settings.calorieGoal) || 2200;
  const macros = [
    { key: 'carbs', label: 'Carbohidratos', value: day.carbs, goal: Number(settings.carbsGoal) || 250 },
    { key: 'protein', label: 'Proteína', value: day.protein, goal: Number(settings.proteinGoal) || 150 },
    { key: 'fat', label: 'Grasa', value: day.fat, goal: Number(settings.fatGoal) || 70 }
  ];
  return (
    <div className="stack fit-nutrition">
      <WeekCapsules selected={date} onSelect={setDate} hasActivity={(iso) => db.meals.some((meal) => meal.date === iso)} label="Día de la nutrición" />

      <section className="fit-card" aria-labelledby="fit-goal-title">
        <h2 className="fit-card__title" id="fit-goal-title">Meta de calorías</h2>
        <div className="fit-goal">
          <p className="fit-big">{formatNumber(goal, 0)} <small>kcal</small></p>
          <p className="fit-goal__count"><strong>{formatNumber(day.kcal, 0)}</strong> / {formatNumber(goal, 0)} kcal</p>
        </div>
        <span className="fit-meter" style={{ '--progress': `${Math.min(100, Math.round((day.kcal / goal) * 100))}%` }} aria-hidden="true" />
        <p className="fit-muted">{day.kcal <= goal ? `Te quedan ${formatNumber(goal - day.kcal, 0)} kcal` : `Te pasaste ${formatNumber(day.kcal - goal, 0)} kcal`}</p>
      </section>

      <div className="fit-macros">
        {macros.map((macro) => (
          <div key={macro.key} className={`fit-macro fit-macro--${macro.key}`}>
            <span className="fit-macro__label">{macro.label}</span>
            <strong className="fit-macro__value">{formatNumber(macro.value, 0)} g</strong>
            <Ring value={macro.value / macro.goal} size={52} stroke={5} tone="teal" label={`${macro.label}: ${Math.round((macro.value / macro.goal) * 100)} % de ${macro.goal} g`}>
              <span className="fit-macro__pct">{Math.round((macro.value / macro.goal) * 100)}%</span>
            </Ring>
          </div>
        ))}
      </div>

      <section className="fit-card" aria-labelledby="fit-meals-title">
        <h2 className="fit-card__title" id="fit-meals-title">Comidas del día</h2>
        <ul className="fit-list">
          {MEAL_TYPES.map((type) => {
            const logged = day.meals.filter((meal) => meal.type === type.value);
            return (
              <li key={type.value} className="fit-list__row fit-list__row--meal">
                <span className={`fit-list__thumb fit-list__thumb--${type.value}`}><Icon name={type.icon} /></span>
                <span className="fit-list__text">
                  <strong>{type.label}</strong>
                  <span>{logged.length ? logged.map((meal) => `${meal.name} · ${meal.kcal} kcal`).join(' + ') : 'Sin registrar'}</span>
                </span>
                {logged.length
                  ? <button type="button" className="fit-check" aria-label={`Editar ${type.label}`} onClick={() => actions.openMeal(logged[0])}><Icon name="check" /></button>
                  : <button type="button" className="fit-add" aria-label={`Añadir ${type.label}`} onClick={() => actions.openMeal(null, { type: type.value, date })}><Icon name="plus" /></button>}
              </li>
            );
          })}
        </ul>
      </section>
      <button type="button" className="fit-button fit-button--block fit-button--peach" onClick={() => actions.openMeal(null, { date })}>Registrar comida</button>
    </div>
  );
}

function Records() {
  const { db } = useData();
  const actions = useActions();
  const board = sortBy(db.records, (record) => record.category);
  const lifts = exerciseRecords(db);
  const runs = runRecords(db);
  const hasDemo = board.some((record) => record.isDemo);
  return (
    <div className="stack fit-records">
      <section className="board-card" aria-labelledby="board-title">
        <header className="board-card__header">
          <div>
            <h2 className="board-card__title" id="board-title">Tablero del cuarto</h2>
            <p className="board-card__lead">{hasDemo ? 'Marcas de ejemplo: carga las tuyas.' : 'Tus marcas personales, siempre a mano.'}</p>
          </div>
          <div className="board-card__actions">
            <button type="button" className="button button--small button--primary" onClick={() => actions.openBoard()}><Icon name="board" /> Cargar tablero</button>
            <button type="button" className="icon-button" aria-label="Añadir marca" onClick={() => actions.openRecord()}><Icon name="plus" /></button>
          </div>
        </header>
        <ul className="board-card__grid">
          {board.map((record) => (
            <li key={record.id}>
              <button type="button" className={`board-mark board-mark--${record.category}${record.isDemo ? ' board-mark--demo' : ''}`} onClick={() => actions.openRecord(record)}>
                <span className="board-mark__name">{record.name}</span>
                <strong className="board-mark__value">{record.value}<small>{record.unit === 'tiempo' ? '' : ` ${record.unit}`}</small></strong>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="fit-card" aria-labelledby="lifts-title">
        <h2 className="fit-card__title" id="lifts-title">Récords automáticos · gym</h2>
        <div className="table-scroll">
          <table className="data-table">
            <caption className="visually-hidden">Peso máximo por ejercicio</caption>
            <thead><tr><th scope="col">Ejercicio</th><th scope="col">Máximo</th><th scope="col">1RM est.</th><th scope="col">Fecha</th></tr></thead>
            <tbody>
              {lifts.map((lift) => (
                <tr key={lift.name}><th scope="row">{lift.name}</th><td>{formatNumber(lift.weight)} kg × {lift.reps}</td><td>{formatNumber(lift.oneRepMax)} kg</td><td>{formatDay(lift.date)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="fit-card" aria-labelledby="runs-title">
        <h2 className="fit-card__title" id="runs-title">Récords automáticos · running</h2>
        <ul className="pr-list">
          {runs.map((record) => (
            <li key={record.name} className="pr-list__item"><span>{record.name}</span><strong>{record.value}</strong><span className="pr-list__date">{formatDay(record.date)}</span></li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function Training() {
  const { settings } = useData();
  const [tab, setTab] = useState('resumen');
  return (
    <div className="view fitness">
      <header className="fitness__header">
        <h1 className="fitness__title">¡Vamos, {settings.name.split(' ')[0]}! <span aria-hidden="true">💪</span></h1>
        <p className="fitness__lead">¿Listo para superar tus metas?</p>
      </header>
      <div className="fit-tabs">
        <Segmented label="Secciones de entreno" value={tab} onChange={setTab} options={[
          { value: 'resumen', label: 'Resumen' }, { value: 'entrenos', label: 'Entrenos' }, { value: 'ejercicios', label: 'Ejercicios' }, { value: 'actividad', label: 'Actividad' },
          { value: 'nutricion', label: 'Nutrición' }, { value: 'records', label: 'Récords' }
        ]} />
      </div>
      {tab === 'resumen' && <Summary onTab={setTab} />}
      {tab === 'entrenos' && <Workouts />}
      {tab === 'ejercicios' && <Library />}
      {tab === 'actividad' && <Activity />}
      {tab === 'nutricion' && <Nutrition />}
      {tab === 'records' && <Records />}
    </div>
  );
}
