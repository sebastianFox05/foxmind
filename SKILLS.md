# SKILLS.md — Rubrica del proyecto FoxMind

Criterios que deben cumplir HTML, CSS y Javascript. El agente Review valida contra este archivo.
Misma base que FoxTrips: **React + Vite** (JavaScript, sin TypeScript), Supabase y PWA.

## Estructura de carpetas y archivos

- Nombres en minusculas, sin espacios ni tildes, separados por guiones (componentes React en PascalCase: `TaskForm.jsx`).
- `index.html` en la raiz (solo `<div id="root">`); codigo en `src/`; imagenes, icono y manifiesto en `public/`.
- `src/lib/` logica sin pantalla (almacen, fechas, calculos, analizador de texto); `src/components/` piezas reutilizables;
  `src/views/` una vista por pantalla; `src/ui/` y `src/session/` contextos globales.
- `supabase/schema.sql` contiene la base de datos y sus politicas de seguridad (RLS).
- `agents/` contiene los roles Timmy, Javascript y Review; cada tarea se registra en `PLAN.md`.

## HTML (agente Timmy)

- Documento con `lang="es"`, `meta charset`, `meta viewport`, `title` y `meta description` (SEO).
- Estructura semantica: `header`, `nav`, `main`, `section`, `article`, `figure`, `footer`.
- Un unico `h1` por vista y jerarquia de titulos sin saltos.
- Imagenes con `picture` (componente `<Photo>`) e `img` con `alt` descriptivo (o `alt=""` si es decorativa), `width`/`height` y `loading="lazy"` fuera de la primera pantalla.
- Formularios con `label` asociado a cada campo (`htmlFor`).
- Enlaces y botones con texto o `aria-label` comprensible; los graficos SVG llevan `role="img"` y `aria-label`.

## CSS (agente Timmy)

- Metodologia BEM: `bloque`, `bloque__elemento`, `bloque--modificador`.
- Un unico `src/styles/styles.css` comentado por bloques (sin CSS-in-JS). Solo se permite `style` en linea para valores
  calculados (porcentajes de progreso, colores de un reto) mediante variables CSS (`--progress`, `--tone`).
- Variables de diseño en `:root`. **Tema oscuro unico** (`color-scheme: dark`): todas las referencias de diseño son oscuras
  (fondo aurora difuminado, cristal y pildoras).
- Mobile first: media queries con `min-width`.
- Sin scroll horizontal en la pagina (las tiras hacen scroll dentro de su contenedor, con `position: relative`).
- Sin alturas rigidas que recorten contenido; usar `min-height` y `aspect-ratio`.
- Foco visible (`:focus-visible`) y contraste AA sobre el cristal.
- Respeta `prefers-reduced-motion` (la aurora deja de moverse).

## Javascript / React (agente Javascript)

- Componentes de funcion con hooks; un componente principal por archivo.
- Eventos en el propio componente (`onClick`, `onSubmit`, `onChange`). Nada de `addEventListener` sobre nodos de React salvo en `useEffect` con limpieza (atajos de teclado globales).
- Orden en cada modulo: imports, constantes, variables de modulo, funciones/componentes auxiliares y, al final, el componente exportado.
- Nomenclatura camelCase; handlers con sufijo `Handler`; booleanos con prefijo `is`/`has`.
- Prohibido `dangerouslySetInnerHTML` salvo para los SVG constantes de `icons.js`.
- Todo dato derivado (progreso de retos, rachas, records, puntuacion del dia, alertas) se calcula en `src/lib/stats.js`
  a partir de los registros: nunca se guarda duplicado.
- Modales con `<dialog>` (`UiContext`): cierre con `Escape`, foco al primer campo y foco restaurado al cerrar.
- Paleta de comandos (`Ctrl/Cmd + K`): navegable con flechas, `Enter` y `Escape`.
- Dependencias con version exacta en `package.json`.

## Seguridad

- Nunca en el codigo la clave secreta de Supabase (solo la publica, protegida por RLS).
- Cada fila de `flow_entries` pertenece a `auth.uid()`; las politicas RLS impiden leer o escribir datos de otra persona.
- Content-Security-Policy y cabeceras en `netlify.toml`.
- Las copias de seguridad (JSON) se validan antes de importarlas.
