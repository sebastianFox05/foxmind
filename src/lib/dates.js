/*
 * Fechas en formato local "AAAA-MM-DD" (sin husos horarios) y utilidades de calendario.
 * La semana empieza en lunes.
 */

export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
/* Orden de la semana para la interfaz (lunes primero), con el indice de getDay() */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value) {
  return String(value).padStart(2, '0');
}

export function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISO(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function todayISO() {
  return toISO(new Date());
}

export function addDays(iso, amount) {
  const date = parseISO(iso);
  date.setDate(date.getDate() + amount);
  return toISO(date);
}

export function daysBetween(fromIso, toIso) {
  return Math.round((parseISO(toIso) - parseISO(fromIso)) / DAY_MS);
}

export function weekday(iso) {
  return parseISO(iso).getDay();
}

export function startOfWeek(iso) {
  const day = weekday(iso);
  return addDays(iso, day === 0 ? -6 : 1 - day);
}

export function weekDays(iso) {
  const start = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function isoWeekNumber(iso) {
  const date = parseISO(iso);
  const thursday = new Date(date);
  thursday.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const firstThursday = new Date(thursday.getFullYear(), 0, 4, 12);
  return 1 + Math.round(((thursday - firstThursday) / DAY_MS - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
}

export function monthRange(year, month) {
  const last = new Date(year, month + 1, 0).getDate();
  return { start: `${year}-${pad(month + 1)}-01`, end: `${year}-${pad(month + 1)}-${pad(last)}` };
}

export function quarterRange(year, quarter) {
  const first = monthRange(year, (quarter - 1) * 3);
  const last = monthRange(year, (quarter - 1) * 3 + 2);
  return { start: first.start, end: last.end };
}

export function yearRange(year) {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function weekRange(iso) {
  const start = startOfWeek(iso);
  return { start, end: addDays(start, 6) };
}

export function quarterOf(iso) {
  return Math.floor((parseISO(iso).getMonth()) / 3) + 1;
}

export function isInRange(iso, start, end) {
  return Boolean(iso) && iso >= start && iso <= end;
}

export function formatDay(iso) {
  const date = parseISO(iso);
  return `${WEEKDAYS_SHORT[date.getDay()].toLowerCase()} ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatLongDay(iso) {
  const date = parseISO(iso);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export function relativeDay(iso, today = todayISO()) {
  const diff = daysBetween(today, iso);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  if (diff > 1 && diff < 7) return WEEKDAYS[weekday(iso)];
  return formatDay(iso);
}

export function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

/* Duracion en minutos → "1 h 05 min" */
export function formatMinutes(minutes) {
  const total = Math.round(minutes || 0);
  if (total < 60) return `${total} min`;
  return `${Math.floor(total / 60)} h ${pad(total % 60)} min`;
}

/* Tiempo de carrera en minutos → "48:20" o "1:05:00" */
export function formatDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  const totalSeconds = Math.round(minutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours ? `${hours}:${pad(mins)}:${pad(seconds)}` : `${mins}:${pad(seconds)}`;
}

/* Ritmo de carrera: minutos por km → "5:12 /km" */
export function formatPace(minutesPerKm) {
  if (!Number.isFinite(minutesPerKm) || minutesPerKm <= 0) return '—';
  const minutes = Math.floor(minutesPerKm);
  const seconds = Math.round((minutesPerKm - minutes) * 60);
  return seconds === 60 ? `${minutes + 1}:00` : `${minutes}:${pad(seconds)}`;
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
