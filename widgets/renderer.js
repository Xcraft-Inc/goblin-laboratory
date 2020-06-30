if (process.env.NODE_ENV === 'development') {
  require('./devtools.js');
}

import React from 'react';
import ReactDOM from 'react-dom';
import Root from 'goblin-laboratory/widgets/root';
import {createHashHistory} from 'history';
import {push} from 'connected-react-router/immutable';
import configureStore from 'goblin-laboratory/widgets/store/store';

class Renderer {
  constructor(send, options = {}) {
    this.send = send;
    this.push = push;
    this.options = options;

    this.history = undefined;
    if (this.options.useRouter !== false) {
      this.history = createHashHistory();
    }

    this._store = configureStore(
      window.__INITIAL_STATE__,
      this.history,
      this.send
    );

    document.addEventListener('drop', (e) => {
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

    document.addEventListener('dragover', (e) => {
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
    //PUT LABID IN WINDOW STATE
    //USEFULL IN SOME CONNECT()
    window.labId = labId;

    const rootElement = document.getElementById('root');
    const isHydratable = rootElement.hasAttribute('data-hydratable');
    let render = ReactDOM.render;
    if (isHydratable) {
      render = ReactDOM.hydrate;
    }
    render(
      <Root
        store={this.store}
        labId={labId}
        useRouter={this.options.useRouter !== false}
        history={this.history}
      />,
      rootElement
    );
  }
}

export default Renderer;
