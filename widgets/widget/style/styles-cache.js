import LinkedList from 'linked-list';

class DoubleMap {
  /** @type {Map<any,Map<any,any>>} */
  map = new Map();

  get(key1, key2) {
    if (!this.map.has(key1)) {
      return null;
    }
    return this.map.get(key1).get(key2);
  }

  set(key1, key2, value) {
    let map;
    if (!this.map.has(key1)) {
      map = new Map();
      this.map.set(key1, map);
    } else {
      map = this.map.get(key1);
    }
    let isNew = !map.has(key2);
    map.set(key2, value);
    return isNew;
  }

  delete(key1, key2) {
    const map = this.map.get(key1);
    if (!map) {
      return;
    }
    map.delete(key2);
    if (map.size === 0) {
      this.map.delete(key1);
    }
  }
}

export default class StylesCache {
  maxSize = 2048;

  _size = 0;
  _cache = new DoubleMap();
  _recentList = new LinkedList();

  get(key1, key2) {
    let item = this._cache.get(key1, key2);
    if (item) {
      /* When an existing style is used, detach from its current position
       * and move of one step in the linked-list. The goal is to keep the less
       * used style in front of the list (head).
       */
      const nextItem = item.next;
      if (nextItem) {
        item.detach();
        nextItem.append(item);
      }

      return item.value;
    }
    return null;
  }

  set(key1, key2, value) {
    this._size++;

    /* Limit the style cache to maxSize entries. The less used item is deleted
     * when the limit is reached.
     */
    if (this._size > this.maxSize) {
      const item = this._recentList.head;
      item.detach();
      this._cache.delete(item.key1, item.key2);
      this._size--;
    }

    /* Create a new linked-list item and add this one at the end of the list.
     * Here, it's still not possible to be sure that this style will be often
     * used. Anyway, if it's not used anymore, it will move one-by-one to the
     * front of the list.
     */
    const item = new LinkedList.Item();
    item.key1 = key1;
    item.key2 = key2;
    item.value = value;
    this._recentList.append(item);

    this._cache.set(key1, key2, item);
  }
}
