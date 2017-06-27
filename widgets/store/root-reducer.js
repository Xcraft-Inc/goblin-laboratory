import {combineReducers} from 'redux';
import backendReducer from 'laboratory/store/backend-reducer';
import Shredder from 'xcraft-core-shredder';
/**
 * This action type will be dispatched when your history
 * receives a location change.
 */
export const LOCATION_CHANGE = '@@router/LOCATION_CHANGE';

const initialState = new Shredder ({
  location: null,
}).state;

export function routerReducer (state = initialState, {type, payload} = {}) {
  if (type === LOCATION_CHANGE) {
    return state.merge ({location: payload});
  }

  return state;
}

export default combineReducers ({
  routing: routerReducer,
  backend: backendReducer,
});
