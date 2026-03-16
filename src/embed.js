import playerjs from '@gumlet/player.js';
import cssText from './embed.css?inline';

function ensureStylesInjected() {
  if (document.getElementById('gumlet-addon-embed-styles')) return;

  const style = document.createElement('style');
  style.id = 'gumlet-addon-embed-styles';
  style.textContent = cssText;
  document.head.appendChild(style);
}

function buildEmbedSrc(embedSrc) {
  const url = new URL(embedSrc);
  return url.toString();
}

function createPreviewIframe(embedSrc) {
  const iframe = createIframe(embedSrc);
  iframe.allow = 'encrypted-media; picture-in-picture; fullscreen;';
  return iframe;
}

function createIframe(embedSrc) {
  const iframe = document.createElement('iframe');
  iframe.loading = 'lazy';
  iframe.title = 'Gumlet video player';
  iframe.src = buildEmbedSrc(embedSrc);
  iframe.referrerPolicy = 'origin';
  iframe.allow = 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;';
  iframe.style.border = 'none';
  iframe.style.position = 'absolute';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.height = '100%';
  iframe.style.width = '100%';
  return iframe;
}

function mount(rootEl, options = {}) {
  ensureStylesInjected();

  const embedSrc = options.embedSrc ?? rootEl.dataset.embedSrc;
  const backdropOpacity = options.backdropOpacity ?? rootEl.dataset.backdropOpacity;

  if (!embedSrc) {
    throw new Error('[GumletAddon] Missing data-embed-src');
  }

  rootEl.classList.add('gumlet-addon');

  const preview = document.createElement('button');
  preview.type = 'button';
  preview.className = 'gumlet-addon__preview';
  preview.setAttribute('aria-label', 'Play video');

  const previewFrame = document.createElement('div');
  previewFrame.className = 'gumlet-addon__preview-frame';

  const overlay = document.createElement('span');
  overlay.className = 'gumlet-addon__overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const previewIframe = createPreviewIframe(embedSrc);
  previewFrame.appendChild(previewIframe);

  preview.appendChild(previewFrame);
  preview.appendChild(overlay);

  const modal = document.createElement('div');
  modal.className = 'gumlet-addon__modal';
  modal.setAttribute('aria-hidden', 'true');

  if (backdropOpacity !== undefined && backdropOpacity !== null) {
    const n = Number(backdropOpacity);
    if (Number.isFinite(n)) {
      modal.style.setProperty('--gumlet-backdrop-opacity', String(Math.min(1, Math.max(0, n))));
    }
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'gumlet-addon__backdrop';

  const dialog = document.createElement('div');
  dialog.className = 'gumlet-addon__dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Video player');

  const close = document.createElement('button');
  close.className = 'gumlet-addon__close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  close.textContent = '✕';

  const playerWrap = document.createElement('div');
  playerWrap.className = 'gumlet-addon__player';

  dialog.appendChild(close);
  dialog.appendChild(playerWrap);
  modal.appendChild(backdrop);
  modal.appendChild(dialog);

  rootEl.replaceChildren(preview);
  document.body.appendChild(modal);

  let lastFocused = null;
  let gumletPlayer = null;

  function openModal() {
    lastFocused = document.activeElement;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');

    playerWrap.replaceChildren();
    const ratio = document.createElement('div');
    ratio.className = 'gumlet-addon__ratio';

    const iframe = createIframe(embedSrc);
    ratio.appendChild(iframe);
    playerWrap.appendChild(ratio);

    gumletPlayer = new playerjs.playerjs.Player(iframe);
    gumletPlayer.on('ready', async () => {
      console.log('gumletPlayer ready');
      try {
        if (gumletPlayer.supports('method', 'play')) {
          await gumletPlayer.play();
        }
      } catch {
        // Best-effort: browser autoplay policies may block sound.
      }
    });
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');

    gumletPlayer = null;
    playerWrap.replaceChildren();

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  }

  function onBackdropClick() {
    closeModal();
  }

  function onCloseClick() {
    closeModal();
  }

  preview.addEventListener('click', openModal);
  backdrop.addEventListener('click', onBackdropClick);
  close.addEventListener('click', onCloseClick);
  window.addEventListener('keydown', onKeyDown);

  return {
    destroy() {
      preview.removeEventListener('click', openModal);
      backdrop.removeEventListener('click', onBackdropClick);
      close.removeEventListener('click', onCloseClick);
      window.removeEventListener('keydown', onKeyDown);
      closeModal();
      modal.remove();
      rootEl.replaceChildren();
    },
  };
}

function scan(selector = '.gumlet-addon') {
  const nodes = Array.from(document.querySelectorAll(selector));
  return nodes.map((el) => {
    if (el.__gumletAddonInstance) return el.__gumletAddonInstance;
    const instance = mount(el);
    el.__gumletAddonInstance = instance;
    return instance;
  });
}

const GumletAddon = {
  init(rootEl, options) {
    if (!rootEl) throw new Error('[GumletAddon] init(rootEl) requires a root element');
    if (rootEl.__gumletAddonInstance) return rootEl.__gumletAddonInstance;
    const instance = mount(rootEl, options);
    rootEl.__gumletAddonInstance = instance;
    return instance;
  },
  scan,
};

if (typeof window !== 'undefined') {
  window.GumletAddon = GumletAddon;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scan());
  } else {
    scan();
  }
}

export default GumletAddon;
