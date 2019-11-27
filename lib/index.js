const helpers = require('xcraft-core-transport/lib/helpers.js');
const xProbe = require('xcraft-core-probe');

class Channel {
  constructor(send) {
    this._send = send;
  }

  _probe(topic, id, handler) {
    if (!xProbe.isAvailable()) {
      handler();
      return;
    }

    const end = xProbe.push(topic, id);
    handler();
    end();
  }

  _prepareMsg(msg) {
    return helpers.toXcraftJSON(msg)[0];
  }

  sendBackendState(msg) {
    const transitState = this._prepareMsg(msg);
    this._send('NEW_BACKEND_STATE', {transitState, _data: transitState});
  }

  sendBackendInfos(service, msg) {
    const transitState = {service, infos: msg.data}; // Plain JS only
    this._send('NEW_BACKEND_INFOS', {transitState, _data: transitState});
  }

  sendPushPath(path) {
    this._send('PUSH_PATH', {path, _data: path});
  }

  sendAction(action) {
    this._send('DISPATCH_IN_APP', {action, _data: action});
  }

  beginRender(labId, token) {
    this._send('BEGIN_RENDER', {labId, token, _data: labId});
  }
}

class ElectronChannel extends Channel {
  constructor(win) {
    const send = win.webContents.send.bind(win.webContents);
    super((type, data) =>
      this._probe('wm/ipc/send', data._data.id, () => send(type, data._data))
    );
  }
}

class WebSocketChannel extends Channel {
  constructor(win) {
    const send = win.send.bind(win);
    super((type, data) =>
      this._probe('wm/ws/send', data._data.id, () => {
        delete data._data;
        send(JSON.stringify(Object.assign({type}, data)));
      })
    );
  }
}

module.exports = {
  ElectronChannel,
  WebSocketChannel,
};
