//Exemple de blueprint pour l'entité Case
const {T} = require('nabu');
const {parse} = require('xcraft-core-stones');
const {BlueprintShape} = require('goblin-laboratory/lib/blueprint.js');

const blueprint = {
  entity: 'case',

  fields: {
    reference: {
      type: 'text',
      label: T('Référence'),
      required: true,
      ui: {
        filter: true,
        sort: true,
        list: true,
        search: 'fulltext',
        hintText: T('Identifiant interne du dossier.'),
        tooltip: T('Utilisé pour retrouver rapidement un dossier.'),
      },
    },

    status: {
      type: 'enum',
      label: T('Statut'),
      required: true,

      values: {
        open: {label: T('Ouvert'), icon: 'mdiLockOpen', color: 'green'},
        closed: {label: T('Fermé'), icon: 'mdiLock', color: 'gray'},
        archived: {label: T('Archivé'), icon: 'mdiArchive', color: 'brown'},
      },

      ui: {
        filter: true,
        sort: true,
        list: true,
      },
    },

    kind: {
      type: 'enum',
      label: T('Type de dossier'),
      required: true,

      values: {
        issue: {label: T('Problème'), icon: 'mdiBug', color: 'red'},
        question: {
          label: T('Question'),
          icon: 'mdiHelpCircleOutline',
          color: 'blue',
        },
        project: {label: T('Projet'), icon: 'mdiChartGantt', color: 'indigo'},
      },

      ui: {
        filter: true,
        list: true,
        hintText: T('Catégorie fonctionnelle du dossier.'),
      },
    },
  },

  references: {
    contactId: {
      entity: 'contact',
      label: T('Contact lié'),
      lookup: {
        labelPaths: ['firstname', 'lastname'],
        iconPath: 'avatar',
        tooltipPath: 'email',
        drilldown: true,
      },
    },

    customerFolderId: {
      entity: 'customer-folder',
      label: T('Dossier client'),
      lookup: {
        labelPaths: ['name'],
        iconPath: 'icon',
        drilldown: true,
      },
    },
  },

  collections: {
    followerIds: {
      entity: 'user',
      label: T('Suivi par'),
      lookup: {
        labelPaths: ['username'],
        iconPath: 'avatar',
      },
    },
  },

  ui: {
    icon: 'mdiFolder',
    primaryLabel: 'reference',
    secondaryLabel: ['kind', 'status'],
    defaultSort: ['lastEventDate', 'desc'],
  },
};

module.exports = parse(BlueprintShape, blueprint);
