import patch from 'immutablepatch';
import {fromJS} from 'immutable';
import Shredder from 'xcraft-core-shredder';
import importer from '../importer/';

const compensatorImporter = importer('compensator');

function injectActionDataGetter(action) {
  action.get = key => {
    if (action.data) {
      if (Shredder.isImmutable(action.data[key])) {
        return new Shredder(action.data[key]);
      }
      return action.data[key];
    }
    return null;
  };
}

const compensatorStates = {};

let prevState = fromJS({});

export default (state = fromJS({}), action = {}) => {
  if (action.type === 'NEW_BACKEND_STATE') {
    if (!action.data) {
      return state;
    }

    const generation = action.data.get('generation');
    const nextGeneration = action.nextGeneration;

    if (generation === nextGeneration) {
      state = action.data.get('_xcraftPatch')
        ? patch(prevState, action.data.get('state'))
        : action.data.get('state');
      prevState = state;
    }

    /* Apply compensators with a debounce of 500ms */
    const timestamp = new Date().getTime() - 500;
    Object.keys(compensatorStates).forEach(id => {
      const comp = compensatorStates[id];
      if (timestamp > comp.timestamp) {
        delete compensatorStates[id];
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
      compensatorStates[action.data.id] = {
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
