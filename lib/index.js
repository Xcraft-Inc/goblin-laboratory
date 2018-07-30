const transit = require('transit-immutable-js');

class Channel {
  constructor(send) {
    this._send = send;
  }

  sendBackendState(data) {
    const transitState = transit.toJSON(data);
    this._send('NEW_BACKEND_STATE', {transitState, _data: transitState});
  }

  sendBackendInfos(service, data) {
    const transitState = transit.toJSON({service, infos: data});
    this._send('NEW_BACKEND_INFOS', {transitState, _data: transitState});
  }

  sendPushPath(path) {
    this._send('PUSH_PATH', {path, _data: path});
  }

  sendAction(action) {
    this._send('DISPATCH_IN_APP', {action, _data: action});
  }
}

class ElectronChannel extends Channel {
  constructor(win) {
    const send = win.webContents.send.bind(win.webContents);
    super((type, data) => {
      send(type, data._data);
    });
  }
}

class WebSocketChannel extends Channel {
  constructor(win) {
    const send = win.send.bind(win);
    super((type, data) => {
      delete data._data;
      send(JSON.stringify(Object.assign({type}, data)));
    });
  }
}

module.exports = {
  ElectronChannel,
  WebSocketChannel,
};
