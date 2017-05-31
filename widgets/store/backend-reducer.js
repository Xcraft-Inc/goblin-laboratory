import patch from 'immutablepatch';
import {fromJS} from 'immutable';

export default (state = fromJS ({}), action = {}) => {
  if (action.type === 'NEW_BACKEND_STATE') {
    const diff = action.diff;
    if (!diff) {
      return state;
    }
    const newAppState = patch (state, diff);
    return newAppState;
  }
  return state;
};
