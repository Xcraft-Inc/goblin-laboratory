import patch from 'immutablepatch';
import {fromJS} from 'immutable';
import Shredder from 'xcraft-core-shredder';
import importer from '../importer/';
const compensatorImporter = importer('compensator');
function injectActionDataGetter(action) {
  action.get = key => {
    if (action.data) {
      if (Shredder.isImmutable(action.data[key])) {
        return new Shredder(action.data[key]);
      }
      return action.data[key];
    }
    return null;
  };
}
export default (state = fromJS({}), action = {}) => {
  if (action.type === 'NEW_BACKEND_STATE') {
    if (!action.data) {
      return state;
    }
    return action.data.get('_xcraftPatch')
      ? patch(state, action.data.get('state'))
      : action.data.get('state');
  }

  if (action.type === 'QUEST') {
    const info = action.cmd.split('.');
    const widget = info[0];
    const _type = info[1];
    let reducer = null;

    if (widget.endsWith('-plugin')) {
      reducer = compensatorImporter('plugin');
    } else {
      reducer = compensatorImporter(widget);
    }

    if (reducer) {
      state = new Shredder(state);
      const backendState = state.get(action.data.id);
      const newAction = {
        type: _type,
        data: action.data,
      };
      injectActionDataGetter(newAction);
      const newServiceState = reducer(backendState, newAction);
      const newBackendState = state.set(action.data.id, newServiceState);
      return newBackendState.state;
    }
    return state;
  }

  return state;
};
