import patch from 'immutablepatch';
import {fromJS} from 'immutable';
import transit from 'transit-immutable-js';

export default (state = fromJS({}), action = {}) => {
  if (action.type === 'NEW_BACKEND_STATE') {
    if (!action.data) {
      return state;
    }
    const newState = transit.fromJSON(action.data);
    return newState.get('_xcraftPatch')
      ? patch(state, newState.get('state'))
      : newState.get('state');
  }
  return state;
};
