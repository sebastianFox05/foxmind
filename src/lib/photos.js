/*
 * Fotos libres de Wikimedia Commons, servidas desde public/img (sin depender de terceros).
 * Se guarda autor y licencia para mostrar el credito en Perfil → Créditos.
 */
import { asset } from './utils.js';
export const MONTH_PHOTOS = [
  { src: asset('img/mes-01.jpg'), alt: 'Aurora boreal verde sobre un paisaje nevado', author: 'Rafal Konieczny', license: 'CC BY 2.5' },
  { src: asset('img/mes-02.jpg'), alt: 'Montañas nevadas y lago en el valle de Chola, Nepal', author: 'Vyacheslav Argenberg', license: 'CC BY 4.0' },
  { src: asset('img/mes-03.jpg'), alt: 'Lago Krishansar entre montañas en Cachemira', author: 'Rohit Sharma', license: 'CC BY-SA 4.0' },
  { src: asset('img/mes-04.jpg'), alt: 'Valle verde con colinas en Santa Rosa, California', author: 'Z3lvs', license: 'CC0' },
  { src: asset('img/mes-05.jpg'), alt: 'Dunas de arena en el desierto de Libia', author: 'Vyacheslav Argenberg', license: 'CC BY 4.0' },
  { src: asset('img/mes-06.jpg'), alt: 'Olas del océano vistas desde un dron', author: 'Caleb Jones', license: 'CC0' },
  { src: asset('img/mes-07.jpg'), alt: 'Olas rompiendo en la playa de Palm Coast', author: 'Lance Asper', license: 'CC0' },
  { src: asset('img/mes-08.jpg'), alt: 'Gran Cañón después del atardecer', author: 'Eric Kilby', license: 'CC BY-SA 2.0' },
  { src: asset('img/mes-09.jpg'), alt: 'Niebla descendiendo sobre un bosque de pinos', author: 'Pacific Austin', license: 'CC0' },
  { src: asset('img/mes-10.jpg'), alt: 'Bosque de otoño con corteza mojada', author: 'Martin Vorel', license: 'CC0' },
  { src: asset('img/mes-11.jpg'), alt: 'Formaciones rocosas del cañón Bryce', author: 'Jon Zander', license: 'CC BY-SA 3.0' },
  { src: asset('img/mes-12.jpg'), alt: 'Boca del glaciar Matanuska en Alaska', author: 'Sbork', license: 'CC BY-SA 3.0' }
];

export const HERO_PHOTOS = {
  gym: { src: asset('img/gym.jpg'), alt: 'Persona levantando una barra en peso muerto', author: 'Nenad Stojkovic', license: 'CC BY 2.0' },
  running: { src: asset('img/running.jpg'), alt: 'Corredor cruzando la meta de una carrera de diez millas', author: 'U.S. Army', license: 'CC BY 2.0' },
  lectura: { src: asset('img/lectura.jpg'), alt: 'Sala de lectura de una biblioteca con estanterías', author: 'Asturio Cantabrio', license: 'CC BY-SA 4.0' },
  trabajo: { src: asset('img/trabajo.jpg'), alt: 'Ciudad iluminada de noche', author: 'Pixel.la', license: 'CC0' },
  bosque: { src: asset('img/bosque.jpg'), alt: 'Bosque de coníferas envuelto en niebla', author: 'Milo McDowell', license: 'CC0' },
  aurora: { src: asset('img/aurora.jpg'), alt: 'Aurora boreal sobre Noruega', author: 'Carsten', license: 'CC BY 2.0' }
};

export function photoForMonth(month) {
  return MONTH_PHOTOS[((month % 12) + 12) % 12];
}

/* Portadas elegibles para el perfil */
export const COVER_PHOTOS = [
  { key: 'aurora', photo: HERO_PHOTOS.aurora },
  { key: 'bosque', photo: HERO_PHOTOS.bosque },
  { key: 'lago', photo: MONTH_PHOTOS[2] },
  { key: 'dunas', photo: MONTH_PHOTOS[4] },
  { key: 'oceano', photo: MONTH_PHOTOS[5] },
  { key: 'canon', photo: MONTH_PHOTOS[10] },
  { key: 'ciudad', photo: HERO_PHOTOS.trabajo },
  { key: 'gym', photo: HERO_PHOTOS.gym }
];

export function coverPhoto(key) {
  return (COVER_PHOTOS.find((item) => item.key === key) || COVER_PHOTOS[0]).photo;
}
