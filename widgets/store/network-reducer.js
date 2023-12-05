import {fromJS} from 'immutable';

const initialState = fromJS({
  hordes: {},
  hasOverlay: false,
});

export default (state = initialState, action = {}) => {
  if (action.type === 'CONNECTION_STATUS') {
    const horde = action.horde;

    ['lag', 'delta', 'overlay', 'message', 'noSocket']
      .filter((key) => action[key] !== undefined)
      .forEach(
        (key) => (state = state.setIn(['hordes', horde, key], action[key]))
      );

    if (action.syncing) {
      Object.keys(action.syncing).forEach(
        (db) =>
          (state = state.setIn(
            ['hordes', horde, 'syncing', db],
            action.syncing[db]
          ))
      );
    }

    const hasOverlay = state.get('hordes').some(({overlay}) => overlay);
    return state.set('hasOverlay', hasOverlay);
  }

  return state;
};
