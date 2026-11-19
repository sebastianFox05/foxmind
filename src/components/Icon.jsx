import { ICONS } from '../lib/icons.js';

/* Icono SVG decorativo (aria-hidden); el texto accesible lo pone el boton o enlace que lo contiene */
export default function Icon({ name, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS.target }}
    />
  );
}
