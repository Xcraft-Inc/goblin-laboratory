// @ts-check
const {Elf} = require('xcraft-core-goblin');
const {string, boolean, array, option, object} = require('xcraft-core-stones');
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
  toolName = option(string);

  inputCommand = boolean;
  cmd = option(string);
  args = option(object);
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
    toolName: null,

    inputCommand: false,
    cmd: null,
    args: null,
  });

  init(prompt) {
    const {state} = this;
    state.prompt = prompt;
  }

  beginCommand(prompt, command, toolName) {
    const {state} = this;
    if (prompt && command) {
      state.prompt = prompt;
      state.busy = true;
      state.history.push(`${prompt} ${command}`);
    }
    if (toolName) {
      state.toolName = toolName;
    }
  }

  endCommand(prompt, result) {
    const {state} = this;
    state.prompt = prompt;
    state.history.push(result);
    state.busy = false;
    state.toolName = null;
    state.inputCommand = false;
    state.cmd = null;
    state.args = null;
  }

  inputCommand(input) {
    const {state} = this;
    state.history.push(input);
    state.busy = true;
    state.inputCommand = false;
  }

  forInputCommand(question, cmd, args) {
    const {state} = this;
    state.prompt = '->';
    state.history.push(question);
    state.busy = false;
    state.inputCommand = true;
    state.cmd = cmd;
    state.args = args;
  }

  forOutputCommand(value) {
    const {state} = this;
    state.history.push(value);
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

  _initialized = false;
  _unsub;
  _tools = {};
  _history = new OrderedSet(); /* only the command entries */

  async init() {
    if (this._initialized) {
      return;
    }
    const prompt = getPrompt(this.user);
    this.logic.init(prompt);
    const {resp} = this.quest;
    this._tools = getTools(resp);
    this._unsub = resp.onCommandsRegistry(() => {
      this._tools = getTools(resp);
    });
    this.quest.goblin.defer(
      this.quest.sub('*::*.<termux-input>', async (_, {msg}) => {
        const {question, cmd, args} = msg.data;
        await this.forInputCommand(question, cmd, args);
      })
    );
    this.quest.goblin.defer(
      this.quest.sub('*::*.<termux-output>', async (_, {msg}) => {
        const value = msg.data;
        await this.forOutputCommand(value);
      })
    );
    this._initialized = true;
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
        args[arg] = arg.startsWith('...') ? params.slice(index) : params[index];
        return args;
      }, {});
      this.logic.beginCommand(null, null, tool.name);
      result = await this.quest.cmd(tool.name, args);
    } catch (ex) {
      result = ex.stack || ex.message || ex;
    } finally {
      /* Keep the command alive while te result is not a string.
       * It uses with the <termux-input> stuff.
       */
      if (typeof result === 'string') {
        if (result.length) {
          result += '\n';
        }
        await this.endCommand(result);
      }
    }
  }

  async endCommand(result) {
    const prompt = getPrompt(this.user);
    this.logic.endCommand(prompt, result);
  }

  async inputCommand(input) {
    const {state} = this;

    this.logic.inputCommand(input);
    if (!state.inputCommand || !state.cmd || !state.args) {
      return;
    }

    let result = '';
    try {
      result = await this.quest.cmd(state.cmd, {input, ...state.args.toJS()});
    } catch (ex) {
      result = ex.stack || ex.message || ex;
    }
    if (typeof result === 'string') {
      if (result.length) {
        result += '\n';
      }
      await this.endCommand(result);
    }
  }

  async forInputCommand(question, cmd, args) {
    this.logic.forInputCommand(question, cmd, args);
  }

  async forOutputCommand(value) {
    this.logic.forOutputCommand(value);
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

    let desc = await this.quest.cmd(`${name}.$tool`, {tool});
    if (items.length === 1) {
      this.logic.askForCompletion(prompt, input, Object.keys(desc));
      return;
    }

    let cmds = Object.keys(desc);
    items.shift();

    for (const item of items) {
      if (item in desc) {
        desc = desc[item];
        if (!Array.isArray(desc)) {
          cmds = Object.keys(desc);
          continue;
        }
        cmds = [
          'Arguments:',
          ...desc.map((obj) =>
            Object.entries(obj)
              .map(([k, v]) => `${k}:${v}`)
              .join(' ')
          ),
        ];
        break;
      }
      const slice = items.slice(0, -1).join(' ');
      cmds = cmds
        .filter((option) => option.startsWith(item))
        .map((option) => `${tool} ${slice.length ? `${slice} ` : ''}${option}`);
    }

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

  async signal(signal) {
    if (signal !== 'SIGINT') {
      throw new Error(`Unsupported signal: ${signal}`);
    }
    const {state} = this;
    if (!state.toolName) {
      return;
    }
    const {resp} = this.quest;
    const signalCommand = `${state.toolName}$signal`;
    if (state.toolName && resp.hasCommand(signalCommand)) {
      let result = await this.quest.cmd(signalCommand, {signal});
      if (typeof result === 'string') {
        result += `Received ${signal}`;
        if (result.length) {
          result += '\n';
        }
        await this.endCommand(result);
      }
    }
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

  async buslog$tool(horde, verbosityLevel, ...moduleNames) {
    const {topology} = require('xcraft-core-etc')().load('xcraft-core-horde');
    const _xcraftRPC = topology?.[horde]?.passive;

    /* FIXME: must be moved on the server side */
    if (_xcraftRPC && this.user.rank !== 'admin') {
      throw new Error('Forbidden');
    }

    verbosityLevel = parseInt(verbosityLevel);
    if (verbosityLevel >= 0 && verbosityLevel < 4) {
      await this.quest.cmd(`buslog.${horde}.verbosity`, {
        level: verbosityLevel,
        _xcraftRPC,
      });
    }
    if (Array.isArray(moduleNames)) {
      moduleNames = moduleNames.filter((entry) => !!entry);
      await this.quest.cmd(`buslog.${horde}.modulenames`, {
        modulenames: moduleNames,
        _xcraftRPC,
      });
    }
    return '';
  }

  async $tool(tool) {
    if (tool === 'man') {
      return {
        ...Object.keys(this._tools).reduce((obj, tool) => {
          obj[tool] = null;
          return obj;
        }, {}),
      };
    }
    if (tool === 'buslog') {
      const {resp} = this.quest;
      const registry = resp.getCommandsRegistry();
      return Object.keys(registry)
        .filter((cmd) => /^buslog[.][^.]+[.]verbosity$/.test(cmd))
        .reduce((autocomp, cmd) => {
          autocomp[cmd.split('.')[1]] = {
            '0': null,
            '1': null,
            '2': null,
            '3': null,
          };
          return autocomp;
        }, {});
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
