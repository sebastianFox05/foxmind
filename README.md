# FoxMind

Tu sistema personal: trabajo, actividades diarias, gym, running, lectura, diario y retos del mes, del trimestre y del año.
Los retos se actualizan solos con lo que registras. Hecho con las mismas herramientas que FoxTrips (React + Vite + Supabase + PWA).

## Arrancar

```bash
npm install
npm run dev
```

Abre http://localhost:5180. La primera vez carga **datos de ejemplo** (Perfil → Tus datos → Empezar de cero para borrarlos).

## Captura rápida (Ctrl + K o botón +)

| Escribes | Pasa |
|---|---|
| `Deploy a staging !alta mañana #api` | Tarea con prioridad alta, para mañana, proyecto api |
| `corrí 8,5 km en 46 min` | Carrera con ritmo calculado (suma a los retos de km) |
| `leí 30 pág 25 min` | Lectura del libro actual |
| `idea: …` / `aprendí: …` / `snippet: …` | Nota de desarrollador |
| `gym pierna` | Sesión con la rutina precargada |
| `reto: …` | Nuevo reto |

## Modo claro y oscuro

Botón sol/luna en la cabecera o Perfil → Personaliza tu perfil → Modo de color (Automático sigue al sistema).

## Perfil

Perfil → Personaliza tu perfil: foto (se recorta en cuadrado), color del avatar, nombre, rol, frase y portada.

## Ejercicios con foto

Entreno → Ejercicios: 37 ejercicios con fotos de inicio y final, pasos y consejos; «Añadir» los suma a una rutina.
Fotos de [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (dominio público, Unlicense).

## Tablero del cuarto

Entreno → Récords → **Cargar tablero**: pega tus marcas, una por línea (`Press banca: 85 kg`, `5K 23:40`, `Dominadas 15 reps`).
Los retos de tipo «Peso máximo en un ejercicio» usan estas marcas y tus sesiones.

## Modo nube (Supabase) — activo

Proyecto **foxflow** (`uiqvkwrcxywvdrtuyppt`, us-east-1, plan gratuito). `supabase/schema.sql` ya está aplicado
(tabla `flow_entries` con RLS: cada persona solo ve sus filas; anónimos sin acceso) y `src/lib/config.js` tiene la URL y la clave pública.

En el panel de Supabase → Authentication:
- **Sign In / Providers → Email → Confirm email**: desactívalo (como en FoxTrips) para entrar sin confirmar el correo,
  o déjalo activo y configura lo de abajo.
- **URL Configuration → Site URL** y **Redirect URLs**: añade `http://localhost:5180` (y la dirección de Netlify cuando se publique)
  para que los enlaces de confirmación y de recuperar contraseña vuelvan a la app.

Para volver al modo local, deja vacíos los dos valores de `src/lib/config.js`.

Pasos generales si algún día lo montas en otro proyecto:

1. En el SQL Editor de Supabase ejecuta `supabase/schema.sql`.
2. Copia la URL y la clave publishable en `src/lib/config.js`.
3. Al entrar con tu cuenta, si no hay datos se cargan los de ejemplo; para subir los del modo local usa Perfil → Descargar copia
   y después Importar copia ya con la sesión abierta.

## Desplegar en Netlify

Publicado en **https://foxmind.netlify.app** (sitio `foxmind`, id 80402d39-2751-4cb3-af07-df163d286d23).
`netlify.toml` ya tiene la compilación (`npm ci && npm run build` → `dist`) y la Content-Security-Policy.
El sitio está conectado al repositorio de GitHub: **cada push a `main` se compila y publica solo** en Netlify
(y en GitHub Pages). Añade `https://foxmind.netlify.app` a las Redirect URLs de Supabase.

## GitHub Pages

Código en **https://github.com/sebastianFox05/foxmind** y copia publicada en **https://sebastianfox05.github.io/foxmind/**.
`.github/workflows/pages.yml` compila y publica en cada push a `main` (Settings → Pages → Source: **GitHub Actions**).
La app vive en la subcarpeta `/foxmind/`, por eso se compila con `BASE_PATH=/foxmind/`; las rutas a `public/`
pasan por `asset()` (`src/lib/utils.js`). Netlify sigue compilando con la base `/`.
Para que el registro y la recuperación de contraseña vuelvan a Pages, añade `https://sebastianfox05.github.io/foxmind/**`
a las Redirect URLs de Supabase. GitHub Pages no envía la Content-Security-Policy de `netlify.toml`.

## Estructura

```txt
src/
  lib/          fechas, almacen (local y Supabase), calculos (stats.js), analizador (parse.js), datos de ejemplo
  session/      DataContext: sesion y registros
  ui/           modales, avisos, paleta de comandos, atajos a formularios
  components/   piezas reutilizables y formularios
  views/        Hoy, Trabajo, Entreno, Mente, Retos, Perfil, Acceso
  styles/       styles.css (BEM)
agents/         Timmy, Javascript y Review
PLAN.md         plan y registro de tareas
SKILLS.md       rubrica que valida el agente Review
```
