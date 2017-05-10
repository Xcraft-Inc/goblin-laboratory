require ('react-hot-loader/patch');
import React from 'react';
import ReactDOM from 'react-dom';
import {AppContainer} from 'react-hot-loader';

import Loadable from 'react-loadable';
import Loading from './loading';
import fakeDelay from './fakeDelay';

let LoadableExample = Loadable ({
  loader: () => fakeDelay (400).then (() => import ('./hello.js')),
  LoadingComponent: Loading,
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

//main (() => <span>Empty Laboratory</span>);
main (LoadableExample);
