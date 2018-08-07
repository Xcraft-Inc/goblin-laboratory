import patch from 'immutablepatch';
import {fromJS} from 'immutable';

export default (state = fromJS({}), action = {}) => {
  if (action.type === 'NEW_BACKEND_STATE') {
    if (!action.data) {
      return state;
    }
    return action.data.get('_xcraftPatch')
      ? patch(state, action.data.get('state'))
      : action.data.get('state');
  }

  return state;
};
