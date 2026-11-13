# FlightFlow · Portrait

A "frame" that shows the **1–3 planes passing closest** to the receiver right now, drawn as
side-profile prints at real scale.

## How it works

- Reads live aircraft from the collector (`/api/live/aircraft`) every 2 s.
- Keeps airborne planes with a fresh position (< 30 s) within the radius of the receiver
  (`portrait.default_radius_km`, 40 km by default) and takes the closest ones.
- **Stability:** planes on screen keep their slot. A newcomer only replaces one if it is more than 10 % closer.
- Each type maps to one of the 15 drawings in `packages/shared/src/art/aircraft/`
  (`typeMap.ts`). Types without their own drawing use the closest one; the caption shows the real type.
- All drawings share one scale (10 px = 1 m), so an ATR 72 next to an A350 looks smaller.
- The drawings are original work by the FlightFlow author (see NOTICE). To add a model,
  drop in an SVG at 10 px/m named after its ICAO code and register it in `typeMap.ts`.

## Styles

| Style | Look |
|-------|------|
| **Print** (`lamina`) | Single-ink print (red / blue / black) on paper with a passe-partout and black frame. |
| **Blueprint** (`plano`) | White lines on blue with a grid, monospace type. |
| **Night** (`noche`) | Light lines on black, for dark rooms. |

Change them from **⚙︎ Settings**, or fix them by URL (handy in kiosk mode):

```
/portrait/?style=lamina&ink=blue&n=2&radius=25&lang=en
```

| Parameter | Values |
|-----------|--------|
| `style` | `lamina` · `plano` · `noche` |
| `ink` | `red` · `blue` · `black` |
| `n` | `1` · `2` · `3` (maximum planes) |
| `layout` | `row` · `pyramid` |
| `radius` | km, 5–100 |
| `lang` | `en` · `es` |

Settings are saved in `localStorage` (`ff:portrait-settings`).

**Kiosk:** the buttons hide after 3 s without activity. There is a full-screen button, and
the screen is kept awake (Wake Lock) where the browser supports it.

## Development

From the repository root: `npm run dev:portrait` → http://localhost:5175/portrait/.
Use `receiver.url: mock` in `config.yaml` to work without an antenna.
