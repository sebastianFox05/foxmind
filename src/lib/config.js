/*
 * Configuracion de servicios.
 * Con los valores vacios la app funciona en MODO LOCAL (los datos se guardan solo en este navegador).
 * Rellenalos (README.md) para activar el modo nube: tus datos sincronizados en todos tus dispositivos.
 */
export const config = {
  // Supabase → proyecto "foxflow" (us-east-1)
  supabaseUrl: 'https://uiqvkwrcxywvdrtuyppt.supabase.co',
  // Clave publica (publishable): pensada para el navegador; la seguridad la ponen las reglas RLS de flow_entries
  supabaseAnonKey: 'sb_publishable_dIem86OKzDXkZzTRLP-Gvw_tpW7Jxwt'
};

/* `vite --mode demo` (solo para revisar el diseño en local) fuerza el modo local con datos de ejemplo */
export const isCloudMode = Boolean(config.supabaseUrl && config.supabaseAnonKey) && import.meta.env.VITE_LOCAL_MODE !== '1';
