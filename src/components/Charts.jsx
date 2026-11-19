/*
 * Graficos SVG propios (sin librerias): anillo de progreso, barras semanales, linea de tendencia
 * (referencia "Weekly trend") y mapa de constancia estilo GitHub.
 */
import { useEffect, useRef } from 'react';
import { addDays, formatDay, startOfWeek, todayISO, MONTHS_SHORT, parseISO } from '../lib/dates.js';
import { formatNumber } from '../lib/utils.js';

export function Ring({ value, size = 64, stroke = 6, label, children, tone = 'light' }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value || 0));
  return (
    <span className={`ring ring--${tone}`} style={{ '--ring-size': `${size}px` }}>
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label || `${Math.round(pct * 100)} %`}>
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className="ring__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring__content">{children}</span>
    </span>
  );
}

export function BarChart({ data, unit = '', label, goal }) {
  const max = Math.max(1, goal || 0, ...data.map((item) => item.value));
  const lastIndex = data.length - 1;
  return (
    <figure className="bar-chart">
      <div className="bar-chart__plot" role="img" aria-label={`${label}: ${data.map((item) => `${item.label} ${formatNumber(item.value)} ${unit}`).join(', ')}`}>
        {goal ? <span className="bar-chart__goal" style={{ '--goal': `${(goal / max) * 100}%` }}><span>meta {formatNumber(goal)}</span></span> : null}
        {data.map((item, index) => (
          <span key={item.start || item.label} className={`bar-chart__bar${index === lastIndex ? ' bar-chart__bar--current' : ''}`} style={{ '--value': `${(item.value / max) * 100}%` }}>
            <span className="bar-chart__value">{item.value ? formatNumber(item.value) : ''}</span>
          </span>
        ))}
      </div>
      <figcaption className="bar-chart__labels" aria-hidden="true">
        {data.map((item) => <span key={item.start || item.label}>{item.label}</span>)}
      </figcaption>
    </figure>
  );
}

export function TrendChart({ data, label, height = 90 }) {
  const width = 300;
  const max = Math.max(1, ...data.map((item) => item.value));
  const step = width / Math.max(1, data.length - 1);
  const points = data.map((item, index) => [index * step, height - 8 - (item.value / max) * (height - 20)]);
  const path = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  return (
    <figure className="trend-chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={label}>
        <defs>
          <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L${width},${height} L0,${height} Z`} fill="url(#trend-fill)" />
        <path d={path} className="trend-chart__line" />
        {last && <circle cx={last[0]} cy={last[1]} r="4" className="trend-chart__dot" />}
      </svg>
      <figcaption className="trend-chart__labels" aria-hidden="true">
        {data.map((item) => <span key={item.date}>{formatDay(item.date).slice(0, 3)}</span>)}
      </figcaption>
    </figure>
  );
}

/* Mapa de constancia: 26 semanas, una celda por dia, mas intensa cuanta mas actividad */
export function Heatmap({ getValue, weeks = 26, label = 'Constancia de los últimos meses' }) {
  const scrollRef = useRef(null);
  const today = todayISO();
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, []);
  const firstMonday = addDays(startOfWeek(today), -(weeks - 1) * 7);
  const columns = Array.from({ length: weeks }, (_, week) => Array.from({ length: 7 }, (_, day) => addDays(firstMonday, week * 7 + day)));
  let activeDays = 0;
  const cells = columns.map((days) => days.map((date) => {
    if (date > today) return { date, level: -1 };
    const value = getValue(date);
    if (value > 0) activeDays += 1;
    return { date, value, level: value === 0 ? 0 : value < 3 ? 1 : value < 6 ? 2 : value < 9 ? 3 : 4 };
  }));
  return (
    <figure className="heatmap">
      <div className="heatmap__scroll" ref={scrollRef}>
        <div className="heatmap__months" aria-hidden="true">
          {columns.map((days) => {
            const first = parseISO(days[0]);
            return <span key={days[0]}>{first.getDate() <= 7 ? MONTHS_SHORT[first.getMonth()] : ''}</span>;
          })}
        </div>
        <div className="heatmap__grid" role="img" aria-label={`${label}: ${activeDays} días con actividad`}>
          {cells.map((days) => (
            <span key={days[0].date} className="heatmap__week">
              {days.map((cell) => <span key={cell.date} className={`heatmap__cell heatmap__cell--${cell.level}`} title={cell.level >= 0 ? `${formatDay(cell.date)}: ${cell.value} registros` : ''} />)}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="heatmap__legend">
        <span>{activeDays} días activos</span>
        <span className="heatmap__scale" aria-hidden="true">menos {[0, 1, 2, 3, 4].map((level) => <span key={level} className={`heatmap__cell heatmap__cell--${level}`} />)} más</span>
      </figcaption>
    </figure>
  );
}

export function ProgressBar({ value, expected, tone, label }) {
  return (
    <span className={`progress${tone ? ` progress--${tone}` : ''}`} role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round((value || 0) * 100)} style={{ '--progress': `${Math.round((value || 0) * 100)}%`, '--expected': `${Math.round((expected || 0) * 100)}%` }}>
      <span className="progress__fill" />
      {expected !== undefined && <span className="progress__expected" />}
    </span>
  );
}
