/*
 * Rutina del dia: la UNICA pantalla con el diseño "Perfect!" (referencia favorita).
 * Fondo aurora rojo difuminado, cabecera en pildora (avatar + nombre + campana), titular grande,
 * actividades en pildoras grandes de cristal, interruptor y boton en contorno "Continuar".
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../session/DataContext.jsx';
import { useUi } from '../ui/UiContext.jsx';
import { useActions } from '../ui/useActions.jsx';
import Icon from '../components/Icon.jsx';
import InsightList from '../components/InsightList.jsx';
import { capitalize, formatLongDay, greeting, todayISO } from '../lib/dates.js';
import { habitStreak, insights, isHabitDone, isHabitDue } from '../lib/stats.js';
import Avatar from '../components/Avatar.jsx';

const MOMENT_ORDER = ['mañana', 'todo el día', 'tarde', 'noche'];
const MOMENT_TEXT = { mañana: 'Por la mañana', 'todo el día': 'A lo largo del día', tarde: 'Por la tarde', noche: 'Por la noche' };

function headline(done, total) {
  if (!total) return { title: 'Día libre.', lead: 'No hay actividades programadas para hoy. Añade una para empezar tu rutina.' };
  if (done === total) return { title: '¡Perfecto!', lead: 'Completaste toda tu rutina. Cierra el día escribiendo en tu diario.' };
  if (done === 0) return { title: `${greeting()}.`, lead: `Tienes ${total} actividades para hoy. Empieza por la primera y deja que la racha haga el resto.` };
  return { title: 'Vas muy bien.', lead: `Llevas ${done} de ${total}. Te ${total - done === 1 ? 'falta 1 actividad' : `faltan ${total - done} actividades`} para cerrar el día.` };
}

export default function Routine() {
  const { db, settings, save } = useData();
  const { openModal, showToast, mode, toggleMode } = useUi();
  const actions = useActions();
  const navigate = useNavigate();
  const location = useLocation();
  const date = location.state?.date || todayISO();
  const [isHidingDone, setIsHidingDone] = useState(false);

  const habits = db.habits.filter((habit) => isHabitDue(habit, date))
    .sort((a, b) => MOMENT_ORDER.indexOf(a.moment) - MOMENT_ORDER.indexOf(b.moment));
  const done = habits.filter((habit) => isHabitDone(habit, date)).length;
  const visible = isHidingDone ? habits.filter((habit) => !isHabitDone(habit, date)) : habits;
  const text = headline(done, habits.length);
  const alerts = insights(db, settings);

  const toggleHandler = (habit) => {
    const log = habit.log || [];
    const isDone = log.includes(date);
    save('habits', { ...habit, log: isDone ? log.filter((item) => item !== date) : [...log, date] });
    if (!isDone) showToast(`${habit.name} ✓`);
  };

  const continueHandler = () => {
    if (done === habits.length && habits.length) actions.openJournal(date);
    else navigate('/');
  };

  return (
    <div className="view ritual">
      <header className="pill-header">
        <Avatar settings={settings} />
        <span className="pill-header__name">{settings.name.split(' ')[0]}</span>
        <span className="pill-header__context">{date === todayISO() ? 'Rutina del día' : capitalize(formatLongDay(date))}</span>
        <button type="button" className="pill-header__bell pill-header__bell--mode mode-toggle" aria-label={mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} onClick={toggleMode}>
          <Icon name={mode === 'dark' ? 'sun' : 'moon'} />
        </button>
        <button type="button" className="pill-header__bell" aria-label={`Alertas: ${alerts.length}`} onClick={() => openModal({ title: 'Alertas y sugerencias', render: (close) => <InsightList items={alerts} onNavigate={close} /> })}>
          <Icon name="bell" />
        </button>
      </header>

      <section className="ritual__intro" aria-labelledby="ritual-title">
        <h1 className="ritual__title" id="ritual-title">{text.title}</h1>
        <p className="ritual__lead">{text.lead}</p>
        <span className="ritual__progress" style={{ '--progress': `${habits.length ? Math.round((done / habits.length) * 100) : 0}%` }} aria-hidden="true" />
      </section>

      <ul className="ritual__list">
        {visible.map((habit) => {
          const isDone = isHabitDone(habit, date);
          const streak = habitStreak(habit, date);
          return (
            <li key={habit.id} className={`ritual-pill${isDone ? ' ritual-pill--done' : ''}`}>
              <button type="button" className="ritual-pill__main" aria-pressed={isDone} onClick={() => toggleHandler(habit)}>
                <span className="ritual-pill__icon"><Icon name={isDone ? 'check' : habit.icon} /></span>
                <span className="ritual-pill__text">
                  <span className="ritual-pill__name">{habit.name}</span>
                  <span className="ritual-pill__meta">{MOMENT_TEXT[habit.moment] || habit.moment} · {streak > 0 ? `${streak} ${streak === 1 ? 'día seguido' : 'días seguidos'}` : 'empieza tu racha hoy'}{isDone ? ' · hecho' : ''}</span>
                </span>
              </button>
              <button type="button" className="ritual-pill__edit" aria-label={`Editar ${habit.name}`} onClick={() => actions.openHabit(habit)}>
                <Icon name="more" />
              </button>
            </li>
          );
        })}
        {!visible.length && habits.length > 0 && <li className="ritual__empty">Todo hecho por hoy ✨</li>}
        <li>
          <button type="button" className="ritual-pill ritual-pill--add" onClick={() => actions.openHabit()}>
            <span className="ritual-pill__icon"><Icon name="plus" /></span>
            <span className="ritual-pill__text"><span className="ritual-pill__name">Añadir actividad</span><span className="ritual-pill__meta">Agua, meditación, inglés, código…</span></span>
          </button>
        </li>
      </ul>

      <footer className="ritual__footer">
        <label className="switch">
          <input type="checkbox" className="switch__input" checked={isHidingDone} onChange={(event) => setIsHidingDone(event.target.checked)} />
          <span className="switch__track" aria-hidden="true"><span className="switch__thumb"><Icon name="check" /></span></span>
          <span className="switch__label">Ocultar las completadas</span>
        </label>
        <button type="button" className="button button--outline button--block button--tall" onClick={continueHandler}>
          {done === habits.length && habits.length ? 'Cerrar el día en el diario' : 'Continuar'}
        </button>
      </footer>
    </div>
  );
}
