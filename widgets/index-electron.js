import Renderer from './renderer.js';

class ElectronRenderer extends Renderer {
  constructor() {
    const electron = require('electron');
    const {ipcRenderer, webFrame, remote} = electron;

    super(ipcRenderer.send);

    let zoom = webFrame.getZoomFactor();
    this.store.subscribe(() => {
      const state = this.store.getState();
      const zoomState = state.backend.get('client').get('zoom');
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

    ipcRenderer.on('BEGIN_RENDER', (event, labId) => super.main(labId));

    if (module.hot) {
      const wid = remote.getCurrentWindow().id;
      this.send('RESEND', wid);
    }
  }
}

new ElectronRenderer();
