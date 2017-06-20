require ('react-hot-loader/patch');
if (process.env.NODE_ENV === 'development') {
  require ('./devtools.js');
}

import transit from 'transit-immutable-js';
import React from 'react';
import ReactDOM from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import Root from 'laboratory/root';
import {Theme} from 'electrum-theme';
import createHistory from 'history/createHashHistory';
import {push} from 'react-router-redux';

const history = createHistory ();
//import Hello from 'venture-trade-company/hello';
import configureStore from 'laboratory/store/store';
const store = configureStore (window.__INITIAL_STATE__, history);

//LYDIA TEST PURPOSE
import LydiaProxy from 'lydia-workflow/lydia-proxy/widget';
let res = null;
/*LydiaProxy ('http://localhost:7777/', methods => {
  res = methods;
}).then (hub => hub.send ('Ping', 'Hello from goblins!'));*/

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
  const diff = transit.fromJSON (transitState);

  store.dispatch ({
    type: 'NEW_BACKEND_STATE',
    diff: diff,
  });

  if (!rootMounted) {
    const state = store.getState ().backend;

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

// THEMES
const themes = [
  'default',
  'compact-mono',
  'default-green',
  'special-green',
  'smooth-green',
  'compact-pink',
  'default-pink',
];
window.CURRENT_THEME_INDEX = 0;

const main = Main => {
  const currentTheme = themes[window.CURRENT_THEME_INDEX % themes.length];
  ReactDOM.render (
    <AppContainer>
      <Main
        store={store}
        history={history}
        theme={Theme.create (currentTheme)}
        labId={labId}
      />
    </AppContainer>,
    document.getElementById ('root')
  );
};

if (module.hot) {
  module.hot.accept ();
  ipcRenderer.send ('RESEND', wid);
}

main (() => <span>Empty Laboratory</span>);
