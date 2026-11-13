/* =========================================================
   souligner.js · activités où l'apprenant souligne dans un texte
   ---------------------------------------------------------
   Ajoute deux types au registre de activites.js :
   - "vf-preuve"  : vrai ou faux, avec le document affiché à côté ;
                    l'apprenant souligne la phrase qui justifie sa réponse ;
   - "connecteur" : l'apprenant souligne le connecteur d'une phrase,
                    puis propose un mot de même sens.
   À charger après activites.js (defer).
   ========================================================= */
(function () {
  'use strict';

  var FOU = window.FOU;
  if (!FOU) return;
  var el = FOU.el;
  var norm = FOU.norm;
  var pop = FOU.pop;
  var setPressed = FOU.setPressed;

  // Découpe un paragraphe en phrases (fin de phrase suivie d'une majuscule).
  var SPLIT = /(?<=[.!?…])\s+(?=[«"A-ZÀ-ÖØ-Ý0-9])/;
  function sentencesOf(text) { return String(text).split(SPLIT).filter(Boolean); }

  // Sans ponctuation, pour comparer des mots soulignés.
  function bare(x) { return norm(x).replace(/[«»"“”.,;:!?()]/g, '').replace(/\s+/g, ' ').trim(); }

  /* ---------- Texte cliquable, phrase par phrase ---------- */

  function buildPanel(doc, onPick) {
    var sentences = [];
    var n = 0;
    var panel = el('div', { class: 'souligner-texte', role: 'region', 'aria-label': 'Texte à souligner : ' + (doc.titre || 'document') });
    panel.appendChild(el('p', { class: 'label', text: (doc.titre || 'Document') + ' · cliquez sur une phrase pour la souligner' }));

    // Un <button> ne peut pas couler dans le texte (il passe à la ligne) :
    // on utilise un span role="button", activable à la souris et au clavier.
    function phrase(text, par) {
      var b = el('span', { class: 'phrase', role: 'button', tabindex: '0', 'aria-pressed': 'false' }, [text]);
      var rec = { text: text, par: par, btn: b };
      b.addEventListener('click', function () { onPick(rec); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(rec); }
      });
      sentences.push(rec);
      return b;
    }

    (doc.paragraphes || []).forEach(function (p) {
      if (typeof p === 'string') {
        n += 1;
        var para = el('p', { class: 'para' }, [el('span', { class: 'para-num', text: '§' + n })]);
        sentencesOf(p).forEach(function (s, k) {
          if (k) para.appendChild(document.createTextNode(' '));
          para.appendChild(phrase(s, n));
        });
        panel.appendChild(para);
      } else if (p.liste) {
        panel.appendChild(el('ul', { class: 'doc-list' }, p.liste.map(function (li) { return el('li', {}, [phrase(li, n)]); })));
      } else if (p.titre || p.sousTitre) {
        panel.appendChild(el('p', { class: 'souligner-inter', text: p.titre || p.sousTitre }));
      }
    });
    return { el: panel, sentences: sentences };
  }

  /* ---------- Vrai ou faux + phrase soulignée ---------- */

  FOU.types['vf-preuve'] = function (a, ctx) {
    var doc = (ctx.data && ctx.data.document) || { paragraphes: [] };
    var active = 0;
    var rows = [];
    var panel = buildPanel(doc, function (rec) {
      var r = rows[active];
      if (!r) return;
      r.proof = r.proof === rec ? null : rec;
      refresh();
      ctx.changed();
    });

    var list = el('div', { class: 'items souligner-items' });
    (a.items || []).forEach(function (it, i) {
      var row = { it: it, value: null, proof: null };
      // "preuve" : un extrait (ou une liste d'extraits) de la ou des phrases acceptées.
      var clues = [].concat(it.preuve || []).map(norm);
      row.accepted = panel.sentences.filter(function (s) {
        return clues.some(function (c) { return norm(s.text).indexOf(c) !== -1; });
      });
      row.expected = row.accepted[0] || null;

      var pair = el('div', { class: 'pair', role: 'group', 'aria-label': it.t });
      var vfButtons = [true, false].map(function (val, k) {
        var b = el('button', { type: 'button', class: 'opt opt--vf', 'aria-pressed': 'false', text: val ? 'Vrai' : 'Faux' });
        b.addEventListener('click', function () { row.value = val; setPressed(vfButtons, k); ctx.changed(); });
        pair.appendChild(b);
        return b;
      });
      row.markBtn = el('button', { type: 'button', class: 'opt opt--mark', 'aria-pressed': 'false' }, [
        el('span', { class: 'mark-num', text: String(i + 1) }), 'Souligner la preuve'
      ]);
      row.markBtn.addEventListener('click', function () { active = i; refresh(); });
      row.proofLine = el('p', { class: 'proof-line' });
      row.fb = el('div');
      row.el = el('div', { class: 'item' }, [
        el('p', { class: 'item-text' }, [el('span', { class: 'mark-num', text: String(i + 1) }), it.t]),
        el('div', { class: 'item-row', style: 'margin-top:10px' }, [pair, row.markBtn]),
        row.proofLine,
        row.fb
      ]);
      list.appendChild(row.el);
      rows.push(row);
    });

    function refresh() {
      rows.forEach(function (r, i) {
        r.markBtn.setAttribute('aria-pressed', i === active ? 'true' : 'false');
        r.el.classList.toggle('is-active', i === active);
        r.proofLine.textContent = r.proof
          ? 'Phrase soulignée (§' + r.proof.par + ') : « ' + r.proof.text + ' »'
          : (i === active ? 'Cliquez dans le texte sur la phrase qui le montre.' : 'Aucune phrase soulignée.');
      });
      panel.sentences.forEach(function (s) {
        var tags = [];
        rows.forEach(function (r, i) { if (r.proof === s) tags.push(i + 1); });
        if (tags.length) s.btn.setAttribute('data-tag', tags.join(','));
        else s.btn.removeAttribute('data-tag');
        s.btn.classList.toggle('is-marked', tags.length > 0);
        s.btn.setAttribute('aria-pressed', rows[active] && rows[active].proof === s ? 'true' : 'false');
      });
    }
    refresh();

    return {
      el: el('div', { class: 'souligner-layout' }, [panel.el, list]),
      check: function () {
        var answered = rows.filter(function (r) { return r.value !== null || r.proof; }).length;
        if (!answered) return { message: 'Répondez vrai ou faux, puis soulignez la phrase qui le montre.' };
        var good = 0;
        rows.forEach(function (r) {
          var vfOk = r.value === r.it.a;
          var proofOk = !!r.proof && r.accepted.indexOf(r.proof) !== -1;
          if (vfOk) good += 1;
          if (proofOk) good += 1;
          if (r.proof) r.proof.btn.classList.add(proofOk ? 'is-ok' : 'is-ko');
          if (!proofOk && r.expected) r.expected.btn.classList.add('is-expected');
          var p = el('p', { class: 'item-fb' }, [
            el('strong', { class: vfOk ? 'verdict--ok' : 'verdict--ko', text: r.value === null ? 'Vrai ou faux : sans réponse.' : (vfOk ? 'Vrai ou faux : juste.' : 'Vrai ou faux : non.') }),
            ' ',
            el('strong', { class: proofOk ? 'verdict--ok' : 'verdict--ko', text: proofOk ? 'Phrase : juste.' : 'Phrase attendue :' }),
            proofOk ? null : ' « ' + (r.expected ? r.expected.text : '?') + ' »',
            r.it.fb ? el('span', { class: 'fb-extra', text: ' ' + r.it.fb }) : null
          ]);
          r.fb.appendChild(p);
          pop(p);
        });
        return { score: { good: good, total: rows.length * 2 } };
      },
      clear: function () {
        rows.forEach(function (r) { r.fb.textContent = ''; });
        panel.sentences.forEach(function (s) { s.btn.classList.remove('is-ok', 'is-ko', 'is-expected'); });
      }
    };
  };

  /* ---------- Souligner le connecteur, puis le remplacer ---------- */

  FOU.types.connecteur = function (a, ctx) {
    var tokens = String(a.phrase || '').split(/\s+/).filter(Boolean);
    var selected = tokens.map(function () { return false; });
    var line = el('p', { class: 'connecteur-phrase', role: 'group', 'aria-label': 'Mots de la phrase : cliquez pour souligner' });
    var buttons = tokens.map(function (t, i) {
      var b = el('button', { type: 'button', class: 'mot', 'aria-pressed': 'false', text: t });
      b.addEventListener('click', function () {
        selected[i] = !selected[i];
        b.setAttribute('aria-pressed', selected[i] ? 'true' : 'false');
        ctx.changed();
      });
      if (i) line.appendChild(document.createTextNode(' '));
      line.appendChild(b);
      return b;
    });

    var inputId = FOU.nextId('remplace');
    var input = el('input', { id: inputId, type: 'text', class: 'fill-input', autocomplete: 'off', spellcheck: 'false' });
    input.addEventListener('input', function () { ctx.changed(); });
    var mark1 = el('span');
    var mark2 = el('span');

    var prod = a.production || null;
    var areaId = FOU.nextId('production');
    var area = prod ? el('textarea', { id: areaId, class: 'free-text', rows: '3' }) : null;
    var model = el('div');

    var body = el('div', { class: 'items' }, [
      el('div', { class: 'item' }, [
        el('p', { class: 'step-label', text: '1. Soulignez le connecteur logique : cliquez sur le ou les mots.' }),
        line,
        mark1
      ]),
      el('div', { class: 'item' }, [
        el('label', { class: 'step-label', for: inputId, text: '2. Remplacez-le par un mot ou une expression de même sens.' }),
        el('div', { class: 'fill-cell' }, [input, mark2])
      ]),
      prod ? el('div', { class: 'item' }, [
        el('label', { class: 'step-label', for: areaId, text: '3. ' + prod.consigne }),
        area,
        model
      ]) : null
    ]);

    return {
      el: body,
      check: function () {
        var chosen = tokens.filter(function (t, i) { return selected[i]; }).join(' ');
        if (!chosen && !input.value.trim()) return { message: 'Commencez par souligner le connecteur dans la phrase.' };
        var target = bare(a.connecteur);
        var markOk = bare(chosen) === target;
        var rep = bare(input.value);
        var repOk = rep !== '' && rep !== target && (a.remplacements || []).some(function (x) { return rep.indexOf(bare(x)) !== -1; });

        buttons.forEach(function (b, i) {
          if (selected[i]) b.classList.add(markOk ? 'is-ok' : 'is-ko');
          else if (!markOk && target.split(' ').indexOf(bare(tokens[i])) !== -1) b.classList.add('is-expected');
        });
        mark1.appendChild(FOU.verdictSpan(markOk, 'le connecteur est « ' + a.connecteur + ' »'));
        input.classList.add(repOk ? 'is-ok' : 'is-ko');
        mark2.appendChild(FOU.verdictSpan(repOk, a.attendu || (a.remplacements || [''])[0]));
        if (prod && prod.proposition) {
          var p = el('p', { class: 'model-answer' }, [el('strong', { text: 'Exemple : ' }), prod.proposition]);
          model.appendChild(p);
          pop(p);
        }
        var good = (markOk ? 1 : 0) + (repOk ? 1 : 0);
        var res = { score: { good: good, total: 2 } };
        if (a.feedback) res.feedback = { ok: good === 2, tag: good === 2 ? 'Bien vu !' : 'À revoir.', text: a.feedback };
        return res;
      },
      clear: function () {
        buttons.forEach(function (b) { b.classList.remove('is-ok', 'is-ko', 'is-expected'); });
        input.classList.remove('is-ok', 'is-ko');
        mark1.textContent = '';
        mark2.textContent = '';
        model.textContent = '';
      }
    };
  };
})();
