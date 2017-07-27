import path from 'path';

const cache = {};

const importAll = (kind, r) => {
  const files = r.keys ();

  cache[kind] = {};

  files.forEach (file => {
    const nameSpace = path.basename (path.dirname (file));
    cache[kind][nameSpace] = r (file);
  });
};

const getter = kind => name => {
  if (!cache[kind][name]) {
    return null;
  }
  return cache[kind][name].default;
};

export default kind => {
  if (cache[kind]) {
    return getter (kind);
  }

  switch (kind) {
    case 'tasks':
      importAll (kind, require.context ('../../../', true, /\/tasks\.js$/));
      break;
    case 'view':
      importAll (kind, require.context ('../../../', true, /\/view\.js$/));
      break;
    case 'partial':
      importAll (kind, require.context ('../../../', true, /\/partial\.js$/));
      break;
    case 'styles':
      importAll (kind, require.context ('../../../', true, /\/styles\.js$/));
      break;
    case 'widget':
      importAll (kind, require.context ('../../../', true, /\/widget\.js$/));
      break;
    default:
      throw new Error (`Unsupported kind: ${kind} for importer`);
  }

  return getter (kind);
};
