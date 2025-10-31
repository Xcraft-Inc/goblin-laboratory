// @ts-check
const {Elf} = require('xcraft-core-goblin');
const {string, boolean, array} = require('xcraft-core-stones');
const {parseOptions} = require('xcraft-core-utils/lib/reflect.js');

class OrderedSet {
  #set = new Set();
  #list = [];

  add(value) {
    if (!this.#set.has(value)) {
      this.#set.add(value);
      this.#list.push(value);
    }
  }

  delete(value) {
    if (this.#set.delete(value)) {
      this.#list = this.#list.filter((v) => v !== value);
    }
  }

  last() {
    return this.#list[this.#list.length - 1];
  }

  previous(value) {
    const i = this.#list.indexOf(value);
    return i > 0 ? this.#list[i - 1] : undefined;
  }

  next(value) {
    const i = this.#list.indexOf(value);
    return i < this.#list.length - 1 && i >= 0 ? this.#list[i + 1] : undefined;
  }
}

class TermuxShape {
  id = string;
  prompt = string;
  busy = boolean;
  history = array(string);
  completion = string;
  value = string;
}

class TermuxState extends Elf.Sculpt(TermuxShape) {}

class TermuxLogic extends Elf.Spirit {
  state = new TermuxState({
    id: 'termux',
    prompt: '~ $',
    busy: false,
    history: [],
    completion: '',
    value: '',
  });

  init(prompt) {
    const {state} = this;
    state.prompt = prompt;
  }

  beginCommand(prompt, command) {
    const {state} = this;
    state.prompt = prompt;
    state.busy = true;
    state.history.push(`${prompt} ${command}`);
  }

  endCommand(result) {
    const {state} = this;
    state.history.push(result);
    state.busy = false;
  }

  askForCompletion(prompt, input, tools) {
    const {state} = this;
    state.prompt = prompt;
    if (tools.length > 1) {
      state.completion = '';
      state.history.push(`${prompt} ${input}\n${tools.join(' ')}\n`);
    } else {
      state.completion = tools[0];
    }
  }

  setFromHistory(value) {
    const {state} = this;
    state.completion = value.trim();
  }

  clearCompletion() {
    const {state} = this;
    state.completion = '';
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
      .filter(([cmd]) => cmd.length)
  );
}

function getTool(tools, name) {
  if (name in tools) {
    return tools[name];
  }
  throw new Error(`${name}: command not found`);
}

function getPrompt(user) {
  return user.rank === 'admin' ? '~ #' : '~ $';
}

class Termux extends Elf.Alone {
  logic = Elf.getLogic(TermuxLogic);
  state = new TermuxState();

  _unsub;
  _tools = {};
  _history = new OrderedSet(); /* only the command entries */

  async init() {
    const prompt = getPrompt(this.user);
    this.logic.init(prompt);
    const {resp} = this.quest;
    this._tools = getTools(resp);
    this._unsub = resp.onCommandsRegistry(() => {
      this._tools = getTools(resp);
    });
  }

  async beginCommand(command) {
    const prompt = getPrompt(this.user);
    this.quest.doSync({prompt, command});

    const entries = parseOptions(command).map(
      (option) =>
        option
          .replace(/^"(.*)"$/g, '$1')
          .replace(/^'(.*)'$/g, '$1')
          .replace(/\\([^\\])/g, '$1') /* unescape */
          .replace(/\\\\/g, '\\') /* keep only escaped \ */
    );
    const name = entries[0];
    const params = entries.slice(1);

    let result = '';
    try {
      if (!name) {
        return;
      }

      this._history.delete(command.trim());
      this._history.add(command.trim());

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

  async askForCompletion(input) {
    const prompt = getPrompt(this.user);
    const tools = Object.keys(this._tools).filter((tool) =>
      tool.startsWith(input)
    );
    this.logic.askForCompletion(prompt, input, tools);
  }

  async setFromHistory(up, input) {
    let value;
    input = input.trim();
    if (up && !input) {
      value = this._history.last();
    } else if (input) {
      value = up ? this._history.previous(input) : this._history.next(input);
    }
    if (!up && !value) {
      this.logic.setFromHistory('<empty>');
    } else if (value) {
      this.logic.setFromHistory(value);
    }
  }

  async clearCompletion() {
    this.logic.clearCompletion();
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
