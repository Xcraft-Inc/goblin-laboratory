class DesktopEvents {
  #events = new Map();

  /**
   * Subscribe to a topic.
   * @param {string} topic
   * @param {Function} callback
   * @returns {Function} unsub
   */
  sub(topic, callback) {
    /** @type {Set} */
    let callbacks = this.#events.get(topic);
    if (!callbacks) {
      callbacks = new Set();
      this.#events.set(topic, callbacks);
    }
    callbacks.add(callback);
    /* unsub */
    return () => {
      callbacks.delete(callback);
    };
  }

  emit(topic, data) {
    const callbacks = this.#events.get(topic);
    if (!callbacks) {
      return; /* discard event */
    }
    for (const callback of callbacks) {
      try {
        callback(data);
      } catch (ex) {
        console.error(ex.stack || ex.message || ex);
      }
    }
  }
}

export default new DesktopEvents();
