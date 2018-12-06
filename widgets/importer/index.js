import path from 'path';

const cache = {};

const importAll = (kind, r) => {
  const files = r.keys();

  cache[kind] = {};

  files.forEach(file => {
    const nameSpace =
      kind === 'theme-context'
        ? file.replace(/.*[\\/.]goblin-([^\\/]+).*/, '$1')
        : path.basename(path.dirname(file));
    cache[kind][nameSpace] = r(file);
  });
};

const getter = kind => (name, key) => {
  if (!cache[kind][name]) {
    return null;
  }
  if (key) {
    return cache[kind][name][key];
  }
  return cache[kind][name].default;
};

export default kind => {
  if (cache[kind]) {
    return getter(kind);
  }

  switch (kind) {
    case 'tasks':
      importAll(
        kind,
        require.context('../../../', true, /\/widgets\/[^/]+\/tasks\.js$/)
      );
      break;
    case 'view':
      importAll(
        kind,
        require.context('../../../', true, /\/widgets\/[^/]+\/view\.js$/)
      );
      break;
    case 'partial':
      importAll(
        kind,
        require.context('../../../', true, /\/widgets\/[^/]+\/partial\.js$/)
      );
      break;
    case 'styles':
      importAll(
        kind,
        require.context('../../../', true, /\/widgets\/[^/]+\/styles\.js$/)
      );
      break;
    case 'widget':
      importAll(
        kind,
        require.context('../../../', true, /\/widgets\/[^/]+\/widget\.js$/)
      );
      break;
    case 'ui':
      importAll(
        kind,
        require.context('../../../', true, /\/widgets\/[^/]+\/ui\.js$/)
      );
      break;
    case 'reducer':
      importAll(
        kind,
        require.context('../../../', true, /\/widgets\/[^/]+\/reducer\.js$/)
      );
      break;
    case 'compensator':
      importAll(
        kind,
        require.context('../../../', true, /\/widgets\/[^/]+\/compensator\.js$/)
      );
      break;
    case 'theme-context':
      importAll(
        kind,
        require.context(
          '../../..',
          true,
          /\/widgets\/theme-context\/index\.js$/
        )
      );
      break;
    default:
      throw new Error(`Unsupported kind: ${kind} for importer`);
  }

  return getter(kind);
};
