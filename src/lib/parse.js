/*
 * Analizador de texto rapido (paleta de comandos y boton +).
 * Ejemplos:
 *   "Revisar PR del login !alta mañana #api"   → tarea con prioridad, fecha y proyecto
 *   "corrí 7.5 km en 42 min"                   → carrera
 *   "leí 30 pág 25 min"                        → sesion de lectura del libro actual
 *   "idea: bot de standup en Slack"            → idea
 *   "aprendí: useDeferredValue evita bloqueos"  → aprendizaje
 * Y el del tablero: "Press banca: 80 kg", "5K 24:30", "Dominadas 12 reps".
 */
import { addDays, todayISO, weekday, toISO } from './dates.js';

const WEEKDAY_WORDS = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
const PRIORITY_WORDS = { alta: 1, urgente: 1, media: 2, baja: 3 };

function strip(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function number(text) {
  return Number(String(text).replace(',', '.'));
}

function parseDue(words, today) {
  const plain = strip(words);
  if (/\bhoy\b/.test(plain)) return today;
  if (/\bpasado manana\b/.test(plain)) return addDays(today, 2);
  if (/\bmanana\b/.test(plain)) return addDays(today, 1);
  const named = plain.match(/\b(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\b/);
  if (named) {
    const diff = (WEEKDAY_WORDS[named[1]] - weekday(today) + 7) % 7 || 7;
    return addDays(today, diff);
  }
  const numeric = plain.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    if (day < 1 || day > 31 || month < 1 || month > 12) return '';
    const year = numeric[3] ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]) : Number(today.slice(0, 4));
    const iso = toISO(new Date(year, month - 1, day, 12));
    /* Sin año y ya pasada ("3/4 del informe") no se toma como fecha */
    return !numeric[3] && iso < today ? '' : iso;
  }
  return '';
}

