/* =========================================================
   grille.js · grille d'auto-évaluation et calcul du score
   ---------------------------------------------------------
   Tout vient de data/grille.json : nombre de points, critères,
   seuils et commentaires. Aucune valeur de barème dans ce code.
   ========================================================= */
(function () {
  'use strict';

  var WORDS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze'];

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

  function init() {
    var root = document.querySelector('[data-grille][data-src]');
    if (!root) return;
    var q = function (sel) { return root.querySelector(sel); };

    fetch(root.getAttribute('data-src'))
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (cfg) { build(root, q, cfg); })
      .catch(function () {
        var box = q('[data-volets]');
        box.textContent = '';
        box.appendChild(el('div', { class: 'load-error', role: 'alert' }, [
          el('strong', { text: 'La grille n’a pas pu être chargée. ' }),
          location.protocol === 'file:'
            ? 'Ouvrez le site avec un petit serveur local (python3 -m http.server 8000), pas en double-cliquant sur le fichier.'
            : 'Rechargez la page.'
        ]));
      });
  }

  function build(root, q, cfg) {
    var max = Number(cfg.pointsMax) || 0;
    var criteria = [];
    (cfg.volets || []).forEach(function (v) { (v.criteres || []).forEach(function (c) { criteria.push(c); }); });
    var nb = criteria.length;
    var maxTotal = nb * max;
    var notes = {};
    var groups = {};

    var bareme = document.querySelector('[data-bareme]');
    if (bareme && cfg.provisoire) {
      bareme.textContent = 'Barème provisoire : 0 = absent · ' + max + ' = pleinement réussi';
      bareme.hidden = false;
    }

    var box = q('[data-volets]');
    box.textContent = '';
    (cfg.volets || []).forEach(function (v, vi) {
      var titleId = 'volet-' + vi;
      var section = el('section', { class: 'volet' + (vi % 2 ? ' volet--alt' : ''), 'aria-labelledby': titleId }, [
        el('span', { class: 'tape' + (vi % 2 ? ' tape--red' : ''), style: '--x:36px;--w:88px;--t:-4deg', 'aria-hidden': 'true' }),
        el('h2', { id: titleId, text: v.titre })
      ]);
      (v.criteres || []).forEach(function (c) {
        var pts = el('div', { class: 'points', role: 'group', 'aria-label': c.label });
        groups[c.id] = [];
        for (var n = 0; n <= max; n++) {
          (function (n) {
            var b = el('button', {
              type: 'button', class: 'pt', 'aria-pressed': 'false',
              'aria-label': c.label + ' : ' + n + ' sur ' + max, text: String(n)
            });
            b.addEventListener('click', function () { notes[c.id] = n; update(); });
            groups[c.id].push(b);
            pts.appendChild(b);
          })(n);
        }
        section.appendChild(el('div', { class: 'crit' }, [
          el('div', { class: 'crit-text' }, [
            el('p', { class: 'crit-label', text: c.label }),
            c.aide ? el('p', { class: 'crit-hint', text: c.aide }) : null
          ]),
          pts
        ]));
      });
      box.appendChild(section);
    });

    var seuils = (cfg.seuils || []).slice().sort(function (a, b) { return a.min - b.min; });

    function update() {
      var total = 0;
      var rated = 0;
      criteria.forEach(function (c) {
        var cur = notes[c.id];
        groups[c.id].forEach(function (b, i) { b.setAttribute('aria-pressed', cur === i ? 'true' : 'false'); });
        if (cur !== undefined) { total += cur; rated += 1; }
      });
      var ratio = maxTotal ? total / maxTotal : 0;
      q('[data-total]').textContent = total;
      q('[data-max]').textContent = maxTotal;
      q('[data-barre]').style.width = Math.round(ratio * 100) + '%';
      q('[data-rated]').textContent = rated + ' critère' + (rated > 1 ? 's' : '') + ' noté' + (rated > 1 ? 's' : '') + ' sur ' + nb;

      var verdict = 'Continuez…';
      var conseil = 'Notez les ' + (WORDS[nb] || nb) + ' critères pour obtenir un commentaire.';
      if (rated === nb && nb > 0) {
        var s = null;
        seuils.forEach(function (x) { if (x.min <= ratio) s = x; });
        if (s) { verdict = s.titre; conseil = s.conseil; }
      }
      q('[data-verdict]').textContent = verdict;
      q('[data-conseil]').textContent = conseil;
    }

    q('[data-reset]').addEventListener('click', function () { notes = {}; update(); });
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
