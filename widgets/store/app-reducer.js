import {fromJS} from 'immutable';
import importer from 'goblin_importer';

const appReducerImporter = importer('app-reducer');
const wrappedReducers = {};

const wrapReducer = (reducer) => (state, action) => {
  return reducer(state, action);
};

function getWrappedReducer(appName) {
  let wrappedReducer = wrappedReducers[appName];
  if (!wrappedReducer) {
    const reducer = appReducerImporter(appName);
    if (!reducer) {
      return null;
    }
    wrappedReducer = wrapReducer(reducer);
    wrappedReducers[appName] = wrappedReducer;
  }
  return wrappedReducer;
}

function getReducerForAction(action) {
  const reducer = getWrappedReducer(action._appName);
  if (reducer) {
    return reducer;
  }

  throw new Error(
    `No app reducer for app name "${
      action._appName
    }" found. Action:\n${JSON.stringify(action)}`
  );
}

export default (state = fromJS({}), action = {}) => {
  // filter any other action
  if (!action._appName) {
    return state;
  }

  const wrappedReducer = getReducerForAction(action);

  let _state = state.get(action._appName, undefined);
  _state = wrappedReducer(_state, action);
  return state.set(action._appName, _state);
};
