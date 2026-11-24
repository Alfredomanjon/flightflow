# Propuesta de rediseño del servicio `map`

Rama: `redesign/map-ui-ux` (creada desde `main`, sin tocar `main`).

## 1. Diagnóstico

| Aspecto | `analytics` (referencia) | `map` (actual) |
|---|---|---|
| Superficies | Sólidas: `#fff` / `#1C1C1E`, sombra mínima | Liquid Glass: blur 24px + saturate 180%, gradientes, bordes y brillos interiores |
| Color de acento | iOS blue `#007AFF`, secundario ámbar `#FF9F0A` | Azul marino `#123b89` / `#9ab8ff`, texto `#222443` |
| Fondo | `#F2F2F7` / negro | Verde `#a9e18b` / `#0f1120`; mapa verde saturado |
| Tipografía | SF / system | Inter |
| Iconos | Trazo 2px, `currentColor`, tamaño 16–20 | SVG inline repetidos, colores hardcodeados por modo (`#3f4661`, `#cfd8e8`, `#f59e0b`) |
| Navegación | Header + bottom nav móvil, estados activo `#007AFF/10` | Tarjeta flotante + panel lateral con pestañas propias |
| Radios | `rounded-xl` / `rounded-lg` | 24–30 px en paneles, 10–16 px en elementos |

Problemas de UX detectados:

- El panel arranca **colapsado** y el único modo de abrirlo es un botón con un chevron sin etiqueta.
- La tarjeta superior mezcla identidad (ICAO), estado, 3 botones de icono de 24 px (objetivo táctil muy pequeño en desktop) y la hora. Los botones **ciclan** estados sin mostrar cuál está activo (callsigns: todos/cercanos/ocultos; vista: físico/autoplay).
- No hay búsqueda ni filtro: con 100+ aviones la lista solo ordena por callsign.
- El detalle del avión es una columna larga de 5 secciones; lo importante (alt/vel/rumbo) compite con RSSI y mensajes.
- Los iconos de avión y los callsigns sobre el mapa (cards con backdrop-filter) son costosos de renderizar con muchos aviones.
- Estética de mapa saturada (verde/azul) que choca con el resto de apps.

## 2. Principios

1. **Mismo lenguaje que `analytics`**: superficies sólidas, jerarquía por tono y no por transparencia.
2. **Mismos tokens**: `#007AFF` como acento, `#FF9F0A` como acento secundario, grises iOS (`#F2F2F7`, `#1C1C1E`, `#8E8E93`).
3. **El mapa es el protagonista**: paleta neutra y desaturada para que los aviones destaquen.
4. **Estado visible, no oculto**: toggles y segmented controls en lugar de botones que ciclan.
5. **Una acción primaria por pantalla**; el detalle es progresivo.

## 3. Sistema visual

### Tokens (compartibles con analytics/portrait vía `packages/shared`)

```
--primary:       #007AFF     (dark: #0A84FF)
--accent:        #FF9F0A
--surface:       #FFFFFF     (dark: #1C1C1E)
--surface-2:     #F2F2F7     (dark: #2C2C2E)
--border:        rgba(0,0,0,.07)   (dark: rgba(255,255,255,.07))
--text:          #111827     (dark: #FFFFFF)
--text-muted:    #6B7280     (dark: #8E8E93)
--ok:            #34C759     --danger: #FF3B30
```

- Tipografía: pila del sistema (SF) como `analytics`; se elimina Inter.
- Radios: 12 px tarjetas/paneles, 8 px controles, pill solo en chips.
- Sombra única: `0 1px 3px rgba(0,0,0,.07)`; en dark sin sombra y con borde 1 px.
- Se eliminan `.glass`, `.glass-inset`, `.glass-pill-active`, `.glass-item`. Se mantiene un único `.glass-strong` (blur ligero) **solo** para la barra superior, igual que `analytics`.

### Iconos

