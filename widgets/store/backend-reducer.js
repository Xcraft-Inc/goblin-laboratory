//T:2019-02-27
import {fromJS} from 'immutable';
import Shredder from 'xcraft-core-shredder';
import importer from 'goblin_importer';

const compensatorImporter = importer('compensator');

function injectActionDataGetter(action) {
  action.get = (key) => {
    if (action.data) {
      if (Shredder.isImmutable(action.data[key])) {
        return new Shredder(action.data[key]);
      }
      return action.data[key];
    }
    return null;
  };
}

let prevState = fromJS({});

/* Apply compensators with a debounce of 500ms */
function applyCompensators(state, action) {
  const ids = Object.keys(action.compensatorStates);
  if (!ids.length) {
    return state;
  }

  const timestamp = new Date().getTime() - 500;

  ids.forEach((id) => {
    const comp = action.compensatorStates[id];
    if (timestamp > comp.timestamp) {
      delete action.compensatorStates[id];
    }

    if (!action.data) {
      return;
    }

    const serviceState = state.get(id);
    const newServiceState = comp.reducer(
      new Shredder(serviceState),
      comp.action
    );

    state = state.set(id, newServiceState.state);
  });

  return state;
}

export default (state = fromJS({}), action = {}) => {
  // Compensate field change
  if (action.type === 'FIELD-CHANGED' && action.path.startsWith('backend.')) {
    const path = action.path.split('.').slice(1);
    return state.setIn(path, Shredder.toImmutable(action.value));
  }

  if (action.type === 'COMPENSATORS') {
    return applyCompensators(prevState, action);
  }

  if (action.type === 'NEW_BACKEND_STATE') {
    if (!action.data) {
      return state;
    }

    const generation = action.data.generation;
    const nextGeneration = action.nextGeneration;

    if (generation === nextGeneration) {
      state = action.data._xcraftPatch
        ? Shredder.applyPatches(state, prevState, action.data)
        : action.data.state;
      prevState = state;
    }

    return applyCompensators(state, action);
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
      action.compensatorStates[action.data.id] = {
        action: newAction,
        reducer,
        timestamp: new Date().getTime(),
      };
      const newBackendState = state.set(action.data.id, newServiceState);
      return newBackendState.state;
    }
    return state;
  }

  return state;
};
