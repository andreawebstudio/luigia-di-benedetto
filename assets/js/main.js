(function () {
  'use strict';

  var supportsIO = 'IntersectionObserver' in window;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menu burger (solo mobile/tablet) ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var desktopMq = window.matchMedia('(min-width: 1024px)');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Chiudi il menu' : 'Apri il menu';
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (open) {
      var first = nav.querySelector('a');
      if (first) first.focus();
    }
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && !desktopMq.matches) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (e.key === 'Escape') { setMenu(false); toggle.focus(); }
      if (e.key === 'Tab') {
        var items = [toggle].concat(Array.prototype.slice.call(nav.querySelectorAll('a')));
        var firstEl = items[0], lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    });
    var onMq = function (mq) { if (mq.matches) setMenu(false); };
    if (desktopMq.addEventListener) desktopMq.addEventListener('change', onMq);
    else if (desktopMq.addListener) desktopMq.addListener(onMq);
  }

  /* ---------- Voce di menu attiva ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-list a'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if (supportsIO && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal + attivazione timeline ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var timeline = document.querySelector('.timeline-wrap');
  if (!supportsIO || reduce) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
    if (timeline) timeline.classList.add('is-active');
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add(entry.target === timeline ? 'is-active' : 'is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
    if (timeline) io.observe(timeline);
  }

  /* ---------- Accordion FAQ ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.acc-trigger'), function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.classList.toggle('is-open', !open);
    });
  });

  /* ---------- Modulo di contatto ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = form.querySelector('.form-status');
    var submit = form.querySelector('.form-submit');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalid = null;
      Array.prototype.forEach.call(form.querySelectorAll('input, textarea'), function (f) {
        var ok = f.checkValidity();
        f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !invalid) invalid = f;
      });
      if (invalid) {
        status.textContent = invalid.type === 'checkbox'
          ? 'Per inviare la richiesta è necessario il consenso al trattamento dei dati.'
          : 'Controlla i campi evidenziati: nome, email valida e messaggio sono obbligatori.';
        invalid.focus();
        return;
      }

      var data = new FormData(form);
      var endpoint = form.getAttribute('data-endpoint');

      if (endpoint) {
        submit.disabled = true;
        status.textContent = 'Invio in corso…';
        fetch(endpoint, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
          .then(function (r) {
            if (!r.ok) throw new Error('send');
            form.reset();
            status.textContent = 'Grazie, la tua richiesta è stata inviata. Ti ricontatterò al più presto.';
          })
          .catch(function () {
            status.textContent = 'Non è stato possibile inviare la richiesta. Puoi scrivermi direttamente via email o WhatsApp.';
          })
          .then(function () { submit.disabled = false; });
      } else {
        var to = form.getAttribute('data-mailto');
        var body = 'Nome: ' + data.get('nome') + '\nEmail: ' + data.get('email') +
          (data.get('telefono') ? '\nTelefono: ' + data.get('telefono') : '') +
          '\n\n' + data.get('messaggio');
        window.location.href = 'mailto:' + to +
          '?subject=' + encodeURIComponent('Richiesta di consulenza dal sito') +
          '&body=' + encodeURIComponent(body);
        status.textContent = 'Si sta aprendo il tuo programma di posta con il messaggio già compilato: verifica e invia.';
      }
    });

    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true' && e.target.checkValidity()) {
        e.target.setAttribute('aria-invalid', 'false');
      }
    });
  }
})();
