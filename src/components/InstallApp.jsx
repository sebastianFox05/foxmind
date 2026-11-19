/* Tarjeta "Instala FoxMind": boton de instalar (Chrome, Edge, Android) o pasos para iPhone/iPad */
import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { installState, promptInstall, subscribeInstall } from '../lib/install.js';
import { useUi } from '../ui/UiContext.jsx';

export default function InstallApp() {
  const { showToast } = useUi();
  const [state, setState] = useState(installState);

  useEffect(() => subscribeInstall(() => setState(installState())), []);

  const installHandler = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') showToast('FoxMind instalada ✓', 'success');
  };

  let body;
  if (state.isStandalone) {
    body = <p className="form__hint"><Icon name="check" /> Ya la estás usando como app instalada. Funciona sin conexión con lo último que cargaste.</p>;
  } else if (state.canPrompt) {
    body = (
      <>
        <p className="form__hint">Ábrela desde tu escritorio o pantalla de inicio, a pantalla completa y sin conexión.</p>
        <button type="button" className="button button--primary" onClick={installHandler}><Icon name="download" /> Instalar FoxMind</button>
      </>
    );
  } else if (state.isIos) {
    body = <p className="form__hint">En iPhone o iPad: toca <strong>Compartir</strong> en Safari y luego <strong>Añadir a pantalla de inicio</strong>.</p>;
  } else {
    body = <p className="form__hint">Usa el icono de instalar de la barra de direcciones de tu navegador (Chrome o Edge) o su menú → <strong>Instalar FoxMind</strong>.</p>;
  }

  return (
    <section className="glass glass--padded install-card" aria-labelledby="install-title">
      <img className="install-card__icon" src="/icon-192.png" alt="" width="192" height="192" />
      <div className="install-card__text">
        <h2 className="section-header__title" id="install-title">Instala FoxMind</h2>
        {body}
      </div>
    </section>
  );
}