- Un único módulo `components/ui/icons.tsx` (patrón ya existente en `portrait`), trazo 2 px, `currentColor`, 16/20 px. Sustituye los SVG inline repetidos y los colores hardcodeados.
- Iconos: antena/radar, play, ojo / ojo tachado / diana, sol/luna, capas, lupa, cerrar, chevrones, plano (el mismo glifo del logo de analytics).

### Mapa

- Paleta light: tierra `#EDEEF0`, agua `#C9DDF0`, parques `#DDE8D3`, carreteras blancas, texto `#6B7280`.
- Paleta dark: tierra `#1C1C1E`, agua `#0E1A2B`, carreteras `#3A3A3C`, texto `#8E8E93`.
- Aviones: icono `#007AFF` (dark `#0A84FF`), seleccionado `#FF9F0A` con halo; trail en azul degradado por altitud (opcional, fase 3).
- Callsign sobre el mapa: etiqueta sólida pequeña (sin `backdrop-filter`), con lo que se aligera el render.

## 4. Propuesta UX — layout inspirado en Flightradar24 (v2)

Referencia de estructura: Flightradar24 web (mapa a pantalla completa, buscador arriba, panel de detalle anclado a un lado, barra vertical de controles, aviones con etiqueta mínima). Estilo visual: el de `analytics`/`portrait` (superficies sólidas, `#007AFF`, `#FF9F0A`, iconos de trazo 2 px). No se copian marca, assets ni textos de FR24.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ✈ FlightFlow  [🔍 Buscar callsign, matrícula, hex…]  ● Online · UTC 14:32  [☀] │  Topbar
├──────────────┬────────────────────────────────────────────────────────┬───────┤
│ Panel        │                                                        │ ＋    │
│ izquierdo    │                  MAPA                                  │ －    │
│ (380 px)     │            ✈ IBE3214   ✈ RYR8XK                        │ ◎     │
│ Tráfico  /   │                                                        │ ☰     │  Barra
│ Detalle /    │                                                        │ 🧭    │  vertical
│ Aeropuerto   │   [METAR chip]                                         │       │
└──────────────┴────────────────────────────────────────────────────────┴───────┘
Móvil: topbar compacto + bottom sheet (peek / medio / completo) + barra vertical reducida.
```

### 4.1 Topbar (sustituye a la «card del aeropuerto»)
- Logo FlightFlow + buscador central (callsign, matrícula, tipo, hex; resultados desplegables con icono de familia; `/` lo enfoca).
- A la derecha: estado del receptor (punto verde/rojo + «Online»), hora UTC, tema claro/oscuro.
- La identidad del aeropuerto (ICAO + nombre) pasa a un **chip** bajo el buscador y abre el **panel de aeropuerto** al pulsarlo; el METAR se muestra dentro de ese panel y como chip compacto sobre el mapa.

### 4.2 Aviones en el mapa (sustituyen a las «cards volantes»)
- Icono de avión rotado por rumbo, con la **etiqueta pegada al icono**: callsign en una línea (sin tarjeta con fondo grande), como en FR24.
- Etiqueta sólida pequeña (`surface`, borde 1 px) solo en seleccionado/hover; el resto, texto con halo.
- Color por altitud (azul → cian → ámbar) como opción de «Capas»; seleccionado en `#FF9F0A` con anillo.
- Trail del avión seleccionado con degradado por altitud; al pasar el ratón, mini tooltip con alt/vel.
- Modos de etiqueta (Todos · Cercanos · Ocultos) en el menú de capas, con segmented explícito.

### 4.3 Panel de tráfico (izquierda, por defecto)
- Cabecera con contador («84 aviones · 61 con posición») y filtros en chips: `Todos · Con posición · Cercanos · Helis`.
- Tabla compacta ordenable (callsign, tipo, alt, vel, dist.) con icono de familia; fila seleccionada `#007AFF/10`.
- Segunda pestaña «Receptor» (antes Stats): ganancia, PPM, msg/s, aviones sin posición.

