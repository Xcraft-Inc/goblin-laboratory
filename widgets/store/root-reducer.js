import {combineReducers} from 'redux';
import backendReducer from 'goblin-laboratory/widgets/store/backend-reducer';
import commandsReducer from 'goblin-laboratory/widgets/store/commands-reducer';
import networkReducer from 'goblin-laboratory/widgets/store/network-reducer';
import widgetsReducer from 'goblin-laboratory/widgets/store/widgets-reducer';
import appReducer from 'goblin-laboratory/widgets/store/app-reducer';

import Shredder from 'xcraft-core-shredder';
/**
 * This action type will be dispatched when your history
 * receives a location change.
 */
export const LOCATION_CHANGE = '@@router/LOCATION_CHANGE';

const initialState = new Shredder({
  location: null,
}).state;

export function routerReducer(state = initialState, {type, payload} = {}) {
  if (type === LOCATION_CHANGE) {
    return state.merge({
      location: payload.location,
      action: payload.action,
    });
  }

  return state;
}

export default combineReducers({
  router: routerReducer,
  commands: commandsReducer,
  network: networkReducer,
  backend: backendReducer,
  widgets: widgetsReducer,
  app: appReducer,
});
