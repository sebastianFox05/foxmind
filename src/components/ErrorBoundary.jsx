/*
 * Red de seguridad: si una vista falla (datos corruptos, por ejemplo), en vez de una pantalla en blanco
 * se ofrece descargar los datos guardados y volver a empezar.
 */
import { Component } from 'react';

const STORAGE_KEY = 'foxflow:v1';

function downloadRawHandler() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '{}';
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'foxmind-rescate.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* sin almacenamiento disponible */
  }
}

function resetHandler() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* sin almacenamiento disponible */
  }
  window.location.reload();
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || '' };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="rescue">
        <h1 className="rescue__title">Algo no cuadra</h1>
        <p className="rescue__text">Una pantalla no pudo dibujarse ({this.state.message}). Tus datos siguen guardados: descárgalos antes de volver a empezar.</p>
        <div className="button-row">
          <button type="button" className="button button--primary" onClick={() => window.location.reload()}>Reintentar</button>
          <button type="button" className="button" onClick={downloadRawHandler}>Descargar mis datos</button>
          <button type="button" className="button button--ghost button--danger-text" onClick={resetHandler}>Empezar de cero</button>
        </div>
      </main>
    );
  }
}
