import path from 'path';

export default function importer(config) {
  const cache = {};

  const importAll = (kind, r) => {
    cache[kind] = {};

    if (r) {
      const files = r.keys();
      files.forEach((file) => {
        let nameSpace;
        switch (kind) {
          case 'tutorials':
          case 'file':
            nameSpace = file.replace(/^[\\/.]+/, '').replace(/\\/g, '/');
            break;
          case 'theme-context':
            nameSpace = file.replace(/.*[\\/.]goblin-([^\\/]+).*/, '$1');
            break;
          default:
            nameSpace = path.basename(path.dirname(file));
            break;
        }
        cache[kind][nameSpace] = r(file);
      });
    }
  };

  const getter = (kind) => (name, key) => {
    if (!cache[kind][name]) {
      return null;
    }
    if (key) {
      return cache[kind][name][key];
    }
    return cache[kind][name].default ?? cache[kind][name];
  };

  return (kind) => {
    if (cache[kind]) {
      return getter(kind);
    }

    if (!(kind in config)) {
      throw new Error(`Unsupported kind: ${kind} for importer`);
    }

    const r = config[kind];
    importAll(kind, r);

    return getter(kind);
  };
}
