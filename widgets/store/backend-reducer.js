import {fromJS} from 'immutable';

function backendReducer (state = {}, action = {}) {
  if (action.type === 'NEW_BACKEND_STATE') {
    return action.newAppState;
  }
  return state;
}
export default backendReducer;
