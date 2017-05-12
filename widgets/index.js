require ('react-hot-loader/patch');
import React from 'react';
import ReactDOM from 'react-dom';
import {AppContainer} from 'react-hot-loader';
//import Root from 'laboratory/root';
import Hello from 'venture-trade-company/hello';

//const store = configureStore (window.__INITIAL_STATE__);
const ipcRenderer = require ('electron').ipcRenderer;
ipcRenderer.on ('PUSH_PATH', (event, path) => {
  store.dispatch (push (path));
});

ipcRenderer.on ('DISPATCH_IN_APP', (event, action) => {
  store.dispatch (action);
});

let backendLoaded = false;
// Must be the last event to subscribe because it sends the FRONT_END_READY msg
ipcRenderer.on ('NEW_BACKEND_STATE', (event, state, from) => {
  store.dispatch ({
    type: 'NEW_BACKEND_STATE',
    newAppState: state,
  });
  if (backendLoaded === false && from === 'main') {
    ipcRenderer.send ('FRONT_END_READY');
    backendLoaded = true;
    return;
  }
});

const main = Component => {
  ReactDOM.render (
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById ('root')
  );
};

if (module.hot) {
  module.hot.accept ();
}

// main (() => <span>Empty Laboratory</span>);
main (Hello);
