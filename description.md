# Blog FOU : les écrits académiques

Document de conception, novembre 2026.

## 1. Contexte

Le blog s'adresse à des étudiants universitaires inscrits en formation FOU (Français sur Objectif Universitaire), dans le cadre du DUFLEPES. Ils ont un niveau B2 en français et la formation doit les amener au niveau C1. Elle se déroule entièrement en ligne.

Il s'agit d'un projet à présenter. Le jury évaluera surtout le scénario pédagogique, mais nous voulons aussi que la démo soit propre et que les activités fonctionnent vraiment dans le navigateur.

## 2. Objectifs pédagogiques

Le blog porte sur les écrits académiques : prise de notes, compte rendu, synthèse de documents, rapport de stage et mémoire.

Le travail se concentre sur la synthèse de documents. À côté, une rubrique de phraséologie aide les apprenants à repérer les expressions figées du rapport de stage et du mémoire.

À la fin du parcours, l'apprenant doit pouvoir :

- comprendre et comparer les idées de deux textes ;
- appliquer la démarche de la synthèse (repérage, confrontation, plan, reformulation, rédaction) ;
- rédiger une synthèse neutre et organisée ;
- s'autocorriger et s'autoévaluer avec une grille ;
- réemployer les formules courantes de l'écrit académique (poser une problématique, présenter des hypothèses, etc.).

## 3. Choix techniques

Le site est statique (HTML, CSS et JavaScript), codé à la main et hébergé gratuitement sur GitHub Pages. Nous avons choisi cette solution plutôt que Blogger, Google Sites ou WordPress avec H5P parce que nous avons les compétences techniques pour la coder et qu'elle laisse une liberté totale sur les activités et la grille.

Le contenu des activités est séparé du code. Chaque activité est décrite dans un fichier JSON, et un même composant JavaScript sert à afficher toutes les activités d'un même type.

Il n'y a ni serveur, ni base de données, ni comptes utilisateurs.

## 4. Rubrique 1 : la synthèse de documents

Le parcours se fait en quatre étapes, dans l'ordre.

### Étape 1 : comprendre les deux textes

Les deux textes sont déjà choisis et leurs activités de compréhension de l'écrit sont déjà rédigées. Sur la plateforme, elles deviennent interactives et se corrigent automatiquement. On y trouve des QCM, des vrai ou faux, des tableaux à compléter, des exercices d'appariement (relier, associer) et des textes lacunaires.

### Étape 2 : apprendre la démarche de la synthèse

Avant de rédiger, l'apprenant découvre la méthode avec des activités guidées : repérer les idées principales de chaque texte, les regrouper par thème dans un tableau de confrontation, construire un plan, puis s'entraîner à reformuler sans recopier.

### Étape 3 : rédiger la synthèse

L'apprenant rédige sa synthèse dans une zone de texte, à partir des deux textes. Pour la correction de la langue, la page propose un lien vers Scribens, que nous connaissons déjà. L'idée d'une correction par un LLM a été écartée : sur un site statique, la clé API serait visible par tout le monde.

### Étape 4 : s'autoévaluer

L'apprenant relit sa synthèse avec la grille d'évaluation et se note sur chaque critère. Le site calcule le score total et affiche un court commentaire selon le résultat.

## 5. La grille d'auto-évaluation

Elle s'inspire de l'épreuve de synthèse du DALF C1 et comporte deux volets.

Contenu et démarche :

- respect de la consigne et du nombre de mots ;
- neutralité : aucun avis personnel ;
- vraie confrontation des deux textes, et non un résumé de l'un puis de l'autre ;
- plan clair, avec un titre et une introduction ;
- reformulation, sans reprise de phrases entières des textes.

Langue :

- cohérence et emploi des connecteurs ;
- richesse et précision du vocabulaire ;
- correction grammaticale et orthographique (vérifiée avec Scribens).

Le barème précis de chaque critère reste à fixer.

## 6. Rubrique 2 : la phraséologie académique

Nous constituons deux corpus : une dizaine de rapports de stage et une dizaine de mémoires. Nous les analysons nous-mêmes avec Sketch Engine pour en extraire les collocations récurrentes. Les apprenants n'utilisent donc pas Sketch Engine ; ils travaillent sur les résultats intégrés au site.

La rubrique est organisée selon les parties d'un mémoire ou d'un rapport :

- introduction ;
- problématique ;
- hypothèses ;
- méthodologie ;
- conclusion.

Chaque page suit la même démarche :

1. l'apprenant observe des lignes de concordance tirées du corpus, avec l'expression au centre, comme dans Sketch Engine ;
2. il repère et déduit les formules qui reviennent ;
3. il s'entraîne avec les mêmes types d'activités interactives que dans la rubrique 1.

## 7. Les composants d'activités

Cinq composants, codés une seule fois et réutilisés dans les deux rubriques :

| Type | Ce que fait l'apprenant |
|---|---|
| QCM | choisit une réponse parmi plusieurs |
| Vrai ou faux | juge une affirmation |
| Tableau à compléter | remplit des cases |
| Appariement | relie des éléments de deux colonnes |
| Texte à trous | complète un texte lacunaire |

Chaque composant vérifie la réponse et affiche une rétroaction.

Exemple de fichier de données pour un QCM :

```json
{
  "type": "qcm",
  "consigne": "Choisissez la bonne réponse.",
  "question": "Quelle est l'idée principale du texte 1 ?",
  "choix": ["Réponse A", "Réponse B", "Réponse C"],
  "reponse": 1,
  "feedback": "Le texte insiste surtout sur..."
}
```

## 8. Arborescence du site

```
/index.html                  accueil et présentation du parcours
/mode-emploi.html            comment s'autocorriger et s'autoévaluer
/synthese/
    texte1.html
    texte2.html
    demarche.html
    redaction.html
    grille.html
/phraseologie/
    introduction.html
    problematique.html
    hypotheses.html
    methodologie.html
    conclusion.html
/assets/css/style.css
/assets/js/activites.js      les cinq composants
/assets/js/grille.js         grille et calcul du score
/data/                       fichiers JSON des activités et des concordances
```

La page « Mode d'emploi » est une suggestion ajoutée en fin de discussion. Elle explique aux apprenants comment s'autocorriger, et montre au jury la logique pédagogique du parcours.

## 9. Ordre de réalisation

1. Maquette générale : menu, accueil, style commun.
2. Les cinq composants d'activités avec la correction automatique.
3. Les pages des deux textes avec leurs activités.
4. La page sur la démarche de la synthèse.
5. La page de rédaction avec le lien Scribens.
6. La grille d'auto-évaluation interactive.
7. La rubrique phraséologie (concordances et activités).
8. Les tests, la mise en ligne sur GitHub Pages et la préparation de la démo.

## 10. Hors périmètre

- Comptes utilisateurs et connexion.
- Suivi des résultats par l'enseignant.
- Correction automatique de la synthèse par un LLM.
- Accès direct des apprenants à Sketch Engine.

## 11. Ce qui reste à fournir

- Les deux textes et leurs activités, à convertir en JSON.
- Les concordances et collocations extraites avec Sketch Engine.
- Le barème de la grille.
- La consigne exacte de la synthèse (nombre de mots, sujet).
