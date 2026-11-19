/*
 * Cabecera.
 * - "home" (Hoy, referencia de la derecha): boton de menu a la izquierda; buscar, campana con punto y avatar a la derecha.
 * - Por defecto (tema noche, "Fitness Journey"): avatar con aro + saludo, buscar y campana.
 */
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useData } from '../session/DataContext.jsx';
import { useUi } from '../ui/UiContext.jsx';
import { insights } from '../lib/stats.js';
import Avatar from './Avatar.jsx';
import InsightList from './InsightList.jsx';

const MENU = [
  { to: '/', label: 'Hoy', icon: 'home' },
  { to: '/rutina', label: 'Rutina del día', icon: 'leaf' },
  { to: '/trabajo', label: 'Trabajo y foco', icon: 'briefcase' },
  { to: '/entreno', label: 'Gym y running', icon: 'dumbbell' },
  { to: '/mente', label: 'Lectura y diario', icon: 'book' },
  { to: '/retos', label: 'Retos', icon: 'trophy' },
  { to: '/perfil', label: 'Perfil y revisión semanal', icon: 'user' }
];

function MenuList({ onNavigate }) {
  return (
    <nav aria-label="Todas las secciones">
      <ul className="menu-list">
        {MENU.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="menu-list__link" onClick={onNavigate}>
              <span className="insight__icon"><Icon name={item.icon} /></span>
              {item.label}
              <Icon name="chevron-right" className="insight__arrow" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function TopBar({ context, variant = 'default' }) {
  const { db, settings } = useData();
  const { openModal, setIsPaletteOpen, mode, toggleMode } = useUi();
  const alerts = insights(db, settings);
  const isHome = variant === 'home';

  const alertsHandler = () => openModal({
    title: 'Alertas y sugerencias',
    render: (close) => <InsightList items={alerts} onNavigate={close} />
  });

  const menuHandler = () => openModal({ title: 'Menú', render: (close) => <MenuList onNavigate={() => close()} /> });

  const modeButton = (
    <button type="button" className="icon-button icon-button--bare mode-toggle" aria-label={mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} onClick={toggleMode}>
      <Icon name={mode === 'dark' ? 'sun' : 'moon'} />
    </button>
  );

  const bell = (
    <button type="button" className="icon-button icon-button--bare top-bar__bell" aria-label={`Alertas: ${alerts.length}`} onClick={alertsHandler}>
      <Icon name="bell" />
      {alerts.length > 0 && (isHome ? <span className="top-bar__dot" aria-hidden="true" /> : <span className="top-bar__badge" aria-hidden="true">{alerts.length}</span>)}
    </button>
  );

  if (isHome) {
    return (
      <header className="top-bar top-bar--home">
        <button type="button" className="icon-button icon-button--bare" aria-label="Abrir menú" onClick={menuHandler}><Icon name="menu" /></button>
        <div className="top-bar__actions">
          <button type="button" className="icon-button icon-button--bare" aria-label="Buscar o capturar (Ctrl + K)" onClick={() => setIsPaletteOpen(true)}><Icon name="search" /></button>
          {modeButton}
          {bell}
          <Link to="/perfil" className="top-bar__avatar-link" aria-label="Abrir perfil"><Avatar settings={settings} className="avatar--photo" /></Link>
        </div>
      </header>
    );
  }

  return (
    <header className="top-bar">
      <Link to="/perfil" className="top-bar__identity" aria-label="Abrir perfil y ajustes">
        <Avatar settings={settings} />
        <span className="top-bar__text">
          <span className="top-bar__name">Hola, {settings.name.split(' ')[0]}</span>
          <span className="top-bar__context">{context}</span>
        </span>
      </Link>
      <div className="top-bar__actions">
        <button type="button" className="icon-button icon-button--bare" aria-label="Buscar o capturar (Ctrl + K)" onClick={() => setIsPaletteOpen(true)}>
          <Icon name="search" />
        </button>
        {modeButton}
        {bell}
      </div>
    </header>
  );
}
