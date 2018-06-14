import {combineReducers} from 'redux';
import backendReducer from 'laboratory/store/backend-reducer';
import commandsReducer from 'laboratory/store/commands-reducer';
import widgetsReducer from 'laboratory/store/widgets-reducer';
import Shredder from 'xcraft-core-shredder';
import {createForms} from 'react-redux-form/immutable';
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
    return state.merge({location: payload});
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
    let newBackend = Object.assign({}, state.backend);
    const fullState = action.model.getState();

    for (const f of Object.keys(state.backend).filter(
      k => blackList.indexOf(k) === -1
    )) {
      if (!fullState.backend.has(f)) {
        if (newBackend[f]) {
          delete newBackend[f];
        }
      }
    }

    if (state.backend && state.backend.$form) {
      const newInitialValue = Object.assign(
        {},
        state.backend.$form.initialValue
      );

      for (const f of Object.keys(state.backend.$form.initialValue)) {
        if (!fullState.backend.has(f)) {
          if (newInitialValue[f]) {
            delete newInitialValue[f];
          }
        }
      }

      const newValue = Object.assign({}, state.backend.$form.value);

      for (const f of Object.keys(state.backend.$form.value).filter(
        k => blackList.indexOf(k) === -1
      )) {
        if (!fullState.backend.has(f)) {
          if (newValue[f]) {
            delete newValue[f];
          }
        }
      }

      const newForm = Object.assign({}, state.backend.$form);
      newForm.initialValue = newInitialValue;
      newForm.value = newValue;
      newBackend.$form = newForm;
    }

    return Object.assign(state, {backend: newBackend});
  }
  return state;
};

export default combineReducers({
  routing: routerReducer,
  commands: commandsReducer,
  backend: backendReducer,
  ...createForms({backend: backendReducer}, '', {
    plugins: [resetPlugin],
  }),
  widgets: widgetsReducer,
});
