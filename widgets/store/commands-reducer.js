import {fromJS} from 'immutable';

export default (state = fromJS({}), action = {}) => {
  if (action.type === 'COMMANDS_REGISTRY') {
    return state.set('registry', action.commands);
  }

  return state;
};
