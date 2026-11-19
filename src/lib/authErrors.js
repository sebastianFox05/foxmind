/*
 * Acceso: reglas de contraseña y errores de Supabase Auth en español.
 * Supabase responde en inglés; aqui se traduce por el codigo del error (error.code) y,
 * si no lo trae, por el texto. Lo desconocido se muestra con un mensaje generico.
 */

export const MIN_PASSWORD = 8;

/* Devuelve el problema de la contraseña o '' si es valida */
export function passwordProblem(password, repeat) {
  if (password.length < MIN_PASSWORD) return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) return 'La contraseña debe tener letras y números.';
  if (/^\s|\s$/.test(password)) return 'La contraseña no puede empezar ni terminar con espacios.';
  if (repeat !== undefined && password !== repeat) return 'Las contraseñas no coinciden.';
  return '';
}

const BY_CODE = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Aún no confirmaste tu correo. Abre el enlace que te enviamos y vuelve a entrar.',
  user_already_exists: 'Ya existe una cuenta con ese correo. Entra o recupera tu contraseña.',
  email_exists: 'Ya existe una cuenta con ese correo. Entra o recupera tu contraseña.',
  email_address_invalid: 'Ese correo no es válido. Revísalo.',
  email_address_not_authorized: 'Por ahora no podemos enviar correos a esa dirección. Inténtalo más tarde.',
  weak_password: `La contraseña es demasiado débil o ya apareció en filtraciones. Usa al menos ${MIN_PASSWORD} caracteres con letras y números.`,
  same_password: 'La contraseña nueva debe ser distinta de la anterior.',
  over_email_send_rate_limit: 'Ya te enviamos un correo hace poco. Espera un momento antes de pedir otro.',
  over_request_rate_limit: 'Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.',
  signup_disabled: 'El registro de cuentas nuevas está cerrado por ahora.',
  email_provider_disabled: 'El acceso con correo está desactivado por ahora.',
  user_banned: 'Esta cuenta está bloqueada.',
  otp_expired: 'El enlace caducó. Pide uno nuevo.',
  flow_state_expired: 'El enlace caducó. Pide uno nuevo.',
  flow_state_not_found: 'El enlace no es válido o ya se usó. Pide uno nuevo y ábrelo en este mismo navegador.',
  session_not_found: 'Tu sesión caducó. Vuelve a entrar.',
  session_expired: 'Tu sesión caducó. Vuelve a entrar.',
  reauthentication_needed: 'Por seguridad, vuelve a entrar antes de cambiar la contraseña.',
  request_timeout: 'El servidor tardó demasiado. Inténtalo de nuevo.',
  captcha_failed: 'No se pudo verificar que eres una persona. Inténtalo de nuevo.'
};

const BY_TEXT = [
  [/invalid login credentials/i, BY_CODE.invalid_credentials],
  [/email not confirmed/i, BY_CODE.email_not_confirmed],
  [/already registered|already exists/i, BY_CODE.user_already_exists],
  [/password should be|weak password|pwned/i, BY_CODE.weak_password],
  [/should be different/i, BY_CODE.same_password],
  [/rate limit|too many/i, BY_CODE.over_request_rate_limit],
  [/invalid.*email|email.*invalid/i, BY_CODE.email_address_invalid],
  [/expired|invalid.*(link|token)/i, BY_CODE.otp_expired],
  [/failed to fetch|network|load failed/i, 'Sin conexión con el servidor. Revisa tu internet e inténtalo de nuevo.']
];

export function authErrorMessage(error) {
  if (!error) return '';
  const text = String(error.message || '');
  /* "For security purposes, you can only request this after 14 seconds." */
  const wait = text.match(/after (\d+) seconds?/i);
  if (wait) return `Por seguridad, espera ${wait[1]} segundos antes de volver a intentarlo.`;
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) return BY_TEXT.at(-1)[1];
  const match = BY_TEXT.find(([pattern]) => pattern.test(text));
  return match ? match[1] : 'No se pudo completar. Inténtalo de nuevo.';
}
