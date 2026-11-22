document.documentElement.classList.add('js');
// The render loading screen (src/loader.js) takes over from here. The class hides the page behind it; the timer is a safety net in case the script fails.
if (!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
  document.documentElement.classList.add('fx-loading');
  setTimeout(function () { document.documentElement.classList.remove('fx-loading'); }, 12000);
}
(function () {
  var th = 'dark';
  try { var s = localStorage.getItem('theme'); if (s === 'light' || s === 'dark') th = s; } catch (e) {}
  document.documentElement.setAttribute('data-theme', th);
  try { var l = localStorage.getItem('lang'); if (l === 'ar' || l === 'ur') { document.documentElement.classList.add('rtl'); document.documentElement.lang = l; document.documentElement.dir = 'rtl'; } } catch (e) {}
})();
