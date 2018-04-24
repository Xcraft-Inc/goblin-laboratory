import Renderer from './renderer.js';

class BrowsersRenderer extends Renderer {
  constructor() {
    const socket = new WebSocket('ws://localhost:8000');

    super((type, data) => {
      socket.send.bind(socket)(JSON.stringify({type, data}));
    });

    socket.onmessage = event => {
      const data = JSON.parse(event.data);
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
      }
    };

    socket.onopen = () => {
      super.main();
    };
  }
}

new BrowsersRenderer();
