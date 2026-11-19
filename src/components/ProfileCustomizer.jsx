/*
 * Personaliza tu perfil (como en FoxTrips, y algo mas): foto recortada en cuadrado, nombre, rol, frase,
 * color del avatar, portada y modo de color (automatico, claro u oscuro).
 */
import { useRef, useState } from 'react';
import { useData } from '../session/DataContext.jsx';
import { useUi } from '../ui/UiContext.jsx';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import { AVATAR_COLORS, avatarGradient, squareAvatar } from '../lib/avatar.js';
import { COVER_PHOTOS } from '../lib/photos.js';

const MODES = [{ value: 'auto', label: 'Automático', icon: 'sparkle' }, { value: 'light', label: 'Claro', icon: 'sun' }, { value: 'dark', label: 'Oscuro', icon: 'moon' }];

export default function ProfileCustomizer() {
  const { settings, saveSettings } = useData();
  const { showToast, confirm, theme, setTheme } = useUi();
  const fileRef = useRef(null);
  const [draft, setDraft] = useState({ name: settings.name, role: settings.role || '', bio: settings.bio || '' });
  const [isUploading, setIsUploading] = useState(false);
  const changeHandler = (field) => (event) => setDraft({ ...draft, [field]: event.target.value });

  const photoHandler = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsUploading(true);
    try {
      await saveSettings({ avatarPhoto: await squareAvatar(file) });
      showToast('Foto de perfil actualizada', 'success');
    } catch (reason) {
      showToast(reason.message || 'No se pudo usar esa imagen', 'danger');
    }
    setIsUploading(false);
  };

  const removePhotoHandler = async () => {
    if (!(await confirm('Se quitará tu foto de perfil y volverán a verse tus iniciales.', { confirmLabel: 'Quitar foto' }))) return;
    await saveSettings({ avatarPhoto: '' });
    showToast('Foto de perfil quitada');
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    await saveSettings({ name: draft.name.trim(), role: draft.role.trim(), bio: draft.bio.trim() });
    showToast('Perfil guardado');
  };

  return (
    <section className="glass glass--padded form" aria-labelledby="customize-title">
      <h2 className="section-header__title" id="customize-title">Personaliza tu perfil</h2>

      <div className="profile-photo">
        <Avatar settings={settings} className="avatar--xl" />
        <div className="profile-photo__actions">
          <input ref={fileRef} id="avatar-file" type="file" accept="image/*" className="visually-hidden" onChange={photoHandler} />
          <label htmlFor="avatar-file" className="button button--small button--primary">
            <Icon name="upload" /> {isUploading ? 'Procesando…' : settings.avatarPhoto ? 'Cambiar foto' : 'Subir foto'}
          </label>
          {settings.avatarPhoto && <button type="button" className="button button--small button--ghost" onClick={removePhotoHandler}><Icon name="trash" /> Quitar</button>}
          <p className="form__hint">Se recorta en cuadrado y se reduce antes de guardarla.</p>
        </div>
      </div>

      {!settings.avatarPhoto && (
        <fieldset className="field field--chips">
          <legend className="field__label">Color del avatar</legend>
          <div className="chip-group">
            {AVATAR_COLORS.map((color) => (
              <label key={color.value} className={`swatch${(settings.avatarColor || 'oro') === color.value ? ' swatch--active' : ''}`} style={{ '--swatch': avatarGradient(color.value) }}>
                <input type="radio" name="avatar-color" className="visually-hidden" checked={(settings.avatarColor || 'oro') === color.value} onChange={() => saveSettings({ avatarColor: color.value })} />
                <span className="visually-hidden">{color.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <form className="form" onSubmit={submitHandler}>
        <div className="form__row">
          <div className="field">
            <label className="field__label" htmlFor="profile-name">Nombre</label>
            <input id="profile-name" className="field__input" maxLength={40} value={draft.name} onChange={changeHandler('name')} required />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="profile-role">Rol</label>
            <input id="profile-role" className="field__input" maxLength={50} value={draft.role} onChange={changeHandler('role')} placeholder="Desarrollador full stack" />
          </div>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="profile-bio">Tu frase</label>
          <input id="profile-bio" className="field__input" maxLength={90} value={draft.bio} onChange={changeHandler('bio')} placeholder="Disciplina > motivación" />
        </div>
        <div className="form__actions"><button type="submit" className="button button--primary">Guardar perfil</button></div>
      </form>

      <fieldset className="field field--chips">
        <legend className="field__label">Portada</legend>
        <div className="cover-grid">
          {COVER_PHOTOS.map((item) => (
            <label key={item.key} className={`cover-option${(settings.cover || 'aurora') === item.key ? ' cover-option--active' : ''}`}>
              <input type="radio" name="cover" className="visually-hidden" checked={(settings.cover || 'aurora') === item.key} onChange={() => saveSettings({ cover: item.key })} />
              <img src={item.photo.src} alt={item.photo.alt} width="960" height="640" loading="lazy" />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="field field--chips">
        <legend className="field__label">Modo de color</legend>
        <div className="chip-group">
          {MODES.map((option) => (
            <label key={option.value} className={`chip${theme === option.value ? ' chip--active' : ''}`}>
              <input type="radio" name="theme" className="visually-hidden" checked={theme === option.value} onChange={() => setTheme(option.value)} />
              <Icon name={option.icon} /> {option.label}
            </label>
          ))}
        </div>
        <p className="form__hint">Automático sigue el modo de tu teléfono u ordenador. Se recuerda en este dispositivo.</p>
      </fieldset>
    </section>
  );
}
