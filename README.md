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

Visual colors live as semantic custom properties at the top of
`src/styles/global.css`. The canvas reads `--dot-primary` and
`--dot-secondary`, so future themes can change both the page and the generated
art without modifying the animation.

The current build follows the device color preference automatically. Explicit
`data-theme="light"` and `data-theme="dark"` hooks are also ready for a future
manual theme control.
