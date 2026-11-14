/* =========================================================
   autonomie.js · pages « Rapport de stage » et « Mémoire »
   ---------------------------------------------------------
   1. [data-corpus] : le PDF du corpus ne se charge qu'au clic
      (fichier lourd), dans un cadre intégré à la page.
   2. [data-autoeval][data-src] : grille d'autoévaluation
      Oui / En partie / Non + remarques, décrite dans un JSON.
      Les réponses restent dans le navigateur (localStorage).
   ========================================================= */
(function () {
  'use strict';

  var CHOICES = [
    { v: 'oui', label: 'Oui' },
    { v: 'partie', label: 'En partie' },
    { v: 'non', label: 'Non' }
  ];

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined) return;
      if (k === 'text') node.textContent = v;
      else if (k === 'class') node.className = v;
      else node.setAttribute(k, v);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return node;
  }

  function readStore(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* navigation privée : on continue sans enregistrer */ }
  }

  /* ---------- 1. Corpus PDF chargé à la demande ---------- */

  function initCorpus(box) {
    var button = box.querySelector('[data-corpus-load]');
    var slot = box.querySelector('[data-corpus-slot]');
    if (!button || !slot) return;
    button.addEventListener('click', function () {
      slot.textContent = '';
      slot.appendChild(el('iframe', {
        class: 'corpus-frame',
        src: box.getAttribute('data-corpus'),
        title: box.getAttribute('data-corpus-title') || 'Corpus'
      }));
    });
  }

  /* ---------- 2. Grille Oui / En partie / Non ---------- */

  function buildGrid(root, cfg) {
    var key = cfg.stockage || ('acadecrit-' + root.getAttribute('data-src'));
    var state = readStore(key) || { r: {}, n: {} };
    var all = [];
    var main = el('div', { class: 'col-main ae-sections' });

    (cfg.sections || []).forEach(function (sec, si) {
      var titleId = 'ae-' + si;
      var section = el('section', { class: 'ae-section', 'aria-labelledby': titleId }, [
        el('span', { class: 'tape' + (si % 2 ? ' tape--red' : ''), style: '--x:36px;--w:84px;--t:-4deg', 'aria-hidden': 'true' }),
        el('h3', { id: titleId, text: (si + 1) + '. ' + sec.titre })
      ]);
      (sec.criteres || []).forEach(function (txt, ci) {
        var id = si + '-' + ci;
        var group = el('div', { class: 'ae-choices', role: 'group', 'aria-label': txt });
        var buttons = CHOICES.map(function (c) {
          var b = el('button', { type: 'button', class: 'opt', 'data-v': c.v, 'aria-pressed': 'false', text: c.label });
          b.addEventListener('click', function () {
            if (state.r[id] === c.v) delete state.r[id]; else state.r[id] = c.v;
            save();
          });
          group.appendChild(b);
          return b;
        });
        var note = el('textarea', { class: 'ae-note', rows: '1', 'aria-label': 'Mes corrections / remarques : ' + txt, placeholder: 'Mes corrections / remarques…' });
        note.value = state.n[id] || '';
        note.addEventListener('input', function () { state.n[id] = note.value; writeStore(key, state); });
        section.appendChild(el('div', { class: 'ae-crit' }, [el('div', { class: 'ae-row' }, [el('p', { text: txt }), group]), note]));
        all.push({ id: id, txt: txt, buttons: buttons });
      });
      main.appendChild(section);
    });

    var counts = el('p', { class: 'ae-counts', role: 'status' });
    var verdict = el('p', { class: 'v' });
    var todo = el('ul', { class: 'ae-todo' });
    var reset = el('button', { type: 'button', class: 'btn btn--ghost', text: 'Recommencer' });
    reset.addEventListener('click', function () {
      state = { r: {}, n: {} };
      main.querySelectorAll('.ae-note').forEach(function (t) { t.value = ''; });
      save();
    });
    var print = el('button', { type: 'button', class: 'btn btn--light', text: 'Imprimer ma grille' });
    print.addEventListener('click', function () { window.print(); });

    var side = el('aside', { class: 'col-side score-box torn-dark ae-summary', 'aria-label': 'Bilan de ma relecture' }, [
      el('p', { class: 'label', text: 'MON BILAN' }),
      counts,
      el('div', { class: 'score-advice' }, [verdict, el('p', { class: 'a', text: 'À retravailler en priorité :' }), todo]),
      el('div', { class: 'score-actions' }, [print, reset])
    ]);

    function save() { writeStore(key, state); render(); }

    function render() {
      var n = { oui: 0, partie: 0, non: 0 };
      todo.textContent = '';
      all.forEach(function (c) {
        var cur = state.r[c.id];
        c.buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === cur ? 'true' : 'false'); });
        if (cur) n[cur] += 1;
        if (cur === 'non' || cur === 'partie') todo.appendChild(el('li', { text: c.txt }));
      });
      var done = n.oui + n.partie + n.non;
      counts.textContent = '';
      counts.appendChild(el('span', { text: 'Oui : ' + n.oui }));
      counts.appendChild(el('span', { text: 'En partie : ' + n.partie }));
      counts.appendChild(el('span', { text: 'Non : ' + n.non }));
      counts.appendChild(el('span', { text: done + ' / ' + all.length + ' critères' }));
      if (!todo.children.length) todo.appendChild(el('li', { text: done ? 'Rien pour l’instant. Continue ta relecture.' : 'Réponds aux critères pour voir ta liste.' }));
      verdict.textContent = done < all.length ? 'Continue ta relecture…'
        : (n.non === 0 && n.partie <= 2 ? 'Ton texte est prêt à être déposé !' : 'Reprends les points ci-dessous, puis relis encore.');
    }

    root.textContent = '';
    root.appendChild(main);
    root.appendChild(side);
    render();
  }

  function initGrid(root) {
    fetch(root.getAttribute('data-src'))
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (cfg) { buildGrid(root, cfg); })
      .catch(function () {
        root.textContent = '';
        root.appendChild(el('div', { class: 'load-error', role: 'alert' }, [
          el('strong', { text: 'La grille n’a pas pu être chargée. ' }),
          location.protocol === 'file:'
            ? 'Ouvre le site avec un petit serveur local (python3 -m http.server 8000).'
            : 'Recharge la page.'
        ]));
      });
  }

  function init() {
    document.querySelectorAll('[data-corpus]').forEach(initCorpus);
    document.querySelectorAll('[data-autoeval][data-src]').forEach(initGrid);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
