# 📘 Blueprints – Documentation technique

## 🧠 Définition

Un **blueprint** est un fichier `.js` déclaratif décrivant les **métadonnées fonctionnelles, structurelles et UI** d’une entité métier du système Xcraft.

Il sert de base à :

- l’interface utilisateur dynamique (UI générée à partir des métadonnées),
- les systèmes de recherche, de filtre et d’export,
- l’internationalisation via `T(...)`,
- l’édition low-code ou runtime,
- et l’assistance intelligente (LLM, agents contextuels...).

## 📦 Gestion

Les blueprints sont :

- des **fichiers `.js`** exportant un objet conforme au `BlueprintShape`,
- **éditables dynamiquement** par un acteur de gestion de ressources Xcraft,
- **versionnés** dans un **sous-module Git** (`share/blueprints`),
- **validés** à l’exécution via `parse(BlueprintShape, blueprint)`.

## 🧱 Structure

Un blueprint contient les sections suivantes :

### entity

Nom logique de l’entité cible (ex : `case`, `contact`).

### fields

Liste des champs déclarés, avec :

- `type` (`text`, `enum`, `date`, etc.)
- `label` (clé nabu via `T(...)`)
- options UI (`filter`, `search`, `hintText`, etc.)
- pour les `enum`, la liste des `values` (label, icône, couleur)

### references

Liste des **références unitaires** vers d'autres entités, avec configuration d'affichage (`lookup`).

### collections

Listes d’identifiants liés à d'autres entités, aussi enrichies par `lookup`.

### ui

Paramètres UI globaux pour l'entité : icône, tri par défaut, label principal, etc.

## 🎛️ Philosophies clés

- Simplicité : uniquement des données, aucune logique métier ou interface
- Interopérabilité : utilisables dans le backend, le CLI, l’UI, et les assistants
- Internationalisation native : chaque `label`, `tooltip`, `hintText` est une clé traduisible
- Dialecte clair : pas de `many-to-one`, on utilise `references` et `collections`

## 🔍 Exemples d’usages

| Objectif                | Utilisation dans blueprint               |
| ----------------------- | ---------------------------------------- |
| Générer une table       | `fields` avec `ui.list = true`           |
| Créer un menu déroulant | `fields.kind.values`                     |
| Filtrer les résultats   | `fields[].ui.filter = true`              |
| Chercher par texte      | `ui.search = 'fulltext'`                 |
| Afficher une relation   | `references.contactId.lookup.labelPaths` |
| Export CSV              | `fields` avec `label` et `values`        |

## ✅ Exemple minimal

```
const {T} = require('nabu');
const {parse} = require('xcraft-core-stones');
const {BlueprintShape} = require('./BlueprintShape');

module.exports = parse(BlueprintShape, {
  entity: 'case',
  fields: {
    status: {
      type: 'enum',
      label: T('Statut'),
      values: {
        open: {label: T('Ouvert'), icon: 'mdiLockOpen'},
        closed: {label: T('Fermé'), icon: 'mdiLock'}
      },
      ui: {filter: true, list: true}
    }
  },
  references: {
    contactId: {
      entity: 'contact',
      label: T('Contact lié'),
      lookup: {
        labelPaths: ['firstname', 'lastname'],
        drilldown: true
      }
    }
  }
});
```

## 🛡️ Validation

Chaque blueprint doit être validé au chargement :

```
const {parse} = require('xcraft-core-stones');
const {BlueprintShape} = require('goblin-laboratory/lib/blueprint.js');

module.exports = parse(BlueprintShape, blueprint);
```

Une erreur sera levée si le format est invalide.

## 📁 Emplacement

Tous les blueprints sont stockés dans le dossier :

```
share/blueprints/
```

Ils peuvent être mis à jour dynamiquement, commités dans le sous-module, et chargés au runtime.
