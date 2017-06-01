let cache = {};

const importAll = (kind, r) => {
  const files = r.keys ();

  files.forEach (file => {
    const matches = file.match (/([^\/\\]+)\.jsx?$/);
    const fileName = matches[1].replace (`.${kind}`, '');
    cache[kind][fileName] = r (file);
  });
};

const getter = kind => name => {
  if (!cache[kind][name]) {
    return null;
  }
  return cache[kind][name].default;
};

export default kind => {
  cache[kind] = {};
  switch (kind) {
    case 'view':
      importAll (kind, require.context ('../../', true, /\.view\.jsx?$/));
      break;
    case 'styles':
      importAll (kind, require.context ('../../', true, /\.styles\.jsx?$/));
      break;
    default:
      throw new Error (`Unsupported kind: ${kind} for importer`);
  }
  return getter (kind);
};
