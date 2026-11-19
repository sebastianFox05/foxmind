/*
 * Armazon: fondo, cabecera, vista, barra inferior y paleta.
 * Tema "noche" (referencia "Fitness Journey": negro con brillo azul arriba y tarjetas oscuras) en todas las
 * pantallas, salvo Rutina del dia, que usa el diseño "Perfect!" (aurora roja y cristal) con su propia cabecera.
 */
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useData } from './session/DataContext.jsx';
import { useUi } from './ui/UiContext.jsx';
import Aurora from './components/Aurora.jsx';
import TopBar from './components/TopBar.jsx';
import { LogoMark } from './components/Logo.jsx';
import BottomNav from './components/BottomNav.jsx';
import CommandPalette from './ui/CommandPalette.jsx';
import Today from './views/Today.jsx';
import Work from './views/Work.jsx';
import Training from './views/Training.jsx';
import Mind from './views/Mind.jsx';
import Challenges from './views/Challenges.jsx';
import Profile from './views/Profile.jsx';
import Auth from './views/Auth.jsx';
import Routine from './views/Routine.jsx';
import Welcome from './views/Welcome.jsx';
import NewPassword from './views/NewPassword.jsx';

const WELCOME_KEY = 'foxflow:welcomed';

function readWelcomed() {
  try {
    return localStorage.getItem(WELCOME_KEY) === '1';
  } catch {
    return true;
  }
}

/* Cada pantalla tiene su diseño; en el modo contrario usa su variante (claro u oscuro) */
const TONE_BY_MODE = {
  light: { light: 'light', paper: 'paper', mint: 'mint', night: 'light', ritual: 'ritual-light' },
  dark: { light: 'night', paper: 'night', mint: 'mint-dark', night: 'night', ritual: 'ritual' }
};

const SECTIONS = {
  '/': { tone: 'light', context: 'Plan del día', title: 'Hoy', topBar: 'home' },
  '/rutina': { tone: 'ritual', context: 'Rutina del día', title: 'Rutina del día', hasOwnHeader: true },
  '/trabajo': { tone: 'paper', context: 'Trabajo y foco', title: 'Trabajo', topBar: 'home' },
  '/entreno': { tone: 'mint', context: 'Gym y running', title: 'Entreno', topBar: 'home' },
  '/mente': { tone: 'night', context: 'Lectura y diario', title: 'Mente' },
  '/retos': { tone: 'night', context: 'Retos y metas', title: 'Retos' },
  '/perfil': { tone: 'night', context: 'Perfil y revisión', title: 'Perfil' }
};

export default function App() {
  const { isReady, isSignedIn, isAuthReady, isRecovering, error, clearError } = useData();
  const { showToast, mode } = useUi();
  const location = useLocation();
  const section = SECTIONS[location.pathname] || SECTIONS['/'];
  const tone = TONE_BY_MODE[mode][section.tone] || section.tone;
  const [isWelcomed, setIsWelcomed] = useState(readWelcomed);
  const [authMode, setAuthMode] = useState(() => (readWelcomed() ? 'login' : 'register'));

  /* Una vez dentro, la proxima vez que se muestre el acceso (al cerrar sesion) sera "Entrar" */
  useEffect(() => {
    if (isSignedIn) setAuthMode('login');
  }, [isSignedIn]);

  const welcomeDoneHandler = (nextMode) => {
    try { localStorage.setItem(WELCOME_KEY, '1'); } catch { /* sin almacenamiento */ }
    setAuthMode(nextMode);
    setIsWelcomed(true);
  };

  useEffect(() => {
    document.title = `${section.title} · FoxMind`;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [section]);

  useEffect(() => {
    if (!error) return;
    showToast(error, 'danger');
    clearError();
  }, [error, showToast, clearError]);

  /* 1) Bienvenida (solo la primera vez)  2) Entrar o registrarse  3) La app */
  /* Enlace de recuperar contraseña: primero la contraseña nueva (aunque no se haya visto la bienvenida) */
  if (isRecovering) {
    return (
      <div className="app app--welcome">
        <NewPassword />
      </div>
    );
  }

  if (!isWelcomed) {
    return (
      <div className="app app--welcome">
        <Welcome onStart={() => welcomeDoneHandler('register')} onLogin={() => welcomeDoneHandler('login')} />
      </div>
    );
  }

  if (isAuthReady && !isSignedIn) {
    return (
      <div className="app app--welcome">
        <Auth initialMode={authMode} />
      </div>
    );
  }

  return (
    <div className={`app app--${tone} app--mode-${mode}`}>
      <Aurora tone={tone} />
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <div className="app__shell">
        {!section.hasOwnHeader && <TopBar context={section.context} variant={section.topBar} />}
        <main id="contenido" className="app__main" tabIndex={-1}>
          {isReady ? (
            <Routes>
              <Route path="/" element={<Today />} />
              <Route path="/rutina" element={<Routine />} />
              <Route path="/trabajo" element={<Work />} />
              <Route path="/entreno" element={<Training />} />
              <Route path="/mente" element={<Mind />} />
              <Route path="/retos" element={<Challenges />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          ) : (
            <p className="loading" role="status"><LogoMark className="loading__mark" />Cargando tu día…</p>
          )}
        </main>
      </div>
      <BottomNav />
      <CommandPalette />
    </div>
  );
}
