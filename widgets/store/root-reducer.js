import {combineReducers} from 'redux';
import {routerReducer} from 'react-router-redux';
import {reducer as formReducer} from 'redux-form';
import backendReducer from 'laboratory/store/backend-reducer';

export default combineReducers ({
  backend: backendReducer,
  routing: routerReducer,
  form: formReducer,
});
