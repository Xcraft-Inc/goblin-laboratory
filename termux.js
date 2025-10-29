const {Elf} = require('xcraft-core-goblin');
const {Termux, TermuxLogic} = require('./lib/termux.js');

exports.xcraftCommands = Elf.birth(Termux, TermuxLogic);
