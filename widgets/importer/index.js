import importer from './importer.js';

// prettier-ignore
const defaultConfig = {
  'tasks': require.context('../../../', true, /\/widgets\/[^/]+\/tasks\.js$/),
  'view': require.context('../../../', true, /\/widgets\/[^/]+\/view\.js$/),
  'partial': require.context('../../../', true, /\/widgets\/[^/]+\/partial\.js$/),
  'styles': require.context('../../../', true, /\/widgets\/[^/]+\/styles\.js$/),
  'widget': require.context('../../../', true, /\/widgets\/[^/]+\/widget\.js$/),
  'ui': require.context('../../../', true, /\/widgets\/[^/]+\/ui\.js$/),
  'reducer': require.context('../../../', true, /\/widgets\/[^/]+\/reducer\.js$/),
  'compensator': require.context('../../../', true, /\/widgets\/[^/]+\/compensator\.js$/),
  'theme-context': require.context('../../..', true, /\/widgets\/theme-context\/index\.js$/),
};

export default importer(defaultConfig);
