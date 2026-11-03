# jryky

The modern rebuild of [jryky.com](https://jryky.com): a small personal homepage
centered on a responsive, generative dot field.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`. The static output is written to
`dist/`, and `netlify.toml` configures Netlify to publish that directory.

## Theme architecture

Page colors live as semantic custom properties in `src/styles/global.css` and follow
system light/dark mode. Explicit `data-theme="light"` and `data-theme="dark"` hooks
remain available independently of the bubble palette.

Bubble palettes live in `src/scripts/palettes.ts`. Add an ID, label, and two hex
colors for each of light and dark mode; the selector builds its options from that
registry. `palette-selector.ts` saves the visitor's choice when browser storage is
available and sets `data-palette` on the root element. Automatic currently uses
Ocean; `defaultPalette()` is the place to add future seasonal/date rules without
overriding explicit visitor choices.

The canvas blends palette colors over 800 ms without recreating dots or resetting
motion. Rapid switches blend from the current colors. Reduced-motion preferences
use an immediate color change and a static field.