### 4.4 Panel de detalle del avión (izquierda, reemplaza al de tráfico)
Estructura tipo FR24:
1. Cabecera: callsign grande, operador, matrícula · tipo, botones *Seguir*, *Compartir enlace*, cerrar.
2. **Tarjeta de vuelo**: logo de aerolínea (`/logos`), origen → destino con barra de progreso y avión sobre ella *(si el colector/analytics dispone de ruta; si no, se oculta)*.
3. **Métricas clave** en cuadrícula 2×2: Altitud, Velocidad, Rumbo, Distancia al receptor; con vario/tendencia de altitud (▲▼) cuando haya `baro_rate`.
4. Foto/silueta del aparato (familia de icono grande si no hay foto; portrait ya dibuja siluetas).
5. Acordeones: Posición · Técnica · Señal ADS-B · Trayectoria.
6. Enlace «Ver en Analytics» al histórico de esa aeronave (`/analytics/aircraft`).

### 4.5 Panel de aeropuerto
- ICAO/IATA, nombre, METAR decodificado (viento, visibilidad, QNH, temperatura) y chips de pista en uso si hay datos.
- Contadores: aviones a < 20 km, en aproximación/despegue (reutiliza la fase de `portrait`).
- Aeropuertos cercanos del mapa: clic en el marcador abre su panel.

### 4.6 Barra vertical de controles (derecha)
Zoom +/−, centrar en receptor, brújula/reset norte, **Capas** (popover: etiquetas, color por altitud, trails, aeropuertos, vista radar/autoplay) y pantalla completa. Botones 40 px, iconos del módulo común.

### 4.7 Transversal
- Interacciones: clic en vacío deselecciona, `Esc` cierra panel, `/` busca, URL con `?hex=` para enlazar un avión.
- Accesibilidad: objetivos ≥ 40 px, contraste AA, `aria-label`, `prefers-reduced-motion`.
- Vacíos/errores: «Esperando aviones…» con icono; banner discreto si el receptor está offline.

## 5. Plan de implementación (por commits en la rama)

| Fase | Contenido | Archivos principales |
|---|---|---|
| 1. Tokens y tema ✅ | Tailwind, fuente del sistema, `globals.css` sin glass | `tailwind.config.ts`, `styles/globals.css` |
| 2. Iconos y UI base | `ui/icons.tsx`, `Segmented`, `Toggle`, `Chip`, `Accordion` | `components/ui/*` |
| 3. Mapa y aviones | Paletas neutras, icono + etiqueta pegada, color por altitud, trail degradado | `lib/mapStyle.ts`, `lib/aircraftIcon.ts`, `Map.tsx` |
| 4. Shell FR24 | `Topbar` + buscador, barra vertical + menú de capas, layout de paneles | `AirportCard.tsx` → `Topbar.tsx`, `MapControls.tsx`, `App.tsx` |
| 5. Panel de tráfico | Tabla, filtros, pestaña Receptor, bottom sheet móvil | `SidePanel.tsx`, `TrafficList.tsx`, `StatsPanel.tsx` |
| 6. Detalle de avión | Cabecera, tarjeta de vuelo, métricas, acordeones, *Seguir* | `AircraftDetail.tsx` |
| 7. Panel de aeropuerto | METAR decodificado, contadores, clic en marcador | `AirportPanel.tsx` |
| 8. QA | Light/dark, móvil/desktop, 200+ aviones demo, rendimiento | — |

Cada fase deja la app funcional y es revisable por separado. Las claves i18n nuevas se añaden en `messages.ts` (en/es).

## 6. Decisiones abiertas

- ¿Extraer los tokens y el módulo de iconos a `packages/shared` para unificar de verdad las 3 apps, o mantenerlos por servicio de momento?
- ¿Mantener el modo *Autoplay* como control visible o moverlo a ajustes?
- ¿Hay datos de ruta (origen/destino) y foto de aeronave disponibles en el colector? Si no, la tarjeta de vuelo y la foto quedan como opcionales.
- ¿Aceptas desactivar `backdrop-filter` también en la barra superior (todo sólido) o prefieres el mismo `glass-strong` de analytics?
