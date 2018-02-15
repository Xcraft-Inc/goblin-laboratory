import 'react-hot-loader/patch';
import React from 'react';
import ReactDOM from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import Root from 'laboratory/root';
import createHistory from 'history/createHashHistory';
import {push} from 'react-router-redux';

const history = createHistory ();
//import Hello from 'venture-trade-company/hello';
import configureStore from 'laboratory/store/store';

const socket = new WebSocket ('ws://localhost:8000');
const store = configureStore (window.__INITIAL_STATE__, history, {
  name: 'ws',
  send: socket.send.bind (socket),
});

const handleNewBackendState = transitState => {
  store.dispatch ({
    type: 'NEW_BACKEND_STATE',
    data: transitState,
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
      main (Root);
      rootMounted = true;
      socket.send (
        JSON.stringify ({type: 'LABORATORY_READY', labId, wid: 'web'})
      );
    }
  }
};

socket.onmessage = function (event) {
  const data = JSON.parse (event.data);
  switch (data.type) {
    case 'PUSH_PATH':
      store.dispatch (push (data.path));
      return;
    case 'DISPATCH_IN_APP':
      store.dispatch (data.action);
      return;
    case 'NEW_BACKEND_STATE':
      handleNewBackendState (data.transitState);
      return;
  }
};

socket.onopen = function () {
  socket.send (JSON.stringify ({type: 'FRONT_END_READY', wid: 'web'}));
};

let rootMounted = false;
let labId;

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
  socket.send (JSON.stringify ({type: 'RESEND'}));
}

main (() => <span>Empty Laboratory</span>);
