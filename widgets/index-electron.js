import Renderer from './renderer.js';

class ElectronRenderer extends Renderer {
  constructor(options) {
    const electron = require('electron');
    const {ipcRenderer, webFrame} = electron;

    const url = new URL(window.location.href);
    const wid = url.searchParams.get('wid');
    const labId = url.searchParams.get('labId');

    if (!wid) {
      throw 'ElectronRenderer: unable to find wid= in url';
    }
    if (!labId) {
      throw new Error(`ElectronRenderer: unable to find labId= in url`);
    }

    const send = (verb, ...args) => {
      ipcRenderer.send(`${wid}-${verb}`, ...args);
    };

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

    ipcRenderer.on('PUSH_PATH', (event, path) =>
      this.store.dispatch(this.push(path))
    );

    ipcRenderer.on('DISPATCH_IN_APP', (event, action) =>
      this.store.dispatch(action)
    );

    ipcRenderer.on('NEW_BACKEND_STATE', (event, transitState) =>
      this.newBackendState(transitState)
    );

    ipcRenderer.on('BEGIN_RENDER', () => {
      return super.main(labId);
    });

    if (module.hot) {
      this.send(`RESEND`, wid);
    }
  }
}

window.Renderer = ElectronRenderer;
