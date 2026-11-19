/*
 * Reto del dia (referencia "Daily challenge"): tarjeta lila con formas 3D, la meta concreta de hoy sacada del
 * reto que mas lo necesita ("Corre 3,2 km antes de las 22:00") y mini-avatares del resto de retos (+N).
 */
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { challengeProgress } from '../lib/stats.js';
import { todayISO } from '../lib/dates.js';
import { formatNumber } from '../lib/utils.js';

const MAX_FACES = 3;

export default function DailyChallenge({ db }) {
  const today = todayISO();
  const active = db.challenges
    .map((challenge) => ({ challenge, progress: challengeProgress(challenge, db, today) }))
    .filter(({ progress }) => progress.status === 'activo' && !progress.metric.isLevel && progress.perDay > 0)
    .sort((a, b) => Number(b.progress.isBehind) - Number(a.progress.isBehind) || b.progress.perDay / b.progress.target - a.progress.perDay / a.progress.target);
  const main = active[0];
  const faces = active.slice(1, 1 + MAX_FACES);
  const extra = Math.max(0, active.length - 1 - MAX_FACES);

  return (
    <Link to="/retos" className="daily-challenge">
      <span className="daily-challenge__shapes" aria-hidden="true">
        <span className="shape shape--cylinder" />
        <span className="shape shape--torus" />
        <span className="shape shape--pill" />
      </span>
      <strong className="daily-challenge__title">Reto<br />del día</strong>
      <span className="daily-challenge__text">
        {main
          ? `${formatNumber(Math.ceil(main.progress.perDay * 10) / 10)} ${main.progress.unit} hoy para «${main.challenge.title}»`
          : 'Vas al día con todos tus retos. ¡Mantén el ritmo!'}
      </span>
      {faces.length > 0 && (
        <span className="daily-challenge__faces" aria-label={`${active.length - 1} retos más en marcha`}>
          {faces.map(({ challenge, progress }) => <span key={challenge.id} className="daily-challenge__face"><Icon name={progress.metric.icon} /></span>)}
          {extra > 0 && <span className="daily-challenge__face daily-challenge__face--more">+{extra}</span>}
        </span>
      )}
    </Link>
  );
}
