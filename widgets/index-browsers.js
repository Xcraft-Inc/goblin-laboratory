import 'babel-polyfill';
import Renderer from './renderer.js';
const uuidV4 = require('uuid/v4');

const WT = `
function () {
  self.onmessage = function(e){
    self.postMessage(JSON.parse(e.data));
  };
}
`;

const parser = URL.createObjectURL(
  new Blob(['(' + WT + ')()'], {type: 'text/javascript'})
);

function webWorkerJSONParse(worker, data, callback) {
  // Bad payload case...
  if (typeof data !== 'string' || data.charAt(0) !== '{') {
    callback(data);
    return;
  }

  //No webworker API case...
  if (!worker) {
    callback(JSON.parse(data));
    return;
  }

  worker.postMessage(data);
}

function getZeppelinDestination() {
  // Get destination from <meta data-zeppelin-destination="my-destination">
  const destinationElement = document.head.querySelectorAll(
    '[data-zeppelin-destination]'
  )[0];
  if (destinationElement) {
    return destinationElement.getAttribute('data-zeppelin-destination');
  }
  return '';
}

class BrowsersRenderer extends Renderer {
  constructor() {
    //TODO: getlocal storage session tocken
    const destination = getZeppelinDestination();
    const socket = new WebSocket(
      `ws://localhost:8000/${uuidV4()}/${destination}/`
    );

    super((type, data) => {
      socket.send.bind(socket)(JSON.stringify({type, data}));
    });

    //FIXME:better lang detection
    window.isBrowser = true;
    /*socket.onopen = () => {
      this.send('SET_LANG', {lang: navigator.language});
    };*/

    const worker = Worker ? new Worker(parser) : null;

    const callback = data => {
      switch (data.type) {
        case 'PUSH_PATH':
          this.store.dispatch(this.push(data.path));
          break;
        case 'DISPATCH_IN_APP':
          this.store.dispatch(data.action);
          break;
        case 'NEW_BACKEND_STATE':
          this.newBackendState(data.transitState);
          break;
        case 'NEW_BACKEND_INFOS':
          this.newBackendInfos(data.transitState);
          break;
        case 'BEGIN_RENDER':
          super.main(data.labId);
          break;
      }
    };

    if (worker) {
      worker.onmessage = e => {
        callback(e.data);
      };
    }

    socket.onmessage = event => {
      webWorkerJSONParse(worker, event.data, callback);
    };

    socket.onclose = event => {
      console.log('Websocket closed:', event);
    };

    socket.onerror = event => {
      console.error('WebSocket error observed:', event);
    };
  }
}

new BrowsersRenderer();
