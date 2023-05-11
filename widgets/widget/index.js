import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import Shredder from 'xcraft-core-shredder';
import {push} from 'connected-react-router/immutable';
import {flushToStyleTag} from 'aphrodite/no-important';
import importer from 'goblin_importer';
import shallowEqualShredder from './utils/shallowEqualShredder';
import _connect from './utils/connect';
import connectWidget from './utils/connectWidget';
import connectBackend from './utils/connectBackend';
import * as widgetsActions from './utils/widgets-actions';
import mergeStyleDefinitions from './style/merge-style-definitions.js';
import buildStyle from './style/build-style.js';

const stylesImporter = importer('styles');
const reducerImporter = importer('reducer');

const debounce500 = _.debounce((fct) => fct(), 500);
const throttle250 = _.throttle((fct) => fct(), 250);

// function isFunction(functionToCheck) {
//   var getType = {};
//   return (
//     functionToCheck &&
//     getType.toString.call(functionToCheck) === '[object Function]'
//   );
// }

function getWidgetName(constructorName) {
  return constructorName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

class Widget extends React.Component {
  constructor() {
    super(...arguments);
    this._names = this._getInheritedNames();
    this._name = this._names[0];

    const reducer = reducerImporter(this._name);
    if (reducer) {
      const widgetId = this.widgetId;
      if (widgetId) {
        this.dispatch({type: 'WIDGETS_CREATE'});
      }
    }
  }

  _getInheritedNames() {
    let p = this;
    const names = new Set();
    while ((p = Object.getPrototypeOf(p))) {
      const constructorName = p.constructor.name;
      if (constructorName === 'Widget') {
        break;
      }
      const widgetName = getWidgetName(constructorName);
      names.add(widgetName);
    }
    return [...names];
  }

  // Context

  static get childContextTypes() {
    return {
      nearestParentId: PropTypes.string,
    };
  }

  getChildContext() {
    return {
      nearestParentId: this.props.id || this.context.nearestParentId,
    };
  }

  static get contextTypes() {
    return {
      labId: PropTypes.string,
      dispatch: PropTypes.func,
      store: PropTypes.object,
      theme: PropTypes.object,
      // model: PropTypes.any,
      // register: PropTypes.func,
      // id: PropTypes.string,
      desktopId: PropTypes.string,
      // contextId: PropTypes.string,
      // entityId: PropTypes.string,
      // dragControllerId: PropTypes.string,
      // dragServiceId: PropTypes.string,
      readonly: PropTypes.bool,
      // themeContextName: PropTypes.string,
      nearestParentId: PropTypes.string,
    };
  }

  // React

  componentDidCatch(error, info) {
    this.reportError(error, info);
  }

  componentDidMount() {
    /* HACK: flush explicitly all aphrodite styles in order to remove the
     * flickers and bugs in some systems where the styles are not applied.
     * Note that this API should not be called directly because it's an
     * internal function of aphrodite.
     */
    throttle250(() => flushToStyleTag());
  }

  shouldComponentUpdate(newProps, newState) {
    return (
      !shallowEqualShredder(this.props, newProps) ||
      !shallowEqualShredder(this.state, newState)
    );
  }

  componentWillUnmount() {
    debounce500(() => this.rawDispatch(widgetsActions.collect()));
  }

  // Get

  get name() {
    return this._name;
  }

  get widgetId() {
    return this.props.widgetId || this.props.id;
  }

  getNearestId() {
    return this.props.id || this.context.nearestParentId;
  }

  // Styles

  get styles() {
    if (this.lastStyleProps === this.props) {
      return this.lastStyle;
    }
    this.lastStyleProps = this.props;

    const styleDef = this.getMergedStyleDefinition();

    const newStyle = buildStyle(
      styleDef,
      this.context.theme,
      this.props,
      this.name
    );

    this.lastStyle = newStyle;
    return newStyle;
  }

  set styles(stylesDef) {
    const myStyleFunc = stylesDef.default;
    const s = {
      hasThemeParam: myStyleFunc.length > 0,
      hasPropsParam: myStyleFunc.length > 1,
      propNamesUsed: stylesDef.propNames,
      mapProps: stylesDef.mapProps,
      func: myStyleFunc,
    };
    if (!this._styleDefs) {
      this._styleDefs = [s];
    } else {
      this._styleDefs.push(s);
    }
  }

  importStyleDefinition(widgetName) {
    let myStyleFunc = stylesImporter(widgetName);
    if (!myStyleFunc) {
      return null;
    }

    return {
      hasThemeParam: myStyleFunc.length > 0,
      hasPropsParam: myStyleFunc.length > 1,
      propNamesUsed: stylesImporter(widgetName, 'propNames'),
      mapProps: stylesImporter(widgetName, 'mapProps'),
      func: myStyleFunc,
    };
  }

  // Get style definition for this widget merged with the style definition of inherited widget
  getMergedStyleDefinition() {
    if (!this._mergedStyleDef) {
      let styleDefs = this._styleDefs;
      if (!styleDefs) {
        styleDefs = this._names.map(this.importStyleDefinition);
      }
      this._mergedStyleDef = mergeStyleDefinitions(styleDefs);
    }
    return this._mergedStyleDef;
  }

  // Connect

  static shred(state) {
    return new Shredder(state);
  }

  static connect(...args) {
    return _connect(...args);
  }

  static connectWidget(...args) {
    return connectWidget(...args);
  }

  static connectBackend(...args) {
    return connectBackend(...args);
  }

  static Wired(component) {
    return () => Widget.connectBackend(component.wiring)(component);
  }

  // Goblin bus

  get registry() {
    return this.getState().commands.get('registry');
  }

  canDo(cmd) {
    if (!this.registry[cmd]) {
      return false;
    }
    const state = this.getState().backend;
    const clientSessionId = state
      .get(this.context.labId)
      .get('clientSessionId');
    const loginSession = state.get(`login-session@${clientSessionId}`);
    if (loginSession && this.registry[cmd] !== true) {
      const rank = loginSession.get('rank');
      if (this.registry[cmd][rank] && this.registry[cmd][rank] === true) {
        return false;
      }
    }
    return true;
  }

  cmd(cmd, args) {
    if (!this.registry[cmd]) {
      throw new Error(
        `Command ${cmd} not implemented or authorized by the zepplin firewall`
      );
    }
    const state = this.getState().backend;

    if (args && !args.labId) {
      args.labId = this.context.labId;
    }

    if (args && !args.clientSessionId) {
      args.clientSessionId = state.get(args.labId).get('clientSessionId');
    }

    if (args && !args.desktopId) {
      args.desktopId = this.context.desktopId;
    }

    const loginSession = state.get(`login-session@${args.clientSessionId}`);
    if (loginSession && this.registry[cmd] !== true) {
      const rank = loginSession.get('rank');
      if (this.registry[cmd][rank] && this.registry[cmd][rank] === true) {
        console.warn(
          '%cGoblins Warning',
          'font-weight: bold;',
          `Command will be blocked`
        );
        return;
      }
    }
    const action = {
      type: 'QUEST',
      cmd,
      data: args,
      _xcraftIPC: true,
    };
    this.context.dispatch(action);
  }

  reportError(error, info) {
    const desktopId = this.context.desktopId
      ? this.context.desktopId
      : this.props.desktopId;
    if (error) {
      error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    this.doFor(this.context.labId, 'when-ui-crash', {desktopId, error, info});
  }

  do(action, args) {
    return this.doAs(this.name, action, args);
  }

  doAs(service, action, args) {
    const id = this.props.id || this.context.id;
    if (!id) {
      console.error(`${this.name} is not a connected widget (need an id)`);
      return;
    }
    this.cmd(`${service}.${action}`, {id, ...args});
  }

  doFor(serviceId, action, args) {
    const service = serviceId.split('@')[0];
    this.cmd(`${service}.${action}`, {id: serviceId, ...args});
  }

  /**
   * Do backend quest or dispatch frontend action given the model
   *
   * @param {String} model - A path in the state.
   * @param {String} name - The quest or action name.
   * @param {Object} args - The arguments.
   */
  doDispatch(model, name, args) {
    const [root, id] = model.split('.');
    if (root === 'backend') {
      this.doFor(id, name, args);
    } else if (root === 'widgets') {
      this.dispatchTo(id, {
        ...args,
        type: name,
      });
    } else {
      throw new Error(`Model path starting with '${root}' is not supported.`);
    }
  }

  /**
   * Dispatch an action in the frontend reducer for this widget.
   *
   * @param {Object} action - Redux action.
   * @param {String} name - (optional) Reducer name.
   */
  dispatch(action, name) {
    this.dispatchTo(this.widgetId, action, name || this.name);
  }

  /**
   * Dispatch an action in the frontend reducer for a specified widget.
   *
   * A `reducer.js` file must be present in a widget folder that matches
   * the `name` parameter or the name specified in the `id` parameter,
   * after the `$`.
   *
   * Possible values for `id`:
   * `backendId` (example: desktop@111)
   * `backendId$name` (exemple: workitem@222$hinter)
   * `backendId$name@id` (exemple: workitem@222$hinter@333)
   * `$name` (no backend id, must be manually collected in componentWillUnmount)
   * `$name@id` (same as above)
   *
   * @param {String} id - Destination widget id.
   * @param {Object} action - Redux action.
   * @param {String} name - (optional) Reducer name.
   */
  dispatchTo(id, action, name) {
    if (typeof action !== 'function') {
      if (!action.type) {
        throw new Error(
          `Cannot dispatch a widget action without a type. Action: ${JSON.stringify(
            action
          )}. Widget name: ${this.name}`
        );
      }
      action._id = id;
      if (name) {
        action._type = name;
      }
      action.type = `@widgets_${action.type}`;
    }
    this.rawDispatch(action);
  }

  /**
   * Dispatch a payload to the desktop cache reducer.
   *
   * This cache is useful for storing provisory values in the session (desktop)
   * in order to restore a specific state when a widget is re-mount again.
   * It's very useful in the case of the ScrollableContainer for example, where
   * the last scroll position is dispatched in the cache, and restored with the
   * next mount of this component. It's not possible to use the widget reducer
   * associated to the ScrollableContainer because in this case, after the
   * unmount, the reducer is collected.
   *
   * The cache has a limit, you must always consider that the values stored
   * can be lost at any time.
   *
   * @param {string} id - Widget's id.
   * @param {Object} payload - Payload to store.
   */
  dispatchToCache(id, payload) {
    this.dispatchTo(
      this.context.desktopId,
      {
        type: 'WIDGET_CACHE',
        widgetId: id,
        value: payload,
      },
      'desktop'
    );
  }

  rawDispatch(action) {
    this.context.store.dispatch(action);
  }

  nav(route, frontOnly) {
    if (frontOnly) {
      this.context.dispatch(push(route));
    } else {
      this.doFor(this.context.labId, 'nav', {route});
    }
  }

  setBackendValue(path, value) {
    this.rawDispatch({
      type: 'FIELD-CHANGED',
      path,
      value,
    });
  }

  setModelValue(path, value, useEntity) {
    let fullPath = 'backend.' + this.props.id + path;
    if (useEntity) {
      fullPath = 'backend.' + this.props.entityId + path;
    }
    this.rawDispatch({
      type: 'FIELD-CHANGED',
      path: fullPath,
      value,
    });
  }

  setFormValue(path, value) {
    this.setModelValue(path, value);
  }

  setEntityValue(path, value) {
    this.setModelValue(path, value, true);
  }

  // State

  backendHasBranch(branch) {
    return this.getState().backend.has(branch);
  }

  // getModelValue(model, fullPath) {
  //   const storeState = this.getState();
  //   const state = new Shredder({
  //     backend: storeState.backend,
  //     widgets: storeState.widgets,
  //     network: storeState.network,
  //   });
  //   if (fullPath) {
  //     if (isFunction(model)) {
  //       model = model(state.get(model));
  //     }
  //     if (!model.startsWith('backend.')) {
  //       model = 'backend.' + model;
  //     }
  //     return state.get(model);
  //   } else {
  //     const parentModel = this.context.model || `backend.${this.props.id}`;
  //     if (isFunction(model)) {
  //       model = model(state.get(parentModel));
  //     }
  //     return state.get(`${parentModel}${model}`);
  //   }
  // }

  getBackendValue(fullpath) {
    const storeState = this.getState();
    const state = new Shredder({
      backend: storeState.backend,
      widgets: storeState.widgets,
      network: storeState.network,
    });
    return state.get(fullpath);
  }

  // getFormValue(path) {
  //   return this.getModelValue(path);
  // }

  // getFormPluginValue(pluginName, path) {
  //   const state = new Shredder(this.getState().backend);
  //   return state.get(`${pluginName}@${this.props.id}${path}`);
  // }

  // getEntityPluginValue(pluginName, path) {
  //   const state = new Shredder(this.getState().backend);
  //   return state.get(`${pluginName}@${this.props.entityId}${path}`);
  // }

  // getEntityValue(model) {
  //   if (isFunction(model)) {
  //     const state = new Shredder(this.getState());
  //     model = model(state.get(`backend.${this.props.entityId}`));
  //     return this.getModelValue(model, true);
  //   } else {
  //     return this.getModelValue(`${this.props.entityId}${model}`, true);
  //   }
  // }

  getEntityById(entityId) {
    const state = new Shredder(this.getState().backend);
    return state.get(entityId);
  }

  getEntityPathInCollection(collectionPath, id, entityPath) {
    return (entity) => {
      const item = entity
        .get(collectionPath)
        .find((pack) => pack.get('id') === id);

      return entityPath
        ? `.${collectionPath}[${item.key}].${entityPath}`
        : `.${collectionPath}[${item.key}]`;
    };
  }

  getState() {
    return this.context.store.getState();
  }

  getSchema(path) {
    return Widget.getSchema(this.getState(), path);
  }

  getWidgetState() {
    const widgetId = this.widgetId;
    if (!widgetId) {
      throw new Error('Cannot resolve widget state without a valid id');
    }
    return this.getState().widgets.get(widgetId);
  }

  getWidgetCacheState(widgetId) {
    if (!widgetId) {
      throw new Error('Cannot resolve widget cache state without a valid id');
    }
    return this.getState().widgets.getIn([
      this.context.desktopId,
      'widgetsCache',
      widgetId,
    ]);
  }

  getBackendState() {
    if (!this.props.id) {
      throw new Error('Cannot resolve backend state without a valid id');
    }
    return this.getState().backend.get(this.props.id);
  }

  getRouting() {
    return new Shredder(this.context.store.getState().router);
  }

  static getSelectionState(target) {
    if (target.type !== 'text') {
      return null;
    }
    return {
      ss: target.selectionStart,
      se: target.selectionEnd,
      sd: target.selectionDirection,
    };
  }

  static getHinterType(hinterId) {
    let type = hinterId;
    if (!type || type === '') {
      return null;
    }
    const index = hinterId.indexOf('@');
    if (index !== -1) {
      type = hinterId.substr(0, index);
    }
    return type;
  }

  getHash() {
    return this.getRouting().get('location.hash');
  }

  getUserSettings() {
    return Widget.getUserSession(new Shredder(this.getState()));
  }

  setUserSettings(questName, payload) {
    const state = this.getState().backend;
    const serviceId = state.get(window.labId).get('clientSessionId');
    payload.id = serviceId;
    const service = serviceId.split('@', 1)[0];
    this.cmd(`${service}.${questName}`, payload);
  }

  static getUserSession(state) {
    return state.get(
      `backend.${state.get(`backend.${window.labId}.clientSessionId`)}`
    );
  }

  static getLoginSession(state) {
    const clientSessionId = state.get(
      `backend.${window.labId}.clientSessionId`,
      null
    );
    if (!clientSessionId) {
      return null;
    }
    const loginSession = state.get(
      `backend.login-session@${clientSessionId}`,
      null
    );
    if (!loginSession) {
      return null;
    } else {
      return loginSession;
    }
  }

  static getSchema(state, path) {
    if (state && state.backend) {
      const backend = new Shredder(state.backend);
      if (!path) {
        return backend.get(`workshop.schema`, null);
      } else {
        return backend.get(`workshop.schema.${path}`, null);
      }
    }
    return null;
  }

  // Other

  static copyTextToClipboard(text) {
    const textField = document.createElement('textarea');
    textField.innerText = text;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand('copy');
    textField.remove();
  }
}

Widget.propTypes = {
  id: PropTypes.string,
  entityId: PropTypes.string,
  hinter: PropTypes.string,
};

export default Widget;
