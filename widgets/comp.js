let cache = {};

function importAll (r) {
  const files = r.keys ();

  files.forEach (file => {
    const matches = file.match (/([^\/\\]+)\.jsx?$/);
    const fileName = matches[1].replace ('.component', '');
    cache[fileName] = r (file);
  });
}

importAll (require.context ('../../', true, /\.component\.jsx?$/));
export default name => {
  if (!cache[name]) {
    throw new Error (`Unable to find ${name}.component.js(x) in bundle`);
  }
  return cache[name].default;
};
