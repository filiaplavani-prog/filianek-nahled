/* Filiánek – společný skript všech stránek (menu, aktuality, rok v patičce) */
(function () {
  // nová stránka začíná nahoře i v náhledu, který web zobrazuje v rámu a drží jeho posun
  // (jen při přechodu odkazem bez kotvy; zpět v historii vrací prohlížeč původní místo)
  var navEntry = window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  if (window.top !== window && !location.hash && navEntry && navEntry.type === 'navigate') document.documentElement.scrollIntoView({ block: 'start' });

  // úvod: průhledná hlavička nad hero, po odrolování bílá
  if (document.body.classList.contains('is-home')) {
    var onScroll = function () { document.body.classList.toggle('is-scrolled', window.scrollY > 20); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }
  // navigace oblasti: aktivní položka viditelná i na úzké obrazovce
  // spodní lišta se při psaní do formuláře skryje, aby nezakrývala pole nad klávesnicí
  if (document.body.classList.contains('has-mbar')) {
    var txt = 'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]),textarea,select';
    document.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches(txt)) document.body.classList.add('kb-open'); });
    document.addEventListener('focusout', function () { setTimeout(function () { if (!(document.activeElement && document.activeElement.matches && document.activeElement.matches(txt))) document.body.classList.remove('kb-open'); }, 0); });
  }
  var an = document.querySelector('.area-nav ul'), ac = an && an.querySelector('[aria-current]');
  if (ac && an.scrollWidth > an.clientWidth) an.scrollLeft = ac.parentNode.offsetLeft - 16;

  var btn = document.getElementById('menu-btn'), nav = document.getElementById('hlavni-menu');
  var sb = document.getElementById('sub-btn'), sub = document.getElementById('sub-aktivity');

  if (btn && nav) {
  function setOpen(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.querySelector('.sr-only').textContent = open ? 'Zavřít menu' : 'Menu';
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (open) { var f = nav.querySelector('.sub-btn'); f && f.focus(); }
  }
  function setSub(open) {
    if (!sb || !sub) return;
    sb.setAttribute('aria-expanded', open ? 'true' : 'false');
    sub.classList.toggle('is-open', open);
  }
  btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  if (sb) sb.addEventListener('click', function (e) { e.stopPropagation(); setSub(sb.getAttribute('aria-expanded') !== 'true'); });
  document.addEventListener('click', function (e) { if (innerWidth >= 1100 && !e.target.closest('.has-sub')) setSub(false); });
  if (sub) sub.addEventListener('focusout', function (e) { if (innerWidth >= 1100 && !e.currentTarget.parentNode.contains(e.relatedTarget)) setSub(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (sub && sub.classList.contains('is-open')) { setSub(false); sb && sb.focus(); }
    else if (nav.classList.contains('is-open')) { setOpen(false); btn.focus(); }
  });
  matchMedia('(min-width:1100px)').addEventListener('change', function (m) { if (m.matches) setOpen(false); });
  }

  /* Aktuality: <ul id="aktuality" data-oblast="seniori" data-pocet="3"> – oblast je nepovinná */
  var list = document.getElementById('aktuality');
  if (list) {
    var obl = list.getAttribute('data-oblast');
    var max = +list.getAttribute('data-pocet') || 3;
    var data = (window.FILIANEK_AKTUALITY || []).filter(function (n) { return !obl || obl.split(' ').indexOf(n.oblast) > -1; })
      .sort(function (a, b) { return a.datum < b.datum ? 1 : -1; }).slice(0, max);
    var mesic = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];
    var esc = function (s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    // pevná mezera za jednopísmennou předložkou a spojkou
    var nb = function (s) { return s.replace(/(^|[\s(])([ksvzouaiKSVZOUAI]) /g, '$1$2\u00a0'); };
    if (!data.length) {
      var sec = list.closest('[data-skryt-bez-aktualit]');
      if (sec) { sec.hidden = true; var hb = sec.closest('.has-news'); if (hb) hb.classList.remove('has-news'); }
      else list.outerHTML = '<p><a class="more" href="aktuality.html">Přečtěte si aktuality Filiánku</a></p>';
    } else {
      // odkazy v aktuality.js jsou vůči kořeni webu; stránky v podsložkách je musí doplnit o cestu ke kořeni
      var sc = document.querySelector('script[src$="aktuality.js"]'), root = sc ? sc.getAttribute('src').replace(/aktuality\.js$/, '') : '';
      var url = function (h) { return /^(https?:|mailto:|tel:|\/|#)/.test(h) ? h : root + h; };
      list.innerHTML = data.map(function (n) {
        var p = n.datum.split('-');
        return '<li class="news" data-oblast="' + esc(n.oblast || 'obecne') + '">' +
          '<time class="date" datetime="' + esc(n.datum) + '"><b>' + (+p[2]) + '</b><span>' + mesic[+p[1] - 1] + ' ' + p[0] + '</span></time>' +
          '<div><h3><a href="' + esc(url(n.odkaz)) + '">' + nb(esc(n.nazev)) + '</a></h3>' + (n.popis ? '<p>' + nb(esc(n.popis)) + '</p>' : '') + '</div></li>';
      }).join('');
    }
  }
  /* Fotogalerie: <a class="lb-item" href="foto.jpg" data-lb="album" data-cap="popis"> – zvětšení, listování šipkami, Esc */
  var lbs = [].slice.call(document.querySelectorAll('a.lb-item'));
  if (lbs.length) {
    var box = document.createElement('div');
    box.className = 'lb'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Prohlížení fotografie');
    box.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure><p class="lb-n" aria-live="polite"></p>' +
      '<button type="button" class="lb-prev">‹<span class="sr-only">Předchozí fotografie</span></button>' +
      '<button type="button" class="lb-next">›<span class="sr-only">Další fotografie</span></button>' +
      '<button type="button" class="lb-close">×<span class="sr-only">Zavřít prohlížení</span></button>';
    document.body.appendChild(box);
    var grp = [], cur = 0, back = null, im = box.querySelector('img'), cap = box.querySelector('figcaption'), num = box.querySelector('.lb-n');
    var show = function (i) { cur = (i + grp.length) % grp.length; var a = grp[cur]; im.src = a.getAttribute('href'); im.alt = a.getAttribute('data-cap') || ''; cap.textContent = a.getAttribute('data-cap') || ''; num.textContent = (cur + 1) + ' / ' + grp.length; };
    var close = function () { box.hidden = true; document.body.classList.remove('lb-open'); if (back) back.focus(); };
    lbs.forEach(function (a) { a.addEventListener('click', function (ev) { ev.preventDefault(); back = a; grp = lbs.filter(function (x) { return x.getAttribute('data-lb') === a.getAttribute('data-lb'); }); box.hidden = false; document.body.classList.add('lb-open'); show(grp.indexOf(a)); box.querySelector('.lb-close').focus(); }); });
    box.querySelector('.lb-prev').addEventListener('click', function () { show(cur - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { show(cur + 1); });
    box.querySelector('.lb-close').addEventListener('click', close);
    box.addEventListener('click', function (ev) { if (ev.target === box) close(); });
    document.addEventListener('keydown', function (ev) { if (box.hidden) return; if (ev.key === 'Escape') close(); else if (ev.key === 'ArrowLeft') show(cur - 1); else if (ev.key === 'ArrowRight') show(cur + 1);
      else if (ev.key === 'Tab') { var b = [].slice.call(box.querySelectorAll('button')), i = b.indexOf(document.activeElement); ev.preventDefault(); b[(i + (ev.shiftKey ? -1 : 1) + b.length) % b.length].focus(); } });
  }
  var rok = document.getElementById('rok');
  if (rok) rok.textContent = new Date().getFullYear();
})();
