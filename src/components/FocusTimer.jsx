/*
 * Temporizador de foco (pomodoro): numero grande y fino dentro de un anillo.
 * Su estado (fin previsto, minutos, tarea) se guarda en localStorage: si cambias de pestaña o de vista
 * sigue contando, y si el bloque termino mientras no lo mirabas se registra al volver.
 */
import { useCallback, useEffect, useState } from 'react';
import { useData } from '../session/DataContext.jsx';
import { useUi } from '../ui/UiContext.jsx';
import { Ring } from './Charts.jsx';
import Icon from './Icon.jsx';
import { todayISO } from '../lib/dates.js';

const PRESETS = [25, 50, 90];
const TIMER_KEY = 'foxflow:focus';

function readTimer() {
  try {
    return JSON.parse(localStorage.getItem(TIMER_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeTimer(state) {
  try {
    if (state) localStorage.setItem(TIMER_KEY, JSON.stringify(state));
    else localStorage.removeItem(TIMER_KEY);
  } catch {
    /* sin almacenamiento: el temporizador funciona solo mientras la vista esta abierta */
  }
}

function chime() {
  try {
    const context = new AudioContext();
    [660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + index * 0.25 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.25 + 0.6);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + index * 0.25);
      oscillator.stop(context.currentTime + index * 0.25 + 0.7);
    });
  } catch {
    /* sin audio disponible */
  }
}

function format(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function FocusTimer({ initialTaskId = '' }) {
  const { db, settings, save } = useData();
  const { showToast } = useUi();
  const [timer, setTimer] = useState(() => readTimer() || { minutes: Number(settings.focusMinutes) || 25, remaining: (Number(settings.focusMinutes) || 25) * 60, endAt: 0, taskId: initialTaskId });
  const [now, setNow] = useState(Date.now());
  const isRunning = timer.endAt > 0;
  const remaining = isRunning ? Math.max(0, Math.round((timer.endAt - now) / 1000)) : timer.remaining;
  const openTasks = db.tasks.filter((task) => task.status !== 'done');

  const update = useCallback((next) => {
    setTimer(next);
    writeTimer(next);
  }, []);

  /* Si se llega desde un poster con otra tarea, se elige esa (sin tocar un bloque en marcha) */
  useEffect(() => {
    if (initialTaskId && !readTimer()?.endAt) setTimer((current) => ({ ...current, taskId: initialTaskId }));
  }, [initialTaskId]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [isRunning]);

  /* Fin del bloque: se guarda la sesion de foco (cuenta para los retos) */
  useEffect(() => {
    if (!isRunning || remaining > 0) return;
    const task = db.tasks.find((item) => item.id === timer.taskId);
    save('focusSessions', { date: todayISO(), minutes: timer.minutes, taskId: timer.taskId, label: task?.title || 'Bloque de foco' });
    chime();
    showToast(`Bloque de ${timer.minutes} min completado. Descansa 5 minutos ☕`, 'success');
    update({ ...timer, endAt: 0, remaining: timer.minutes * 60 });
  }, [isRunning, remaining, timer, db.tasks, save, showToast, update]);

  useEffect(() => {
    if (isRunning) document.title = `${format(remaining)} · Foco`;
  }, [isRunning, remaining]);

  useEffect(() => () => { document.title = 'Trabajo · FoxMind'; }, []);

  const toggleHandler = () => {
    if (isRunning) update({ ...timer, endAt: 0, remaining });
    else {
      setNow(Date.now());
      update({ ...timer, endAt: Date.now() + remaining * 1000 });
    }
  };

  const presetHandler = (value) => update({ ...timer, minutes: value, remaining: value * 60, endAt: 0 });

  const todayMinutes = db.focusSessions.filter((item) => item.date === todayISO()).reduce((total, item) => total + item.minutes, 0);

  return (
    <div className="focus glass glass--padded">
      <div className="focus__presets" role="group" aria-label="Duración">
        {PRESETS.map((value) => (
          <button key={value} type="button" className={`chip${timer.minutes === value ? ' chip--active' : ''}`} aria-pressed={timer.minutes === value} onClick={() => presetHandler(value)}>{value} min</button>
        ))}
      </div>
      <Ring value={1 - remaining / (timer.minutes * 60)} size={220} stroke={4} label={`Quedan ${format(remaining)}`}>
        <span className="focus__time">{format(remaining)}</span>
        <span className="focus__state">{isRunning ? 'En foco' : 'Listo'}</span>
      </Ring>
      <div className="field focus__task">
        <label className="field__label" htmlFor="focus-task">¿En qué te enfocas?</label>
        <select id="focus-task" className="field__input" value={timer.taskId} onChange={(event) => update({ ...timer, taskId: event.target.value })}>
          <option value="">Bloque libre</option>
          {openTasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
        </select>
      </div>
      <div className="focus__controls">
        <button type="button" className="icon-button icon-button--large" aria-label="Reiniciar" onClick={() => presetHandler(timer.minutes)}><Icon name="reset" /></button>
        <button type="button" className="focus__play" aria-label={isRunning ? 'Pausar' : 'Empezar'} onClick={toggleHandler}><Icon name={isRunning ? 'pause' : 'play'} /></button>
        <span className="focus__today"><strong>{todayMinutes}</strong> min hoy</span>
      </div>
    </div>
  );
}
