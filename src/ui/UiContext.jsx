/*
 * UiContext: modales (<dialog>), avisos breves (toast), confirmaciones y la paleta de comandos.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Modal from './Modal.jsx';

const UiContext = createContext(null);

const TOAST_MS = 2600;
const THEME_KEY = 'foxflow:theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'auto';
  } catch {
    return 'auto';
  }
}

export function UiProvider({ children }) {
  /* Modo de color: 'auto' sigue al sistema; 'light' y 'dark' lo fijan (se recuerda en este dispositivo) */
  const [theme, setThemeState] = useState(readTheme);
  const [isSystemDark, setIsSystemDark] = useState(() => window.matchMedia?.(DARK_QUERY).matches ?? true);
  const mode = theme === 'auto' ? (isSystemDark ? 'dark' : 'light') : theme;
  const [modal, setModal] = useState(null);
  const [confirmBox, setConfirmBox] = useState(null);
  const [toast, setToast] = useState(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const toastTimer = useRef(0);

  useEffect(() => {
    const query = window.matchMedia?.(DARK_QUERY);
    if (!query) return undefined;
    const changeHandler = (event) => setIsSystemDark(event.matches);
    query.addEventListener('change', changeHandler);
    return () => query.removeEventListener('change', changeHandler);
  }, []);

  /* El modo tambien vive en <html> para los modales, la paleta y el color de la barra del navegador */
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'dark' ? '#050506' : '#f4efe9');
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', mode);
  }, [mode]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* sin almacenamiento */ }
  }, []);

  const toggleMode = useCallback(() => setTheme(mode === 'dark' ? 'light' : 'dark'), [mode, setTheme]);

  const closeModal = useCallback(() => setModal(null), []);

  const openModal = useCallback((options) => setModal({ key: Date.now(), ...options }), []);

  const showToast = useCallback((message, tone = 'default') => {
    clearTimeout(toastTimer.current);
    setToast({ message, tone, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  /* La confirmacion es un segundo <dialog> encima del modal abierto: cancelar no cierra el formulario de debajo */
  const confirm = useCallback((message, { confirmLabel = 'Borrar', isDanger = true } = {}) => new Promise((resolve) => {
    setConfirmBox({ key: Date.now(), message, confirmLabel, isDanger, resolve });
  }), []);

  const answerHandler = (answer) => {
    confirmBox?.resolve(answer);
    setConfirmBox(null);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const value = useMemo(() => ({ openModal, closeModal, showToast, confirm, isPaletteOpen, setIsPaletteOpen, theme, mode, setTheme, toggleMode }), [openModal, closeModal, showToast, confirm, isPaletteOpen, theme, mode, setTheme, toggleMode]);

  return (
    <UiContext.Provider value={value}>
      {children}
      {modal && (
        <Modal
          key={modal.key}
          title={modal.title}
          size={modal.size}
          onClose={(isSilent) => {
            if (!isSilent) modal.onClose?.();
            closeModal();
          }}
        >
          {modal.render}
        </Modal>
      )}
      {confirmBox && (
        <Modal key={confirmBox.key} title="¿Seguro?" size="small" onClose={() => answerHandler(false)}>
          {() => (
            <div className="form">
              <p className="form__hint">{confirmBox.message}</p>
              <div className="form__actions">
                <button type="button" className="button button--ghost" data-autofocus onClick={() => answerHandler(false)}>Cancelar</button>
                <button type="button" className={`button ${confirmBox.isDanger ? 'button--danger' : 'button--primary'}`} onClick={() => answerHandler(true)}>{confirmBox.confirmLabel}</button>
              </div>
            </div>
          )}
        </Modal>
      )}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && <p key={toast.key} className={`toast toast--${toast.tone}`}>{toast.message}</p>}
      </div>
    </UiContext.Provider>
  );
}

export function useUi() {
  return useContext(UiContext);
}
