import Renderer from './renderer.js';

class ElectronRenderer extends Renderer {
  constructor() {
    const electron = require('electron');
    const {ipcRenderer, webFrame, remote} = electron;

    let xProbe = null;
    let probing = false;
    /* FIXME: runtime probes for renderer are not supported (too slow) */
    if (process.env.XCRAFT_PROBE && parseInt(process.env.XCRAFT_PROBE) !== 0) {
      xProbe = remote.require('xcraft-core-probe');
      probing = xProbe.isAvailable();
    }

    const probe = (handler, id) => {
      if (!probing) {
        handler();
        return;
      }

      const end = xProbe.push('wm/ipc/receive', id);
      handler();
      end();
    };

    super(ipcRenderer.send);

    window.zoomable = true;
    window.zoom = () => webFrame.setZoomFactor(webFrame.getZoomFactor() + 0.1);
    window.unZoom = () =>
      webFrame.setZoomFactor(webFrame.getZoomFactor() - 0.1);

    ipcRenderer.on('PUSH_PATH', (event, path) =>
      probe(() => this.store.dispatch(this.push(path)))
    );

    ipcRenderer.on('DISPATCH_IN_APP', (event, action) =>
      probe(() => this.store.dispatch(action))
    );

    ipcRenderer.on('NEW_BACKEND_STATE', (event, transitState) =>
      probe(() => this.newBackendState(transitState), transitState.id)
    );

    ipcRenderer.on('NEW_BACKEND_INFOS', (event, transitState) =>
      probe(() => this.newBackendInfos(transitState))
    );

    if (module.hot) {
      const wid = remote.getCurrentWindow().id;
      this.send('RESEND', wid);
    }

    super.main();
  }
}

new ElectronRenderer();
