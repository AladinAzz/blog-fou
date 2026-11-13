/* =========================================================
   activites.js · moteur de rendu des activités interactives
   ---------------------------------------------------------
   Chaque conteneur <div class="activites" data-src="...json">
   reçoit les activités décrites dans le tableau "activities"
   du fichier JSON. Un registre associe chaque "type" à une
   fonction de rendu : pour ajouter un type, on ajoute une
   entrée dans TYPES, sans toucher au reste.

   Le même script affiche aussi, s'il les trouve dans la page :
   - [data-document] : le document (clé "document" du JSON) ;
   - [data-pendant]  : les questions « Pendant la lecture ».
   ========================================================= */
(function () {
  'use strict';

  var LETTERS = 'ABCDEFGHIJ';
  var KINDS = {
    qcm: 'QCM',
    vf: 'VRAI OU FAUX',
    tableau: 'TABLEAU À COMPLÉTER',
    appariement: 'APPARIEMENT',
    trous: 'TEXTE À TROUS',
    reformulation: 'REFORMULATION'
  };
  var uid = 0;

  /* ---------- Outils ---------- */

  var cache = {};
  function load(src) {
    if (!cache[src]) {
      cache[src] = fetch(src).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' sur ' + src);
        return r.json();
      });
    }
    return cache[src];
  }

  // Crée un élément : el('p', { class: 'x', text: '…' }, [enfants])
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') node.textContent = v;
      else if (k === 'class') node.className = v;
      else node.setAttribute(k, v);
    });
    (children || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function nextId(prefix) { uid += 1; return prefix + '-' + uid; }

  // Minuscules, sans accents, espaces réduits.
  function norm(x) {
    return String(x === null || x === undefined ? '' : x)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[’']/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Relance l'animation « pop » sur un élément.
  function pop(node) {
    node.classList.remove('pop');
    void node.offsetWidth;
    node.classList.add('pop');
  }

  function setPressed(buttons, index) {
    buttons.forEach(function (b, i) { b.setAttribute('aria-pressed', i === index ? 'true' : 'false'); });
  }

  function verdictSpan(ok, expected) {
    return el('span', {
      class: 'verdict ' + (ok ? 'verdict--ok' : 'verdict--ko'),
      text: ok ? 'juste' : '→ ' + expected
    });
  }

  // Groupe de pastilles (une seule sélection). onPick(index).
  // useLetters : la pastille affiche A, B, C… (texte complet en aria-label).
  function pillGroup(options, label, className, onPick, useLetters) {
    var group = el('div', { class: 'pills', role: 'group', 'aria-label': label });
    var buttons = options.map(function (op, i) {
      var b = el('button', {
        type: 'button', class: 'opt ' + className + (useLetters ? ' opt--letter' : ''), 'aria-pressed': 'false',
        text: useLetters ? LETTERS.charAt(i) : op,
        'aria-label': useLetters ? LETTERS.charAt(i) + ' : ' + op : null
      });
      b.addEventListener('click', function () { setPressed(buttons, i); onPick(i); });
      group.appendChild(b);
      return b;
    });
    return { el: group, buttons: buttons };
  }

  /* ---------- Types d'activités ----------
     Chaque fonction reçoit (activité, ctx) et renvoie :
       el    : le corps de l'activité ;
       check : fonction qui marque les réponses et renvoie
               { score: {good, total} } ou { feedback: {ok, text} }
               ou { message: '…' } ;
       clear : efface les marques de vérification.
     ctx.changed() doit être appelé à chaque modification de réponse. */

  var TYPES = {};

  TYPES.qcm = function (a, ctx) {
    var cur = null;
    var group = el('div', { class: 'choices', role: 'group', 'aria-label': a.titre });
    var buttons = (a.choix || []).map(function (t, i) {
      var b = el('button', { type: 'button', class: 'opt opt--choice', 'aria-pressed': 'false' },
        [el('span', { class: 'letter', text: LETTERS.charAt(i) }), el('span', { text: t })]);
      b.addEventListener('click', function () { cur = i; setPressed(buttons, i); ctx.changed(); });
      group.appendChild(b);
      return b;
    });
    return {
      el: group,
      check: function () {
        if (cur === null) return { message: "Choisissez d'abord une réponse." };
        var ok = cur === a.reponse;
        buttons[cur].classList.add(ok ? 'is-ok' : 'is-ko');
        return { feedback: { ok: ok, text: ok ? a.feedbackOk : a.feedbackKo } };
      },
      clear: function () { buttons.forEach(function (b) { b.classList.remove('is-ok', 'is-ko'); }); }
    };
  };

  TYPES.vf = function (a, ctx) {
    var list = el('div', { class: 'items' });
    var rows = (a.items || []).map(function (it) {
      var row = { value: null, it: it };
      var text = el('p', { class: 'item-text', text: it.t });
      var pair = el('div', { class: 'pair', role: 'group', 'aria-label': it.t });
      var buttons = [true, false].map(function (val, i) {
        var b = el('button', { type: 'button', class: 'opt opt--vf', 'aria-pressed': 'false', text: val ? 'Vrai' : 'Faux' });
        b.addEventListener('click', function () { row.value = val; setPressed(buttons, i); ctx.changed(); });
        pair.appendChild(b);
        return b;
      });
      row.fb = el('div');
      row.el = el('div', { class: 'item' }, [el('div', { class: 'item-row' }, [text, pair]), row.fb]);
      list.appendChild(row.el);
      return row;
    });
    return {
      el: list,
      check: function () {
        var good = 0;
        rows.forEach(function (r) {
          if (r.value === null) return;
          var ok = r.value === r.it.a;
          if (ok) good += 1;
          var p = el('p', { class: 'item-fb ' + (ok ? 'verdict--ok' : 'verdict--ko') },
            [el('strong', { text: ok ? 'Juste.' : 'Non.' }), ' ' + (r.it.fb || '')]);
          r.fb.appendChild(p);
          pop(p);
        });
        var answered = rows.filter(function (r) { return r.value !== null; }).length;
        if (answered === 0) return { message: "Répondez d'abord à au moins une affirmation." };
        return { score: { good: good, total: rows.length } };
      },
      clear: function () { rows.forEach(function (r) { r.fb.textContent = ''; }); }
    };
  };

  TYPES.tableau = function (a, ctx) {
    var tbody = el('tbody');
    var rows = (a.lignes || []).map(function (l) {
      var id = nextId('case');
      var input = el('input', { id: id, type: 'text', class: 'fill-input', autocomplete: 'off', spellcheck: 'false' });
      input.addEventListener('input', function () { ctx.changed(); });
      var mark = el('span');
      tbody.appendChild(el('tr', {}, [
        el('th', { scope: 'row' }, [el('label', { for: id, text: l.label })]),
        el('td', {}, [el('div', { class: 'fill-cell' }, [input, mark])])
      ]));
      return { l: l, input: input, mark: mark };
    });
    var caption = el('caption', { class: 'visually-hidden', text: a.titre });
    var table = el('table', { class: 'fill-table' }, [caption, tbody]);
    return {
      el: el('div', { class: 'table-wrap' }, [table]),
      check: function () {
        var good = 0;
        rows.forEach(function (r) {
          var v = norm(r.input.value);
          var ok = v !== '' && (r.l.accepte || []).some(function (x) { return v.indexOf(norm(x)) !== -1; });
          if (ok) good += 1;
          r.input.classList.add(ok ? 'is-ok' : 'is-ko');
          var expected = r.l.attendu || ((r.l.accepte || [''])[0] + '…');
          r.mark.appendChild(verdictSpan(ok, expected));
        });
        return { score: { good: good, total: rows.length } };
      },
      clear: function () {
        rows.forEach(function (r) { r.input.classList.remove('is-ok', 'is-ko'); r.mark.textContent = ''; });
      }
    };
  };

  TYPES.appariement = function (a, ctx) {
    var options = a.options || [];
    var longLabels = (a.gauche || []).some(function (g) { return String(g.t).length > 24; });
    // Options longues : légende lettrée affichée une fois, pastilles A, B, C… sur chaque ligne.
    var useLetters = options.some(function (o) { return String(o).length > 40; });
    var list = el('div', { class: 'items' + (longLabels ? ' match-stack' : '') });
    var wrapper = el('div', {}, [
      useLetters ? el('ol', { class: 'option-legend' }, options.map(function (o, i) {
        return el('li', {}, [el('span', { class: 'letter', text: LETTERS.charAt(i) }), el('span', { text: o })]);
      })) : null,
      list
    ]);
    var expectedLabel = function (answer) {
      var i = options.indexOf(answer);
      return useLetters && i >= 0 ? LETTERS.charAt(i) + ' · ' + answer : answer;
    };
    var rows = (a.gauche || []).map(function (g) {
      var row = { g: g, value: null };
      var group = pillGroup(options, 'Réponse pour : ' + g.t, 'opt--pill', function (i) { row.value = options[i]; ctx.changed(); }, useLetters);
      row.mark = el('span');
      row.fb = el('div');
      row.buttons = group.buttons;
      row.el = el('div', { class: 'item' }, [
        el('div', { class: 'match-row' }, [
          el('span', { class: 'match-label' + (longLabels ? ' match-label--long' : ''), text: g.t }),
          el('span', { class: 'match-arrow', 'aria-hidden': 'true', text: '→' }),
          group.el,
          row.mark
        ]),
        row.fb
      ]);
      list.appendChild(row.el);
      return row;
    });
    return {
      el: wrapper,
      check: function () {
        var good = 0;
        rows.forEach(function (r) {
          var ok = r.value === r.g.a;
          if (ok) good += 1;
          r.buttons.forEach(function (b) {
            if (b.getAttribute('aria-pressed') === 'true') b.classList.add(ok ? 'is-ok' : 'is-ko');
          });
          r.mark.appendChild(verdictSpan(ok, expectedLabel(r.g.a)));
          if (r.g.fb) r.fb.appendChild(el('p', { class: 'item-fb', text: r.g.fb }));
        });
        return { score: { good: good, total: rows.length } };
      },
      clear: function () {
        rows.forEach(function (r) {
          r.mark.textContent = '';
          r.fb.textContent = '';
          r.buttons.forEach(function (b) { b.classList.remove('is-ok', 'is-ko'); });
        });
      }
    };
  };

  TYPES.trous = function (a, ctx) {
    var options = a.options || [];
    var list = el('div', { class: 'items' });
    var rows = (a.phrases || []).map(function (ph, i) {
      var row = { ph: ph, value: null };
      var avant = ph.avant || '';
      var apres = ph.apres || '';
      row.gap = el('span', { class: 'gap', text: '………' });
      row.mark = el('span');
      // Pas d'espace après une apostrophe, ni avant une ponctuation basse.
      var before = avant ? avant + (/['’]$/.test(avant) ? '' : ' ') : '';
      var after = apres ? (/^[,.)]/.test(apres) ? '' : ' ') + apres : '';
      var sentence = el('p', { class: 'gap-sentence' }, [before, row.gap, after, ' ', row.mark]);
      var label = 'Trou ' + (i + 1) + ' : ' + (avant + ' … ' + apres).trim();
      var group = pillGroup(options, label, 'opt--pill opt--mono', function (k) {
        row.value = options[k];
        row.gap.textContent = options[k];
        ctx.changed();
      });
      row.buttons = group.buttons;
      list.appendChild(el('div', { class: 'item' }, [sentence, group.el]));
      return row;
    });
    return {
      el: list,
      check: function () {
        var good = 0;
        rows.forEach(function (r) {
          var ok = r.value === r.ph.a;
          if (ok) good += 1;
          r.gap.classList.add(ok ? 'is-ok' : 'is-ko');
          r.mark.appendChild(verdictSpan(ok, r.ph.a));
        });
        return { score: { good: good, total: rows.length } };
      },
      clear: function () {
        rows.forEach(function (r) { r.gap.classList.remove('is-ok', 'is-ko'); r.mark.textContent = ''; });
      }
    };
  };

  // Production libre : l'apprenant compare avec une proposition (pas de score).
  TYPES.reformulation = function (a, ctx) {
    var list = el('div', { class: 'items' });
    var rows = (a.items || []).map(function (it, i) {
      var id = nextId('reform');
      var area = el('textarea', { id: id, class: 'free-text', rows: '3' });
      area.addEventListener('input', function () { ctx.changed(); });
      var answer = el('div');
      list.appendChild(el('div', { class: 'item' }, [
        el('p', { class: 'quote', text: it.t }),
        el('label', { class: 'field-label', for: id, text: 'Votre reformulation ' + (i + 1) }),
        area,
        answer
      ]));
      return { it: it, area: area, answer: answer };
    });
    return {
      el: list,
      check: function () {
        rows.forEach(function (r) {
          var p = el('p', { class: 'model-answer' }, [el('strong', { text: 'Proposition : ' }), r.it.proposition || '']);
          r.answer.appendChild(p);
          pop(p);
        });
        return { feedback: { ok: true, tag: 'À vous de juger.', text: a.feedback || "Comparez : le sens est-il le même ? Avez-vous évité de reprendre les mots du texte ?" } };
      },
      clear: function () { rows.forEach(function (r) { r.answer.textContent = ''; }); }
    };
  };
  TYPES.reformulation.buttonLabel = 'Voir une proposition';

  /* ---------- Carte d'activité ---------- */

  function renderActivity(a, index) {
    var type = TYPES[a.type];
    var alt = index % 2 === 1;
    if (!type) {
      return el('p', { class: 'load-error', text: 'Type d’activité inconnu : « ' + a.type + ' ».' });
    }
    var titleId = nextId('act');
    var verified = false;
    var status = el('div', { role: 'status' });
    var score = el('span', { class: 'score', role: 'status' });

    var ctx = {
      changed: function () {
        if (!verified) return;
        verified = false;
        widget.clear();
        status.textContent = '';
        score.textContent = '';
      }
    };
    var widget = type(a, ctx);

    var button = el('button', { type: 'button', class: 'btn', text: type.buttonLabel || 'Vérifier' });
    button.addEventListener('click', function () {
      widget.clear();
      status.textContent = '';
      score.textContent = '';
      var res = widget.check() || {};
      if (res.message) {
        status.appendChild(el('p', { class: 'hint-msg', text: res.message }));
        return;
      }
      verified = true;
      if (res.feedback) {
        var ok = res.feedback.ok;
        var box = el('div', { class: 'feedback ' + (ok ? 'feedback--ok' : 'feedback--ko') }, [
          el('strong', { class: 'tag', text: res.feedback.tag || (ok ? 'Bien vu !' : 'Pas encore.') }),
          ' ' + (res.feedback.text || '')
        ]);
        status.appendChild(box);
        pop(box);
      }
      if (res.score) {
        var s = res.score;
        score.textContent = s.good + ' / ' + s.total + (s.total > 0 && s.good === s.total ? ' — parfait' : '');
        pop(score);
      }
    });

    var children = [];
    if (a.phase) children.push(el('p', { class: 'kicker', style: 'margin-bottom:12px', text: a.phase }));
    children.push(
      el('span', {
        class: 'tape' + (alt ? ' tape--red' : ''),
        style: '--x:48px;--w:90px;--t:' + (alt ? '4deg' : '-5deg'),
        'aria-hidden': 'true'
      }),
      el('p', { class: 'activite-kind', text: 'ACTIVITÉ ' + (index + 1) + ' · ' + (KINDS[a.type] || a.type.toUpperCase()) }),
      el('h2', { class: 'activite-title', id: titleId, text: a.titre }),
      a.consigne ? el('p', { class: 'activite-consigne', text: a.consigne }) : null,
      widget.el,
      el('div', { class: 'activite-actions' }, [button, score]),
      status
    );
    return el('section', { class: 'activite' + (alt ? ' activite--alt' : ''), 'aria-labelledby': titleId }, children);
  }

  /* ---------- Document et questions de lecture ---------- */

  function renderDocument(slot, doc) {
    var titleNode = slot.querySelector('h2');
    var keep = slot.querySelector('.tape');
    slot.textContent = '';
    if (keep) slot.appendChild(keep);
    if (doc.etiquette) slot.appendChild(el('p', { class: 'label', text: doc.etiquette }));
    var h2 = el('h2', { id: titleNode ? titleNode.id : null, text: doc.titre || 'Document' });
    slot.appendChild(h2);
    var meta = [doc.auteur, doc.source, doc.date].filter(Boolean).join(' · ');
    if (meta) slot.appendChild(el('p', { class: 'meta', text: meta }));
    if (doc.chapo) slot.appendChild(el('p', { class: 'para', style: 'font-weight:700', text: doc.chapo }));

    var paras = doc.paragraphes || [];
    if (!paras.length) {
      slot.appendChild(el('p', { class: 'placeholder-box', text: doc.aRemplacer || 'Texte à intégrer.' }));
      return;
    }
    var n = 0;
    paras.forEach(function (p) {
      if (typeof p === 'string') {
        n += 1;
        slot.appendChild(el('p', { class: 'para' }, [el('span', { class: 'para-num', text: '§' + n }), p]));
      } else if (p.titre) {
        slot.appendChild(el('h3', { class: 'doc-h3', text: p.titre }));
      } else if (p.sousTitre) {
        slot.appendChild(el('h4', { class: 'doc-h4', text: p.sousTitre }));
      } else if (p.liste) {
        slot.appendChild(el('ul', { class: 'doc-list' }, p.liste.map(function (li) { return el('li', { text: li }); })));
      }
    });
  }

  /* ---------- Erreurs de chargement ---------- */

  function errorBox(err) {
    var local = location.protocol === 'file:';
    return el('div', { class: 'load-error', role: 'alert' }, [
      el('strong', { text: 'Les activités n’ont pas pu être chargées. ' }),
      local
        ? 'La page est ouverte directement depuis le disque (file://), ce qui bloque le chargement des fichiers JSON. Lancez un petit serveur à la racine du site, par exemple '
        : 'Rechargez la page. Si le problème continue, vérifiez le fichier de données (' + err.message + ').',
      local ? el('code', { text: 'python3 -m http.server 8000' }) : null,
      local ? ', puis ouvrez http://localhost:8000.' : null
    ]);
  }

  /* ---------- Démarrage ---------- */

  function init() {
    document.querySelectorAll('.activites[data-src]').forEach(function (box) {
      load(box.getAttribute('data-src')).then(function (data) {
        box.textContent = '';
        (data.activities || []).forEach(function (a, i) { box.appendChild(renderActivity(a, i)); });
      }).catch(function (err) {
        box.textContent = '';
        box.appendChild(errorBox(err));
      });
    });

    document.querySelectorAll('[data-document][data-src]').forEach(function (slot) {
      load(slot.getAttribute('data-src')).then(function (data) {
        if (data.document) renderDocument(slot, data.document);
      }).catch(function () {
        var meta = slot.querySelector('.meta');
        if (meta) meta.textContent = 'Le texte n’a pas pu être chargé.';
      });
    });

    document.querySelectorAll('[data-pendant][data-src]').forEach(function (ul) {
      load(ul.getAttribute('data-src')).then(function (data) {
        (data.pendant || []).forEach(function (q) { ul.appendChild(el('li', { text: q })); });
      }).catch(function () { /* le message d'erreur est déjà affiché par les activités */ });
    });
  }

  // API partagée avec concordance.js
  window.FOU = { load: load, el: el, errorBox: errorBox, types: TYPES, renderActivity: renderActivity };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
