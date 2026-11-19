/*
 * Modal accesible con <dialog>: Escape cierra, foco al primer campo y foco restaurado al cerrar.
 */
import { useEffect, useRef } from 'react';
import Icon from '../components/Icon.jsx';

const FOCUSABLE = 'input:not([type="hidden"]), select, textarea, [data-autofocus]';

export default function Modal({ title, size = 'normal', onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    dialog.showModal();
    const first = dialog.querySelector(FOCUSABLE);
    if (first) first.focus();
    return () => {
      if (previous && typeof previous.focus === 'function') previous.focus();
    };
  }, []);

  const cancelHandler = (event) => {
    event.preventDefault();
    onClose(false);
  };

  const backdropHandler = (event) => {
    if (event.target === dialogRef.current) onClose(false);
  };

  return (
    <dialog ref={dialogRef} className={`modal modal--${size}`} aria-labelledby="modal-title" onCancel={cancelHandler} onClick={backdropHandler}>
      {size === 'poster' || size === 'fit' ? (
        /* Ficha a pantalla completa (estilo cine): la vista pinta su propio titulo y boton de volver */
        <div className="modal__panel modal__panel--poster">
          <h2 id="modal-title" className="visually-hidden">{title}</h2>
          {children((isSilent = true) => onClose(isSilent))}
        </div>
      ) : (
        <div className="modal__panel">
          <header className="modal__header">
            <h2 id="modal-title" className="modal__title">{title}</h2>
            <button type="button" className="icon-button icon-button--small" aria-label="Cerrar" onClick={() => onClose(false)}>
              <Icon name="x" />
            </button>
          </header>
          <div className="modal__body">{children((isSilent = true) => onClose(isSilent))}</div>
        </div>
      )}
    </dialog>
  );
}
