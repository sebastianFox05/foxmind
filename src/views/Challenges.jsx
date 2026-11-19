/*
 * Retos: tarjetas de mes con foto y nombre gigante translucido (referencia "March / April / May"),
 * trimestres, año, futuros (con plantillas para crearlos rapido) e historial con tasa de exito.
 * El progreso de cada reto se calcula solo desde los registros (stats.challengeProgress).
 */
import { useState } from 'react';
import { useData } from '../session/DataContext.jsx';
import { useActions } from '../ui/useActions.jsx';
import Segmented from '../components/Segmented.jsx';
import ChallengeCard from '../components/ChallengeCard.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import Photo from '../components/Photo.jsx';
import Icon from '../components/Icon.jsx';
import { capitalize, MONTHS, monthRange, parseISO, quarterOf, quarterRange, todayISO, yearRange } from '../lib/dates.js';
import { challengeProgress, METRICS } from '../lib/stats.js';
import { photoForMonth } from '../lib/photos.js';
import { formatNumber } from '../lib/utils.js';

const TEMPLATES = [
  { title: 'Correr 100 km en el mes', metric: 'run_km', target: 100, period: 'mes' },
  { title: '20 sesiones de gym', metric: 'gym_sessions', target: 20, period: 'mes' },
  { title: 'Leer 2 libros en el mes', metric: 'books_done', target: 2, period: 'mes' },
  { title: '1.000 páginas en el trimestre', metric: 'pages', target: 1000, period: 'trimestre' },
  { title: '30 días de diario', metric: 'journal_days', target: 30, period: 'mes' },
  { title: '40 horas de foco profundo', metric: 'focus_min', target: 2400, period: 'mes' },
  { title: 'Cerrar 50 tareas en el trimestre', metric: 'tasks_done', target: 50, period: 'trimestre' },
  { title: 'Sentadilla a 120 kg', metric: 'exercise_weight', target: 120, period: 'trimestre', exercise: 'Sentadilla', unit: 'kg' }
];

function PeriodCard({ photo, word, count, isOpen, onToggle, onAdd, summary, children, id }) {
  return (
    <article className={`period-card${isOpen ? ' period-card--open' : ''}`}>
      <div className="period-card__cover">
        <Photo photo={photo} className="period-card__photo" isDecorative />
        <span className="period-card__pill">{count} {count === 1 ? 'reto' : 'retos'}{summary ? ` · ${summary}` : ''}</span>
        <button type="button" className="period-card__more" aria-label={`Añadir reto en ${word}`} onClick={onAdd}><Icon name="more" /></button>
        <button type="button" className="period-card__toggle" aria-expanded={isOpen} aria-controls={id} onClick={onToggle}>
          <span className="period-card__word" aria-hidden="true" style={{ '--chars': word.length }}>{word}</span>
          <span className="visually-hidden">{isOpen ? 'Ocultar' : 'Ver'} retos de {word}</span>
        </button>
      </div>
      {isOpen && <div className="period-card__body stack" id={id}>{children}</div>}
    </article>
  );
}

function ChallengeList({ challenges, onOpen, emptyText }) {
  if (!challenges.length) return <p className="empty">{emptyText}</p>;
  return challenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} onOpen={onOpen} />);
}

function successSummary(list, db) {
  if (!list.length) return '';
  const done = list.filter((challenge) => challengeProgress(challenge, db).isDone).length;
  return `${done} cumplidos`;
}

