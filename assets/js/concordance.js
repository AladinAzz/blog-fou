/* =========================================================
   concordance.js · sélecteur d'expression + table KWIC
   ---------------------------------------------------------
   Lit le JSON indiqué par <div class="concordance" data-src>
   et remplit :
   - la concordance (clé "nodes") ;
   - [data-repere]  (clé "repere") ;
   - [data-retenir] (clé "retenir").
   Dépend de activites.js (window.FOU) chargé avant lui.
   ========================================================= */
(function () {
  'use strict';

  function init() {
    var FOU = window.FOU;
    if (!FOU) return;
    var el = FOU.el;

    document.querySelectorAll('.concordance[data-src]').forEach(function (box) {
      FOU.load(box.getAttribute('data-src')).then(function (data) {
        renderKwic(box, data.nodes || [], el);

        var repere = document.querySelector('[data-repere]');
        if (repere) repere.textContent = data.repere || '';

        var retenir = document.querySelector('[data-retenir]');
        if (retenir) {
          retenir.textContent = '';
          (data.retenir || []).forEach(function (r) { retenir.appendChild(el('li', { text: r })); });
        }
      }).catch(function (err) {
        box.textContent = '';
        box.appendChild(FOU.errorBox(err));
      });
    });
  }

  function renderKwic(box, nodes, el) {
    box.textContent = '';
    if (!nodes.length) return;

    var group = el('div', { class: 'nodes', role: 'group', 'aria-label': 'Choisir une expression' });
    var count = el('span');
    var tbody = el('tbody');
    var table = el('table', { class: 'kwic' }, [
      el('caption', { class: 'visually-hidden', text: 'Lignes de concordance pour l’expression choisie' }),
      tbody
    ]);
    var buttons = nodes.map(function (n, i) {
      var b = el('button', { type: 'button', class: 'node', 'aria-pressed': 'false', text: '« ' + n.label + ' »' });
      b.addEventListener('click', function () { show(i); });
      group.appendChild(b);
      return b;
    });

    function show(index) {
      var node = nodes[index];
      buttons.forEach(function (b, i) { b.setAttribute('aria-pressed', i === index ? 'true' : 'false'); });
      tbody.textContent = '';
      (node.lines || []).forEach(function (line, i) {
        var tr = el('tr', { class: 'slide', style: 'animation-delay:' + (i * 50) + 'ms' }, [
          el('td', { class: 'l', text: line[0] || '' }),
          el('td', { class: 'k', text: line[1] || node.label }),
          el('td', { class: 'r', text: line[2] || '' })
        ]);
        tbody.appendChild(tr);
      });
      var n = (node.lines || []).length;
      count.textContent = 'concordance · ' + n + ' ligne' + (n > 1 ? 's' : '');
    }

    box.appendChild(group);
    box.appendChild(el('div', { class: 'kwic-box' }, [
      el('div', { class: 'kwic-head' }, [
        el('span', { role: 'status' }, [count]),
        el('span', { text: 'corpus : mémoires + rapports de stage' })
      ]),
      el('div', { class: 'kwic-scroll' }, [table])
    ]));
    show(0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