function cleanTitle(text, hasNumericDue) {
  const withoutDate = hasNumericDue ? text.replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, '') : text;
  return withoutDate
    .replace(/!(alta|urgente|media|baja|[123])\b/gi, '')
    .replace(/#[\wÀ-ſ-]+/g, '')
    .replace(/@(trabajo|personal)\b/gi, '')
    .replace(/\b(pasado mañana|pasado manana|hoy|mañana|manana)\b/gi, '')
    .replace(/\b(el )?(domingo|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado)\b/gi, '')
    .replace(/^(tarea|todo|pendiente)[:\s]+/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function quickParse(input, today = todayISO()) {
  const text = input.trim();
  const plain = strip(text);
  if (!text) return null;

  /* "corrí 5 km en 30 minutos", "corrí 21 km 1:55" (h:mm) o "corrí 10 km 52:30" (mm:ss) */
  const run = plain.match(/^(corri|running|run|trote)\s+([\d.,]+)\s*k(?:m|ms)?\b(.*)$/);
  if (run) {
    const km = number(run[2]);
    const rest = run[3] || '';
    const clock = rest.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    const plainMinutes = rest.match(/(\d+(?:[.,]\d+)?)\s*(?:min(?:utos?)?|m)\b/);
    let minutes = 0;
    if (clock) {
      const first = Number(clock[1]);
      const second = Number(clock[2]);
      /* Con segundos explicitos es h:mm:ss; sin ellos, menos de 10 en la primera parte se lee como horas (1:55) */
      if (clock[3]) minutes = first * 60 + second + Number(clock[3]) / 60;
      else minutes = first < 10 ? first * 60 + second : first + second / 60;
    } else if (plainMinutes) {
      minutes = number(plainMinutes[1]);
    }
    minutes = Math.round(minutes * 10) / 10;
    return { type: 'run', label: `Registrar carrera: ${km} km${minutes ? ` en ${minutes} min` : ''}`, data: { date: today, km, minutes, type: 'rodaje', feel: 3 } };
  }

  const reading = plain.match(/^(lei|lectura|leer)\s+(\d+)\s*(pag|paginas|p)\b(?:.*?(\d+)\s*min)?/);
  if (reading) {
    const pages = Number(reading[2]);
    const minutes = reading[4] ? Number(reading[4]) : pages * 2;
    return { type: 'reading', label: `Registrar lectura: ${pages} páginas · ${minutes} min`, data: { date: today, pages, minutes } };
  }

  const readingMinutes = plain.match(/^(lei|lectura|leer)\s+(\d+)\s*min/);
  if (readingMinutes) {
    const minutes = Number(readingMinutes[2]);
    return { type: 'reading', label: `Registrar lectura: ${minutes} min`, data: { date: today, pages: 0, minutes } };
  }

  /* Con dos puntos obligatorios: "Idea para el bot" sigue siendo una tarea, "idea: bot" es una nota */
  const note = text.match(/^(idea|aprend[ií]|til|snippet)\s*:\s*(.+)/i);
  if (note) {
    const kindWord = strip(note[1]);
    const kind = kindWord === 'idea' ? 'idea' : kindWord === 'snippet' ? 'snippet' : 'aprendizaje';
    return { type: 'note', label: `Guardar ${kind}: ${note[2]}`, data: { kind, title: note[2].trim(), body: '', tags: [] } };
  }

  if (/^(gym|entrene|entreno)\b/.test(plain)) {
    return { type: 'workout', label: 'Registrar sesión de gym', data: { name: text.replace(/^\S+\s*/, '') } };
  }

  if (/^reto[:\s]/.test(plain)) {
    return { type: 'challenge', label: `Crear reto: ${text.replace(/^reto[:\s]+/i, '')}`, data: { title: text.replace(/^reto[:\s]+/i, '') } };
  }

  const priorityMatch = plain.match(/!(alta|urgente|media|baja|[123])\b/);
  const priority = priorityMatch ? (PRIORITY_WORDS[priorityMatch[1]] || Number(priorityMatch[1])) : 2;
  const project = (text.match(/#([\wÀ-ſ-]+)/) || [])[1] || '';
  const area = /@personal\b/i.test(text) ? 'personal' : 'trabajo';
  const due = parseDue(text, today);
  const title = cleanTitle(text, Boolean(due) && /\b\d{1,2}\/\d{1,2}/.test(text));
  if (!title) return null;
  const details = [due && `para ${due === today ? 'hoy' : due}`, project && `#${project}`, priority === 1 && 'prioridad alta'].filter(Boolean).join(' · ');
  return { type: 'task', label: `Nueva tarea: ${title}${details ? ` (${details})` : ''}`, data: { title, priority, project, area, due, status: 'todo', subtasks: [], tags: [] } };
}

/* ---------- Tablero del cuarto: una marca por linea ---------- */

const CATEGORY_HINTS = [
  { category: 'running', pattern: /\b(5k|10k|21k|42k|km|carrera|correr|media maraton|maraton|ritmo|run)\b/ },
  { category: 'gym', pattern: /\b(press|banca|sentadilla|squat|peso muerto|deadlift|dominadas|curl|remo|militar|hip thrust|fondos|kg|lb|reps|flexiones|plancha)\b/ },
  { category: 'lectura', pattern: /\b(libro|libros|paginas|lectura|leer)\b/ }
];

export function parseBoard(text, today = todayISO()) {
  return text.split(/\r?\n/).map((line) => line.replace(/^[-*•·\s]+/, '').trim()).filter(Boolean).map((line) => {
    const plain = strip(line);
    const time = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    const amount = line.match(/([\d]+(?:[.,]\d+)?)\s*(kg|kgs|lb|lbs|km|reps|rep|min|pag|páginas|paginas|libros|veces|x)?\b(?!.*\d)/i);
    const category = (CATEGORY_HINTS.find((hint) => hint.pattern.test(plain)) || { category: 'otro' }).category;
    let name = line;
    let value = '';
    let unit = '';
    if (time) {
      value = time[1];
      unit = 'tiempo';
      name = line.replace(time[0], '');
    } else if (amount) {
      value = number(amount[1]);
      unit = (amount[2] || '').toLowerCase().replace(/^kgs$/, 'kg').replace(/^lbs$/, 'lb').replace(/^rep$/, 'reps').replace(/^p[aá]g.*/, 'páginas');
      name = line.slice(0, amount.index);
    }
    name = name.replace(/[:=\-–—]+\s*$/, '').replace(/\s{2,}/g, ' ').trim() || line;
    return { name, value, unit, category: unit === 'tiempo' && category === 'otro' ? 'running' : category, date: today };
  });
}
