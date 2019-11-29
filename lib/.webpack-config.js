const path = require('path');
const fs = require('fs');
const xFs = require('xcraft-core-fs');

module.exports = (location, mainGoblinModule) => {
  const alias = {};

  xFs
    .lsall(location, true)
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
      if (key === 'nabu') {
        // HACK: should be placed in goblin-nabu webpack config (see issue #189)
        alias.t = path.resolve(location, name, 'helpers/t-frontend.js');
      }
    });

  const importerPath = path.join(
    location,
    mainGoblinModule,
    'widgets/importer/index.js'
  );
  alias['goblin/importer'] = fs.existsSync(importerPath)
    ? importerPath
    : path.join(location, 'goblin-laboratory/widgets/importer/index.js');

  return {
    alias,
  };
};
