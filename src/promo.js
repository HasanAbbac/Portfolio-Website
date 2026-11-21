// The promo video popup. The video is not downloaded until the visitor presses play (preload="none" plus a poster image),
// so it costs nothing on first load. Opened from the hero button and from the quick menu.
export function initPromo() {
  const dlg = document.getElementById('promo');
  const video = document.getElementById('promoVideo');
  const btn = document.getElementById('promoBtn');
  if (!dlg || !video) return { open() {} };
  const err = document.getElementById('promoErr');
  let opener = null;
  // The file name carries a version on purpose: browsers and the CDN keep videos for a day, so a replaced video must get a new name
  // (Hasan_Abbasi_Promo-v4.mp4 ...) or visitors would keep seeing the old one.
  const SRC = '/promo/Hasan_Abbasi_Promo-v3.mp4';

  function open(from) {
    opener = from || document.activeElement;
    if (err) err.hidden = true;
    if (!video.getAttribute('src')) { video.poster = '/promo/poster.webp'; video.src = SRC; } // poster and video are only requested on the first open
    document.documentElement.classList.add('modal-open', 'promo-open');
    if (!dlg.open) dlg.showModal();
    const p = video.play(); if (p && p.catch) p.catch(() => { /* the visitor can press play */ });
  }
  // a failed download is said out loud and the next open tries again from scratch
  video.addEventListener('error', () => { if (err) err.hidden = false; video.removeAttribute('src'); video.load(); });
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
