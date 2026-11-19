/* Titulo de seccion con enlace o accion a la derecha ("Ver todo") */
import { Link } from 'react-router-dom';

export default function SectionHeader({ title, id, to, linkLabel = 'Ver todo', action }) {
  return (
    <div className="section-header">
      <h2 className="section-header__title" id={id}>{title}</h2>
      {to && <Link className="section-header__link" to={to}>{linkLabel}</Link>}
      {action}
    </div>
  );
}
