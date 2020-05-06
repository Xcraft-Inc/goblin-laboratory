//T:2019-02-27

import React from 'react';
import _ from 'lodash';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import Shredder from 'xcraft-core-shredder';
import LinkedList from 'linked-list';
import {push, replace, goBack} from 'connected-react-router/immutable';
import {matchPath} from 'react-router';
import fasterStringify from 'faster-stable-stringify';
import {StyleSheet as Aphrodite, flushToStyleTag} from 'aphrodite/no-important';
import traverse from 'traverse';
import importer from 'goblin_importer';
import shallowEqualShredder from './utils/shallowEqualShredder';
import _connect from './utils/connect';
import connectWidget from './utils/connectWidget';
import connectBackend from './utils/connectBackend';
import * as widgetsActions from './utils/widgets-actions';
import {getParameter} from '../../lib/helpers.js';

const stylesImporter = importer('styles');
const reducerImporter = importer('reducer');

let stylesCache = new Map();
let stylesCacheUses = new LinkedList();
let myStyleCache = {};

export function clearStylesCache() {
  stylesCache = new Map();
  stylesCacheUses = new LinkedList();
  myStyleCache = {};
}

const debounceCollect = _.debounce((fct) => {
  fct();
}, 500);

function isFunction(functionToCheck) {
  var getType = {};
  return (
    functionToCheck &&
    getType.toString.call(functionToCheck) === '[object Function]'
  );
}

// See https://github.com/Khan/aphrodite/issues/319#issuecomment-393857964
const {StyleSheet, css} = Aphrodite.extend([
  {
    selectorHandler: (selector, baseSelector, generateSubtreeStyles) => {
      const nestedTags = [];
      const selectors = selector.split(',');
      _.each(selectors, (subselector, key) => {
        if (selector[0] === '&') {
          const tag = key === 0 ? subselector.slice(1) : subselector;
          const nestedTag = generateSubtreeStyles(
            `${baseSelector} ${tag}`.replace(/ +(?= )/g, '')
          );
          nestedTags.push(nestedTag);
        }
      });
      return _.isEmpty(nestedTags) ? null : _.flattenDeep(nestedTags);
    },
  },
]);

