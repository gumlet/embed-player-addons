# Gumlet Modal Player (Vanilla JS)

## Run locally

```bash
npm install
npm run dev
```

Then open the URL printed in the terminal.

## Build embed bundle

```bash
npm install
npm run build:embed
```

Output:

- `dist/gumlet-addon-embed.min.js`

Host that file on your CDN and use the snippet below.

## Embed snippet

```html
<div
  class="gumlet-addon"
  data-embed-src="https://play.gumlet.io/embed/VIDEO_ID?background=false&loop=false&disable_player_controls=false"
></div>

<script src="https://cdn.jsdelivr.net/gh/gumlet/gumlet-player-addons@v1.2.0/dist/gumlet-addon-embed.min.js" async></script>
```

## Configure

Edit these attributes in `index.html`:

- `data-embed-src`: your Gumlet embed URL.
- `data-backdrop-opacity`: optional number from `0` to `1` controlling the modal backdrop opacity.
