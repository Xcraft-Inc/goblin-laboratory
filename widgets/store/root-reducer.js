import {combineReducers} from 'redux';
import {routerReducer} from 'react-router-redux';
import {combineForms} from 'react-redux-form/immutable';
import backendReducer from 'laboratory/store/backend-reducer';

/*export default widgets => {
  let forms = {};
  if (widgets) {
    widgets.forEach ((v, k) => (forms[k] = v));
  }
  return combineReducers ({
    routing: routerReducer,
    backend: combineForms (forms, 'backend'),
  });
};*/
export default combineReducers ({
  routing: routerReducer,
  backend: backendReducer,
});
