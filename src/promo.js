// The promo video popup. The video is not downloaded until the visitor presses play (preload="none" plus a poster image),
// so it costs nothing on first load. Opened from the hero button and from the quick menu.
export function initPromo() {
  const dlg = document.getElementById('promo');
  const video = document.getElementById('promoVideo');
  const btn = document.getElementById('promoBtn');
  if (!dlg || !video) return { open() {} };
  let opener = null;
  const SRC = '/promo/Hasan_Abbasi_Promo.mp4';

  function open(from) {
    opener = from || document.activeElement;
    if (!video.getAttribute('src')) video.src = SRC;
    document.documentElement.classList.add('modal-open', 'promo-open');
    if (!dlg.open) dlg.showModal();
    const p = video.play(); if (p && p.catch) p.catch(() => { /* the visitor can press play */ });
  }
  const close = () => dlg.close();
  if (btn) btn.addEventListener('click', () => open(btn));
  document.getElementById('promoClose').addEventListener('click', close);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener('close', () => {
    video.pause();
    document.documentElement.classList.remove('modal-open', 'promo-open');
    if (opener && opener.isConnected) opener.focus();
  });
  return { open };
}
