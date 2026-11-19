# PLAN.md — FoxMind, sistema personal de actividades

## Objetivo

App web personal (PWA) para gestionar en un solo lugar: trabajo (por hacer / en curso / hecho), actividades diarias,
gym, running, lectura, diario y retos del mes, del trimestre, del año y futuros. Los retos se **automatizan**: su progreso
sale solo de lo que registras (carreras, sesiones, paginas, tareas, foco, habitos y las marcas del tablero del cuarto).

## Arquitectura (mismas herramientas que FoxTrips)

| Pieza | Herramienta | Motivo |
|---|---|---|
| Interfaz | React 18 + Vite 7 + React Router (HashRouter) | Igual que FoxTrips v2 |
| Datos y login | Supabase (tabla `flow_entries` con RLS) | Gratis, sincroniza todos tus dispositivos |
| Modo local | localStorage | Sin claves en `src/lib/config.js` la app funciona sola en el navegador |
| PWA | vite-plugin-pwa (Workbox) | Instalable y usable sin conexion |
| Despliegue | Netlify (`netlify.toml` con CSP estricta) | Igual que FoxTrips |
| Fotos | Wikimedia Commons en `public/img` | Libres, con autor y licencia (Perfil → Creditos) |
| Graficos | SVG propio | Sin librerias: anillos, barras, tendencia y mapa de constancia |

**Decision de datos:** una sola tabla de documentos (`collection` + `data jsonb`) en vez de 13 tablas. Para una app
personal es mas flexible: se pueden añadir campos sin migraciones, y RLS sigue garantizando que cada fila es de su dueño.
Lleva el prefijo `flow_` para poder convivir en el proyecto de Supabase de FoxTrips.

## Diseño (referencias del usuario)

| Referencia | Donde se aplica |
|---|---|
| **"Perfect!" (la favorita)**: fondo aurora rojo/magenta difuminado, cabecera en pildora con avatar y campana, tarjetas-pildora grandes con icono en circulo, interruptor y boton en contorno | SOLO la pantalla Rutina del dia (`#/rutina`) y el acceso, por peticion del usuario |
| **"Fitness Journey"**: negro con brillo azul marino arriba, tarjetas grafito, acento menta, avatar con aro, titulo con pesos mezclados | Fondo y tarjetas de todas las demas pantallas |
| "Hiking Exploring": foto a sangre con titulo encima, tarjeta "84 score", dos tarjetas cuadradas con numero grande y flecha, boton central blanco | Portada de Entreno, puntuacion del dia, tarjetas Pendientes / Entreno, boton + de la barra |
| "March / April / May": tarjetas con foto y nombre del mes gigante translucido, pildora "23 reports" y boton "···", año con desplegable | Retos por mes, trimestre y año |
| "Jan, Week 1 · Stress level 74": semana en circulos de colores, numero grande y fino, tendencia semanal, barra flotante con la pestaña activa resaltada | Semana de Hoy, temporizador de foco, graficos, barra inferior |
| Reel del cine "12 JUN": fecha gigante, chips "Coming soon / Now playing / Tomorrow", poster con chips, ficha con foto grande, titulo en mayusculas, "Watch trailer", descripcion y "Cast" | Hoy: chips Ayer / Hoy / Mañana, fecha gigante, cartelera de posters y ficha a pantalla completa (Empezar + ejercicios/pasos como reparto) |
| "Your Legend": tarjetas altas con titulo serif, pestañas en pildora | Libros "Leyendo ahora" y titulos serif de Mente |
| "Fitness journey": tarjetas oscuras, reto "30-Day Pushup Challenge", "New Challenge" | Tarjetas de retos y plantillas |
| Galeria "Today / Yesterday / Friday" | Diario agrupado por dias |

## Funciones

1. **Hoy**: fecha gigante, Ayer/Hoy/Mañana, semana en circulos coloreados por puntuacion, puntuacion del dia (0-100, con desglose),
   pendientes, entreno de la semana, rutinas programadas para el dia, actividades diarias por momento (mañana/tarde/noche) con rachas,
   agenda, retos en marcha, intencion/diario y mapa de constancia de 26 semanas.
2. **Trabajo**: tablero por hacer / en curso / hecho (arrastrar y soltar en escritorio), vista lista por fechas (vencidas, hoy, mañana…),
   captura rapida con lenguaje natural, prioridades, proyectos, subtareas, bloqueos.
