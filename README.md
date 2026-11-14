# jryky

The modern rebuild of [jryky.com](https://jryky.com): a small personal homepage centered on a
responsive, generative dot field.

## Run locally

Use Node 22 (22.12 or newer). If you use nvm, run `nvm use` first.

```sh
npm ci
npm run dev
```

Create a production build with `npm run build`. The static output is written to `dist/`, and
`netlify.toml` configures Netlify to publish that directory.

## Formatting and validation

The `.nvmrc` file selects the Node major version used by GitHub Actions.

Run `npm run format` to format source and configuration files. Formatting uses two-space
indentation, single quotes, semicolons, and a 100-character line width. Editor settings are defined
in `.editorconfig`. Generated files, public assets, and the npm lockfile are excluded from
formatting.

Before committing, run `npm run validate`. It checks formatting, runs Astro's TypeScript checks, and
creates the production build. GitHub Actions runs this command for pull requests and pushes to
`main`. Netlify uses it before publishing, so a formatting or type-check failure stops the build.

## Theme architecture

Page colors live as semantic custom properties in `src/styles/global.css` and follow system
light/dark mode. Explicit `data-theme="light"` and `data-theme="dark"` hooks remain available
independently of the bubble palette.

Bubble palettes live in `src/scripts/palettes.ts`. Add an ID, label, and three hex colors for each
of light and dark mode; the unlabeled slider builds its discrete stops from that registry. Repeat a
color in the third slot for two-color themes. It has one stop per palette and exposes the theme name
to screen readers. `palette-selector.ts` saves the visitor's choice when browser storage is
available and sets `data-palette` on the root element. Without an explicit choice, the default is
currently Ocean; `defaultPalette()` is the place to add future seasonal/date rules without
overriding explicit visitor choices.

The canvas blends palette colors over 800 ms without recreating dots or resetting motion. Rapid
switches blend from the current colors. Reduced-motion preferences use an immediate color change and
a static field.
