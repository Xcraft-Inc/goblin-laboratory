'use strict';

const {expect} = require('chai');
const path = require('node:path');
const {Elf} = require('xcraft-core-goblin/lib/test.js');
const {TermuxLogic, Termux} = require('../lib/termux.js');

describe('goblin.laboratory.termux.command', function () {
  it('history', function () {
    const termuxLogic = Elf.trial(TermuxLogic);

    termuxLogic.beginCommand('$', 'cmd1', []);
    termuxLogic.endCommand('done 1');
    expect(termuxLogic.state.history.length).to.be.equal(2);
    expect(termuxLogic.state.history[0]).to.be.equal('$ cmd1 ');
    expect(termuxLogic.state.history[1]).to.be.equal('done 1');

    termuxLogic.beginCommand('$', 'cmd2', []);
    termuxLogic.endCommand('done 2');
    expect(termuxLogic.state.history.length).to.be.equal(4);
    expect(termuxLogic.state.history[2]).to.be.equal('$ cmd2 ');
    expect(termuxLogic.state.history[3]).to.be.equal('done 2');
  });
});

describe('goblin.laboratory.termux.completion', function () {
  let runner;

  this.beforeAll(function () {
    runner = new Elf.Runner();
    runner.init();
  });

  this.afterAll(function () {
    runner.dispose();
  });

  it('history', async function () {
    this.timeout(process.env.NODE_ENV === 'development' ? 1000000 : 40000);

    /** @this {Elf} */
    async function test() {
      const xBus = require('xcraft-core-bus');
      await xBus.loadModule(
        this.quest.resp,
        ['termux.js'],
        path.join(__dirname, '..'),
        {}
      );

      let state;
      const termux = new Termux(this);

      await termux.init();

      await termux.beginCommand('$', 'cmd1', []);
      await termux.endCommand('done 1');
      await termux.beginCommand('$', 'cmd2', []);
      await termux.endCommand('done 2');

      //////////////////////////////////////////////////////////////////////////

      await termux.setFromHistory(true, 'cmd2 '); // UP
      state = await this.quest.getState('termux');
      expect(state.get('completion')).to.be.equal('cmd1');

      await termux.setFromHistory(true, 'cmd1 '); // UP (roof)
      state = await this.quest.getState('termux');
      expect(state.get('completion')).to.be.equal('cmd1');

      await termux.setFromHistory(false, 'cmd1 '); // DOWN
      state = await this.quest.getState('termux');
      expect(state.get('completion')).to.be.equal('cmd2');

      await termux.setFromHistory(false, 'cmd2 '); // DOWN (ground)
      state = await this.quest.getState('termux');
      expect(state.get('completion')).to.be.equal('<empty>');

      //////////////////////////////////////////////////////////////////////////

      await termux.setFromHistory(true, 'cmd3 '); // UP
      state = await this.quest.getState('termux');
      expect(state.get('completion')).to.be.equal('<empty>');

      await termux.setFromHistory(false, 'cmd3 '); // DOWN
      state = await this.quest.getState('termux');
      expect(state.get('completion')).to.be.equal('<empty>');
    }

    await runner.it(test);
  });
});
