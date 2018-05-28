import 'babel-polyfill';
import Renderer from './renderer.js';
const uuidV4 = require('uuid/v4');
import fasterStringify from 'faster-stable-stringify';

const WT = `
function () {
  self.onmessage = function(e){
    self.postMessage(JSON.parse(e.data));
    self.close();
  };
}
`;

const parser = URL.createObjectURL(
  new Blob(['(' + WT + ')()'], {type: 'text/javascript'})
);
function webWorkerJSONParse(data, callback) {
  //No webworker API case...
  if (!Worker) {
    callback(JSON.parse(data));
    return;
  }

  // Bad payload case...
  if (typeof data !== 'string' || data.charAt(0) !== '{') {
    callback(data);
    return;
  }

  const worker = new Worker(parser);
  worker.onmessage = e => {
    callback(e.data);
  };

  worker.postMessage(data);
}

class BrowsersRenderer extends Renderer {
  constructor() {
    //TODO: getlocal storage session tocken
    const socket = new WebSocket(`ws://localhost:8000/${uuidV4()}/`);

    super((type, data) => {
      socket.send.bind(socket)(fasterStringify({type, data}));
    });

    socket.onmessage = event => {
      webWorkerJSONParse(event.data, data => {
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
        }
      });
    };

    socket.onopen = () => {
      super.main();
    };
  }
}

new BrowsersRenderer();
