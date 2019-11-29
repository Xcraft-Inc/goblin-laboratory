import {fromJS} from 'immutable';
import importer from 'goblin/importer';
import Shredder from 'xcraft-core-shredder';

const reducerImporter = importer('reducer');
const wrappedReducers = {};

const actionTypePrefix = '@widgets_';
const findReducerNameRegex = /\$([^@]*)/;

const wrapReducer = reducer => (state, action) => {
  if (state) {
    state = new Shredder(state);
  }
  const nState = reducer(state, action);
  if (Shredder.isShredder(nState)) {
    return nState.state;
  }
  return nState;
};

function findReducerName(action) {
  const matches = action._id.match(findReducerNameRegex);
  if (!matches || !matches[1]) {
    throw new Error(
      `Unable to find a reducer name for action: ${JSON.stringify(action)}`
    );
  }
  return matches[1];
}

function getWrappedReducer(reducerName) {
  let wrappedReducer = wrappedReducers[reducerName];
  if (!wrappedReducer) {
    const reducer = reducerImporter(reducerName);
    if (!reducer) {
      return null;
    }
    wrappedReducer = wrapReducer(reducer);
    wrappedReducers[reducerName] = wrappedReducer;
  }
  return wrappedReducer;
}

function getReducerForAction(action) {
  if (action._type) {
    const reducer = getWrappedReducer(action._type);
    if (reducer) {
      return reducer;
    }
  }

  const reducerName = findReducerName(action);
  const reducer = getWrappedReducer(reducerName);
  if (reducer) {
    return reducer;
  }

  throw new Error(
    `No reducer named "${reducerName}" found. Action:\n${JSON.stringify(
      action
    )}`
  );
}

export default (state = fromJS({}), action = {}) => {
  if (action.type === 'FIELD-CHANGED' && action.path.startsWith('widgets.')) {
    const path = action.path.split('.').slice(1);
    return state.setIn(path, action.value);
  }

  if (action.type === 'WIDGETS_COLLECT') {
    action.ids.forEach(id => {
      state = state.delete(id);
    });
    return state;
  }

  if (!action.type.startsWith(actionTypePrefix)) {
    return state;
  }

  const wrappedReducer = getReducerForAction(action);

  // Remove type prefix
  action = {
    ...action,
    type: action.type.substring(actionTypePrefix.length),
  };

  const id = action._id;
  let _state = state.get(id, undefined);
  _state = wrappedReducer(_state, action);
  return state.set(id, _state);
};
