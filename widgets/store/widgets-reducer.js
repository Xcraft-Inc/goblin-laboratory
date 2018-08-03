import {fromJS} from 'immutable';
import importer from '../importer/';

const reducerImporter = importer('reducer');

export default (state = fromJS({}), action = {}) => {
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
