/*
 * Marca FoxMind.
 * - Logo: logotipo (reloj de arena + "FOX MIND"), rojo sobre fondos claros y crema sobre oscuros o fotos.
 * - LogoMark: el icono "FM" de la app (el mismo de la pantalla de inicio del movil).
 */
import { asset } from '../lib/utils.js';

export default function Logo({ isOnDark = false, className = '', alt = 'FoxMind' }) {
  return (
    <img
      className={`logo ${className}`}
      src={asset(isOnDark ? 'logo-foxmind-crema.png' : 'logo-foxmind.png')}
      alt={alt}
      width="720"
      height="407"
      decoding="async"
    />
  );
}

export function LogoMark({ className = '' }) {
  return <img className={`logo-mark ${className}`} src={asset('icon-192.png')} alt="" width="192" height="192" decoding="async" />;
}
