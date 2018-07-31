import {fromJS} from 'immutable';
import transit from 'transit-immutable-js';

export default (state = fromJS({}), action = {}) => {
  if (action.type === 'NEW_BACKEND_INFOS') {
    if (!action.data) {
      return state;
    }
    const newState = transit.fromJSON(action.data);
    return state.set(newState.service, newState.infos);
  }

  return state;
};
