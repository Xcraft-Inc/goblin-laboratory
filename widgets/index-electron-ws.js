import '@babel/polyfill';
import Renderer from './renderer.js';

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

class ElectronRendererWS extends Renderer {
  constructor(options = {}) {
    const electron = require('electron');
    const {webFrame} = electron;

    const send = (type, data) => {
      const socket = this._socket;
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({type, data}));
      }
    };

    const port = new URL(window.location.href).searchParams.get('wss');
    const labId = new URL(window.location.href).searchParams.get('labId');
    if (!port) {
      throw new Error(`ElectronRendererWS: unable to find wss= in url`);
    }
    if (!labId) {
      throw new Error(`ElectronRendererWS: unable to find labId= in url`);
    }

    super(send, options);

    let zoom = webFrame.getZoomFactor();
    this.store.subscribe(() => {
      if (!labId) {
        return;
      }
      const state = this.store.getState();
      if (!state || !state.backend) {
        return;
      }
      const lab = state.backend.get(labId);
      if (!lab) {
        return;
      }
      const zoomState = lab.get('zoom');
      if (zoomState && zoomState !== zoom) {
        zoom = zoomState;
        webFrame.setZoomFactor(zoom);
      }
    });

    window.zoomable = true;

    const callback = (data) => {
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
        case 'BEGIN_RENDER':
          super.main(labId);
          break;
      }
    };

    const worker = Worker ? new Worker(parser) : null;
    if (worker) {
      worker.onmessage = (e) => {
        callback(e.data);
      };
    }

    this._handleWebSocketMessage = (data) => {
      webWorkerJSONParse(worker, data, callback);
    };

    this.reconnectTimeout = 125; // 125ms / 250ms / 500ms / 1000ms / ...
    this.connect = this.connect.bind(this);
    this.connect(port);
    if (module.hot) {
      this.send(`RESEND`);
    }
  }

  connect(port) {
    const {protocol = 'ws', hostname = 'localhost'} = this.options;

    const socket = new WebSocket(`${protocol}://${hostname}:${port}/`);

    socket.onmessage = (event) => {
      this._handleWebSocketMessage(event.data);
    };

    let resetTimeoutHandle;

    socket.onopen = (event) => {
      console.log('Websocket is open:', event);
      this.store.dispatch({type: 'SET_WEBSOCKET_STATUS', status: 'open'});
      resetTimeoutHandle = setTimeout(() => {
        this.reconnectTimeout = 125;
      }, 10000);
    };

    socket.onclose = (event) => {
      console.log('Websocket closed:', event);
      this.store.dispatch({type: 'SET_WEBSOCKET_STATUS', status: 'closed'});

      // Do not reconnect immediately in case of error while opening the connection
      if (event.code === 4001 && this.reconnectTimeout < 16000) {
        this.reconnectTimeout = 16000;
      }

      clearTimeout(resetTimeoutHandle);
      setTimeout(this.connect, this.reconnectTimeout);
      this.reconnectTimeout *= 2;
    };

    socket.onerror = (event) => {
      console.error('WebSocket error observed:', event);
    };

    this._socket = socket;
  }
}

window.Renderer = ElectronRendererWS;
