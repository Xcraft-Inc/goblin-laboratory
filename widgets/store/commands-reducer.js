import {fromJS} from 'immutable';

const initialState = fromJS({
  registry: {},
});

export default (state = initialState, action = {}) => {
  if (action.type === 'COMMANDS_REGISTRY') {
    return state.set('registry', action.commands);
  }

  return state;
};
