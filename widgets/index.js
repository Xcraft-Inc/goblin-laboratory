require ('react-hot-loader/patch');
import React from 'react';
import ReactDOM from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import Hello from './hello.js';

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
main (Hello);
