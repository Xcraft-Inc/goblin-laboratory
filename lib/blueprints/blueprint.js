// @ts-check
const {Elf} = require('xcraft-core-goblin');
const {
  string,
  boolean,
  option,
  enumeration,
  array,
  record,
} = require('xcraft-core-stones');

/**
 * Décrit comment représenter une entité liée dans l'UI
 */
class LookupShape {
  labelPaths = array(string); // ex: ['firstname', 'lastname']
  iconPath = option(string); // ex: 'avatar'
  drilldown = option(boolean); // true pour lien vers la fiche
  tooltipPath = option(string); // champ pour info-bulle
  descriptionPath = option(string); // champ pour résumé
}

/**
 * Champ enum (valeur, label, icône…)
 */
class EnumValueShape {
  label = string; // clé i18n
  icon = option(string);
  color = option(string);
}

/**
 * Hints pour aider l’UI à générer des interfaces intelligentes
 */
class FieldUiShape {
  filter = option(boolean);
  sort = option(boolean);
  list = option(boolean);
  search = option(enumeration('fulltext', 'exact', 'none'));
  hintText = option(string); // clé i18n
  tooltip = option(string); // clé i18n
}

/**
 * Décrit un champ d'entité
 */
class FieldShape {
  type = string; // 'text', 'enum', 'date', 'number', etc.
  label = string; // clé i18n
  required = option(boolean);
  readonly = option(boolean);
  hidden = option(boolean);
  values = option(record(string, EnumValueShape)); // enum uniquement
  ui = option(FieldUiShape);
}

/**
 * Pointeur vers une autre entité (ex: contactId)
 */
class ReferenceShape {
  entity = string; // cible : 'contact'
  label = option(string); // clé i18n
  lookup = option(LookupShape); // représentation dans l’UI
}

/**
 * Collection de pointeurs (ex: contactIds)
 */
class CollectionShape {
  entity = string;
  label = option(string);
  lookup = option(LookupShape);
}

/**
 * Configuration UI globale de l’entité
 */
class UiConfigShape {
  icon = option(string); // ex: 'mdiFolder'
  primaryLabel = option(string); // champ principal
  secondaryLabel = option(array(string)); // champs secondaires
  defaultSort = option(array(string)); // ex: ['createdAt', 'desc']
}

/**
 * Blueprint final pour une entité
 */
class BlueprintShape {
  id = string;
  entity = string;
  fields = record(string, FieldShape);
  references = option(record(string, ReferenceShape));
  collections = option(record(string, CollectionShape));
  ui = option(UiConfigShape);
}

class BlueprintState extends Elf.Sculpt(BlueprintShape) {}

class BlueprintLogic extends Elf.Archetype {
  static db = 'blueprints';

  state = new BlueprintState({
    id: undefined,
    entity: undefined,
    fields: {},
    references: undefined,
    collections: undefined,
    ui: undefined,
    meta: {status: 'published'},
  });

  create(id) {
    const {state} = this;
    state.id = id;
  }

  change(path, newValue) {
    const {state} = this;
    state._state.set(path, newValue);
  }
}

class Blueprint extends Elf {
  logic = Elf.getLogic(BlueprintLogic);
  state = new BlueprintState();

  async create(id, desktopId) {
    this.logic.create(id);
    await this.persist();
    return this;
  }

  async change(path, newValue) {
    this.logic.change(path, newValue);
    await this.persist();
  }

  delete() {}
}

module.exports = {
  BlueprintShape,
  BlueprintState,
  Blueprint,
  BlueprintLogic,
};
