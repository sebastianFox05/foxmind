/*
 * Almacen en Supabase: tabla flow_entries (una fila por registro, datos en JSON).
 * RLS garantiza que cada persona solo lee y escribe sus propias filas.
 */
import { emptyDb } from './collections.js';

const TABLE = 'flow_entries';
const PAGE_SIZE = 1000;

function toRow(collection, item) {
  const { id, ...data } = item;
  return { id, collection, data };
}

export function createSupabaseStore(client) {
  return {
    mode: 'cloud',
    async loadAll() {
      const db = emptyDb();
      let from = 0;
      let total = 0;
      for (;;) {
        // Orden estable: sin .order() Postgres puede repetir o saltarse filas entre paginas
        const { data, error } = await client.from(TABLE).select('id, collection, data').order('id').range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        data.forEach((row) => {
          if (db[row.collection]) db[row.collection].push({ ...row.data, id: row.id });
        });
        total += data.length;
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      return { db, isEmpty: total === 0 };
    },
    async upsert(collection, item) {
      const { error } = await client.from(TABLE).upsert(toRow(collection, item));
      if (error) throw error;
    },
    async remove(collection, id) {
      const { error } = await client.from(TABLE).delete().eq('id', id).eq('collection', collection);
      if (error) throw error;
    },
    /*
     * Reemplazo seguro: primero se escriben (upsert) todas las filas nuevas y solo despues se borran
     * las que sobran. Si algo falla a mitad, los datos anteriores siguen ahi (nunca queda la tabla vacia).
     */
    async replaceAll(next) {
      const rows = Object.entries(next).flatMap(([collection, list]) => list.map((item) => toRow(collection, item)));
      for (let index = 0; index < rows.length; index += 500) {
        const { error } = await client.from(TABLE).upsert(rows.slice(index, index + 500));
        if (error) throw error;
      }
      const keep = new Set(rows.map((row) => row.id));
      const stale = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await client.from(TABLE).select('id').order('id').range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        data.forEach((row) => { if (!keep.has(row.id)) stale.push(row.id); });
        if (data.length < PAGE_SIZE) break;
      }
      for (let index = 0; index < stale.length; index += 200) {
        const { error } = await client.from(TABLE).delete().in('id', stale.slice(index, index + 200));
        if (error) throw error;
      }
    }
  };
}
