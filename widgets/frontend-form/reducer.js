import Shredder from 'xcraft-core-shredder';

const initialState = new Shredder({});

export default (state = initialState, action = {}) => {
  switch (action.type) {
    case 'INIT': {
      return state.set('', action.initialState);
    }
    case 'CHANGE': {
      return state.set(action.path, action.newValue);
    }
  }
  return state;
};
