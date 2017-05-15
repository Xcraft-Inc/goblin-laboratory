/*import {fromJS} from 'immutable';
import transit  from 'transit-immutable-js';

function backendReducer (state = fromJS ({}), action = {}) {
  if (action.type === 'NEW_BACKEND_STATE') {
    return transit.fromJSON (action.newAppState);
  }
  return state;
}
export default backendReducer;*/

export default (state = {}) => state;
