# Blog FOU · Écrits académiques

Site statique pour la formation FOU (Français sur Objectif Universitaire, DUFLEPES), du B2 au C1, entièrement en ligne.

- **Rubrique 1 · Synthèse de documents** : comprendre les deux textes, apprendre la démarche, rédiger, s'autoévaluer avec une grille.
- **Rubrique 2 · Phraséologie** : concordances tirées d'un corpus de mémoires et de rapports de stage, repérage des formules, entraînement.

HTML, CSS et JavaScript vanilla : pas de framework, pas d'étape de build, pas de serveur, pas de compte. Seules ressources externes : Google Fonts et le lien vers [Scribens](https://www.scribens.fr/).

## Lancer le site en local

Les activités sont chargées depuis des fichiers JSON avec `fetch()`, ce qui **ne fonctionne pas** si on ouvre les pages en double-cliquant (`file://`). Il faut un petit serveur, lancé à la racine du dépôt :

```bash
python3 -m http.server 8000
```

(sous Windows : `python -m http.server 8000`), puis ouvrir <http://localhost:8000>.

Après avoir modifié un JSON, rechargez la page avec **Ctrl + F5** (ou Cmd + Maj + R) : le navigateur garde parfois l'ancienne version en cache.

## Arborescence

```
index.html                 accueil
mode-emploi.html           s'autocorriger et s'autoévaluer
synthese/                  texte1, texte2, demarche, redaction, grille
phraseologie/              introduction, problematique, hypotheses, methodologie, conclusion
assets/css/style.css       charte « papier-collage »
assets/js/activites.js     moteur des activités (+ document et questions de lecture)
assets/js/concordance.js   sélecteur d'expression + table de concordance
assets/js/grille.js        grille d'auto-évaluation et score
assets/js/redaction.js     compteur de mots, copie, check-list
data/                      un fichier JSON par page : tout le contenu modifiable
```

## Modifier le contenu

Tout le contenu pédagogique est dans `data/`. On ne touche pas au JavaScript pour changer un texte, une question ou une réponse.

| Page | Fichier |
|---|---|
| Texte 1 (document + activités) | `data/synthese-texte1.json` |
| Texte 2 (document + activités) | `data/synthese-texte2.json` |
| Démarche | `data/synthese-demarche.json` |
| Rédaction (consigne, nombre de mots, check-list) | `data/redaction.json` |
| Grille (critères, barème, commentaires) | `data/grille.json` |
| Phraséologie | `data/phraseo-<partie>.json` |

### Ajouter une activité

Ajoutez un objet dans le tableau `activities` du fichier de la page : elle apparaît automatiquement, numérotée, avec son bouton **Vérifier**. Champs communs : `type`, `titre`, `consigne`, et facultativement `phase` (petit titre affiché au-dessus de la carte, par exemple « Phase 3 · Compréhension sélective »).

**QCM** (une seule bonne réponse ; `reponse` compte à partir de 0) :

```json
{ "type": "qcm", "titre": "…", "consigne": "…",
  "choix": ["…", "…", "…"], "reponse": 1,
  "feedbackOk": "…", "feedbackKo": "…" }
```

**Vrai ou faux** :

```json
{ "type": "vf", "titre": "Vrai ou faux ?", "consigne": "…",
  "items": [ { "t": "affirmation", "a": true, "fb": "justification" } ] }
```

**Tableau à compléter** (saisie libre) : la réponse est juste si, une fois mise en minuscules et sans accents, elle **contient** l'un des éléments de `accepte` (on peut y mettre des radicaux : `"organis"`, `"repar"`). `attendu` (facultatif) est la réponse affichée en cas d'erreur ; sinon c'est `accepte[0]` + « … ».

```json
{ "type": "tableau", "titre": "…", "consigne": "…",
  "lignes": [ { "label": "Premier avantage cité", "accepte": ["souplesse"], "attendu": "la souplesse" } ] }
```

`groupe` (facultatif) : les lignes d'un même groupe doivent recevoir des réponses différentes (par exemple « Technologie (1) » et « Technologie (2) »). La même réponse écrite deux fois n'est comptée juste qu'une fois.

**Appariement** : quand les options sont longues (plus de 40 caractères), elles sont affichées une seule fois sous forme de liste A, B, C… et chaque ligne propose les lettres. `fb` (facultatif) s'affiche après vérification.

```json
{ "type": "appariement", "titre": "…", "consigne": "…",
  "options": ["…", "…"],
  "gauche": [ { "t": "§1", "a": "texte exact de la bonne option", "fb": "…" } ] }
```

