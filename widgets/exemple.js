import Loadable from 'react-loadable';
import Loading from './loading';
import fakeDelay from './fakeDelay';

let LoadableExample = Loadable ({
  loader: () => fakeDelay (400).then (() => import ('./hello.js')),
  LoadingComponent: Loading,
});

export default LoadableExample;
