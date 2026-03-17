import playerjs from '@gumlet/player.js';
import cssText from './pip.css?inline';

function ensureStylesInjected() {
  if (document.getElementById('gumlet-ecommerce-video-styles')) return;

  const style = document.createElement('style');
  style.id = 'gumlet-ecommerce-video-styles';
  style.textContent = cssText;
  document.head.appendChild(style);
}

function normalizeEnabledControls(value) {
  if (value == null) return null;
  if (value === true) return ['play'];
  if (value === false) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return null;
}

function buildEmbedSrc(embedSrc, { background, enabledPlayerControls } = {}) {
  const url = new URL(embedSrc);
  if (background != null) url.searchParams.set('background', background ? 'true' : 'false');
  if (enabledPlayerControls != null) {
    const controls = normalizeEnabledControls(enabledPlayerControls);
    const normalized = controls ? Array.from(new Set(controls)) : [];
    url.searchParams.delete('enabled_player_control');
    for (const control of normalized) {
      url.searchParams.append('enabled_player_control', control);
    }
  }
  return url.toString();
}

function createIframe(embedSrc, { background, enabledPlayerControls } = {}) {
  const iframe = document.createElement('iframe');
  iframe.loading = 'lazy';
  iframe.title = 'Gumlet video player';
  iframe.src = buildEmbedSrc(embedSrc, { background, enabledPlayerControls });
  iframe.referrerPolicy = 'origin';
  iframe.allow = 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;';
  iframe.style.border = 'none';
  return iframe;
}

function parseAspectRatio(value) {
  if (!value || typeof value !== 'string') return null;
  const raw = value.trim();

  const parts = raw.split(/[:/x]/i).map((p) => p.trim()).filter(Boolean);
  if (parts.length !== 2) return null;

  const w = Number(parts[0]);
  const h = Number(parts[1]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return { w, h };
}

function parseOptionalBoolean(value) {
  if (typeof value === 'boolean') return { hasValue: true, value };
  if (typeof value !== 'string') return { hasValue: false, value: false };
  const raw = value.trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes' || raw === 'on') {
    return { hasValue: true, value: true };
  }
  if (raw === 'false' || raw === '0' || raw === 'no' || raw === 'off') {
    return { hasValue: true, value: false };
  }
  return { hasValue: true, value: false };
}

function safeStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeStorageRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function mount(rootEl, options = {}) {
  ensureStylesInjected();

  const embedSrc = options.embedSrc ?? rootEl.dataset.embedSrc;
  const corner = options.corner ?? rootEl.dataset.corner ?? 'bottom-right';
  const aspectRatioRaw = options.aspectRatio ?? rootEl.dataset.aspectRatio ?? '9:16';
  const aspectRatio = parseAspectRatio(aspectRatioRaw) ?? { w: 9, h: 16 };

  const persistVideoData = parseOptionalBoolean(rootEl.dataset.persistVideo);
  const persistVideo =
    options.persistVideo ?? (persistVideoData.hasValue ? persistVideoData.value : true);
  const dismissKey =
    options.dismissKey ?? rootEl.dataset.dismissKey ?? `gumlet-ecommerce-video:dismissed:${embedSrc ?? ''}`;

  if (!embedSrc) {
    throw new Error('[GumletEcommerceVideo] Missing data-embed-src');
  }

  if (persistVideoData.hasValue && persistVideoData.value === true) {
    safeStorageRemove(dismissKey);
  }

  if (!persistVideo) {
    const dismissed = safeStorageGet(dismissKey) === '1';
    if (dismissed) {
      rootEl.replaceChildren();
      return {
        destroy() {
          rootEl.replaceChildren();
        },
      };
    }
  }

  rootEl.classList.add('gumlet-ecommerce-video');

  const pip = document.createElement('div');
  pip.className = 'gumlet-ecommerce-video__pip';
  pip.classList.toggle('is-bottom-left', corner === 'bottom-left');
  pip.classList.toggle('is-bottom-right', corner !== 'bottom-left');
  pip.style.aspectRatio = `${aspectRatio.w} / ${aspectRatio.h}`;

  const close = document.createElement('button');
  close.className = 'gumlet-ecommerce-video__close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  close.textContent = '✕';

  const ratio = document.createElement('div');
  ratio.className = 'gumlet-ecommerce-video__ratio';

  let gumletPlayer = null;
  let currentMode = 'compact';
  let isReady = false;

  function setMode(mode) {
    currentMode = mode;
    const expanded = mode === 'expanded';
    pip.classList.toggle('is-expanded', expanded);

    close.setAttribute('aria-label', expanded ? 'Minimize' : 'Close');
    close.textContent = expanded ? '-' : '✕';

    ratio.replaceChildren();

    const iframe = createIframe(embedSrc, {
      background: !expanded,
      enabledPlayerControls: expanded ? ['play', 'mute', 'volume'] : null,
    });
    ratio.appendChild(iframe);

    if (!expanded) {
      const tapzone = document.createElement('div');
      tapzone.className = 'gumlet-ecommerce-video__tapzone';
      tapzone.setAttribute('role', 'button');
      tapzone.setAttribute('tabindex', '0');
      tapzone.setAttribute('aria-label', 'Expand video');
      tapzone.addEventListener('click', () => setMode('expanded'));
      ratio.appendChild(tapzone);
    }

    gumletPlayer = new playerjs.playerjs.Player(iframe);
    isReady = false;

    gumletPlayer.on('ready', async () => {
      isReady = true;
      try {
        if (gumletPlayer.supports('method', 'play')) await gumletPlayer.play();
      } catch {
        // ignore
      }

      try {
        if (!expanded) {
          if (gumletPlayer.supports('method', 'mute')) await gumletPlayer.mute();
        } else {
          if (gumletPlayer.supports('method', 'unmute')) await gumletPlayer.unmute();
        }
      } catch {
        // ignore
      }
    });
  }

  setMode('compact');

  pip.appendChild(close);
  pip.appendChild(ratio);

  rootEl.replaceChildren();
  rootEl.appendChild(pip);

  function onClose() {
    if (currentMode === 'expanded') {
      setMode('compact');
      return;
    }

    if (!persistVideo) safeStorageSet(dismissKey, '1');
    pip.remove();
  }

  close.addEventListener('click', onClose);

  return {
    destroy() {
      close.removeEventListener('click', onClose);
      pip.remove();
      rootEl.replaceChildren();
    },
  };
}

function scan(selector = '.gumlet-ecommerce-video') {
  const nodes = Array.from(document.querySelectorAll(selector));
  return nodes.map((el) => {
    if (el.__gumletEcommerceVideoInstance) return el.__gumletEcommerceVideoInstance;
    const instance = mount(el);
    el.__gumletEcommerceVideoInstance = instance;
    return instance;
  });
}

const GumletEcommerceVideo = {
  init(rootEl, options) {
    if (!rootEl) throw new Error('[GumletEcommerceVideo] init(rootEl) requires a root element');
    if (rootEl.__gumletEcommerceVideoInstance) return rootEl.__gumletEcommerceVideoInstance;
    const instance = mount(rootEl, options);
    rootEl.__gumletEcommerceVideoInstance = instance;
    return instance;
  },
  scan,
};

if (typeof window !== 'undefined') {
  window.GumletEcommerceVideo = GumletEcommerceVideo;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scan());
  } else {
    scan();
  }
}

export default GumletEcommerceVideo;