3. **Foco**: pomodoro 25/50/90 min ligado a una tarea; guarda los minutos (cuentan para retos).
4. **Standup automatico**: ayer / hoy / bloqueos sale de las tareas; boton Copiar para Slack o Teams.
5. **Notas de desarrollador**: ideas, aprendizajes (TIL) y snippets con boton copiar.
6. **Entreno · Gym**: registrar sesion con la rutina precargada y el ultimo peso usado (sobrecarga progresiva), aviso de nuevo record,
   volumen semanal, sesiones por semana con meta.
7. **Entreno · Running**: carreras con ritmo calculado, km por semana con meta, ritmo medio.
8. **Rutinas**: gym, running y lectura por dia de la semana (plan semanal).
9. **Records**: automaticos (peso maximo, 1RM estimado, carrera mas larga, mejor ritmo, 5K/10K estimados) + **tablero del cuarto**
   (pegar las marcas linea a linea y se convierten en records).
10. **Mente · Lectura**: meta anual de libros, rutina diaria de lectura, racha, libros en curso, por leer y terminados, paginas por semana.
11. **Mente · Diario**: intencion, animo, energia, logros, gratitud, que mejorar; grafico de animo.
12. **Retos**: mes / trimestre / año / futuros / historial; 12 metricas automaticas + manual; marca de "donde deberias ir",
    "necesitas X al dia", plantillas para planificar el proximo periodo y tasa de exito.
13. **Alertas proactivas** (campana y Hoy): tareas vencidas, demasiado trabajo en curso, retos en riesgo o por terminar, retos que
    empiezan pronto, dias sin entrenar, lectura pendiente, rachas en riesgo, libro casi terminado, planificar mañana, revision del domingo.
14. **Paleta de comandos** (Ctrl/Cmd + K y boton +): captura natural, acciones, navegacion y busqueda.
15. **Perfil**: revision semanal comparada con la anterior, objetivos, actividades diarias, copia de seguridad JSON, datos de ejemplo,
    atajos, creditos.

## Registro de tareas

