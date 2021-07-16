import {fromJS} from 'immutable';

const initialState = fromJS({
  hordes: {},
  hasOverlay: false,
});

export default (state = initialState, action = {}) => {
  if (action.type === 'CONNECTION_STATUS') {
    state = state.setIn(['hordes', action.horde], {
      lag: action.lag,
      delta: action.delta,
      overlay: action.overlay,
      message: action.message,
    });

    const hasOverlay = state.get('hordes').some(({overlay}) => overlay);
    return state.set('hasOverlay', hasOverlay);
  }

  return state;
};
