/*
 * DataContext: sesion (modo nube) y todos los registros en memoria.
 * Las vistas leen `db` y escriben con save/remove; el almacen (local o Supabase) persiste por detras.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { config, isCloudMode } from '../lib/config.js';
import { createLocalStore } from '../lib/store/local.js';
import { createSupabaseStore } from '../lib/store/supabase.js';
import { emptyDb } from '../lib/store/collections.js';
import { createSeed } from '../lib/seed.js';
import { uid } from '../lib/utils.js';

const DataContext = createContext(null);

const DEFAULT_SETTINGS = { name: 'Yo', role: '', dailyReadingMin: 20, weeklyGymGoal: 4, weeklyKmGoal: 20, yearBooksGoal: 12, focusMinutes: 25, calorieGoal: 2200, carbsGoal: 250, proteinGoal: 150, fatGoal: 70, weeklyActiveGoal: 240 };

const LOCAL_SESSION_KEY = 'foxflow:local-session';

let supabaseClient = null;

function readLocalSession() {
  try {
    return localStorage.getItem(LOCAL_SESSION_KEY) === '1';
  } catch {
    return true;
  }
}

/*
 * PKCE: los enlaces de correo (recuperar contraseña) vuelven con ?code=… en la direccion, no con #access_token,
 * asi no chocan con las rutas #/ del HashRouter. supabase-js canjea el codigo solo al arrancar.
 */
function getClient() {
  if (!supabaseClient && isCloudMode) {
    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, { auth: { flowType: 'pkce', detectSessionInUrl: true } });
  }
  return supabaseClient;
}

/* La app se abrio desde el enlace de "recuperar contraseña" (redirectTo …/?recuperar=1) */
function readRecoveryFlag() {
  try {
    return new URLSearchParams(window.location.search).has('recuperar');
  } catch {
    return false;
  }
}

export function DataProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(!isCloudMode);
  const [db, setDb] = useState(emptyDb);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  /* Modo local: "sesion" de este dispositivo (sin servidor no hay cuentas reales) */
  const [hasLocalSession, setHasLocalSession] = useState(readLocalSession);
  /* Recuperacion de contraseña en curso: hay que pedir la nueva antes de entrar */
  const [isRecovering, setIsRecovering] = useState(() => isCloudMode && readRecoveryFlag());

  const userId = session?.user?.id || '';
  const userName = session?.user?.user_metadata?.name || '';
  const seededFor = useRef(null);
  const writeQueue = useRef(new Map());

  /* El almacen depende del usuario, no del objeto sesion: el refresco del token (cada hora) no recarga la app */
  const store = useMemo(() => {
    if (!isCloudMode) return createLocalStore();
    return userId ? createSupabaseStore(getClient()) : null;
  }, [userId]);

  /* Al cerrar sesion no quedan datos de la persona anterior en memoria */
  useEffect(() => {
    if (isCloudMode && !userId) {
      setDb(emptyDb());
      setIsReady(false);
    }
  }, [userId]);

  /* Sesion de Supabase */
  useEffect(() => {
    if (!isCloudMode) return undefined;
    const client = getClient();
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsAuthReady(true);
    });
    const { data } = client.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') setIsRecovering(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  /* Fin de la recuperacion: limpia ?recuperar y ?code de la direccion y entra a la app */
  const finishRecovery = useCallback(() => {
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash || '#/'}`);
    } catch {
      /* sin historial */
    }
    setIsRecovering(false);
  }, []);

  /* Carga inicial (y datos de ejemplo si esta vacio) */
  useEffect(() => {
    if (!store) return;
    let isCurrent = true;
    setIsReady(false);
    store.loadAll().then(async ({ db: loaded, isEmpty }) => {
      let next = loaded;
      const owner = userId || 'local';
      if (isEmpty) {
        /* Una sola siembra por persona aunque el efecto se ejecute dos veces (StrictMode, eventos de sesion) */
        if (seededFor.current?.owner !== owner) {
          const data = { ...emptyDb(), ...createSeed(undefined, userName || undefined) };
          seededFor.current = { owner, data, promise: store.replaceAll(data) };
        }
        await seededFor.current.promise;
        next = seededFor.current.data;
      }
      if (isCurrent) {
        setDb(next);
        setIsReady(true);
      }
    }).catch((reason) => {
      if (isCurrent) setError(reason.message || 'No se pudieron cargar los datos.');
    });
    return () => { isCurrent = false; };
  }, [store, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Escrituras del mismo registro en fila: un doble toque (marcar y desmarcar) llega a la base en el mismo orden */
  const enqueue = useCallback((id, job) => {
    const previous = writeQueue.current.get(id) || Promise.resolve();
    const next = previous.catch(() => {}).then(job);
    writeQueue.current.set(id, next);
    next.finally(() => { if (writeQueue.current.get(id) === next) writeQueue.current.delete(id); });
    return next;
  }, []);

  const save = useCallback(async (collection, item) => {
    const now = new Date().toISOString();
    const record = { ...item, id: item.id || uid(), createdAt: item.createdAt || now, updatedAt: now };
    setDb((current) => {
      const list = current[collection];
      const isExisting = list.some((entry) => entry.id === record.id);
      return { ...current, [collection]: isExisting ? list.map((entry) => (entry.id === record.id ? record : entry)) : [...list, record] };
    });
    try {
      await enqueue(record.id, () => store.upsert(collection, record));
    } catch (reason) {
      setError(reason.message || 'No se pudo guardar.');
    }
    return record;
  }, [store, enqueue]);

  const remove = useCallback(async (collection, id) => {
    setDb((current) => ({ ...current, [collection]: current[collection].filter((entry) => entry.id !== id) }));
    try {
      await enqueue(id, () => store.remove(collection, id));
    } catch (reason) {
      setError(reason.message || 'No se pudo borrar.');
    }
  }, [store, enqueue]);

  /* Reemplaza todo; si el almacen falla, la pantalla vuelve a los datos anteriores y el error sube a quien llama */
  const replaceAll = useCallback(async (next) => {
    const full = { ...emptyDb(), ...next };
    let previous = null;
    setDb((current) => {
      previous = current;
      return full;
    });
    try {
      await store.replaceAll(full);
    } catch (reason) {
      if (previous) setDb(previous);
      throw reason;
    }
  }, [store]);

  const settingsRecord = db.settings[0];
  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...settingsRecord }), [settingsRecord]);

  const saveSettings = useCallback((changes) => save('settings', { ...settings, ...changes, id: settingsRecord?.id }), [save, settings, settingsRecord]);

  const startLocalSession = useCallback(() => {
    try { localStorage.setItem(LOCAL_SESSION_KEY, '1'); } catch { /* sin almacenamiento */ }
    setHasLocalSession(true);
  }, []);

  const signOut = useCallback(() => {
    if (isCloudMode) return getClient()?.auth.signOut();
    try { localStorage.removeItem(LOCAL_SESSION_KEY); } catch { /* sin almacenamiento */ }
    setHasLocalSession(false);
    return undefined;
  }, []);

  const isSignedIn = isCloudMode ? Boolean(session) : hasLocalSession;

  const value = useMemo(() => ({
    db, settings, isReady, error, clearError: () => setError(''),
    save, remove, replaceAll, saveSettings,
    mode: isCloudMode ? 'cloud' : 'local', session, isAuthReady, isSignedIn, startLocalSession, signOut, isRecovering, finishRecovery, client: getClient()
  }), [db, settings, isReady, error, save, remove, replaceAll, saveSettings, session, isAuthReady, isSignedIn, startLocalSession, signOut, isRecovering, finishRecovery]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
