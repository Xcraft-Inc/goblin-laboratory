import Renderer from './renderer.js';

class ElectronRenderer extends Renderer {
  constructor(options) {
    const electron = require('electron');
    const {ipcRenderer, webFrame, remote} = electron;
    const wid = remote.getCurrentWindow().id;
    const send = (verb, ...args) => {
      ipcRenderer.send(`${wid}-${verb}`, ...args);
    };

    super(send, wid);
    let zoom = webFrame.getZoomFactor();
    let laboratoryId;
    this.store.subscribe(() => {
      if (!laboratoryId) {
        return;
      }
      const state = this.store.getState();
      if (!state || !state.backend) {
        return;
      }
      const lab = state.backend.get(laboratoryId);
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

    ipcRenderer.on('PUSH_PATH', (event, path) =>
      this.store.dispatch(this.push(path))
    );

    ipcRenderer.on('DISPATCH_IN_APP', (event, action) =>
      this.store.dispatch(action)
    );

    ipcRenderer.on('NEW_BACKEND_STATE', (event, transitState) =>
      this.newBackendState(transitState)
    );

    ipcRenderer.on('NEW_BACKEND_INFOS', (event, transitState) =>
      this.newBackendInfos(transitState)
    );

    ipcRenderer.on('BEGIN_RENDER', (event, labId) => {
      laboratoryId = labId;
      return super.main(labId);
    });

    if (module.hot) {
      this.send(`RESEND`, wid);
    }
  }
}

window.Renderer = ElectronRenderer;
