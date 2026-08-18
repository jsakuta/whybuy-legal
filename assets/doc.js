(function () {
  'use strict';

  var body = document.querySelector('.doc-body');
  var tocNav = document.getElementById('toc-nav');
  var tocAside = document.getElementById('toc');
  var progress = document.getElementById('reading-progress');

  // --- 見出しが自ら持つ番号 (第1条 / 1.) を分解する -------------------------
  // 戻り値: { label: 表示する番号ラベル, text: 番号を除いた見出し本文 }
  function splitHeading(raw) {
    var m = raw.match(/^第\s*(\d+)\s*条\s*[（(]?(.*?)[）)]?$/);
    if (m) { return { label: '第' + m[1] + '条', text: m[2] || raw }; }
    m = raw.match(/^(\d+)[.．]\s*(.+)$/);
    if (m) { return { label: ('0' + m[1]).slice(-2), text: m[2] }; }
    return { label: '', text: raw };
  }

  // --- テーブルを横スクロール用ラッパで包む -------------------------------
  if (body) {
    Array.prototype.slice.call(body.querySelectorAll('table')).forEach(function (t) {
      if (t.parentNode && t.parentNode.classList.contains('table-wrap')) { return; }
      var w = document.createElement('div');
      w.className = 'table-wrap';
      t.parentNode.insertBefore(w, t);
      w.appendChild(t);
    });
  }

  // --- 目次生成 + 見出しの番号ラベル化 -------------------------------------
  var headings = body ? Array.prototype.slice.call(body.querySelectorAll('h2')) : [];
  var links = [];
  var wide = false;

  if (headings.length) {
    headings.forEach(function (h, i) {
      if (!h.id) { h.id = 'sec-' + (i + 1); }
      var parts = splitHeading(h.textContent.trim());
      if (parts.label) {
        if (parts.label.length > 3) { wide = true; }
        var num = document.createElement('span');
        num.className = 'h-num';
        num.textContent = parts.label;
        h.textContent = parts.text;
        h.insertBefore(num, h.firstChild);
      }
      if (!tocNav) { return; }
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.className = 'toc__link';
      var numEl = document.createElement('span');
      numEl.className = 'toc__num';
      numEl.textContent = parts.label;
      var textEl = document.createElement('span');
      textEl.className = 'toc__text';
      textEl.textContent = parts.text;
      a.appendChild(numEl);
      a.appendChild(textEl);
      tocNav.appendChild(a);
      links.push(a);
    });
    if (wide && tocAside) { tocAside.classList.add('toc--wide'); }
  } else if (tocAside) {
    tocAside.classList.add('is-empty');
  }

  // --- スクロールスパイ -----------------------------------------------------
  if ('IntersectionObserver' in window && links.length) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        links.forEach(function (a) { a.classList.remove('is-current'); });
        var cur = byId[e.target.id];
        if (cur) { cur.classList.add('is-current'); }
      });
    }, { rootMargin: '-12% 0px -75% 0px', threshold: 0 });
    headings.forEach(function (h) { spy.observe(h); });
  }

  // --- 読書プログレスバー ---------------------------------------------------
  function onScroll() {
    if (!progress) { return; }
    var docEl = document.documentElement;
    var max = docEl.scrollHeight - docEl.clientHeight;
    var pct = max > 0 ? (docEl.scrollTop || document.body.scrollTop) / max : 0;
    progress.style.transform = 'scaleX(' + Math.min(1, Math.max(0, pct)) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- スムーズスクロール (ヘッダー高さ補正) --------------------------------
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) { return; }
    var id = a.getAttribute('href').slice(1);
    var target = document.getElementById(id);
    if (!target) { return; }
    e.preventDefault();
    var top = target.getBoundingClientRect().top + window.pageYOffset - 88;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + id);
  });
})();
