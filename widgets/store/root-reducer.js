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

const blackList = [
  'initialValue',
  'focus',
  'pending',
  '$form',
  'pristine',
  'submitted',
  'submitFailed',
  'retouched',
  'touched',
  'valid',
  'validating',
  'validated',
  'validity',
  'errors',
  'intents',
  'model',
  'value',
];
const resetPlugin = (state, action) => {
  if (action.type === 'rrf/reset') {
    let newState = Object.assign ({}, state.backend);
    const fullState = action.model.getState ();
    for (const f of Object.keys (state.backend).filter (
      k => blackList.indexOf (k) === -1
    )) {
      if (!fullState.backend.has (f)) {
        console.log (f);
        delete newState[f];
      }
    }
    return Object.assign (state, {backend: newState});
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
