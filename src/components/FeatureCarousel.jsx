/*
 * Tarjetas destacadas de Hoy (referencia de la derecha, "Eira do Serrado"): foto grande redondeada,
 * chip blanco arriba a la derecha, titulo con serifa, linea "hora · tipo", fila de mini-avatares (+N)
 * y boton coral con flecha encajado en la esquina recortada. Tocar la tarjeta abre la ficha tipo cine;
 * la flecha lanza la accion directamente (empezar sesion, registrar, foco…).
 */
import { useRef } from 'react';
import Icon from './Icon.jsx';
import Photo from './Photo.jsx';

const MAX_FACES = 3;

export default function FeatureCarousel({ posters, onOpen, onAction }) {
  const trackRef = useRef(null);

  const scrollHandler = (direction) => {
    const track = trackRef.current;
    const card = track?.querySelector('.feature-card');
    if (card) track.scrollBy({ left: direction * (card.offsetWidth + 16), behavior: 'smooth' });
  };

  if (!posters.length) {
    return <p className="empty">Nada programado en esta categoría. Buen momento para planificar.</p>;
  }

  return (
    <div className="feature-carousel">
      <ul className="feature-carousel__track" ref={trackRef} aria-label="Lo programado">
        {posters.map((poster, index) => {
          const faces = poster.cast.slice(0, MAX_FACES);
          const extra = poster.cast.length - faces.length;
          return (
            <li key={poster.id} className={`feature-card${poster.isDone ? ' feature-card--done' : ''}`}>
              <button type="button" className="feature-card__main" onClick={() => onOpen(poster)} aria-label={`${poster.title}. ${poster.chips.join(', ')}${poster.isDone ? ', hecho' : ''}. Ver ficha`}>
                <Photo photo={poster.photo} className="feature-card__photo" isEager={index === 0} isDecorative />
                <span className="feature-card__chip" aria-hidden="true">
                  {poster.isDone ? <><Icon name="check" /> Hecho</> : <><Icon name="star" /> {poster.chips[0]}</>}
                </span>
                <span className="feature-card__body" aria-hidden="true">
                  <span className="feature-card__title">{poster.title}</span>
                  <span className="feature-card__meta">{[poster.eyebrow, poster.chips[1]].filter(Boolean).join(' • ')}</span>
                  <span className="feature-card__faces">
                    {faces.map((member) => <span key={member.name} className={`feature-card__face feature-card__face--${poster.kind}`}><Icon name={member.icon} /></span>)}
                    {extra > 0 && <span className="feature-card__face feature-card__face--more">+{extra}</span>}
                  </span>
                </span>
              </button>
              <button type="button" className="feature-card__go" aria-label={`${poster.isDone ? 'Registrar otra vez' : poster.action}: ${poster.title}`} onClick={() => onAction(poster)}>
                <Icon name="arrow-up-right" />
              </button>
            </li>
          );
        })}
      </ul>
      {posters.length > 1 && (
        <div className="feature-carousel__arrows">
          <button type="button" className="icon-button icon-button--small" aria-label="Anterior" onClick={() => scrollHandler(-1)}><Icon name="chevron-left" /></button>
          <button type="button" className="icon-button icon-button--small" aria-label="Siguiente" onClick={() => scrollHandler(1)}><Icon name="chevron-right" /></button>
        </div>
      )}
    </div>
  );
}
