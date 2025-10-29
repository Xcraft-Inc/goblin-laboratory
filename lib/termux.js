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

  beginCommand(prompt, name, params) {
    const {state} = this;
    state.busy = true;
    state.history.push(`${prompt} ${name} ${params.join(' ')}`);
  }

  endCommand(result) {
    const {state} = this;
    state.history.push(result);
    state.busy = false;
  }

  /// TOOLS ////////////////////////////////////////////////////////////////////

  clear$tool() {
    const {state} = this;
    state.history = [];
  }
}

function getTools(resp) {
  const registry = resp.getCommandsRegistry();
  return Object.fromEntries(
    Object.entries(registry)
      .filter(([cmd]) => cmd.endsWith('$tool'))
      .map(([cmd, ctx]) => [cmd.split('.').reverse()[0].split('$')[0], ctx])
  );
}

function getTool(tools, name) {
  if (name in tools) {
    return tools[name];
  }
  throw new Error(`${name}: command not found`);
}

class Termux extends Elf.Alone {
  logic = Elf.getLogic(TermuxLogic);
  state = new TermuxState();

  _unsub;
  _tools = {};

  async init() {
    const {resp} = this.quest;
    this._tools = getTools(resp);
    this._unsub = resp.onCommandsRegistry(() => {
      this._tools = getTools(resp);
    });
  }

  async beginCommand(prompt, name, params) {
    this.quest.doSync({prompt, name, params});

    let result = '';
    try {
      if (!name) {
        return;
      }
      const tool = getTool(this._tools, name);
      const {required, optional} = tool.options.params;
      let args = required.concat(optional).reduce((args, arg, index) => {
        args[arg] = params[index];
        return args;
      }, {});
      result = await this.quest.cmd(tool.name, args);
    } catch (ex) {
      result = ex.stack || ex.message || ex;
    } finally {
      if (result.length) {
        result += '\n';
      }
      await this.endCommand(result);
    }
  }

  async endCommand(result) {
    this.logic.endCommand(result);
  }

  /// TOOLS ////////////////////////////////////////////////////////////////////

  async clear$tool() {
    this.logic.clear$tool();
    return '';
  }

  async man$tool(name) {
    const tool = getTool(this._tools, name);
    let result = '';
    result += `  module: ${tool.info.name} (v${tool.info.version})\n`;
    result += `location: ${tool.location}\n`;
    result += `   usage: ${name} ${tool.options.params.required
      .map((arg) => arg.toUpperCase())
      .join(' ')}`;
    return result;
  }

  //////////////////////////////////////////////////////////////////////////////

  dispose() {
    if (this._unsub) {
      this._unsub();
    }
  }
}

module.exports = {Termux, TermuxLogic};
