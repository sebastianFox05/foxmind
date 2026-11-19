/*
 * Tarjeta de reto con progreso automatico: valor actual / meta, barra con la marca de "donde deberias ir"
 * y un texto proactivo (vas al dia, necesitas X al dia, quedan N dias, cumplido…).
 */
import Icon from './Icon.jsx';
import { ProgressBar } from './Charts.jsx';
import { challengeProgress } from '../lib/stats.js';
import { formatDay } from '../lib/dates.js';
import { formatNumber } from '../lib/utils.js';
import { useData } from '../session/DataContext.jsx';

function statusText(progress, challenge) {
  if (progress.status === 'futuro') return `Empieza el ${formatDay(challenge.start)}`;
  if (progress.status === 'cumplido') return 'Cumplido 🏆';
  if (progress.status === 'vencido') return `No llegó · ${Math.round(progress.pct * 100)} %`;
  if (progress.metric.isLevel) return `Te faltan ${formatNumber(progress.target - progress.value)} ${progress.unit}`;
  if (progress.isBehind) return `Necesitas ${formatNumber(progress.perDay)} ${progress.unit}/día`;
  return `Vas al día · ${progress.daysLeft} ${progress.daysLeft === 1 ? 'día' : 'días'} restantes`;
}

export default function ChallengeCard({ challenge, onOpen, isCompact = false }) {
  const { db, save } = useData();
  const progress = challengeProgress(challenge, db);
  const isManual = challenge.metric === 'manual';
  const tone = progress.status === 'cumplido' ? 'green' : progress.isBehind ? 'amber' : progress.status === 'vencido' ? 'rose' : 'light';

  const stepHandler = (amount) => save('challenges', { ...challenge, manual: Math.max(0, (Number(challenge.manual) || 0) + amount) });

  return (
    <article className={`challenge-card challenge-card--${progress.status}${isCompact ? ' challenge-card--compact' : ''}`}>
      <button type="button" className="challenge-card__main" onClick={() => onOpen(challenge)} aria-label={`Editar reto ${challenge.title}`}>
        <span className="challenge-card__icon"><Icon name={progress.metric.icon} /></span>
        <span className="challenge-card__text">
          <span className="challenge-card__source">{isManual ? 'manual' : `auto · ${progress.metric.source}`}</span>
          <span className="challenge-card__title">{challenge.title}</span>
        </span>
        <span className="challenge-card__value">
          <strong>{formatNumber(progress.value)}</strong>
          <span>/ {formatNumber(progress.target)} {progress.unit}</span>
        </span>
      </button>
      <ProgressBar value={progress.pct} expected={progress.status === 'activo' && !progress.metric.isLevel ? progress.expectedPct : undefined} tone={tone} label={`${challenge.title}: ${Math.round(progress.pct * 100)} %`} />
      <footer className="challenge-card__footer">
        <span className={`challenge-card__status challenge-card__status--${tone}`}>{statusText(progress, challenge)}</span>
        {isManual && progress.status !== 'futuro' && (
          <span className="challenge-card__stepper">
            <button type="button" className="icon-button icon-button--small" aria-label="Restar uno" onClick={() => stepHandler(-1)}>−</button>
            <button type="button" className="icon-button icon-button--small" aria-label="Sumar uno" onClick={() => stepHandler(1)}><Icon name="plus" /></button>
          </span>
        )}
      </footer>
    </article>
  );
}
