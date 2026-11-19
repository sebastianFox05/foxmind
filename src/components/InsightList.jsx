/* Lista de alertas proactivas (stats.insights) como pildoras con icono */
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

export default function InsightList({ items, onNavigate, limit }) {
  const list = limit ? items.slice(0, limit) : items;
  if (!list.length) {
    return <p className="empty">Todo en orden. Nada urgente por ahora ✨</p>;
  }
  return (
    <ul className="insight-list">
      {list.map((item) => (
        <li key={item.id}>
          <Link to={item.to} className={`insight insight--${item.tone}`} onClick={() => onNavigate?.()}>
            <span className="insight__icon"><Icon name={item.icon} /></span>
            <span className="insight__text">
              <strong className="insight__title">{item.title}</strong>
              <span className="insight__body">{item.text}</span>
            </span>
            <Icon name="chevron-right" className="insight__arrow" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
