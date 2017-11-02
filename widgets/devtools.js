//import Perf from 'react-addons-perf';
//window.Perf = Perf;

const installDevTools = require ('immutable-devtools');
installDevTools (require ('immutable'));

/* Look for unnecessary updates (it's expensive), uncomment only for testing
 * Seems not working properly with PureComponent, https://github.com/garbles/why-did-you-update/issues/28

import React from 'react';
import {whyDidYouUpdate} from 'why-did-you-update';

let {createClass} = React;
Object.defineProperty (React, 'createClass', {
  set: nextCreateClass => {
    createClass = nextCreateClass;
  },
});

whyDidYouUpdate (React);

*/
