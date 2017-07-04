const path = require ('path');
const xFs = require ('xcraft-core-fs');
const location = path.join (__dirname, '../../');
const alias = {};

xFs
  .lsall (location)
  .filter (file =>
    /.*[\\/]goblin-[a-z0-9-]+[\\/]widgets[\\/].*\.jsx?$/.test (file)
  )
  .map (file => {
    return file.replace (/.*[\\/]goblin-([a-z0-9-]+).*/, '$1');
  })
  .forEach (goblin => {
    const name = `../../goblin-${goblin}/widgets/`;
    if (!alias[goblin]) {
      alias[goblin] = path.resolve (__dirname, name);
    }
  });

xFs
  .lsall (location)
  .filter (file =>
    /.*[\\/]xcraft-[a-z0-9-]+[\\/]widgets[\\/].*\.jsx?$/.test (file)
  )
  .map (file => {
    return file.replace (/.*[\\/]xcraft-([a-z0-9-]+).*/, '$1');
  })
  .forEach (xcraft => {
    const name = `../../xcraft-${xcraft}/widgets/`;
    if (!alias[xcraft]) {
      alias[xcraft] = path.resolve (__dirname, name);
    }
  });

module.exports = {
  alias,
};
