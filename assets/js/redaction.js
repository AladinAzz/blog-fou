/* =========================================================
   redaction.js · compteur de mots, copie, check-list
   ---------------------------------------------------------
   La cible, la consigne et la check-list viennent de
   data/redaction.json. Rien n'est enregistré.
   ========================================================= */
(function () {
  'use strict';

  var DEFAULTS = { motsCible: 220, consigne: '', aConfirmer: false, checklist: [] };
  var BAR_SCALE = 1.2;   // la barre pleine correspond à 120 % de la cible
  var LOW = 0.9;         // en dessous : « encore un peu court »
  var HIGH = 1.1;        // au-dessus : « trop long »

  function init() {
    var root = document.querySelector('[data-redaction]');
    if (!root) return;
    var src = root.getAttribute('data-src');
    fetch(src)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(function () { return DEFAULTS; })
      .then(function (cfg) { setup(root, Object.assign({}, DEFAULTS, cfg)); });
  }

  function countWords(text) {
    var t = text.trim();
    return t ? t.split(/\s+/).length : 0;
  }

  function setup(root, cfg) {
    var q = function (sel) { return root.querySelector(sel); };
    var cible = Number(cfg.motsCible) || DEFAULTS.motsCible;
    var area = q('#synthese');
    var mots = q('[data-mots]');
    var etat = q('[data-etat]');
    var barre = q('[data-barre]');

    q('[data-cible]').textContent = cible;
    if (cfg.consigne) q('[data-consigne]').textContent = cfg.consigne.replace('{cible}', cible);
    q('[data-a-confirmer]').hidden = !cfg.aConfirmer;

    function refresh() {
      var n = countWords(area.value);
      var st;
      if (n === 0) st = ['empty', 'Pas encore commencé'];
      else if (n < cible * LOW) st = ['short', 'Encore un peu court'];
      else if (n <= cible * HIGH) st = ['ok', 'Dans la cible'];
      else st = ['long', 'Trop long : resserrez'];
      mots.textContent = n;
      etat.textContent = st[1];
      etat.className = 'state st-' + st[0];
      barre.className = 'bar-fill bg-' + st[0];
      barre.style.width = Math.min(100, Math.round(n / (cible * BAR_SCALE) * 100)) + '%';
    }
    area.addEventListener('input', function () { refresh(); copyBtn.textContent = 'Copier mon texte'; });

    var copyBtn = q('[data-copier]');
    copyBtn.addEventListener('click', function () {
      if (!navigator.clipboard || !navigator.clipboard.writeText) return;
      navigator.clipboard.writeText(area.value).then(function () {
        copyBtn.textContent = 'Copié !';
      }, function () { /* échec silencieux : la copie manuelle reste possible */ });
    });

    var list = q('[data-checklist]');
    var counter = q('[data-check-count]');
    var total = cfg.checklist.length;
    list.textContent = '';
    cfg.checklist.forEach(function (t, i) {
      var id = 'check-' + i;
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      var span = document.createElement('span');
      span.textContent = t;
      var label = document.createElement('label');
      label.setAttribute('for', id);
      label.appendChild(input);
      label.appendChild(span);
      var li = document.createElement('li');
      li.appendChild(label);
      list.appendChild(li);
      input.addEventListener('change', updateChecks);
    });
    function updateChecks() {
      var n = list.querySelectorAll('input:checked').length;
      counter.textContent = n + ' / ' + total;
    }
    updateChecks();
    refresh();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
