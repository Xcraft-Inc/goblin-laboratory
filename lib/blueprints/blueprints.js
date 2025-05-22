const {Elf} = require('xcraft-core-goblin');
const {string} = require('xcraft-core-stones');
const {BlueprintLogic, BlueprintShape, Blueprint} = require('./blueprint.js');

class BlueprintsShape {
  id = string;
}

class BlueprintsState extends Elf.Sculpt(BlueprintsShape) {}

class BlueprintsLogic extends Elf.Spirit {
  state = new BlueprintsState({id: 'blueprints'});
}

class Blueprints extends Elf.Alone {
  logic = Elf.getLogic(BlueprintsLogic);
  state = new BlueprintsState();

  async loadAll(desktopId) {
    const reader = await this.cryo.reader(BlueprintLogic.db);
    const blueprintIds = reader
      .queryArchetype('blueprint', BlueprintShape)
      .field('id')
      .all();

    //Mount all blueprint in the desktop session
    await Promise.all(
      blueprintIds.map((id) => new Blueprint(this).create(id, desktopId))
    );
  }
}

module.exports = {Blueprints, BlueprintsLogic};
