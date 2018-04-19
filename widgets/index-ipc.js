import 'react-hot-loader/patch';
if (process.env.NODE_ENV !== 'production') {
  require('./devtools.js');
}

import React from 'react';
import ReactDOM from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import Root from 'laboratory/root';
import createHistory from 'history/createHashHistory';
import {push} from 'react-router-redux';

const ipcRenderer = require('electron').ipcRenderer;
const history = createHistory();
//import Hello from 'venture-trade-company/hello';
import configureStore from 'laboratory/store/store';

const store = configureStore(window.__INITIAL_STATE__, history, {
  name: 'electron',
  send: ipcRenderer.send,
});

ipcRenderer.on('PUSH_PATH', (event, path) => {
  store.dispatch(push(path));
});

ipcRenderer.on('DISPATCH_IN_APP', (event, action) => {
  store.dispatch(action);
});

const wid = require('electron').remote.getCurrentWindow().id;
ipcRenderer.send('FRONT_END_READY', wid);

let rootMounted = false;
let labId;

// Must be the last event to subscribe because it sends the FRONT_END_READY msg
ipcRenderer.on('NEW_BACKEND_STATE', (event, transitState) => {
  store.dispatch({
    type: 'NEW_BACKEND_STATE',
    data: transitState.state,
  });

  if (!rootMounted) {
    const state = store.getState().backend;

    if (
      state.some((v, k) => {
        const ns = k.replace(/([^@]+)@.*/, '$1');
        if (ns !== 'laboratory') {
          return false;
        }
        labId = k;
        return true;
      })
    ) {
      main(Root);
      rootMounted = true;
      ipcRenderer.send('LABORATORY_READY', labId);
    }
  }
});

const main = Main => {
  ReactDOM.render(
    <AppContainer>
      <Main store={store} history={history} labId={labId} />
    </AppContainer>,
    document.getElementById('root')
  );
};

if (module.hot) {
  module.hot.accept();
  ipcRenderer.send('RESEND');
}

main(() => <span>Empty Laboratory</span>);
