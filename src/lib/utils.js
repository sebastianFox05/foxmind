/* Utilidades pequeñas sin dependencia de la interfaz */

export function uid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

export function sum(list, pick = (value) => value) {
  return list.reduce((total, item) => total + (Number(pick(item)) || 0), 0);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) || 0) * factor) / factor;
}

export function formatNumber(value, decimals = 1) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: decimals }).format(Number(value) || 0);
}

export function sortBy(list, pick, direction = 'asc') {
  const factor = direction === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const left = pick(a);
    const right = pick(b);
    if (left === right) return 0;
    return left > right ? factor : -factor;
  });
}

export function groupBy(list, pick) {
  return list.reduce((groups, item) => {
    const key = pick(item);
    (groups[key] ||= []).push(item);
    return groups;
  }, {});
}

export function initials(name) {
  return (name || 'Yo').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

export function plural(count, singular, pluralForm = `${singular}s`) {
  return `${formatNumber(count, 1)} ${Number(count) === 1 ? singular : pluralForm}`;
}

export function downloadFile(filename, content, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Ruta a un archivo de public/ respetando la base del despliegue ('/' en Netlify, '/foxmind/' en GitHub Pages) */
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
