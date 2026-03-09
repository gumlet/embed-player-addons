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
  data-modal-bg="rgba(0,0,0,0.6)"
></div>

<script src="https://cdn.example.com/gumlet-addon-embed.min.js" async></script>
```

Optional:

- `data-thumbnail` can be provided to override the preview appearance.
- `data-modal-bg` can be provided to set the modal background (any valid CSS color).

## Configure

Edit these attributes in `index.html`:

- `data-embed-src`: your Gumlet embed URL.
- `data-thumbnail`: optional thumbnail image URL. If empty, the tile renders a gradient background.