| Hora | Agente | Tarea | Archivos | Estado |
|---|---|---|---|---|
| 2026-11-18 12:00 | Orquestador | Analisis del stack de FoxTrips y de las 8 referencias de diseño; plan, rubrica y arquitectura | `PLAN.md`, `SKILLS.md` | hecho |
| 2026-11-18 12:10 | Orquestador | Proyecto Vite/React, PWA, CSP de Netlify, esquema Supabase con RLS, fotos de Wikimedia | `package.json`, `vite.config.js`, `netlify.toml`, `supabase/schema.sql`, `public/*` | hecho |
| 2026-11-18 12:20 | Javascript | Almacen local/Supabase, fechas, calculos automaticos (retos, rachas, records, puntuacion, alertas, standup), analizador de texto y del tablero, datos de ejemplo | `src/lib/**` | hecho |
| 2026-11-18 12:40 | Javascript | Contextos (datos, modales `<dialog>`, avisos), paleta de comandos, formularios | `src/session`, `src/ui`, `src/components/forms` | hecho |
| 2026-11-18 13:00 | Javascript | Vistas Hoy, Trabajo, Entreno, Mente, Retos, Perfil y Acceso | `src/views/*` | hecho |
| 2026-11-18 13:20 | Timmy | CSS BEM mobile first: aurora por seccion, cristal, pildoras, tarjetas de mes con nombre gigante, barra flotante, hoja inferior, escritorio a 2-3 columnas | `src/styles/styles.css`, componentes | hecho |
| 2026-11-18 13:40 | Orquestador | Pruebas en navegador (375, 320 y escritorio): paleta («corrí 8,5 km en 46 min» → el reto de 80 km sube solo), tarea con prioridad/fecha/proyecto, sesion de gym con rutina y ultimo peso | — | hecho |
| 2026-11-18 13:45 | Timmy | Correcciones: nombre del mes adaptado a su longitud (container queries), tabla de records y foco sin desbordar a 320 px, `fieldset` de ejercicios | `styles.css`, `Training.jsx`, `Challenges.jsx` | hecho |
| 2026-11-18 14:30 | Timmy | Cambio de diseño pedido por el usuario: "Perfect!" solo en la nueva pantalla Rutina del dia; resto con el fondo "Fitness Journey" (negro, brillo azul, tarjetas grafito, acento menta, pestaña activa en circulo menta, titulos con pesos mezclados) | `styles.css`, `App.jsx`, `TopBar.jsx`, vistas | hecho |
| 2026-11-18 14:40 | Javascript | Reel del cine ampliado: cartelera de posters en Hoy (rutinas con hora, tarea prioritaria, libro) y ficha a pantalla completa con "Empezar" y fila de reparto; pantalla Rutina del dia; hora en rutinas; Foco abre la tarea elegida | `lib/posters.js`, `PosterCarousel.jsx`, `PosterDetail.jsx`, `Routine.jsx`, `Today.jsx`, `Modal.jsx`, `Work.jsx`, `FocusTimer.jsx` | hecho |
| 2026-11-18 14:50 | Orquestador | Pruebas en navegador de lo anterior (375 px): cartelera, ficha, rutina, tema noche, sin scroll horizontal | — | hecho |
| 2026-11-18 14:55 | Review | Revision contra `SKILLS.md`: 18 hallazgos (2 bloqueantes, 9 importantes, 7 menores) | todo el proyecto | hecho |
| 2026-11-18 15:30 | Javascript | Correcciones del Review: copias validadas por coleccion + ErrorBoundary de rescate; reemplazo en nube sin vaciar la tabla (upsert y luego borrar sobrantes) y con vuelta atras; almacen por id de usuario (el refresco del token no recarga); siembra unica; escrituras en fila por registro; `.order('id')`; retos de fechas propias visibles; foco que sobrevive al cambiar de pestaña; confirmacion encima del formulario; CSP con Google Fonts en `connect-src`; chips como botones `aria-pressed`; foco visible en campos; sin titulos dentro de botones; paleta que sigue la opcion activa; fechas locales en notas; carreras en minutos y h:mm; 10K con horas; tablero en kg/lb; nombres de handlers y `RecordForm` aparte | `src/**`, `netlify.toml` | hecho |
| 2026-11-18 16:00 | Timmy + Javascript | Bienvenida ("Discover Portugal": foto, lugar, serif Bitter, puntos, boton coral) y acceso/registro en el mismo estilo (modo local avisado; modo nube con Supabase y recuperar contraseña) | `Welcome.jsx`, `Auth.jsx`, `App.jsx`, `DataContext.jsx` | hecho |
| 2026-11-18 16:20 | Timmy + Javascript | Hoy en claro (referencia "Hi, Amanda"): menu, campana con punto, saludo serif, pildoras de categoria con miniatura, tarjeta destacada con esquina recortada y flecha coral; secciones en pestañas (Resumen, Agenda, Plan, Progreso) con reto del dia, capsulas, linea de tiempo con "Ahora", plan de entreno, cardio y "Tu plan" | `Today.jsx`, `FeatureCarousel.jsx`, `DailyChallenge.jsx`, `DayTimeline.jsx`, `PlanGrid.jsx`, `TrainingToday.jsx`, `WeekCapsules.jsx` | hecho |
| 2026-11-18 16:50 | Timmy + Javascript | Entreno con el diseño fitness menta: Resumen, Entrenos (ficha "Full Body Strength"), Ejercicios, Actividad (calorias estimadas, anillos) y Nutricion (coleccion nueva `meals`) | `Training.jsx`, `WorkoutDetail.jsx`, `MealForm.jsx`, `stats.js`, `schema.sql` | hecho |
| 2026-11-18 17:10 | Javascript | Biblioteca de 37 ejercicios con fotos de inicio y final (free-exercise-db, dominio publico), pasos en español, consejo y "añadir a rutina"; foto de cada ejercicio en la rutina del dia y en la ficha | `lib/exercises.js`, `ExerciseGuide.jsx`, `public/img/ejercicios/*` | hecho |
| 2026-11-18 17:30 | Timmy + Javascript | Trabajo combinado con la referencia "Let's find your best project": cabecera oscura con ondas y buscador, filtro de prioridad alta, carrusel de proyectos, vista Hoy con dias en pildora y linea de tiempo; hora opcional en tareas | `Work.jsx`, `WorkToday.jsx`, `Waves.jsx`, `TaskForm.jsx` | hecho |
| 2026-11-18 17:50 | Timmy + Javascript | Modo claro y oscuro en toda la app (automatico, claro u oscuro; boton sol/luna y ajuste en Perfil): cada pantalla tiene su variante (`TONE_BY_MODE`), modales y paleta incluidos | `UiContext.jsx`, `App.jsx`, `styles.css` | hecho |
| 2026-11-18 18:00 | Javascript | Perfil personalizable como en FoxTrips: foto recortada en cuadrado (WebP 256 px), quitar foto, color del avatar, nombre, rol, frase y portada | `ProfileCustomizer.jsx`, `Avatar.jsx`, `lib/avatar.js`, `Profile.jsx` | hecho |
| 2026-11-18 21:40 | Orquestador | Modo nube: proyecto Supabase nuevo `foxflow` (us-east-1, 0 $/mes), esquema con RLS aplicado (anon sin permisos, 4 politicas), sin avisos de seguridad; URL y clave publica en `config.js`; registro con `emailRedirectTo` | `config.js`, `Auth.jsx`, `README.md` | hecho |
| 2026-11-19 | Javascript | Renombrado a FoxMind (claves internas foxflow:* sin cambiar) y sitio Netlify foxmind; recuperar contraseña completa: PKCE (?code= no choca con #/), enlace a /?recuperar=1, pantalla "Crea tu nueva contraseña" con aviso si el enlace caduco | `DataContext.jsx`, `Auth.jsx`, `NewPassword.jsx`, `App.jsx` | hecho |
| 2026-11-19 | Timmy + Javascript | Pantallas grandes: barra lateral fija en ≥1024 px (logo, Captura rapida, secciones, Perfil), contenido hasta 1280-1360 px, rejillas por pantalla (Hoy 3 tarjetas, Entreno 2-5 columnas, libros 2, retos 3), fichas centradas y acceso a dos columnas. Sin desbordes en 12 vistas × 6 anchos (320-1920) | `BottomNav.jsx`, `styles.css`, `Training.jsx` | hecho |
| 2026-11-19 | Javascript | PWA completa: iconos PNG 192/512, maskable y apple-touch-icon; manifiesto con id, scope, accesos directos y categorias; metas de iOS/Android; boton "Instalar FoxMind" en Perfil (beforeinstallprompt y pasos para iPhone); modo `vite --mode demo` para revisar el diseño | `public/*`, `index.html`, `lib/install.js`, `InstallApp.jsx`, `config.js`, `.env.demo` | hecho |
| 2026-11-19 | Timmy | Nueva marca: logotipo FoxMind (reloj de arena) recortado sin fondo en rojo y crema para bienvenida, acceso, nueva contraseña, menu, barra lateral y pie de Perfil; icono "FM" para la app (192/512, maskable con zona segura, apple-touch, favicon), la cabecera de Hoy, la carga y la tarjeta de instalar | `public/logo-*.png`, `public/icon-*.png`, `Logo.jsx`, `Welcome.jsx`, `Auth.jsx`, `NewPassword.jsx`, `TopBar.jsx`, `BottomNav.jsx`, `Profile.jsx`, `styles.css` | hecho |
| 2026-11-18 18:10 | Orquestador | Pruebas: 320 y 375 px sin scroll horizontal; build de produccion con la CSP de Netlify en 7 pantallas × 2 modos sin errores de consola ni imagenes rotas | — | hecho |

## Mapa de diseños por pantalla (modo claro / modo oscuro)

| Pantalla | Claro | Oscuro |
|---|---|---|
| Bienvenida y acceso | Foto a sangre + serif + coral ("Discover Portugal") | igual |
| Hoy | Crema ("Hi, Amanda") + piezas "Daily challenge" y "Good Day" | Noche |
| Rutina del dia | "Perfect!" en pastel | "Perfect!" aurora roja |
| Trabajo | Papel gris con tarjetas negras y ondas | Noche (tarjetas invertidas) |
| Entreno | Fitness menta | Menta nocturno |
| Mente, Retos, Perfil | Crema | Noche ("Fitness Journey") |

## Pendiente

- Datos reales del **tablero del cuarto**: cargar las marcas (Entreno → Records → Cargar tablero) y crear los retos reales.
- Modo nube: activo (proyecto `foxflow`). Falta que el usuario desactive "Confirm email" o configure Site URL y Redirect URLs en Supabase, y se registre.
- Netlify: publicado en https://foxmind.netlify.app. Opcional: quitar la insignia "Powered by Netlify" (Project configuration → General) y añadir la URL a Redirect URLs de Supabase para recuperar contraseña.
