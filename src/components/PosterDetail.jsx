/*
 * Ficha a pantalla completa (segunda pantalla del reel del cine): volver + chips arriba, foto grande con
 * titulo en mayusculas y boton redondo "Empezar" (el "Watch trailer"), descripcion y fila de "reparto"
 * (ejercicios, pasos o detalles).
 */
import { useState } from 'react';
import Icon from './Icon.jsx';
import Photo from './Photo.jsx';

export default function PosterDetail({ poster, onAction, onClose }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = (poster.description || '').length > 140;
  return (
    <article className="poster-detail">
      <header className="poster-detail__bar">
        <button type="button" className="poster-detail__back" data-autofocus onClick={() => onClose(false)}>
          <Icon name="chevron-left" /> Volver
        </button>
        <ul className="poster-detail__chips">
          {poster.chips.map((chip) => <li key={chip} className="poster-chip">{chip}</li>)}
          {poster.isDone && <li className="poster-chip poster-chip--done">Hecho ✓</li>}
        </ul>
      </header>

      <figure className="poster-detail__hero">
        <Photo photo={poster.photo} className="poster-detail__photo" isEager />
        <figcaption className="poster-detail__eyebrow">{poster.eyebrow}</figcaption>
        <button type="button" className="poster-detail__play" onClick={() => onAction(poster)}>
          <span className="poster-detail__play-icon"><Icon name={poster.isDone ? 'plus' : 'play'} /></span>
          {poster.isDone ? 'Registrar otra' : poster.action}
        </button>
      </figure>

      <h3 className="poster-detail__title">{poster.title}</h3>
      {poster.description && (
        <p className={`poster-detail__text${isLong && !isExpanded ? ' poster-detail__text--clamped' : ''}`}>{poster.description}</p>
      )}
      {isLong && (
        <button type="button" className="poster-detail__more" onClick={() => setIsExpanded(!isExpanded)}>{isExpanded ? 'Leer menos' : 'Leer más'}</button>
      )}

      {poster.cast.length > 0 && (
        <section className="poster-detail__cast" aria-labelledby="cast-title">
          <h4 className="poster-detail__cast-title" id="cast-title">{poster.castTitle}</h4>
          <ul className="cast-row">
            {poster.cast.map((member) => (
              <li key={member.name} className="cast-card">
                <span className={`cast-card__portrait cast-card__portrait--${poster.kind}`}><Icon name={member.icon} /></span>
                <strong className="cast-card__name">{member.name}</strong>
                <span className="cast-card__detail">{member.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
