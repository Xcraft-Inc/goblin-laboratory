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

const history = createHistory();
import configureStore from 'laboratory/store/store';

class Renderer {
  constructor(send) {
    this.send = send;
    this.push = push;
    this._store = configureStore(window.__INITIAL_STATE__, history, this.send);
    this._rootMounted = false;

    if (module.hot) {
      module.hot.accept();
    }
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

    if (!this._rootMounted) {
      const state = this.store.getState().backend;

      if (
        state.some((v, k) => {
          const ns = k.replace(/([^@]+)@.*/, '$1');
          if (ns === 'laboratory' || ns === 'carnotzet') {
            this._labId = k;
            return true;
          }
          return false;
        })
      ) {
        this.main(Root);
        this._rootMounted = true;
        console.log('root mounted!');
      }
    }
  }

  newBackendInfos(transitState) {
    this.store.dispatch({
      type: 'NEW_BACKEND_INFOS',
      data: transitState,
    });
  }

  main(Main) {
    if (!Main) {
      Main = function Main() {
        return <span>Empty Laboratory</span>;
      };
    }

    ReactDOM.render(
      <AppContainer>
        <Main store={this.store} history={history} labId={this._labId} />
      </AppContainer>,
      document.getElementById('root')
    );
  }
}

export default Renderer;
