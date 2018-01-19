import {combineReducers} from 'redux';
import backendReducer from 'laboratory/store/backend-reducer';
import Shredder from 'xcraft-core-shredder';
import {createForms} from 'react-redux-form/immutable';
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

const resetPlugin = (state, action) => {
  if (action.type === 'rrf/reset') {
    const form = action.model.formId;
    if (state.backend[form]) {
      let newState = Object.assign ({}, state.backend);
      delete newState[form];
      for (const f of Object.keys (state.backend)) {
        if (action.model.backendEntries.indexOf (f) === -1) {
          delete newState[f];
        }
      }
      return Object.assign (state, {backend: newState});
    }
    return state;
  }
  return state;
};

export default combineReducers ({
  routing: routerReducer,
  backend: backendReducer,
  ...createForms ({backend: backendReducer}, '', {
    plugins: [resetPlugin],
  }),
});
