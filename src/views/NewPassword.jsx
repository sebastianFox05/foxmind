/*
 * Nueva contraseña: se abre desde el enlace del correo de "¿Olvidaste tu contraseña?".
 * Mismo estilo que el acceso (foto arriba, hoja oscura, serif y boton coral).
 * Si el enlace caduco o se abrio en otro navegador, no hay sesion: se explica y se vuelve a pedir el correo.
 */
import { useState } from 'react';
import { useData } from '../session/DataContext.jsx';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import Photo from '../components/Photo.jsx';
import { MONTH_PHOTOS } from '../lib/photos.js';
import { MIN_PASSWORD, authErrorMessage, passwordProblem } from '../lib/authErrors.js';

export default function NewPassword() {
  const { client, session, isAuthReady, finishRecovery, signOut } = useData();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [message, setMessage] = useState({ text: '', tone: '' });
  const [isBusy, setIsBusy] = useState(false);
  const hasSession = Boolean(session);

  const submitHandler = async (event) => {
    event.preventDefault();
    const problem = passwordProblem(password, repeat);
    if (problem) {
      setMessage({ text: problem, tone: 'error' });
      return;
    }
    setIsBusy(true);
    setMessage({ text: '', tone: '' });
    const { error } = await client.auth.updateUser({ password });
    setIsBusy(false);
    if (error) {
      setMessage({ text: authErrorMessage(error), tone: 'error' });
      return;
    }
    setMessage({ text: 'Contraseña actualizada. Entrando…', tone: 'ok' });
    setTimeout(finishRecovery, 900);
  };

  const backHandler = async () => {
    await signOut();
    finishRecovery();
  };

  return (
    <main className="auth">
      <figure className="auth__cover">
        <Photo photo={MONTH_PHOTOS[2]} className="auth__photo" isEager isDecorative />
        <Logo isOnDark className="auth__logo" />
      </figure>

      <section className="auth__sheet" aria-labelledby="recovery-title">
        <h1 className="auth__title" id="recovery-title">Crea tu nueva contraseña</h1>

        {!isAuthReady && <p className="auth__notice" role="status"><Icon name="clock" /> Comprobando el enlace…</p>}

        {isAuthReady && !hasSession && (
          <>
            <p className="auth__notice" role="alert"><Icon name="alert" /> El enlace caducó o se abrió en otro navegador. Pide uno nuevo desde «¿Olvidaste tu contraseña?» y ábrelo en este mismo dispositivo.</p>
            <button type="button" className="welcome__cta auth__submit" onClick={finishRecovery}>Volver a entrar</button>
          </>
        )}

        {isAuthReady && hasSession && (
          <form className="auth__form" onSubmit={submitHandler}>
            <p className="auth__lead">Cuenta: <strong>{session.user?.email}</strong></p>
            <label className="auth-field" htmlFor="new-password">
              <Icon name="settings" />
              <span className="visually-hidden">Nueva contraseña</span>
              <input id="new-password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} maxLength={72} placeholder={`Nueva contraseña (mín. ${MIN_PASSWORD}, letras y números)`} value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <label className="auth-field" htmlFor="new-password-repeat">
              <Icon name="check" />
              <span className="visually-hidden">Repite la contraseña</span>
              <input id="new-password-repeat" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} maxLength={72} placeholder="Repite la contraseña" value={repeat} onChange={(event) => setRepeat(event.target.value)} required />
            </label>
            {message.text && <p className={`auth__message auth__message--${message.tone}`} role="alert">{message.text}</p>}
            <button type="submit" className="welcome__cta auth__submit" disabled={isBusy}>{isBusy ? 'Guardando…' : 'Guardar contraseña'}</button>
            <button type="button" className="auth__link" onClick={backHandler}>Cancelar y cerrar sesión</button>
          </form>
        )}
      </section>
    </main>
  );
}
