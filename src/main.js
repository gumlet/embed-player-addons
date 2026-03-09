import './style.css';

import playerjs from '@gumlet/player.js';

const thumbButton = document.getElementById('gumletThumb');
const modalRoot = document.getElementById('modalRoot');
const modalPlayer = document.getElementById('modalPlayer');
const modalDialog = modalRoot?.querySelector('.modal__dialog');

let lastFocusedElement = null;
let gumletPlayer = null;

function createPreviewIframe(embedSrc) {
  const iframe = createPlayerIframe(embedSrc);
  iframe.allow = 'encrypted-media; picture-in-picture; fullscreen;';
  iframe.style.pointerEvents = 'none';
  return iframe;
}

function buildEmbedSrc(embedSrc) {
  const url = new URL(embedSrc);
  url.searchParams.set('autoplay', 'false');
  return url.toString();
}

function createPlayerIframe(embedSrc) {
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

function mountPreview() {
  if (!thumbButton) return;

  const embedSrc = thumbButton.dataset.embedSrc;
  if (!embedSrc) return;

  if (thumbButton.querySelector('.thumb__frame')) return;

  const frame = document.createElement('div');
  frame.className = 'thumb__frame';

  const iframe = createPreviewIframe(embedSrc);
  frame.appendChild(iframe);

  thumbButton.prepend(frame);
}

function applyModalBg() {
  if (!thumbButton || !modalDialog) return;
  const modalBg = thumbButton.dataset.modalBg;
  if (typeof modalBg === 'string' && modalBg.trim().length > 0) {
    modalDialog.style.setProperty('--modal-bg', modalBg.trim());
  }
}

function openModal(embedSrc) {
  lastFocusedElement = document.activeElement;

  modalRoot.classList.add('is-open');
  modalRoot.setAttribute('aria-hidden', 'false');

  modalPlayer.replaceChildren();
  const wrapper = document.createElement('div');
  wrapper.className = 'ratio';
  const iframe = createPlayerIframe(embedSrc);
  wrapper.appendChild(iframe);
  modalPlayer.appendChild(wrapper);

  gumletPlayer = new window.playerjs.Player(iframe);
  gumletPlayer.on('ready', async () => {
    try {
      if (gumletPlayer.supports('method', 'play')) {
        await gumletPlayer.play();
      }
    } catch {
      // Some browsers may block autoplay-with-sound even after a gesture.
    }
  });

  const closeButton = modalRoot.querySelector('.modal__close');
  closeButton?.focus();
}

function closeModal() {
  modalRoot.classList.remove('is-open');
  modalRoot.setAttribute('aria-hidden', 'true');

  gumletPlayer = null;
  modalPlayer.replaceChildren();

  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

function syncThumbnail() {
  const url = thumbButton?.dataset?.thumbnail;
  if (!thumbButton) return;

  if (url && url.trim().length > 0) {
    thumbButton.style.backgroundImage = `url(${JSON.stringify(url.trim()).slice(1, -1)})`;
    thumbButton.classList.add('has-image');
  } else {
    thumbButton.classList.remove('has-image');
  }
}

thumbButton?.addEventListener('click', () => {
  const embedSrc = thumbButton.dataset.embedSrc;
  if (!embedSrc) return;
  openModal(embedSrc);
});

modalRoot?.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.dataset.modalClose === 'true') {
    closeModal();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalRoot.classList.contains('is-open')) {
    closeModal();
  }
});

syncThumbnail();
mountPreview();
applyModalBg();
