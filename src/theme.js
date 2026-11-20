import { t } from './i18n.js';

const META = { dark: '#0f1d26', light: '#f3efe6' };

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function initTheme(getStage) {
  const btn = document.getElementById('themeBtn');
  const meta = document.querySelector('meta[name="theme-color"]');
  function apply(mode, persist) {
    document.documentElement.setAttribute('data-theme', mode);
    if (meta) meta.setAttribute('content', META[mode]);
    const stage = getStage && getStage();
    if (stage && stage.setTheme) stage.setTheme(mode);
    if (btn) {
      const label = t(mode === 'light' ? 'theme.dark' : 'theme.light');
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    }
    if (persist) { try { localStorage.setItem('theme', mode); } catch { /* storage blocked */ } }
  }
  const toggle = () => apply(getTheme() === 'light' ? 'dark' : 'light', true);
  if (btn) btn.addEventListener('click', toggle);
  window.addEventListener('langchange', () => apply(getTheme(), false));
  apply(getTheme(), false);
  return { toggle };
}
