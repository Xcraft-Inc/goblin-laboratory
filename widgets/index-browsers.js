import 'babel-polyfill';
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

class BrowsersRenderer extends Renderer {
  constructor(options = {}) {
    const send = (type, data) => {
      const socket = this._socket;
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({type, data}));
      }
    };

    super(send, options);

    window.isBrowser = true;

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
        case 'NEW_BACKEND_INFOS':
          this.newBackendInfos(data.transitState);
          break;
        case 'BEGIN_RENDER':
          super.main(data.labId);
          //persist for future handshaking
          this.storeTokens(data.tokens);
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
    this.connect();
  }

  connect() {
    const {
      protocol = 'ws',
      hostname = 'localhost',
      port = '8000',
      destination = '',
    } = this.options;

    const {clientToken, sessionToken} = this.getTokens();

    const socket = new WebSocket(
      `${protocol}://${hostname}:${port}/${clientToken}/${sessionToken}/${destination}/`
    );

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

      clearTimeout(resetTimeoutHandle);
      setTimeout(this.connect, this.reconnectTimeout);
      this.reconnectTimeout *= 2;
    };

    socket.onerror = (event) => {
      console.error('WebSocket error observed:', event);
    };

    this._socket = socket;
  }

  getTokens() {
    let clientToken;
    let sessionToken;

    try {
      clientToken = window.localStorage.getItem('epsitec/zeppelin/clientToken');
      sessionToken = window.sessionStorage.getItem(
        'epsitec/zeppelin/sessionToken'
      );
    } catch (e) {
      if (e.name !== 'SecurityError') {
        throw e;
      }
    }

    if (!clientToken) {
      clientToken = 'new-client';
    }
    if (!sessionToken) {
      sessionToken = 'new-session';
    }

    return {clientToken, sessionToken};
  }

  storeTokens(tokens) {
    if (!tokens) {
      return;
    }
    try {
      if (tokens.clientToken) {
        window.localStorage.setItem(
          'epsitec/zeppelin/clientToken',
          tokens.clientToken
        );
      }
      if (tokens.sessionToken) {
        window.sessionStorage.setItem(
          'epsitec/zeppelin/sessionToken',
          tokens.sessionToken
        );
      }
    } catch (e) {
      if (e.name !== 'SecurityError') {
        throw e;
      }
    }
  }
}

window.Renderer = BrowsersRenderer;
