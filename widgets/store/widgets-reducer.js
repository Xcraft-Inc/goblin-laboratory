import {fromJS} from 'immutable';
import importer from '../importer/';
import Shredder from 'xcraft-core-shredder';

const reducerImporter = importer('reducer');

export default (state = fromJS({}), action = {}) => {
  if (action.type === 'NEW_BACKEND_STATE') {
    if (!action.data) {
      return state;
    }
    if (action.data.get('_xcraftPatch')) {
      action.data
        .get('state')
        .filter(
          op =>
            op.get('op') === 'remove' && state.has(op.get('path').substring(1))
        )
        .forEach(op => {
          const pathToRemove = op.get('path').substring(1);
          state = state.delete(pathToRemove);
        });

      return state;
    }
  }

  if (!action.type.startsWith('@widgets_')) {
    return state;
  }

  const items = action.type.split('_');
  const reducer = reducerImporter(action._type);
  if (!reducer) {
    return state;
  }

  const id = action._id;
  action.type = items[1];
  let _state = state.get(id, undefined);
  _state = reducer(_state, action);
  return state.set(id, _state);
};
