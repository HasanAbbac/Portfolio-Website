document.documentElement.classList.add('js');
(function () {
  var th = 'dark';
  try { var s = localStorage.getItem('theme'); if (s === 'light' || s === 'dark') th = s; } catch (e) {}
  document.documentElement.setAttribute('data-theme', th);
  try { var l = localStorage.getItem('lang'); if (l === 'ar' || l === 'ur') { document.documentElement.classList.add('rtl'); document.documentElement.lang = l; document.documentElement.dir = 'rtl'; } } catch (e) {}
})();