**Texte à trous** (`avant` peut être vide, pour un trou en début de phrase) :

```json
{ "type": "trous", "titre": "…", "consigne": "…",
  "options": ["en revanche", "de même"],
  "phrases": [ { "avant": "Le document 1 …", "apres": ", le document 2 …", "a": "en revanche" } ] }
```

**Reformulation** (production libre, sans score : l'apprenant compare avec une proposition) :

```json
{ "type": "reformulation", "titre": "…", "consigne": "…",
  "items": [ { "t": "« phrase du document »", "proposition": "reformulation possible" } ] }
```

Les deux types suivants sont dans `assets/js/souligner.js`, chargé après `activites.js` dans les pages d'activités.

**Vrai ou faux + souligner la preuve** : le document de la page (clé `document`) s'affiche à côté des affirmations. L'apprenant répond vrai ou faux, puis clique sur la phrase du texte qui le montre. `preuve` est un extrait de la phrase attendue, ou une liste d'extraits si plusieurs phrases conviennent. Le score compte la réponse et la phrase (2 points par affirmation).

```json
{ "type": "vf-preuve", "titre": "…", "consigne": "…",
  "items": [ { "t": "affirmation", "a": false, "preuve": ["et même la mode", "Dans la mode aussi"] } ] }
```

**Connecteur** : l'apprenant souligne le connecteur en cliquant sur le ou les mots de la phrase, puis écrit un mot de même sens (comparé à `remplacements`, sans accents). `production` (facultatif) ajoute une phrase libre, avec un exemple affiché après vérification.

```json
{ "type": "connecteur", "titre": "…", "consigne": "…",
  "phrase": "Malgré ces régulations strictes, …", "connecteur": "Malgré",
  "remplacements": ["en depit de", "bien que"], "attendu": "en dépit de, bien que…",
  "production": { "consigne": "Écrivez une phrase…", "proposition": "…" },
  "feedback": "…" }
```

### Le document d'une page texte

```json
"document": {
  "etiquette": "DOCUMENT 1 · …", "titre": "…", "auteur": "", "source": "…", "date": "…",
  "chapo": "phrase d'introduction en gras (facultatif)",
  "paragraphes": [
    { "titre": "intertitre" },
    { "sousTitre": "sous-titre" },
    "un paragraphe (numéroté §1, §2… automatiquement)",
    { "liste": ["élément", "élément"] }
  ]
},
"pendant": ["question affichée dans le post-it « Pendant la lecture »"]
```

### Phraséologie

```json
{
  "repere": "texte du bloc « Je repère »",
  "retenir": ["Nous faisons l'hypothèse que…"],
  "nodes": [ { "label": "hypothèse", "lines": [ ["contexte gauche", "pivot", "contexte droit"] ] } ],
  "activities": [ … ]
}
```

La colonne du milieu (pivot) est affichée telle quelle : elle peut varier d'une ligne à l'autre (formes conjuguées, collocations proches).

### Grille

`pointsMax`, les critères (`volets[].criteres[]`) et les `seuils` (`min` = part du score maximum, entre 0 et 1) sont tous lus dans `data/grille.json`. Passer `pointsMax` à 4 suffit pour obtenir des boutons de 0 à 4 et un total sur 32. `provisoire: true` affiche la mention « Barème provisoire ».

## Contenu provisoire à remplacer

Chaque élément est signalé comme tel sur le site.

- **Texte 2** (« L'obsolescence programmée », sao-bio.fr) : le titre a été ajouté pour la page et la date reste à compléter (`[date]` dans `data/synthese-texte2.json`).
- **Toutes les lignes de concordance** : à remplacer par l'extraction Sketch Engine, puis retirer la mention « Lignes d'exemple » dans les pages `phraseologie/*.html`.
- **Barème de la grille** (0 à 3, provisoire) et **consigne de rédaction** (220 mots, « à confirmer » : passer `aConfirmer` à `false` une fois validée).
- `[NOMS DE L'ÉQUIPE]` dans le pied de page de `index.html` et `mode-emploi.html`.

## Mise en ligne sur GitHub Pages

1. Dépôt GitHub public, fichiers à la racine de la branche `main` (le fichier `.nojekyll` est déjà présent).
2. Settings → Pages → Source : « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Le site est servi à l'adresse `https://<utilisateur>.github.io/<dépôt>/`. Tous les chemins sont relatifs, il n'y a rien à configurer.

Les fichiers de travail (`.docx`, `.zip`) sont exclus du dépôt par `.gitignore`.
