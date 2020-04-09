import path from 'path';

export default function importer(config) {
  const cache = {};

  const importAll = (kind, r) => {
    cache[kind] = {};

    if (r) {
      const files = r.keys();
      files.forEach((file) => {
        const nameSpace =
          kind === 'theme-context'
            ? file.replace(/.*[\\/.]goblin-([^\\/]+).*/, '$1')
            : path.basename(path.dirname(file));
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
    return cache[kind][name].default;
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
