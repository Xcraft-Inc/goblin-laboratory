const path = require('path');
const fs = require('fs');

module.exports = (location, mainGoblinModule) => {
  const alias = {};

  // HACK: should be placed in goblin-nabu webpack config (see issue #189)
  const nabuT = path.resolve(
    location,
    'goblin-nabu',
    'widgets/helpers/t-frontend.js'
  );
  if (fs.existsSync(nabuT)) {
    alias.t = nabuT;
  }

  let importerPath = path.join(
    location,
    'goblin-laboratory/widgets/importer/index.js'
  );
  if (mainGoblinModule) {
    const customImporterPath = path.join(
      location,
      mainGoblinModule,
      'widgets/importer/index.js'
    );
    if (fs.existsSync(customImporterPath)) {
      importerPath = customImporterPath;
    }
  }
  alias['goblin_importer'] = importerPath;

  return {
    alias,
  };
};
