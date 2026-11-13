# Passation : Blog FOU « Écrits académiques »

À l'attention de Claude Code. Ce document décrit le site à construire à partir de la maquette validée. Les fichiers `reference/*.dc.html` sont la maquette : ils donnent le texte exact, la mise en page et les données d'exemple de chaque page. Ce ne sont **pas** des fichiers à déployer (format propriétaire de l'outil de maquette) : il faut les traduire en HTML/CSS/JS standard.

---

## 1. Contexte

- Public : étudiants universitaires en formation FOU (Français sur Objectif Universitaire), DUFLEPES, niveau B2 vers C1, formation 100 % en ligne.
- Projet présenté à un jury : le scénario pédagogique compte le plus, mais la démo doit être propre et **toutes les activités doivent fonctionner dans le navigateur**.
- Langue du site : français (`<html lang="fr">`). Les apprenants sont vouvoyés.

## 2. Contraintes techniques (non négociables)

- Site **statique** : HTML, CSS, JavaScript vanilla. Pas de framework, pas de bundler, pas d'étape de build.
- Hébergement **GitHub Pages**. Tous les chemins doivent être **relatifs** (le site sera servi sous `https://<user>.github.io/<repo>/`).
- Ni serveur, ni base de données, ni comptes, ni API externe. Pas de LLM.
- Le contenu des activités est **séparé du code** : un fichier JSON par page d'activités dans `/data/`, et **un seul composant JS par type d'activité**, réutilisé dans les deux rubriques.
- Les JSON sont chargés avec `fetch()`. Attention : `fetch` échoue en `file://`. Pour tester en local : `python3 -m http.server 8000` à la racine. Le noter dans le README.
- Seules ressources externes autorisées : Google Fonts, et le lien sortant vers Scribens (`https://www.scribens.fr/`).

## 3. Arborescence cible

```
/index.html                     accueil                          (ref: Main.dc.html)
/mode-emploi.html               mode d'emploi                    (ref: ModeEmploi.dc.html)
/synthese/
    texte1.html                 étape 1, document 1              (ref: Texte1.dc.html)
    texte2.html                 étape 1, document 2              (ref: Texte2.dc.html)
    demarche.html               étape 2, méthode                 (ref: Demarche.dc.html)
    redaction.html              étape 3, rédaction               (ref: Redaction.dc.html)
    grille.html                 étape 4, auto-évaluation         (ref: Grille.dc.html)
/phraseologie/
    introduction.html                                            (ref: PhraseoIntroduction.dc.html)
    problematique.html                                           (ref: Phraseologie.dc.html)
    hypotheses.html                                              (ref: PhraseoHypotheses.dc.html)
    methodologie.html                                            (ref: PhraseoMethodologie.dc.html)
    conclusion.html                                              (ref: PhraseoConclusion.dc.html)
/assets/css/style.css
/assets/js/activites.js         les cinq composants + moteur de rendu
/assets/js/concordance.js       sélecteur d'expression + table KWIC
/assets/js/grille.js            grille et calcul du score
/assets/js/redaction.js         compteur de mots, copie, check-list
/data/
    synthese-texte1.json
    synthese-texte2.json
    synthese-demarche.json
    grille.json
    redaction.json
    phraseo-introduction.json
    phraseo-problematique.json
    phraseo-hypotheses.json
    phraseo-methodologie.json
    phraseo-conclusion.json
/README.md
```

Correspondance des liens de la maquette : `Main.dc.html` → `index.html`, `Texte1.dc.html` → `synthese/texte1.html`, etc. (selon le tableau ci-dessus). Depuis un sous-dossier, les liens remontent avec `../`.

## 4. Charte graphique « papier-collage »

Esprit : un fanzine fait de bouts de papier collés. Papier crème, encre noire, morceaux de ruban adhésif, bords déchirés, légères rotations, ombres franches décalées. Mouvement présent mais doux.

### 4.1 Couleurs (variables CSS sur `:root`)

| Variable | Valeur | Usage |
|---|---|---|
| `--bg` | `#f2e8d5` | fond de page |
| `--paper` | `#faf3e3` | cartes, papier crème |
| `--white` | `#ffffff` | cartes claires, champs |
| `--ink` | `#1b1512` | texte, bordures, boutons sombres |
| `--muted` | `#4a3f37` | texte secondaire |
| `--red` | `#e04a2a` | **décor uniquement** : aplats, grands titres, gommettes avec texte encre |
| `--red-text` | `#c23a1c` | petits textes rouges, boutons rouges à texte crème, erreurs |
| `--blue-text` | `#276d8e` | liens, réponses justes, focus |
| `--blue-tape` | `rgba(46,127,164,.55)` | ruban adhésif bleu |
| `--red-tape` | `rgba(224,74,42,.5)` | ruban adhésif rouge |
| `--sky` | `#8fc3db` | post-it bleu clair |
| `--salmon` | `#f07a5c` | accent sur fond encre |
| `--ok-green` | `#2f7d4a` | compteur de mots « dans la cible » |

Règle de contraste : `#e04a2a` ne passe pas 4,5:1 sur crème. Ne jamais l'utiliser pour du texte de petite taille ; utiliser `--red-text`. Le texte crème sur `--red-text` et sur `--ink` est conforme.

Le site est en thème clair uniquement (pas de mode sombre). Donner une couleur de fond explicite au `body`.

### 4.2 Typographie (Google Fonts)

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,700&family=Permanent+Marker&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
```

- `--serif` : Fraunces (corps et titres, 900 pour les h1/h2)
- `--marker` : Permanent Marker (mots soulignés à la main, numéros d'étape, verdicts « Bien vu ! »)
- `--mono` : Courier Prime (menus, étiquettes, boutons, lignes de concordance)
- h1 : `clamp(44px, 6vw, 80px)`, interlignage 1, `letter-spacing: -.02em`
- corps : 18–20px, interlignage 1,55–1,75

### 4.3 Motifs récurrents

- **Fond pointillé** : `background-image: radial-gradient(rgba(27,21,18,.06) 1px, transparent 1px); background-size: 6px 6px;`
- **Ruban adhésif** : petit rectangle absolu (≈ 90×24 px) en haut d'une carte, couleur `--blue-tape` ou `--red-tape`, rotation entre -12° et +18°. Décoratif → `aria-hidden="true"`.
- **Bord déchiré** : `clip-path: polygon(...)` irrégulier (voir les exemples dans les références : bandeau noir de l'accueil, mots du h1, encadré « Votre score »).
- **Rotation** : cartes entre -2° et +2°, alternées. Les cartes d'activités restent presque droites (±0,3°) pour la lisibilité.
- **Ombre franche** : `box-shadow: 6px 7px 0 rgba(27,21,18,.85)` ; bordure `2px solid var(--ink)`.
- **Post-it** « À retenir » / « Pendant la lecture » : aplat `--sky` ou `--red`, rotation ±1,5°, ombre franche.
- Largeur de contenu : `max-width: 1180px`, gouttière 24px.

### 4.4 Mouvement

- Survol des onglets : `rotate(-2deg) translateY(-2px)` + ombre ; survol des cartes : se redressent et montent de 6px ; survol des options : `translate(-2px,-2px)` + ombre.
- Apparition des rétroactions : animation « pop » (scale .92 → 1, 350 ms).
- Lignes de concordance : glissement depuis la gauche quand on change d'expression.
- Gommette « = 1 synthèse » de l'accueil : flottement lent (6 s).
- Courbe : `cubic-bezier(.2,.8,.2,1)`.
- **Obligatoire** : tout désactiver sous `@media (prefers-reduced-motion: reduce)`.

### 4.5 Accessibilité

- Vrais éléments : `<button type="button">`, `<a href>`, `<input>` + `<label for>`. Pas de `div` cliquable.
- Choix multiples : `<button aria-pressed="true|false">` dans un `role="group"` avec `aria-label`.
- Rétroactions et scores : `role="status"` (lus par les lecteurs d'écran).
- Cibles tactiles ≥ 44px. Focus visible : `outline: 3px solid var(--blue-text); outline-offset: 3px`.
- Juste / faux ne repose pas que sur la couleur : texte « juste », « Non. », « → réponse attendue ».
- Tables : `scope` sur les en-têtes ; table de concordance avec `<caption>` masquée visuellement.
- Responsive : à largeur de téléphone, les menus passent à la ligne, les colonnes s'empilent (`flex-wrap`), les tables larges défilent dans un conteneur `overflow-x: auto`. Pas de défilement horizontal de la page.

## 5. Gabarit commun des pages

1. **En-tête** : logo « écrits » (marqueur, aplat encre, -3°) + « académiques » (Fraunces italique) → lien accueil. Menu : Accueil · Mode d'emploi · Synthèse (→ texte1) · Phraséologie (→ introduction). L'onglet de la rubrique courante est en `--red-text` avec `aria-current`.
2. **Sous-navigation** :
   - Rubrique synthèse : « 1 · Comprendre » (texte1) · « 2 · Démarche » · « 3 · Rédiger » · « 4 · S'autoévaluer ». Étape courante pleine encre (`aria-current="step"`), les autres en pointillés.
   - Rubrique phraséologie : introduction · problématique · hypothèses · méthodologie · conclusion.
3. **Contenu** de la page.
4. **Navigation précédent / suivant** en bas.
5. **Pied de page** (accueil et mode d'emploi) : « Projet DUFLEPES · Français sur Objectif Universitaire » / « [NOMS DE L'ÉQUIPE] · 2026 ».

Factoriser l'en-tête et les sous-navigations : soit les écrire en dur dans chaque page (le plus simple, aucune dépendance JS), soit les injecter avec un petit script. Préférer le HTML en dur pour que le site reste lisible sans JS.

## 6. Composants d'activités (`activites.js`)

### 6.1 Principe

Chaque page d'activités contient un conteneur :

```html
<div class="activites" data-src="../data/synthese-texte1.json"></div>
<script src="../assets/js/activites.js" defer></script>
```

Le script charge le JSON, lit `activities[]` et rend chaque activité dans une carte numérotée « ACTIVITÉ n · TYPE », avec titre, consigne, corps selon le type, bouton **Vérifier** et zone de rétroaction. Un registre `{ qcm, vf, tableau, appariement, trous }` associe chaque type à sa fonction de rendu, pour qu'on puisse en ajouter sans toucher au reste.

Comportement commun :
- L'apprenant peut changer sa réponse à tout moment ; modifier une réponse efface l'état « vérifié » de l'activité.
- **Vérifier** colore chaque item (bleu = juste, rouge = faux), affiche « juste » ou « → réponse attendue », et pour les types à plusieurs items un score « n / total » (« — parfait » si tout est juste).
- Aucun état n'est conservé entre deux visites (voir §10 pour une option).
- Afficher un message clair si le JSON ne charge pas (cas `file://`).

### 6.2 Schémas JSON

Fichier de page :

```json
{
  "page": "synthese-texte1",
  "activities": [ /* activités, voir ci-dessous */ ]
}
```

**QCM** (une seule bonne réponse, index à partir de 0) :

```json
{
  "type": "qcm",
  "titre": "Quelle est l'idée principale du texte 1 ?",
  "consigne": "Choisissez la bonne réponse.",
  "choix": ["…", "…", "…"],
  "reponse": 1,
  "feedbackOk": "…",
  "feedbackKo": "…"
}
```
Rendu : boutons pleine largeur avec lettre A/B/C. Si rien n'est choisi : « Choisissez d'abord une réponse. » Juste : « Bien vu ! » (marqueur, bleu) + `feedbackOk`. Faux : « Pas encore. » (marqueur, rouge) + `feedbackKo`.

**Vrai ou faux** :

```json
{
  "type": "vf",
  "titre": "Vrai ou faux ?",
  "consigne": "…",
  "items": [ { "t": "affirmation", "a": true, "fb": "justification" } ]
}
```
Rendu : affirmation + deux boutons Vrai / Faux. Après vérification : « Juste. » ou « Non. » suivi de `fb`, pour chaque item répondu.

**Tableau à compléter** (saisie libre) :

```json
{
  "type": "tableau",
  "titre": "Complétez le tableau",
  "consigne": "Écrivez un mot ou une expression du texte dans chaque case.",
  "lignes": [ { "label": "Premier avantage cité", "accepte": ["souplesse"] } ]
}
```
Correction : la réponse est **normalisée** (minuscules, accents retirés via `normalize("NFD")` + suppression des diacritiques, espaces de début et de fin supprimés) ; elle est juste si elle **contient** l'une des chaînes de `accepte` (normalisées de la même façon). `accepte` peut contenir des radicaux (`"organis"`, `"decroch"`). Réponse attendue affichée : `accepte[0]` + « … ».

**Appariement** :

```json
{
  "type": "appariement",
  "titre": "…",
  "consigne": "…",
  "options": ["…", "…", "…"],
  "gauche": [ { "t": "§1", "a": "Un accès plus large aux études" } ]
}
```
Rendu : étiquette encre à gauche, flèche, puis les `options` sous forme de boutons-pastilles (une seule sélection par ligne). Pas de liste déroulante : les pastilles sont plus lisibles et plus faciles à toucher.

**Texte à trous** :

```json
{
  "type": "trous",
  "titre": "…",
  "consigne": "…",
  "options": ["en revanche", "de même", "par conséquent"],
  "phrases": [ { "avant": "Le document 1 …", "apres": ", le document 2 …", "a": "en revanche" } ]
}
```
Rendu : la phrase avec le trou affiché « ……… » (puis le mot choisi, souligné), et en dessous les pastilles d'options. `avant` peut être vide (trou en début de phrase).

### 6.3 Données à extraire

Le contenu exact de chaque activité se trouve dans le bloc `var DATA = {…}` du script de chaque fichier de référence (Texte1, Texte2, PhraseoIntroduction, PhraseoHypotheses, PhraseoMethodologie, PhraseoConclusion). Il est déjà au bon format : le copier tel quel dans le JSON correspondant.

Deux pages de référence ont une logique écrite à la main, à **normaliser** vers les composants communs :
- `Demarche.dc.html` : QCM, vrai/faux et texte à trous (en listes déroulantes dans la maquette) → les passer en types `qcm`, `vf`, `trous` (pastilles) dans `synthese-demarche.json`. Les textes, réponses et rétroactions sont dans `renderVals()`. Le tableau de confrontation et la frise des cinq étapes restent du HTML statique.
- `Phraseologie.dc.html` (problématique) : concordances et appariement codés en dur dans `renderVals()` → les passer au format commun (`nodes` + activité `appariement`) dans `phraseo-problematique.json`. Ajouter à cette page un paragraphe « Je repère » via `repere`, comme sur les autres pages.

## 7. Concordances (`concordance.js`)

Les pages de phraséologie ajoutent dans leur JSON :

```json
{
  "repere": "texte du bloc « Je repère »",
  "retenir": ["Nous faisons l'hypothèse que…", "…"],
  "nodes": [
    { "label": "hypothèse", "lines": [ ["contexte gauche", "pivot", "contexte droit"] ] }
  ],
  "activities": [ … ]
}
```

- Boutons-pastilles « « label » » pour choisir l'expression (`aria-pressed`), la première est active au chargement.
- Table KWIC : contexte gauche **aligné à droite** (≈ 38–40 %), pivot centré en gras `--red-text` sur fond `rgba(224,74,42,.08)`, `white-space: nowrap`, contexte droit aligné à gauche ; Courier Prime 16px. Bandeau encre au-dessus : « concordance · n lignes » / « corpus : mémoires + rapports de stage ».
- Le pivot peut varier d'une ligne à l'autre (formes conjuguées, collocations différentes) : on prend la colonne du milieu telle quelle.
- Mention sous la table : « Lignes d'exemple, à remplacer par les concordances extraites avec Sketch Engine. » (à retirer quand les vraies données seront là).
- Chaque page suit les trois temps : **1 J'observe le corpus**, **2 Je repère** (texte `repere` + post-it « À retenir » généré depuis `retenir`), **3 Je m'entraîne** (activités, même moteur que §6).

## 8. Grille d'auto-évaluation (`grille.js`, `data/grille.json`)

```json
{
  "pointsMax": 3,
  "provisoire": true,
  "volets": [
    { "titre": "Contenu et démarche", "criteres": [
      { "id": "consigne", "label": "Consigne et nombre de mots", "aide": "Le sujet est traité, la longueur demandée est respectée." },
      { "id": "neutre", "label": "Neutralité", "aide": "Aucun avis personnel, aucun « je pense »." },
      { "id": "confront", "label": "Vraie confrontation", "aide": "Les idées des deux textes sont croisées, pas résumées l'une après l'autre." },
      { "id": "plan", "label": "Plan clair", "aide": "Un titre, une introduction, des parties qu'on repère." },
      { "id": "reform", "label": "Reformulation", "aide": "Aucune phrase entière reprise des documents." }
    ]},
    { "titre": "Langue", "criteres": [
      { "id": "connect", "label": "Cohérence et connecteurs", "aide": "Les liens logiques sont variés et justes." },
      { "id": "lexique", "label": "Vocabulaire riche et précis", "aide": "Le mot juste, peu de répétitions." },
      { "id": "gram", "label": "Grammaire et orthographe", "aide": "Texte passé dans Scribens, fautes corrigées." }
    ]}
  ],
  "seuils": [
    { "min": 0,    "titre": "À retravailler",  "conseil": "Reprenez la démarche : la confrontation et la reformulation posent souvent problème. Revoyez l'étape 2 avant de réécrire." },
    { "min": 0.5,  "titre": "En bonne voie",   "conseil": "La base est là. Reprenez les critères où vous avez mis 0 ou 1 et corrigez-les un par un." },
    { "min": 0.75, "titre": "Synthèse solide", "conseil": "Vous êtes proche des attentes du C1. Une dernière relecture de la langue avec Scribens, et c'est prêt." }
  ]
}
```

- Pour chaque critère : boutons ronds 0…`pointsMax` (`aria-pressed`, `aria-label` « Neutralité : 2 sur 3 »).
- Encadré « Votre score » (fond encre, bord déchiré) : total / (nb critères × `pointsMax`), barre de progression, « n critère(s) noté(s) sur 8 ».
- Tant que tous les critères ne sont pas notés : « Continuez… / Notez les huit critères pour obtenir un commentaire. » Ensuite : le seuil le plus haut dont `min` ≤ ratio.
- Boutons : « Ouvrir Scribens ↗ » et « Recommencer ».
- Si `provisoire` : afficher « Barème provisoire : 0 = absent · 3 = pleinement réussi ».
- Le barème n'est pas encore fixé : tout doit dépendre du JSON (nombre de points, critères, seuils, textes), aucune valeur en dur dans le JS.

## 9. Rédaction (`redaction.js`, `data/redaction.json`)

```json
{
  "motsCible": 220,
  "consigne": "À partir des deux documents, rédigez une synthèse d'environ {cible} mots. Donnez-lui un titre. Vous ne devez pas donner votre avis.",
  "aConfirmer": true,
  "checklist": ["Ma synthèse a un titre.", "L'introduction présente le thème et les deux documents.", "Chaque partie croise les deux textes.", "Je n'ai donné aucun avis personnel.", "J'ai reformulé, sans recopier de phrase."]
}
```

- Zone de texte (`<textarea>` avec `<label>`), fond blanc ligné bleu pâle, ombre franche.
- Compteur de mots en direct (`texte.trim().split(/\s+/)`), barre de progression avec repère à la cible, et état :
  - 0 mot : « Pas encore commencé » (gris)
  - < 90 % : « Encore un peu court » (bleu)
  - 90–110 % : « Dans la cible » (vert)
  - > 110 % : « Trop long : resserrez » (rouge)
- Bouton « Copier mon texte » (`navigator.clipboard.writeText`, puis « Copié ! » ; échec silencieux si indisponible).
- Lien « Vérifier la langue avec Scribens ↗ ».
- Check-list à cocher (vraies cases à cocher, texte barré une fois cochée, compteur « n / 5 »).
- Liens « Relire » vers texte 1, texte 2 et la démarche ; post-it « Connecteurs utiles ».
- Avertissement : « Votre texte n'est pas enregistré sur le site. Copiez-le dans un document à vous avant de quitter la page. »

## 10. Option à valider avec l'équipe (ne pas faire par défaut)

Sauvegarde locale du brouillon de synthèse et des notes de la grille dans `localStorage`. Le document de conception ne le prévoit pas. Si l'équipe l'accepte : envelopper chaque lecture et écriture dans `try/catch`, ajouter un bouton « Effacer mon brouillon », et adapter l'avertissement de la page Rédaction.

## 11. Contenu provisoire à remplacer plus tard

Tout est marqué comme tel sur le site.
- Les deux textes (« Étudier à distance : une chance à saisir », « Le campus virtuel, un mirage ? ») : rédigés pour la démo, à remplacer par les textes retenus. Auteur, source et date sont entre crochets. Les activités des pages texte1/texte2 et l'exemple de la démarche dépendent de ces textes.
- Toutes les lignes de concordance : à remplacer par l'extraction Sketch Engine.
- Barème de la grille (0 à 3, provisoire) et consigne de rédaction (220 mots, « à confirmer »).
- `[NOMS DE L'ÉQUIPE]` dans le pied de page.

Mettre ces textes dans les JSON (pas dans le HTML) chaque fois que possible, pour qu'on puisse les remplacer sans toucher au code. Les deux documents peuvent aller dans `data/synthese-texte1.json` sous une clé `document` : `{ "titre", "auteur", "source", "date", "paragraphes": [] }`, rendue en `<article>` avec les repères §1, §2, §3.

## 12. Ordre de réalisation

1. Maquette générale : `style.css` (variables, typographie, motifs), en-tête, sous-navigations, accueil, mode d'emploi.
2. `activites.js` avec les cinq types et leur correction, testés sur une page de démonstration.
3. Pages texte1 et texte2 + leurs JSON.
4. Page démarche (normalisée vers les composants communs).
5. Page rédaction.
6. Grille d'auto-évaluation.
7. Rubrique phraséologie : `concordance.js` + les cinq pages et leurs JSON.
8. Tests, README, mise en ligne GitHub Pages.

## 13. Critères d'acceptation

- [ ] Toutes les pages s'ouvrent depuis le serveur local et depuis GitHub Pages, sans erreur dans la console.
- [ ] Tous les liens internes fonctionnent, y compris depuis les sous-dossiers (aucun 404).
- [ ] Chaque activité des 8 pages concernées se vérifie, avec les couleurs, les verdicts et les scores attendus ; changer une réponse réinitialise l'état « vérifié ».
- [ ] Tableau à compléter : « Souplesse », « souplesse  » et « la souplesse » sont acceptés ; une case vide est fausse.
- [ ] Grille : total, barre, commentaire et « Recommencer » fonctionnent ; passer `pointsMax` à 4 dans le JSON change bien les boutons et le total.
- [ ] Rédaction : le compteur et les quatre états fonctionnent ; changer `motsCible` dans le JSON est pris en compte.
- [ ] Concordances : le changement d'expression met à jour les lignes et le compteur.
- [ ] Navigation clavier complète (Tab, Entrée, Espace), focus visible partout.
- [ ] Mise en page correcte à 375px de large, sans défilement horizontal.
- [ ] Aucune animation avec `prefers-reduced-motion: reduce`.
- [ ] Ajouter une activité dans un JSON suffit à la faire apparaître, sans toucher au JS.

## 14. Hors périmètre

Comptes et connexion · suivi des résultats par l'enseignant · correction de la synthèse par un LLM · accès des apprenants à Sketch Engine · back-office d'édition.

## 15. Mise en ligne

1. Dépôt GitHub public, fichiers à la racine de la branche `main`.
2. Settings → Pages → Source : « Deploy from a branch », `main` / `/ (root)`.
3. Ajouter un fichier `.nojekyll` vide à la racine.
4. README : présentation du projet, lancement local (`python3 -m http.server 8000`), comment modifier une activité (où est le JSON, format de chaque type), liste du contenu provisoire.

---

## Prompt de démarrage à coller dans Claude Code

> Lis `HANDOFF.md` en entier, puis parcours les fichiers de `reference/` (ce sont des maquettes, pas du code à déployer). Construis le site statique décrit : HTML, CSS et JS vanilla, chemins relatifs, compatible GitHub Pages. Suis l'ordre de réalisation du §12 et fais un commit par étape. Commence par le §12.1 et le §12.2 (styles, gabarit, accueil, mode d'emploi, puis `activites.js` avec les cinq types). Extrais les données des blocs `DATA` des références vers `data/*.json` sans en modifier le texte. Ne fais pas l'option du §10 sans me demander. À la fin de chaque étape, vérifie les critères du §13 qui s'y rapportent et dis-moi ce qui reste.
