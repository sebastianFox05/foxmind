/*
 * Almacen local: todo vive en localStorage bajo una sola clave.
 * Misma interfaz que el almacen de Supabase: loadAll, upsert, remove, replaceAll.
 */
import { COLLECTIONS, emptyDb } from './collections.js';

const STORAGE_KEY = 'foxflow:v1';

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed) return null;
    return { ...emptyDb(), ...Object.fromEntries(Object.entries(parsed).filter(([name]) => COLLECTIONS.includes(name))) };
  } catch {
    return null;
  }
}

function write(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function createLocalStore() {
  let db = read();

  return {
    mode: 'local',
    async loadAll() {
      return { db: db || emptyDb(), isEmpty: !db };
    },
    async upsert(collection, item) {
      db ||= emptyDb();
      const list = db[collection];
      const index = list.findIndex((entry) => entry.id === item.id);
      db = { ...db, [collection]: index === -1 ? [...list, item] : list.map((entry) => (entry.id === item.id ? item : entry)) };
      write(db);
    },
    async remove(collection, id) {
      if (!db) return;
      db = { ...db, [collection]: db[collection].filter((entry) => entry.id !== id) };
      write(db);
    },
    async replaceAll(next) {
      db = { ...emptyDb(), ...next };
      write(db);
    }
  };
}
