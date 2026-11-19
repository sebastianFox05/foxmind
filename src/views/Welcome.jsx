/*
 * Bienvenida (referencia "Discover Portugal"): foto a sangre, pildora de lugar, titular grande con serifa,
 * puntos de progreso y boton coral. Tres diapositivas que se deslizan; se muestra solo la primera vez.
 */
import { useRef, useState } from 'react';
import Logo from '../components/Logo.jsx';
import Photo from '../components/Photo.jsx';
import { HERO_PHOTOS, MONTH_PHOTOS } from '../lib/photos.js';

const SLIDES = [
  { photo: MONTH_PHOTOS[10], place: 'Bryce Canyon', title: 'Tu día, en orden: trabajo, entreno y lectura en un solo lugar' },
  { photo: HERO_PHOTOS.running, place: 'Tu próxima meta', title: 'Retos que avanzan solos con cada kilómetro, cada serie y cada página' },
  { photo: HERO_PHOTOS.lectura, place: 'Modo proactivo', title: 'Alertas, rachas y standup listos antes de que los necesites' }
];

export default function Welcome({ onStart, onLogin }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const scrollHandler = () => {
    const track = trackRef.current;
    if (track) setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const goTo = (next) => trackRef.current?.scrollTo({ left: next * trackRef.current.clientWidth, behavior: 'smooth' });

  const nextHandler = () => {
    if (isLast) onStart();
    else goTo(index + 1);
  };

  return (
    <main className="welcome">
      <h1 className="visually-hidden">Bienvenido a FoxMind</h1>
      <Logo isOnDark className="welcome__logo" alt="" />
      <div className="welcome__track" ref={trackRef} onScroll={scrollHandler}>
        {SLIDES.map((slide, position) => (
          <section key={slide.place} className="welcome__slide" aria-label={`${position + 1} de ${SLIDES.length}`} aria-hidden={position !== index}>
            <Photo photo={slide.photo} className="welcome__photo" isEager={position === 0} />
            <span className="welcome__place"><span className="welcome__pin" aria-hidden="true" />{slide.place}</span>
            <h2 className="welcome__title">{slide.title}</h2>
          </section>
        ))}
      </div>

      <button type="button" className="welcome__skip" onClick={onLogin}>Ya tengo cuenta</button>

      <footer className="welcome__footer">
        <div className="welcome__dots" role="group" aria-label="Diapositivas">
          {SLIDES.map((slide, position) => (
            <button
              key={slide.place}
              type="button"
              className={`welcome__dot${position === index ? ' welcome__dot--active' : ''}`}
              aria-label={`Ir a la diapositiva ${position + 1}`}
              aria-pressed={position === index}
              onClick={() => goTo(position)}
            />
          ))}
        </div>
        <button type="button" className="welcome__cta" onClick={nextHandler}>{isLast ? '¡Empecemos!' : 'Siguiente'}</button>
      </footer>
    </main>
  );
}
