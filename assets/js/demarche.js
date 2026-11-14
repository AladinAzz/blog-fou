/* =========================================================
   demarche.js · types d'activités de l'étape « Démarche »
   ---------------------------------------------------------
   S'ajoute au registre de activites.js (window.FOU.types) :
   - lacunaire     : un texte avec des trous à choisir dans une liste ;
   - confrontation : un tableau à remplir, puis une proposition ;
   - plan          : un brouillon de plan enregistré dans le navigateur.
   ========================================================= */
(function () {
  'use strict';

  var FOU = window.FOU;
  if (!FOU) return;
  var el = FOU.el;
  var norm = FOU.norm;
  var pop = FOU.pop;
  var nextId = FOU.nextId;

  function readStore(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }

  /* ---------- Texte lacunaire ---------- */

  FOU.types.lacunaire = function (a, ctx) {
    var parts = String(a.texte || '').split(/\[([^\]]+)\]/);
    var answers = parts.filter(function (_, i) { return i % 2 === 1; });
    var bank = answers.concat(a.distracteurs || []).slice().sort(function (x, y) { return x.localeCompare(y, 'fr'); });
    var gaps = [];
    var para = el('p', { class: 'lacunaire' });
    parts.forEach(function (chunk, i) {
      if (i % 2 === 0) { para.appendChild(document.createTextNode(chunk)); return; }
      var select = el('select', { class: 'lac-select', 'aria-label': 'Trou ' + (gaps.length + 1) },
        [el('option', { value: '', text: '……' })].concat(bank.map(function (w) { return el('option', { value: w, text: w }); })));
      select.addEventListener('change', function () { ctx.changed(); });
      gaps.push({ select: select, answer: chunk });
      para.appendChild(select);
    });
    return {
      el: el('div', {}, [el('p', { class: 'word-bank', text: 'Mots à placer : ' + bank.join(' · ') }), para]),
      check: function () {
        var filled = gaps.filter(function (g) { return g.select.value !== ''; }).length;
        if (!filled) return { message: 'Choisis d’abord au moins un mot.' };
        var good = 0;
        gaps.forEach(function (g) {
          var ok = norm(g.select.value) === norm(g.answer);
          if (ok) good += 1;
          g.select.classList.add(ok ? 'is-ok' : 'is-ko');
        });
        var res = { score: { good: good, total: gaps.length } };
        if (good === gaps.length && a.feedbackOk) res.feedback = { ok: true, text: a.feedbackOk };
        return res;
      },
      clear: function () { gaps.forEach(function (g) { g.select.classList.remove('is-ok', 'is-ko'); }); }
    };
  };

  /* ---------- Tableau de confrontation ---------- */

  var HEADS = ['Axe', 'Document 1', 'Document 2', 'Mise en relation'];

  function headRow() {
    return el('thead', {}, [el('tr', {}, HEADS.map(function (h) { return el('th', { scope: 'col', text: h }); }))]);
  }

  function modelTable(rows) {
    var tbody = el('tbody', {}, rows.map(function (r) {
      return el('tr', {}, [
        el('th', { scope: 'row', text: r.axe }),
        el('td', { text: r.doc1 }),
        el('td', { text: r.doc2 }),
        el('td', {}, [el('span', { class: 'rel', text: r.rel })])
      ]);
    }));
    return el('div', { class: 'table-wrap confront model-table' }, [
      el('table', {}, [el('caption', { class: 'visually-hidden', text: 'Proposition de tableau de confrontation' }), headRow(), tbody])
    ]);
  }

  FOU.types.confrontation = function (a, ctx) {
    var relations = a.relations || [];
    var n = Number(a.lignes) || 3;
    var tbody = el('tbody');
    for (var i = 0; i < n; i++) {
      var k = 'Axe ' + (i + 1);
      var axe = el('input', { type: 'text', class: 'fill-input', 'aria-label': k, placeholder: k });
      var d1 = el('textarea', { class: 'fill-input', 'aria-label': k + ', idée du document 1' });
      var d2 = el('textarea', { class: 'fill-input', 'aria-label': k + ', idée du document 2' });
      var rel = el('select', { 'aria-label': k + ', mise en relation' },
        [el('option', { value: '', text: '— relation —' })].concat(relations.map(function (r) { return el('option', { value: r, text: r }); })));
      [axe, d1, d2, rel].forEach(function (f) { f.addEventListener('input', function () { ctx.changed(); }); });
      tbody.appendChild(el('tr', {}, [el('td', {}, [axe]), el('td', {}, [d1]), el('td', {}, [d2]), el('td', {}, [rel])]));
    }
    var answer = el('div');
    return {
      el: el('div', {}, [
        el('div', { class: 'table-wrap confront confront-edit' }, [el('table', {}, [headRow(), tbody])]),
        answer
      ]),
      check: function () {
        answer.appendChild(el('p', { class: 'field-label', style: 'margin-top:24px', text: 'Une proposition possible' }));
        var t = modelTable(a.modele || []);
        answer.appendChild(t);
        pop(t);
        return { feedback: { ok: true, tag: 'À toi de juger.', text: a.feedback || '' } };
      },
      clear: function () { answer.textContent = ''; }
    };
  };
  FOU.types.confrontation.buttonLabel = 'Voir une proposition';

  /* ---------- Brouillon de plan ---------- */

  FOU.types.plan = function (a, ctx) {
    var key = a.stockage || 'acadecrit-plan';
    var saved = readStore(key) || [];
    var status = el('span', { class: 'plan-saved', role: 'status' });
    var timer = null;
    var fields = (a.champs || []).map(function (c, i) {
      var id = nextId('plan');
      var area = el('textarea', { id: id, class: 'free-text', rows: '2', placeholder: c.aide || '' });
      area.value = saved[i] || '';
      area.addEventListener('input', function () {
        ctx.changed();
        clearTimeout(timer);
        timer = setTimeout(function () {
          var data = fields.map(function (f) { return f.area.value; });
          status.textContent = writeStore(key, data) ? 'Brouillon enregistré dans ce navigateur.' : '';
        }, 400);
      });
      return { label: c.label, area: area, node: el('div', {}, [el('label', { class: 'field-label', for: id, text: c.label }), area]) };
    });

    var copy = el('button', { type: 'button', class: 'btn btn--ghost', text: 'Copier mon plan' });
    copy.addEventListener('click', function () {
      var txt = fields.map(function (f) { return f.label + ' : ' + f.area.value.trim(); }).join('\n');
      var fail = function () { status.textContent = 'Copie impossible : sélectionne le texte à la main.'; };
      if (!navigator.clipboard || !navigator.clipboard.writeText) { fail(); return; }
      navigator.clipboard.writeText(txt).then(function () { status.textContent = 'Plan copié. Colle-le dans ton document.'; }, fail);
    });

    var answer = el('div');
    return {
      el: el('div', {}, [
        el('div', { class: 'plan-fields' }, fields.map(function (f) { return f.node; })),
        el('div', { class: 'actions-row', style: 'margin-top:16px' }, [copy, status]),
        answer
      ]),
      check: function () {
        var box = el('div', { class: 'model-answer' }, [
          el('strong', { text: 'Exemple de structure : ' }),
          el('ul', { style: 'margin:8px 0 0;padding-left:20px' }, (a.exemple || []).map(function (x) { return el('li', { text: x }); }))
        ]);
        answer.appendChild(box);
        pop(box);
        return { feedback: { ok: true, tag: 'Compare.', text: a.feedback || '' } };
      },
      clear: function () { answer.textContent = ''; }
    };
  };
  FOU.types.plan.buttonLabel = 'Voir un exemple de plan';
})();