const injectCSS = (classes) => {
  traverse(classes).forEach(function (style) {
    if (style === undefined || style === null) {
      this.delete();
    }
  });

  const sheet = StyleSheet.create(classes);
  Object.keys(sheet).forEach((key) => (sheet[key] = css(sheet[key])));
  return sheet;
};

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

  //? static get propTypes() {
  //?   return {
  //?     id: PropTypes.string,
  //?     entityId: PropTypes.string,
  //?     hinter: PropTypes.string,
  //?   };
  //? }

  static get childContextTypes() {
    return this.contextTypes;
  }

  getChildContext() {
    if (this.props.id) {
      return {...this.context, ...{nearestParentId: this.props.id}};
    }

    return this.context;
  }

  static get contextTypes() {
    return {
      labId: PropTypes.string,
      dispatch: PropTypes.func,
      store: PropTypes.object,
      theme: PropTypes.object,
      model: PropTypes.any,
      register: PropTypes.func,
      id: PropTypes.string,
      desktopId: PropTypes.string,
      contextId: PropTypes.string,
      entityId: PropTypes.string,
      dragControllerId: PropTypes.string,
      dragServiceId: PropTypes.string,
      readonly: PropTypes.any,
      themeContextName: PropTypes.string,
      nearestParentId: PropTypes.string,
    };
  }

  get name() {
    return this._name;
  }

  get widgetId() {
    return this.props.widgetId || this.props.id;
  }

  get styles() {
    if (this.lastStyleProps === this.props) {
      return this.lastStyle;
    }
    this.lastStyleProps = this.props;

    const myStyle = this.getMyStyle();

    const styleProps = this.getStyleProps(myStyle);
    const hash = this.computeStyleHash(myStyle, styleProps);

    let item = stylesCache.get(hash);
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

      this.lastStyle = item.style;
      return item.style;
    }

    const jsStyles = myStyle.func(this.context.theme, styleProps);
    const newStyle = {
      classNames: injectCSS(jsStyles),
      props: jsStyles,
    };

    /* Limit the style cache to 1024 entries. The less used item is deleted
     * when the limit is reached.
     */
    if (stylesCache.size > 1024) {
      item = stylesCacheUses.head;
      item.detach();
      stylesCache.delete(item.hash);
    }

    /* Create a new linked-list item and add this one at the end of the list.
     * Here, it's still not possible to be sure that this style will be often
     * used. Anyway, if it's not used anymore, it will move one-by-one to the
     * front of the list.
     */
    item = new LinkedList.Item();
    item.hash = hash;
    item.style = newStyle;
    stylesCacheUses.append(item);

    stylesCache.set(hash, item);

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

  getStyleProps(myStyle) {
    if (!myStyle.hasPropsParam) {
      return null;
    }
    let propNamesUsed = myStyle.propNamesUsed;
    if (!propNamesUsed) {
      throw new Error(`propNames is not defined in styles.js of ${this.name}`);
    }

    let styleProps = {};
    propNamesUsed.forEach((p) => {
      styleProps[p] = this.props[p];
    });
    if (myStyle.mapProps) {
      styleProps = myStyle.mapProps(styleProps, this.context.theme);
    }
    return styleProps;
  }

  computeStyleHash(myStyle, styleProps) {
    let hashProps = '';
    if (myStyle.hasPropsParam) {
      hashProps = fasterStringify(styleProps);
    }

    let hashTheme = '';
    if (myStyle.hasThemeParam) {
      hashTheme = this.context.theme.name;
    }

    return `${this.name}${hashTheme}${hashProps}`;
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

  // Get style definition for this widget and merge it with the style definition of inherited widget
  getMergedStyleDefinition() {
    let styleDefs = this._styleDefs;
    if (!styleDefs) {
      styleDefs = this._names.map(this.importStyleDefinition);
    }
    if (styleDefs.every((styleDef) => !styleDef)) {
      throw new Error(`No styles.js file for component '${this.name}'`);
    }
    styleDefs = styleDefs.filter((styleDef) => styleDef);

    if (styleDefs.length === 1) {
      return styleDefs[0];
    }

    styleDefs.reverse();

    const propNamesUsedList = styleDefs
      .map((styleDef) => styleDef.propNamesUsed)
      .filter((propNamesUsed) => propNamesUsed)
      .flat();

    let propNamesUsed;
    if (propNamesUsedList.length > 0) {
      propNamesUsed = new Set(propNamesUsedList);
    }

    const mapPropsList = styleDefs
      .map((styleDef) => styleDef.mapProps)
      .filter((mapProps) => mapProps);
    const funcList = styleDefs.map((styleDef) => styleDef.func);

    return {
      hasThemeParam: styleDefs.some((styleDef) => styleDef.hasThemeParam),
      hasPropsParam: styleDefs.some((styleDef) => styleDef.hasPropsParam),
      propNamesUsed,
      mapProps: (props, theme) =>
        mapPropsList.reduce((p, mapProps) => mapProps(p, theme), props),
      func: (theme, props) =>
        funcList.reduce(
          (styles, func) => func.bind({styles})(theme, props),
          {}
        ),
    };
  }

  // Get style definition for this widget from cache or import it
  getMyStyle() {
    let myStyle = myStyleCache[this.name];
    if (myStyle) {
      return myStyle;
    }

    myStyle = this.getMergedStyleDefinition();
    myStyleCache[this.name] = myStyle;

    return myStyle;
  }

  read(key) {
    return this.props[key];
  }

  componentDidCatch(error, info) {
    this.reportError(error, info);
  }

  componentDidMount() {
    /* HACK: flush explicitly all aphrodite styles in order to remove the
     * flickers and bugs in some systems where the styles are not applied.
     * Note that this API should not be called directly because it's an
     * internal function of aphrodite.
     */
    flushToStyleTag();
  }

  shouldComponentUpdate(newProps, newState) {
    return (
      !shallowEqualShredder(this.props, newProps) ||
      !shallowEqualShredder(this.state, newState)
    );
  }

  componentWillUnmount() {
    debounceCollect(() => {
      this.rawDispatch(widgetsActions.collect());
    });
  }

  ///////////STATE MGMT:
  static withRoute(path, watchedParams, watchedSearchs, watchHash) {
    return connect(
      (state) => {
        const router = new Shredder(state.router);
        const location = router.get('location');
        if (!location) {
          return {};
        }

        const pathName = router.get('location.pathname');
        const search = router.get('location.search');

        const match = matchPath(pathName, {
          path,
          exact: false,
          strict: false,
        });

        let withSearch = null;

        if (Array.isArray(watchedSearchs)) {
          for (const s of watchedSearchs) {
            if (!withSearch) {
              withSearch = {};
            }
            withSearch[s] = Widget.GetParameter(search, s);
          }
        } else {
          withSearch = {
            [watchedSearchs]: Widget.GetParameter(search, watchedSearchs),
          };
        }

        let withHash = null;
        if (watchHash) {
          withHash = {hash: router.get('location.hash')};
        }

        if (Array.isArray(watchedParams)) {
          const params = {};
          for (const p of watchedParams) {
            params[p] = !match ? null : match.params[p];
          }
          return {
            isDisplayed: !!match,
            ...params,
            ...withSearch,
            ...withHash,
          };
        } else {
          return {
            isDisplayed: !!match,
            [watchedParams]: !match ? null : match.params[watchedParams],
            ...withSearch,
            ...withHash,
          };
        }
      },
      null,
      null,
      {
        pure: true,
        areOwnPropsEqual: shallowEqualShredder,
        areStatePropsEqual: shallowEqualShredder,
        areMergedPropsEqual: shallowEqualShredder,
      }
    );
  }

  static WithRoute(component, watchedParams, watchedSearchs, watchHash) {
    return (path) => {
      return Widget.withRoute(
        path,
        watchedParams,
        watchedSearchs,
        watchHash
      )(component);
    };
  }

  static wire(connectId, wires) {
    const useProps = !connectId;
    return connect(
      (state, props) => {
        if (useProps) {
          connectId = props.id;
        }
        let mapState = {};
        if (state.backend) {
          if (wires) {
            const shredded = new Shredder(state.backend);
            if (!shredded.has(connectId)) {
              return {_no_props_: true, id: null};
            }
            Object.keys(wires).forEach((wire) => {
              const val = shredded.get(`${connectId}.${wires[wire]}`, null);
              if (val) {
                if (val._isSuperReaper6000) {
                  mapState[wire] = val.state;
                } else {
                  mapState[wire] = val;
                }
              }
            });
          }
          return mapState;
        }
        if (this.isForm) {
          mapState.initialValues = mapState;
        }

        return {};
      },
      null,
      null,
      {
        pure: true,
        areOwnPropsEqual: shallowEqualShredder,
        areStatePropsEqual: shallowEqualShredder,
        areMergedPropsEqual: shallowEqualShredder,
      }
    );
  }

  static Wired(component) {
    if (!component) {
      throw new Error('You must provide a component!');
    }
    return (id) => Widget.wire(id, component.wiring)(component);
  }

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

  withState(mapProps, path) {
    return connect(
      (state) => {
        const s = new Shredder(state.backend);
        if (isFunction(mapProps)) {
          return Object.assign(mapProps(s.get(`${this.props.id}${path}`)));
        } else {
          return {
            [mapProps]: s.get(`${this.props.id}${path}`),
          };
        }
      },
      null,
      null,
      {
        pure: true,
        areOwnPropsEqual: shallowEqualShredder,
        areStatePropsEqual: shallowEqualShredder,
        areMergedPropsEqual: shallowEqualShredder,
      }
    );
  }

  WithState(component, mapProps) {
    return (path) => {
      return this.withState(mapProps, path)(component);
    };
  }

  withModel(model, mapProps, fullPath) {
    return connect(
      (state) => {
        const s = new Shredder({
          backend: state.backend,
          widgets: state.widgets,
        });
        let parentModel = '';
        if (!fullPath) {
          parentModel = `backend.${this.props.id}`;
        }
        if (!mapProps) {
          return {
            defaultValue: s.get(`${parentModel}${model}`),
            model,
          };
        } else {
          if (isFunction(mapProps)) {
            return Object.assign(
              {model},
              mapProps(s.get(`${parentModel}${model}`))
            );
          } else {
            return {
              [mapProps]: s.get(`${parentModel}${model}`),
              model,
            };
          }
        }
      },
      null,
      null,
      {
        pure: true,
        areOwnPropsEqual: shallowEqualShredder,
        areStatePropsEqual: shallowEqualShredder,
        areMergedPropsEqual: shallowEqualShredder,
        forwardRef: true,
      }
    );
  }

  WithModel(component, mapProps, useEntityId) {
    return (model) => {
      if (isFunction(model)) {
        model = model();
      }
      if (useEntityId) {
        model = `backend.${this.props.entityId}${model}`;
      }
      // Optional choice
      if (model.indexOf('||') !== -1) {
        const choices = model.split('||');
        const first = this.getModelValue(choices[0], useEntityId);
        if (first) {
          return this.withModel(choices[0], mapProps)(component);
        }
        const second = choices[0].replace().replace(/[^\.]+$/, choices[1]);
        return this.withModel(second, mapProps)(component);
      }
      // Look for data in collections
      const collectionInfo = model.match(/\[(.*)\]/);
      if (collectionInfo) {
        if (collectionInfo.length === 2) {
          const itemId = collectionInfo[1];
          //Full collection case
          if (itemId.length === 0) {
            const path = model.replace('[]', '');
            const coll = this.getModelValue(path, useEntityId);
            return (props) => {
              return (
                <div>
                  {coll.map((v, k) => {
                    const Item = this.withModel(
                      `${path}.${k}`,
                      mapProps,
                      useEntityId
                    )(component);
                    return <Item key={k} {...props} />;
                  })}
                </div>
              );
            };
          }
          // With entity id  case
          if (
            itemId.match(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            )
          ) {
            const i = model.indexOf('[');
            const prePath = model.substring(1, i);
            const finalPath = this.getEntityPathInCollection(
              prePath,
              itemId
            )(
              useEntityId
                ? this.getModelValue(this.props.entityId, useEntityId)
                : this.getModelValue('')
            );

            return this.withModel(finalPath, mapProps, useEntityId)(component);
          }
        }
      }

      // Std
      return this.withModel(model, mapProps, useEntityId)(component);
    };
  }

  ///////// High-level model mapper API

  getWidgetToEntityMapper(component, mapProps) {
    return this.WithModel(component, mapProps, true);
  }

  getWidgetToFormMapper(component, mapProps) {
    return this.WithModel(component, mapProps, false);
  }

  getPluginToEntityMapper(component, pluginName, mapProps) {
    const WiredPlugin = Widget.Wired(component)(
      `${pluginName}@${this.props.id}`
    );
    return this.WithModel(WiredPlugin, mapProps, true);
  }

  getPluginToFormMapper(component, pluginName, mapProps) {
    const pluginPath = `${pluginName}@${this.props.id}`;
    const WiredPlugin = Widget.Wired(component)(pluginPath);
    return this.withModel(`backend.${pluginPath}`, mapProps, true)(WiredPlugin);
  }

  wirePluginToForm(component, pluginName) {
    const WiredPlugin = Widget.Wired(component)(
      `${pluginName}@${this.props.id}`
    );
    return WiredPlugin;
  }

  mapWidgetToBackend(component, mapProps, path) {
    return this.withModel(`backend.${path}`, mapProps, true)(component);
  }

  mapWidgetToEntityPlugin(component, mapProps, pluginName, path) {
    path = `${pluginName}@${this.props.entityId}${path}`;
    return this.withModel(`backend.${path}`, mapProps, true)(component);
  }

  mapWidgetToFormPlugin(component, mapProps, pluginName, path) {
    path = `${pluginName}@${this.props.id}${path}`;
    return this.withModel(`backend.${path}`, mapProps, true)(component);
  }

  mapWidget(component, mapProps, path) {
    return this.withModel(path, mapProps, true)(component);
  }

  buildCollectionLoader(ids, FinalComp, FallbackComp) {
    let Loader = (props) => {
      const loaded = ids.reduce((loaded, id) => {
        return props[id] === true;
      }, false);
      if (loaded) {
        return <FinalComp collection={this.getCollection(ids)} />;
      } else {
        return FallbackComp ? <FallbackComp /> : null;
      }
    };

    ids.map((id) => {
      Loader = this.mapWidget(
        Loader,
        (item) => {
          return {
            [id]: item !== null && item !== undefined,
          };
        },
        `backend.${id}.id`
      );
    });

    return <Loader />;
  }

  getCollection(ids) {
    return ids.map((id) => {
      return this.getEntityById(id);
    });
  }

  buildLoader(branch, Loaded, FallbackComp) {
    const Loader = (props) => {
      if (props.loaded) {
        return <Loaded />;
      } else {
        return FallbackComp ? <FallbackComp /> : null;
      }
    };

    const Renderer = this.mapWidget(
      Loader,
      (entityId) => {
        if (!entityId) {
          return {loaded: false};
        } else {
          return {loaded: true};
        }
      },
      `backend.${branch}.id`
    );
    return <Renderer />;
  }

  ///////////GOBLIN BUS:
  get registry() {
    return this.getState().commands.get('registry');
  }

  cmd(cmd, args) {
    if (!this.registry[cmd]) {
      console.warn(
        '%cGoblins Warning',
        'font-weight: bold;',
        `Command not impl. ${cmd}`
      );
      return;
    }

    if (args && !args.labId) {
      args.labId = this.context.labId;
    }
    if (args && !args.desktopId) {
      args.desktopId = this.context.desktopId;
    }

    const action = {
      type: 'QUEST', // FIXME: it seems not used
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
    this.cmd(
      'laboratory.when-ui-crash',
      Object.assign({id: this.context.labId}, {desktopId, error, info})
    );
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
    this.cmd(`${service}.${action}`, Object.assign({id}, args));
  }

  doFor(serviceId, action, args) {
    const service = serviceId.split('@')[0];
    this.cmd(`${service}.${action}`, Object.assign({id: serviceId}, args));
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

  ///////////NAVIGATION:

  nav(path) {
    this.context.dispatch(push(path));
  }

  static GetParameter(search, name) {
    return getParameter(search, name);
  }

  getWorkItemId() {
    const search = this.getRouting().get('location.search');
    if (search) {
      return Widget.GetParameter(search, 'wid');
    }
  }

  getModelId() {
    const search = this.getRouting().get('location.search');
    if (search) {
      return Widget.GetParameter(search, 'mid');
    }
  }

  getHinterId() {
    const search = this.getRouting().get('location.search');
    if (search) {
      return Widget.GetParameter(search, 'hid');
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

  backendHasBranch(branch) {
    return this.getState().backend.has(branch);
  }

  getModelValue(model, fullPath) {
    const storeState = this.getState();
    const state = new Shredder({
      backend: storeState.backend,
      widgets: storeState.widgets,
    });
    if (fullPath) {
      if (isFunction(model)) {
        model = model(state.get(model));
      }
      if (!model.startsWith('backend.')) {
        model = 'backend.' + model;
      }
      return state.get(model);
    } else {
      const parentModel = this.context.model || `backend.${this.props.id}`;
      if (isFunction(model)) {
        model = model(state.get(parentModel));
      }
      return state.get(`${parentModel}${model}`);
    }
  }

  getBackendValue(fullpath) {
    const storeState = this.getState();
    const state = new Shredder({
      backend: storeState.backend,
      widgets: storeState.widgets,
    });
    return state.get(fullpath);
  }

  getFormValue(path) {
    return this.getModelValue(path);
  }

  getFormPluginValue(pluginName, path) {
    const state = new Shredder(this.getState().backend);
    return state.get(`${pluginName}@${this.props.id}${path}`);
  }

  getEntityPluginValue(pluginName, path) {
    const state = new Shredder(this.getState().backend);
    return state.get(`${pluginName}@${this.props.entityId}${path}`);
  }

  getEntityValue(model) {
    if (isFunction(model)) {
      const state = new Shredder(this.getState());
      model = model(state.get(`backend.${this.props.entityId}`));
      return this.getModelValue(model, true);
    } else {
      return this.getModelValue(`${this.props.entityId}${model}`, true);
    }
  }

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

  getSelectionState(target) {
    if (target.type !== 'text') {
      return null;
    }
    return {
      ss: target.selectionStart,
      se: target.selectionEnd,
      sd: target.selectionDirection,
    };
  }

  getHinterType(hinterId) {
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

  hideHinter() {
    let path = this.getRouting().get('location.pathname');
    const search = this.getRouting().get('location.search');
    const hash = this.getRouting().get('location.hash');
    if (path.split('/').length === 4) {
      let hinterType = path.substr(path.lastIndexOf('/'), path.length);
      path = path.substr(0, path.lastIndexOf('/'));
      if (!hinterType.endsWith('-hidden')) {
        hinterType += '-hidden';
      }
      this.nav(`${path}${hinterType}${search}${hash}`);
    }
  }

  navToHinter() {
    if (this.props.hinter) {
      if (this.props.displayValue) {
        if (this.props.model && this.props.selectedId) {
          console.log(this.props.selectedId);
          this.navToDetail(this.props.id, this.props.selectedId);
        }
      } else {
        let path = this.getRouting().get('location.pathname');
        const search = this.getRouting().get('location.search');
        if (path.split('/').length === 4) {
          path = path.substr(0, path.lastIndexOf('/'));
        }

        const hinterType = this.getHinterType(this.props.hinter);

        if (!hinterType) {
          this.nav(
            `${path}${search}#${this.context.model}.${this.props.hinter}`
          );
          return;
        }

        this.nav(
          `${path}/${hinterType}${search}#${this.context.model}.${this.props.hinter}`
        );
      }
    } else {
      this.hideHinter();
    }
  }

  navToDetail(workitemId, entityId, hinterName) {
    const type = entityId.split('@')[0];
    let path = this.getRouting().get('location.pathname');
    const search = this.getRouting().get('location.search');
    if (path.split('/').length === 4) {
      path = path.substr(0, path.lastIndexOf('/'));
    }

    if (!hinterName) {
      hinterName = type;
    }

    this.nav(
      `${path}/${hinterName}-hidden${search}#backend.${workitemId}.${type}`
    );

    const detailServiceId = `${hinterName}-detail@${workitemId}`;
    this.cmd(`detail.set-entity`, {
      id: detailServiceId,
      entityId,
    });
  }

  navGoBack() {
    this.context.dispatch(goBack());
  }

  replaceNav(path) {
    this.context.dispatch(replace(path));
  }

  getNearestId() {
    return this.props.id || this.context.nearestParentId;
  }

  static copyTextToClipboard(text) {
    const textField = document.createElement('textarea');
    textField.innerText = text;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand('copy');
    textField.remove();
  }

  getUserSettings() {
    return Widget.getUserSession(new Shredder(this.getState()));
  }

  setUserSettings(questName, payload) {
    const state = this.getState().backend;
    payload.id = state.get(window.labId).get('clientSessionId');
    this.cmd(`client-session.${questName}`, payload);
  }

  static getUserSession(state) {
    if (window.isBrowser) {
      //TODO: impl. browser session
      return new Shredder({locale: navigator.language});
    } else {
      return state.get(
        `backend.${state.get(`backend.${window.labId}.clientSessionId`)}`
      );
    }
  }
}

Widget.propTypes = {
  id: PropTypes.string,
  entityId: PropTypes.string,
  hinter: PropTypes.string,
};

export default Widget;
