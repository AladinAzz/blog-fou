/* =========================================================
   echanges.js · espace d'échanges (maquette, site statique)
   ---------------------------------------------------------
   Les fils d'exemple viennent de data/echanges.json. Ce que
   l'apprenant publie reste dans SON navigateur (localStorage) :
   rien n'est envoyé, personne d'autre ne le voit.
   Tout le texte est inséré avec textContent (pas de HTML).
   ========================================================= */
(function () {
  'use strict';

  var KEY = 'acadecrit-echanges';
  var TYPES = { travail: 'Travail déposé', question: 'Question', discussion: 'Discussion' };
  var MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

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

  function today() { var d = new Date(); return d.getDate() + ' ' + MONTHS[d.getMonth()]; }

  function readStore() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && Array.isArray(s.fils) && s.reponses) return s;
    } catch (e) { /* stockage indisponible */ }
    return { fils: [], reponses: {} };
  }
  function writeStore(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* navigation privée */ }
  }

  // Lien interne (relatif) ou externe en https uniquement.
  function safeUrl(url) {
    var u = String(url || '');
    return /^https:\/\//.test(u) || /^[a-z0-9][a-z0-9\-\/]*\.html(#[\w-]*)?$/i.test(u) ? u : null;
  }

  function author(name, role, date) {
    return el('p', { class: 'thread-meta' }, [
      el('strong', { text: name }),
      role === 'prof' ? el('span', { class: 'badge badge--prof', text: 'Enseignante' }) : null,
      ' · ' + date
    ]);
  }

  function replyNode(r) {
    var url = r.lien && safeUrl(r.lien.url);
    var external = url && /^https/.test(url);
    return el('li', { class: 'reply' + (r.role === 'prof' ? ' reply--prof' : '') }, [
      author(r.auteur, r.role, r.date),
      el('p', { text: r.texte }),
      url ? el('p', {}, [el('a', { href: url, target: external ? '_blank' : null, rel: external ? 'noopener' : null, text: '🔗 ' + r.lien.texte + (external ? ' ↗' : ' →') })]) : null
    ]);
  }

  function threadNode(t, store, rerender) {
    var replies = (t.reponses || []).concat(store.reponses[t.id] || []);
    var inputId = 'rep-' + t.id;
    var input = el('input', { id: inputId, type: 'text', placeholder: 'Je réponds…', autocomplete: 'off' });
    var form = el('form', { class: 'reply-form' }, [
      el('label', { class: 'visually-hidden', for: inputId, text: 'Répondre à : ' + t.titre }),
      input,
      el('button', { type: 'submit', class: 'btn', text: 'Répondre' })
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var txt = input.value.trim();
      if (!txt) return;
      store.reponses[t.id] = (store.reponses[t.id] || []).concat([{ auteur: 'Moi', role: 'etudiant', date: today(), texte: txt.slice(0, 2000) }]);
      writeStore(store);
      rerender();
    });
    return el('article', { class: 'thread' }, [
      el('span', { class: 'tape' + (t.type === 'question' ? ' tape--red' : ''), style: '--x:28px;--w:70px;--t:-5deg', 'aria-hidden': 'true' }),
      el('p', { class: 'thread-meta' }, [el('span', { class: 'badge badge--type', style: 'margin-left:0', text: TYPES[t.type] || t.type })]),
      el('h3', { text: t.titre }),
      author(t.auteur, t.role, t.date),
      el('p', { class: 'thread-body', text: t.texte }),
      t.fichier ? el('p', { class: 'file-chip', text: '📎 ' + t.fichier }) : null,
      replies.length ? el('ul', { class: 'replies' }, replies.map(replyNode)) : null,
      form
    ]);
  }

  function init() {
    var root = document.querySelector('[data-echanges][data-src]');
    if (!root) return;
    var listBox = root.querySelector('[data-threads]');
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-filter]'));
    var form = root.querySelector('[data-publier]');
    var status = root.querySelector('[data-publier-status]');
    var reset = root.querySelector('[data-effacer]');
    var seed = [];
    var filter = 'tous';

    function render() {
      var store = readStore();
      var shown = store.fils.concat(seed).filter(function (t) { return filter === 'tous' || t.type === filter; });
      listBox.textContent = '';
      if (!shown.length) listBox.appendChild(el('p', { text: 'Rien ici pour l’instant. Lance la conversation !' }));
      shown.forEach(function (t) { listBox.appendChild(threadNode(t, store, render)); });
    }

    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        filter = b.getAttribute('data-filter');
        tabs.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        render();
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      var titre = f.titre.value.trim();
      var texte = f.message.value.trim();
      if (!titre || !texte) { status.textContent = 'Ajoute un titre et un message.'; return; }
      var file = f.fichier.files && f.fichier.files[0];
      var store = readStore();
      store.fils = [{
        id: 'u' + Date.now(),
        type: TYPES[f.genre.value] ? f.genre.value : 'question',
        auteur: f.prenom.value.trim().slice(0, 60) || 'Moi',
        role: 'etudiant',
        date: today(),
        titre: titre.slice(0, 200),
        texte: texte.slice(0, 4000),
        fichier: file ? file.name.slice(0, 120) : null,
        reponses: []
      }].concat(store.fils);
      writeStore(store);
      form.reset();
      status.textContent = 'Publié ! (Dans ton navigateur uniquement : c’est une maquette.)';
      render();
    });

    reset.addEventListener('click', function () {
      try { localStorage.removeItem(KEY); } catch (e) { /* rien à effacer */ }
      status.textContent = 'Tes publications d’essai ont été effacées.';
      render();
    });

    fetch(root.getAttribute('data-src'))
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { seed = d.fils || []; render(); })
      .catch(function () {
        render();
        listBox.insertBefore(el('div', { class: 'load-error', role: 'alert' }, [
          el('strong', { text: 'Les échanges d’exemple n’ont pas pu être chargés. ' }),
          location.protocol === 'file:' ? 'Ouvre le site avec un petit serveur local (python3 -m http.server 8000).' : 'Recharge la page.'
        ]), listBox.firstChild);
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