export default function Challenges() {
  const { db } = useData();
  const actions = useActions();
  const today = todayISO();
  const currentYear = Number(today.slice(0, 4));
  const [year, setYear] = useState(currentYear);
  const [tab, setTab] = useState('mes');
  const [openMonth, setOpenMonth] = useState(parseISO(today).getMonth());
  const [openQuarter, setOpenQuarter] = useState(quarterOf(today));

  const withProgress = db.challenges.map((challenge) => ({ challenge, progress: challengeProgress(challenge, db, today) }));
  const ofPeriod = (period, start, end) => db.challenges.filter((challenge) => challenge.period === period && challenge.start === start && challenge.end === end);
  const future = withProgress.filter(({ progress }) => progress.status === 'futuro').sort((a, b) => a.challenge.start.localeCompare(b.challenge.start));
  const past = withProgress.filter(({ challenge }) => challenge.end < today).sort((a, b) => b.challenge.end.localeCompare(a.challenge.end));
  const pastDone = past.filter(({ progress }) => progress.isDone).length;
  const active = withProgress.filter(({ progress }) => progress.status === 'activo');
  /* Los retos de fechas propias no encajan en mes/trimestre/año: se muestran aparte mientras sigan abiertos */
  const custom = db.challenges.filter((challenge) => challenge.period === 'personalizado' && challenge.end >= today && challenge.start <= today);
  const years = [...new Set([currentYear, ...db.challenges.map((challenge) => Number(challenge.start.slice(0, 4)))])].sort();

  /* Mes actual primero, luego los proximos y despues los pasados (del mas reciente al mas antiguo) */
  const currentMonth = parseISO(today).getMonth();
  const monthsWithData = MONTHS.map((_, index) => index).filter((index) => {
    const range = monthRange(year, index);
    return ofPeriod('mes', range.start, range.end).length || (year === currentYear && index === currentMonth);
  }).sort((a, b) => {
    if (year !== currentYear) return a - b;
    const rank = (month) => (month === currentMonth ? -100 : month > currentMonth ? month - currentMonth : 100 + (currentMonth - month));
    return rank(a) - rank(b);
  });

  const templateHandler = (template) => {
    const start = template.period === 'mes'
      ? monthRange(parseISO(today).getMonth() === 11 ? currentYear + 1 : currentYear, (parseISO(today).getMonth() + 1) % 12).start
      : (quarterOf(today) === 4 ? quarterRange(currentYear + 1, 1) : quarterRange(currentYear, quarterOf(today) + 1)).start;
    actions.openChallenge(null, { ...template, start, unit: template.unit || METRICS[template.metric].unit });
  };

  return (
    <div className="view challenges">
      <header className="challenges__header">
        <label className="year-select">
          <span className="visually-hidden">Año</span>
          <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {years.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Icon name="chevron-down" />
        </label>
        <button type="button" className="icon-button icon-button--bare" aria-label="Nuevo reto" onClick={() => actions.openChallenge()}><Icon name="calendar" /></button>
      </header>
      <h1 className="view__title">Tus <strong>retos</strong><br />del mes y del año</h1>
      <p className="view__lead">{active.length} en marcha · {future.length} futuros · {past.length ? `${Math.round((pastDone / past.length) * 100)} % cumplidos` : 'sin historial aún'}</p>

      <Segmented label="Periodo de los retos" value={tab} onChange={setTab} options={[
        { value: 'mes', label: 'Mes' }, { value: 'trimestre', label: 'Trimestre' }, { value: 'año', label: 'Año' },
        { value: 'futuros', label: 'Futuros', count: future.length }, { value: 'historial', label: 'Historial' }
      ]} />

      {tab === 'mes' && custom.length > 0 && (
        <section className="stack" aria-labelledby="custom-title">
          <SectionHeader id="custom-title" title="Con fechas propias" />
          <ChallengeList challenges={custom} onOpen={actions.openChallenge} emptyText="" />
        </section>
      )}

      {tab === 'mes' && (
        <div className="period-stack">
          {monthsWithData.map((month) => {
            const range = monthRange(year, month);
            const list = ofPeriod('mes', range.start, range.end);
            return (
              <PeriodCard
                key={month}
                id={`month-${month}`}
                photo={photoForMonth(month)}
                word={capitalize(MONTHS[month])}
                count={list.length}
                summary={range.end < today ? successSummary(list, db) : ''}
                isOpen={openMonth === month}
                onToggle={() => setOpenMonth(openMonth === month ? -1 : month)}
                onAdd={() => actions.openChallenge(null, { period: 'mes', start: range.start })}
              >
                <ChallengeList challenges={list} onOpen={actions.openChallenge} emptyText="Sin retos este mes. Toca ··· para crear uno." />
              </PeriodCard>
            );
          })}
        </div>
      )}

      {tab === 'trimestre' && (
        <div className="period-stack">
          {[1, 2, 3, 4].map((quarter) => {
            const range = quarterRange(year, quarter);
            const list = ofPeriod('trimestre', range.start, range.end);
            return (
              <PeriodCard
                key={quarter}
                id={`quarter-${quarter}`}
                photo={photoForMonth((quarter - 1) * 3 + 1)}
                word={`Q${quarter}`}
                count={list.length}
                summary={range.end < today ? successSummary(list, db) : ''}
                isOpen={openQuarter === quarter}
                onToggle={() => setOpenQuarter(openQuarter === quarter ? 0 : quarter)}
                onAdd={() => actions.openChallenge(null, { period: 'trimestre', start: range.start })}
              >
                <ChallengeList challenges={list} onOpen={actions.openChallenge} emptyText="Sin retos en este trimestre." />
              </PeriodCard>
            );
          })}
        </div>
      )}

      {tab === 'año' && (() => {
        const range = yearRange(year);
        const list = ofPeriod('año', range.start, range.end);
        return (
          <div className="period-stack">
            <PeriodCard id="year-card" photo={photoForMonth(11)} word={String(year)} count={list.length} isOpen onToggle={() => {}} onAdd={() => actions.openChallenge(null, { period: 'año', start: range.start })}>
              <ChallengeList challenges={list} onOpen={actions.openChallenge} emptyText="Sin retos anuales todavía." />
            </PeriodCard>
            <div className="glass glass--padded">
              <SectionHeader title={`${year} en números`} />
              <div className="stat-row">
                {['run_km', 'gym_sessions', 'books_done', 'tasks_done'].map((key) => (
                  <div key={key} className="stat">
                    <strong className="stat__number">{formatNumber(METRICS[key].compute(db, range.start, range.end, {}), 0)}</strong>
                    <span className="stat__label">{METRICS[key].label.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {tab === 'futuros' && (
        <div className="stack">
          <ChallengeList challenges={future.map(({ challenge }) => challenge)} onOpen={actions.openChallenge} emptyText="No hay retos futuros. Planifica el próximo mes con una plantilla." />
          <SectionHeader title="Plantillas para el próximo periodo" />
          <ul className="template-grid">
            {TEMPLATES.map((template) => (
              <li key={template.title}>
                <button type="button" className="template-chip glass" onClick={() => templateHandler(template)}>
                  <Icon name={METRICS[template.metric].icon} />
                  <span>{template.title}</span>
                  <span className="template-chip__period">{template.period === 'mes' ? 'próximo mes' : 'próximo trimestre'}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'historial' && (
        <div className="stack">
          <div className="stat-row glass">
            <div className="stat"><strong className="stat__number">{past.length}</strong><span className="stat__label">retos cerrados</span></div>
            <div className="stat"><strong className="stat__number">{pastDone}</strong><span className="stat__label">cumplidos</span></div>
            <div className="stat"><strong className="stat__number">{past.length ? Math.round((pastDone / past.length) * 100) : 0}%</strong><span className="stat__label">de éxito</span></div>
          </div>
          <ChallengeList challenges={past.map(({ challenge }) => challenge)} onOpen={actions.openChallenge} emptyText="Aún no has cerrado ningún reto." />
        </div>
      )}
    </div>
  );
}
