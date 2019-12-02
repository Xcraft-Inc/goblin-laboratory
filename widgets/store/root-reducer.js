import {combineReducers} from 'redux';
import backendReducer from 'goblin-laboratory/widgets/store/backend-reducer';
import infosReducer from 'goblin-laboratory/widgets/store/infos-reducer';
import commandsReducer from 'goblin-laboratory/widgets/store/commands-reducer';
import widgetsReducer from 'goblin-laboratory/widgets/store/widgets-reducer';

import Shredder from 'xcraft-core-shredder';
/**
 * This action type will be dispatched when your history
 * receives a location change.
 */
export const LOCATION_CHANGE = '@@router/LOCATION_CHANGE';

const initialState = new Shredder({
  location: null,
}).state;

export function routerReducer(state = initialState, {type, payload} = {}) {
  if (type === LOCATION_CHANGE) {
    const location = state.get('location');
    if (location) {
      //This complexity:
      //Prevent loosing hash when a nav is initiated in front-end and erased by a backend nav
      const currentLoc = location.get('pathname');
      const currentSearch = location.get('search');
      const currentHash = location.get('hash');

      if (currentHash !== '' && payload.location.hash !== currentHash) {
        return state.merge({
          location: payload.location,
          action: payload.action,
        });
      }

      if (
        currentLoc.startsWith(payload.location.pathname) &&
        (payload.location.search.startsWith(currentSearch) ||
          currentSearch.startsWith(payload.location.search))
      ) {
        // pathname looks similar, we can investigate
        const currentPath = currentLoc.split('/');
        const newPath = payload.location.pathname.split('/');
        const cPl = currentPath.length - 1;
        const nPl = newPath.length - 1;
        if (cPl > nPl) {
          //Current path contains more info (for ex. hinter) in this case, we must skip the nav
          return state.set(
            'location',
            state.get('location').set('search', payload.location.search)
          );
        } else if (cPl === nPl && currentPath[cPl] === newPath[nPl]) {
          //Same path, but same value?
          return state.set(
            'location',
            state.get('location').set('search', payload.location.search)
          );
        }
      }
    }
    return state.merge({location: payload.location, action: payload.action});
  }

  return state;
}

export default combineReducers({
  router: routerReducer,
  commands: commandsReducer,
  infos: infosReducer,
  backend: backendReducer,
  widgets: widgetsReducer,
});
