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
      state.history.push(
        `${prompt} ${input}\n${tools
          .filter((tool) => tool[0] !== '$')
          .map((tool) => {
            const items = tool.split(' ');
            return items[items.length - 1];
          })
          .join(' ')}\n`
      );
    } else if (tools.length === 1) {
      state.completion = tools[0];
    } else {
      state.completion = '';
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
      .map(([cmd, ctx]) => {
        const tool = cmd.split('.').reverse()[0].split('$')[0];
        return tool.length ? [tool, ctx] : [`$${cmd.split('.', 1)[0]}`, ctx];
      })
  );
}

function getTool(tools, name) {
  if (name[0] !== '$' && name in tools) {
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

    const {completion} = this.state;
    if (completion) {
      return;
    }

    const items = input.trim().split(' ');
    const tool = items[0];
    if (!(tool in this._tools)) {
      return;
    }

    const name = this._tools[tool].name.split('.', 1)[0];
    if (!(`$${name}` in this._tools)) {
      return;
    }

    const desc = await this.quest.cmd(`${name}.$tool`, {tool});
    if (items.length === 1) {
      this.logic.askForCompletion(prompt, input, Object.keys(desc));
      return;
    }

    const cmds = Object.keys(desc)
      .filter((option) => option.startsWith(items[1]))
      .map((option) => `${tool} ${option}`);
    this.logic.askForCompletion(prompt, input.trim(), cmds);
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
      .join(' ')}\n\n`;

    /* List first parameter possible values */
    const _name = tool.name.split('.', 1)[0];
    if (`$${_name}` in this._tools) {
      const desc = await this.quest.cmd(`${_name}.$tool`, {tool: name});
      const {required} = tool.options.params;
      if (required[0]) {
        result += `${required[0].toUpperCase()} ${Object.keys(desc)
          .filter((option) => option[0] !== '$')
          .join(`\n${new Array(required[0].length + 2).join(' ')}`)}`;
      }
    }

    return result;
  }

  async $tool(tool) {
    if (tool === 'man') {
      return {...this._tools};
    }
    return {};
  }

  //////////////////////////////////////////////////////////////////////////////

  dispose() {
    if (this._unsub) {
      this._unsub();
    }
  }
}

module.exports = {Termux, TermuxLogic};
