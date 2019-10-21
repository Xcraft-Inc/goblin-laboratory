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

class BrowsersRenderer extends Renderer {
  constructor() {
    //TODO: getlocal storage session tocken
    const socket = new WebSocket(`ws://localhost:8000/${uuidV4()}/`);

    super((type, data) => {
      socket.send.bind(socket)(JSON.stringify({type, data}));
    });

    //FIXME:better lang detection
    this.send('SET_LANG', {lang: window.language});

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
  }
}

new BrowsersRenderer();
