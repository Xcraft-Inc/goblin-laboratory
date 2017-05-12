import {combineReducers} from 'redux';
import {routerReducer} from 'react-router-redux';
import backendReducer from 'laboratory/backend-reducer';

export default combineReducers ({
  backend: backendReducer,
  routing: routerReducer,
});
