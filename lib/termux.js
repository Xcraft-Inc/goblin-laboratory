// @ts-check
const {Elf} = require('xcraft-core-goblin');
const {string, boolean, array} = require('xcraft-core-stones');

class TermuxShape {
  id = string;
  busy = boolean;
  history = array(string);
}

class TermuxState extends Elf.Sculpt(TermuxShape) {}

class TermuxLogic extends Elf.Spirit {
  state = new TermuxState({
    id: 'termux',
    busy: false,
    history: [],
  });

  beginCommand(prompt, name) {
    const {state} = this;
    state.busy = true;
    state.history.push(`${prompt} ${name}`);
  }

  endCommand(result) {
    const {state} = this;
    state.history.push(result);
    state.busy = false;
  }
}

class Termux extends Elf.Alone {
  logic = Elf.getLogic(TermuxLogic);
  state = new TermuxState();

  async beginCommand(prompt, name) {
    this.quest.doSync({prompt, name});

    let result = '';
    try {
      // XXX: simulate a command
      const {setTimeout: setTimeoutAsync} = require('node:timers/promises');
      await setTimeoutAsync(1000);
      result = 'Terminé\n';
    } finally {
      await this.endCommand(result);
    }
  }

  async endCommand(result) {
    this.logic.endCommand(result);
  }
}

module.exports = {Termux, TermuxLogic};
