/* Avatar del perfil: tu foto, o tus iniciales sobre el color que elegiste (como en FoxTrips) */
import { avatarGradient } from '../lib/avatar.js';
import { initials } from '../lib/utils.js';

export default function Avatar({ settings, className = '' }) {
  if (settings.avatarPhoto) {
    return (
      <span className={`avatar avatar--image ${className}`} aria-hidden="true">
        <img className="avatar__img" src={settings.avatarPhoto} alt="" width="256" height="256" decoding="async" />
      </span>
    );
  }
  return <span className={`avatar ${className}`} aria-hidden="true" style={{ '--avatar-bg': avatarGradient(settings.avatarColor) }}>{initials(settings.name)}</span>;
}
