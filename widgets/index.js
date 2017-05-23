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

const wid = require ('electron').remote.getCurrentWindow ().id;
console.log ('Init WM');
console.log (`Sending FRONT_END_READY for window ${wid}`);
ipcRenderer.send ('FRONT_END_READY', wid);

let rootMounted = false;
let labId;

// Must be the last event to subscribe because it sends the FRONT_END_READY msg
ipcRenderer.on ('NEW_BACKEND_STATE', (event, transitState) => {
  console.log ('Received new state from backend');
  const state = transit.fromJSON (transitState);
  console.dir (state);

  store.dispatch ({
    type: 'NEW_BACKEND_STATE',
    newAppState: state,
  });

  if (!rootMounted) {
    if (
      state.some ((v, k) => {
        const ns = k.replace (/([^@]+)@.*/, '$1');
        if (ns !== 'laboratory') {
          return false;
        }
        labId = k;
        return true;
      })
    ) {
      console.log ('Starting laboratory:');
      console.dir (labId);
      main (Root);
      rootMounted = true;
      ipcRenderer.send ('LABORATORY_READY', labId, wid);
    }
  }
});

const main = Main => {
  ReactDOM.render (
    <AppContainer>
      <Main store={store} history={history} labId={labId} />
    </AppContainer>,
    document.getElementById ('root')
  );
};

if (module.hot) {
  module.hot.accept ();
  ipcRenderer.send ('RESEND', wid);
}

main (() => <span>Empty Laboratory</span>);
