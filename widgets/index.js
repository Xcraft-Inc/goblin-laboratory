require ('react-hot-loader/patch');
require ('./devtools.js');

import transit from 'transit-immutable-js';
import React from 'react';
import ReactDOM from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import Root from 'laboratory/root';
import createHistory from 'history/createHashHistory';
import {push} from 'react-router-redux';

const history = createHistory ();
//import Hello from 'venture-trade-company/hello';
import configureStore from 'laboratory/store/store';
const store = configureStore (window.__INITIAL_STATE__, history);

const ipcRenderer = require ('electron').ipcRenderer;
ipcRenderer.on ('PUSH_PATH', (event, path) => {
  console.log (`Received a PUSH_PATH to ${path}`);
  store.dispatch (push (path));
});

ipcRenderer.on ('DISPATCH_IN_APP', (event, action) => {
  store.dispatch (action);
});

let backendLoaded = false;
let rootMounted = false;
let wid = null;
// Must be the last event to subscribe because it sends the FRONT_END_READY msg
ipcRenderer.on ('NEW_BACKEND_STATE', (event, transitState, from) => {
  const state = transit.fromJSON (transitState);
  store.dispatch ({
    type: 'NEW_BACKEND_STATE',
    newAppState: state,
  });
  if (backendLoaded === false && from === 'main') {
    console.log ('Init WM');
    console.dir (state.toJS ());
    wid = state.toJS ().wid;
    if (!wid) {
      throw new Error ('No window id provided');
    }
    console.log (`Sending FRONT_END_READY for window ${wid}`);
    ipcRenderer.send ('FRONT_END_READY', wid);
    backendLoaded = true;
    return;
  }

  if (!rootMounted) {
    main (Root);
    rootMounted = true;
    ipcRenderer.send ('LABORATORY_READY', wid);
  }
});

const main = Main => {
  ReactDOM.render (
    <AppContainer>
      <Main store={store} history={history} />
    </AppContainer>,
    document.getElementById ('root')
  );
};

if (module.hot) {
  module.hot.accept ();
  if (wid) {
    console.log ('Requesing a resend...');
    ipcRenderer.send ('RESEND', wid);
  }
}

main (() => <span>Empty Laboratory</span>);
