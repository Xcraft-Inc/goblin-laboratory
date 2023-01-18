// prettier-ignore
const defaultConfig = {
  'tasks':         require.context('../../../../node_modules/', true, /\/widgets\/[^/]+\/tasks\.js$/),
  'view':          require.context('../../../../node_modules/', true, /\/widgets\/[^/]+\/view\.js$/),
  'partial':       require.context('../../../../node_modules/', true, /\/widgets\/[^/]+\/partial\.js$/),
  'styles':        require.context('../../../../node_modules/', true, /\/widgets\/[^/]+\/styles\.js$/),
  'widget':        require.context('../../../../node_modules/', true, /\/widgets\/[^/]+\/widget\.js$/),
  'ui':            require.context('../../../../node_modules/', true, /\/widgets\/[^/]+\/ui\.js$/),
  'reducer':       require.context('../../../../node_modules/', true, /\/widgets\/[^/]+\/reducer\.js$/),
  'compensator':   require.context('../../../../node_modules/', true, /\/widgets\/[^/]+\/compensator\.js$/),
  'theme-context': require.context('../../../../node_modules/', true, /\/widgets\/theme-context\/index\.js$/),
  'file':          null,
  'tutorials':     null,
};

export default defaultConfig;
