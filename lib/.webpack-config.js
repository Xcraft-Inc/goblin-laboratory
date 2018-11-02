const path = require('path');
const xFs = require('xcraft-core-fs');

module.exports = location => {
  const alias = {};

  xFs
    .lsall(location)
    .filter(file =>
      /.*[\\/](goblin|xcraft)-[a-z0-9-]+[\\/]widgets[\\/].*\.jsx?$/.test(file)
    )
    .map(file => {
      return file.replace(/.*[\\/]((?:goblin|xcraft)-[a-z0-9-]+).*/, '$1');
    })
    .forEach(mod => {
      const name = `${mod}/widgets/`;
      const key = mod.replace(/[^-]+-(.*)/, '$1');
      if (!alias[key]) {
        alias[key] = path.resolve(location, name);
      }
    });

  return {
    alias,
  };
};
