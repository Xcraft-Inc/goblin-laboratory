'use strict';

const {expect} = require('chai');
const {Elf} = require('xcraft-core-goblin/lib/test.js');

describe('goblin.laboratory.termux', function () {
  const {TermuxLogic} = require('../lib/termux.js');

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
