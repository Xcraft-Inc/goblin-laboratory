import Renderer from './renderer.js';

class ElectronRenderer extends Renderer {
  constructor() {
    const electron = require('electron');
    const {ipcRenderer, webFrame, remote} = electron;

    super(ipcRenderer.send);

    window.zoomable = true;
    window.zoom = () => webFrame.setZoomFactor(webFrame.getZoomFactor() + 0.1);
    window.unZoom = () =>
      webFrame.setZoomFactor(webFrame.getZoomFactor() - 0.1);

    ipcRenderer.on('PUSH_PATH', (event, path) => {
      this.store.dispatch(this.push(path));
    });

    ipcRenderer.on('DISPATCH_IN_APP', (event, action) => {
      this.store.dispatch(action);
    });

    ipcRenderer.on('NEW_BACKEND_STATE', (event, transitState) => {
      this.newBackendState(transitState);
    });

    ipcRenderer.on('NEW_BACKEND_INFOS', (event, transitState) => {
      this.newBackendInfos(transitState);
    });

    if (module.hot) {
      const wid = remote.getCurrentWindow().id;
      this.send('RESEND', wid);
    }

    super.main();
  }
}

new ElectronRenderer();
