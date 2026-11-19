/*
 * Navegacion principal.
 * - Movil y tablet: barra inferior flotante de cristal con el boton (+) centrado (tres secciones a cada lado).
 * - Escritorio (≥ 1024 px): la misma lista se convierte en barra lateral fija con logo, "Captura rapida"
 *   arriba, las secciones con su nombre y Perfil al final (todo con CSS: un solo marcado).
 */
import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import { useUi } from '../ui/UiContext.jsx';

const LEFT = [
  { to: '/', label: 'Hoy', icon: 'home', isEnd: true },
  { to: '/rutina', label: 'Rutina', icon: 'leaf' },
  { to: '/trabajo', label: 'Trabajo', icon: 'briefcase' }
];
/* Tres a cada lado para que el boton + quede centrado */
const RIGHT = [
  { to: '/entreno', label: 'Entreno', icon: 'dumbbell' },
  { to: '/mente', label: 'Mente', icon: 'book' },
  { to: '/retos', label: 'Retos', icon: 'trophy' }
];

function NavItem({ item, className = '' }) {
  return (
    <li className={`bottom-nav__item ${className}`}>
      <NavLink to={item.to} end={item.isEnd} className={({ isActive }) => `bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}`}>
        <Icon name={item.icon} />
        <span className="bottom-nav__label">{item.label}</span>
      </NavLink>
    </li>
  );
}

export default function BottomNav() {
  const { setIsPaletteOpen, mode } = useUi();
  return (
    <nav className="bottom-nav" aria-label="Secciones">
      <a className="bottom-nav__brand" href="#/" aria-label="FoxMind: ir a Hoy">
        <Logo isOnDark={mode === 'dark'} alt="" />
      </a>
      <ul className="bottom-nav__list">
        {LEFT.map((item) => <NavItem key={item.to} item={item} />)}
        <li className="bottom-nav__item bottom-nav__item--fab">
          <button type="button" className="bottom-nav__fab" aria-label="Captura rápida (Ctrl + K)" onClick={() => setIsPaletteOpen(true)}>
            <Icon name="plus" />
            <span className="bottom-nav__fab-label" aria-hidden="true">Captura rápida</span>
            <kbd className="bottom-nav__kbd" aria-hidden="true">Ctrl K</kbd>
          </button>
        </li>
        {RIGHT.map((item) => <NavItem key={item.to} item={item} />)}
        <NavItem item={{ to: '/perfil', label: 'Perfil', icon: 'user' }} className="bottom-nav__item--desktop" />
      </ul>
    </nav>
  );
}
