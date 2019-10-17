if (process.env.NODE_ENV !== 'production') {
  require('./devtools.js');
}

import React from 'react';
import ReactDOM from 'react-dom';
import Root from 'laboratory/root';
import {createHashHistory} from 'history';
import {push} from 'connected-react-router/immutable';
const history = createHashHistory();
import configureStore from 'laboratory/store/store';

class Renderer {
  constructor(send, wid) {
    this.wid = wid;
    this.send = send;
    this.push = push;
    this._store = configureStore(
      window.__INITIAL_STATE__,
      history,
      this.send,
      this.wid
    );

    document.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();

      const filePaths = [];
      for (const file of e.dataTransfer.files) {
        filePaths.push(file.path);
      }

      if (filePaths.length) {
        send('DATA_TRANSFER', {filePaths});
      }
    });

    document.addEventListener('dragover', e => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    });
  }

  get store() {
    return this._store;
  }

  newBackendState(transitState) {
    this.store.dispatch({
      type: 'NEW_BACKEND_STATE',
      data: transitState,
      renderer: this,
    });
  }

  newBackendInfos(transitState) {
    this.store.dispatch({
      type: 'NEW_BACKEND_INFOS',
      data: transitState,
    });
  }

  main(labId) {
    ReactDOM.render(
      <Root store={this.store} history={history} labId={labId} />,
      document.getElementById('root')
    );
  }
}

export default Renderer;
