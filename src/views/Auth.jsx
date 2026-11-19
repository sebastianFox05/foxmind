/*
 * Inicio de sesion y registro, en el estilo de la bienvenida: foto a sangre arriba, hoja oscura con titular
 * con serifa, campos en pildora y boton coral.
 * - Modo nube (Supabase configurado): cuentas reales, recuperar contraseña.
 * - Modo local: no hay servidor; se avisa y se entra con tu nombre (los datos se quedan en este dispositivo).
 */
import { useState } from 'react';
import { useData } from '../session/DataContext.jsx';
import Icon from '../components/Icon.jsx';
import Photo from '../components/Photo.jsx';
import { MONTH_PHOTOS } from '../lib/photos.js';

const MIN_PASSWORD = 8;

export default function Auth({ initialMode = 'login' }) {
  const { client, mode, startLocalSession, saveSettings } = useData();
  const [view, setView] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [message, setMessage] = useState({ text: '', tone: '' });
  const [isBusy, setIsBusy] = useState(false);
  const isCloud = mode === 'cloud';
  const isSignUp = view === 'register';

  const viewHandler = (next) => {
    setView(next);
    setMessage({ text: '', tone: '' });
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    if (isSignUp && password !== repeat) {
      setMessage({ text: 'Las contraseñas no coinciden.', tone: 'error' });
      return;
    }
    setIsBusy(true);
    setMessage({ text: '', tone: '' });
    try {
      if (!isCloud) {
        if (isSignUp && name.trim()) await saveSettings({ name: name.trim() });
        startLocalSession();
        return;
      }
      if (view === 'forgot') {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}?recuperar=1` });
        if (error) throw error;
        setMessage({ text: 'Te enviamos un enlace para crear una contraseña nueva.', tone: 'ok' });
        return;
      }
      const { data, error } = isSignUp
        ? await client.auth.signUp({ email, password, options: { data: { name: name.trim() }, emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` } })
        : await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (isSignUp && !data.session) setMessage({ text: 'Cuenta creada. Revisa tu correo para confirmarla y luego entra.', tone: 'ok' });
    } catch (reason) {
      setMessage({ text: reason.message || 'No se pudo completar. Inténtalo de nuevo.', tone: 'error' });
    } finally {
      setIsBusy(false);
    }
  };

  const title = view === 'forgot' ? 'Recupera tu acceso' : isSignUp ? 'Crea tu cuenta y empieza hoy' : 'Bienvenido de nuevo';

  return (
    <main className="auth">
      <figure className="auth__cover">
        <Photo photo={MONTH_PHOTOS[2]} className="auth__photo" isEager isDecorative />
        <span className="welcome__place auth__place"><span className="welcome__pin" aria-hidden="true" />FoxMind</span>
      </figure>

      <section className="auth__sheet" aria-labelledby="auth-title">
        {view !== 'forgot' && (
          <div className="auth__switch" role="group" aria-label="Acceso">
            <button type="button" className={`auth__tab${!isSignUp ? ' auth__tab--active' : ''}`} aria-pressed={!isSignUp} onClick={() => viewHandler('login')}>Entrar</button>
            <button type="button" className={`auth__tab${isSignUp ? ' auth__tab--active' : ''}`} aria-pressed={isSignUp} onClick={() => viewHandler('register')}>Registrarme</button>
          </div>
        )}
        <h1 className="auth__title" id="auth-title">{title}</h1>
        {!isCloud && (
          <p className="auth__notice"><Icon name="alert" /> Modo local: aún no hay servidor conectado. Tus datos se guardan solo en este dispositivo; al activar la nube tendrás cuenta real con correo y contraseña.</p>
        )}

        <form className="auth__form" onSubmit={submitHandler}>
          {isSignUp && (
            <label className="auth-field" htmlFor="auth-name">
              <Icon name="user" />
              <span className="visually-hidden">Nombre</span>
              <input id="auth-name" autoComplete="name" placeholder="Tu nombre" value={name} onChange={(event) => setName(event.target.value)} required={isSignUp} />
            </label>
          )}
          {isCloud && (
            <label className="auth-field" htmlFor="auth-email">
              <Icon name="note" />
              <span className="visually-hidden">Correo</span>
              <input id="auth-email" type="email" autoComplete="email" placeholder="Correo" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
          )}
          {isCloud && view !== 'forgot' && (
            <label className="auth-field" htmlFor="auth-password">
              <Icon name="settings" />
              <span className="visually-hidden">Contraseña</span>
              <input id="auth-password" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={MIN_PASSWORD} placeholder={`Contraseña (mín. ${MIN_PASSWORD})`} value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
          )}
          {isCloud && isSignUp && (
            <label className="auth-field" htmlFor="auth-repeat">
              <Icon name="check" />
              <span className="visually-hidden">Repite la contraseña</span>
              <input id="auth-repeat" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} placeholder="Repite la contraseña" value={repeat} onChange={(event) => setRepeat(event.target.value)} required />
            </label>
          )}
          {message.text && <p className={`auth__message auth__message--${message.tone}`} role="alert">{message.text}</p>}
          <button type="submit" className="welcome__cta auth__submit" disabled={isBusy}>
            {isBusy ? 'Un momento…' : view === 'forgot' ? 'Enviar enlace' : isSignUp ? (isCloud ? 'Crear cuenta' : 'Empezar en este dispositivo') : (isCloud ? 'Entrar' : 'Entrar en modo local')}
          </button>
        </form>

        {isCloud && view === 'login' && <button type="button" className="auth__link" onClick={() => viewHandler('forgot')}>¿Olvidaste tu contraseña?</button>}
        {view === 'forgot' && <button type="button" className="auth__link" onClick={() => viewHandler('login')}>Volver a entrar</button>}
      </section>
    </main>
  );
}
