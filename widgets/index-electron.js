import Renderer from './renderer.js';

class ElectronRenderer extends Renderer {
  constructor() {
    const electron = require('electron');
    const {ipcRenderer, webFrame, remote} = electron;

    super(ipcRenderer.send);
    // webFrame.setZoomFactor(webFrame.getZoomFactor() - 0.3);

    window.zoomable = true;
    window.zoom = () => webFrame.setZoomFactor(webFrame.getZoomFactor() + 0.1);
    window.unZoom = () =>
      webFrame.setZoomFactor(webFrame.getZoomFactor() - 0.1);

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

    ipcRenderer.on('BEGIN_RENDER', (event, labId) => super.main(labId));

    const zoom = webFrame.getZoomFactor();
    this.store.subscribe(() => {
      const state = this.store.getState();
      const zoomState = state.backend.get('client.zoom');
      if (zoomState && zoomState !== zoom) {
        webFrame.setZoomFactor(zoom);
      }
    });

    if (module.hot) {
      const wid = remote.getCurrentWindow().id;
      this.send('RESEND', wid);
    }
  }
}

new ElectronRenderer();
