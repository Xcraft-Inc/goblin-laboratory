import patch from 'immutablepatch';
import {fromJS} from 'immutable';
import transit from 'transit-immutable-js';

export default (state = fromJS ({}), action = {}) => {
  if (action.type === 'NEW_BACKEND_STATE') {
    if (!action.data) {
      return state;
    }
    const newState = transit.fromJSON (action.data.state);
    return action.data._xcraftPatch ? patch (state, newState) : newState;
  }
  return state;
};
