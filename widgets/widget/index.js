import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import Shredder from 'xcraft-core-shredder';
import {push, replace, goBack} from 'react-router-redux';
import {actions} from 'react-redux-form/immutable';
import {matchPath} from 'react-router';
import fasterStringify from 'faster-stable-stringify';
import {StyleSheet, css} from 'aphrodite/no-important';
import {flushToStyleTag} from 'aphrodite/lib/inject'; // HACK
import traverse from 'traverse';
import importer from '../importer/';

const stylesImporter = importer('styles');

const hashStyles = {};

function isFunction(functionToCheck) {
  var getType = {};
  return (
    functionToCheck &&
    getType.toString.call(functionToCheck) === '[object Function]'
  );
}

/**
 * Remove props that are functions, 'children' or undefined, null
 *
 * @param {object} props - Component properties.
 * @returns {object} the filtered props.
 */
const getPropsForStyles = props =>
  Object.assign(
    {},
    ...Object.keys(props)
      .filter(
        k =>
          props[k] !== undefined &&
          props[k] !== null &&
          k !== 'children' &&
          typeof props[k] !== 'function'
      )
      .map(k => ({
        [k]: props[k],
      }))
  );

const injectCSS = classes => {
  traverse(classes).forEach(function(style) {
    if (style === undefined || style === null) {
      this.delete();
    }
  });

  const sheet = StyleSheet.create(classes);
  Object.keys(sheet).forEach(key => (sheet[key] = css(sheet[key])));
  return sheet;
};

class Widget extends React.PureComponent {
  constructor() {
    super(...arguments);
    this._name = this.constructor.name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }

  static get propTypes() {
    return {
      id: PropTypes.string,
      entityId: PropTypes.string,
      hinter: PropTypes.string,
    };
  }

  static get contextTypes() {
    return {
      labId: PropTypes.string,
      dispatch: PropTypes.func,
      store: PropTypes.object,
      theme: PropTypes.object,
      model: PropTypes.any,
      id: PropTypes.string,
      desktopId: PropTypes.string,
      contextId: PropTypes.string,
      entityId: PropTypes.string,
      dragControllerId: PropTypes.string,
      dragServiceId: PropTypes.string,
      readonly: PropTypes.any,
    };
  }

  get name() {
    return this._name;
  }

  get styles() {
    let myStyle = stylesImporter(this.name);
    if (!myStyle) {
      return {};
    }

    const styleProps = getPropsForStyles(this.props);
    const h = fasterStringify(styleProps);
    const k = `${this.name}${this.context.theme.name}${h}`;

    if (hashStyles[k]) {
      return hashStyles[k];
    }

    const styles = myStyle(this.context.theme, styleProps);
    return (hashStyles[k] = {
      classNames: injectCSS(styles),
      props: styles,
    });
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

  ///////////STATE MGMT:
  static withRoute(path, watchedParams, watchedSearchs, watchHash) {
    return connect(
      state => {
        const routing = new Shredder(state.routing);
        const pathName = routing.get('location.pathname');
        const search = routing.get('location.search');

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
          withHash = {hash: routing.get('location.hash')};
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
      {pure: true}
    );
  }

  static WithRoute(component, watchedParams, watchedSearchs, watchHash) {
    return path => {
      return Widget.withRoute(path, watchedParams, watchedSearchs, watchHash)(
        component
      );
    };
  }

  static wire(connectId, wires) {
    return connect(
      state => {
        let mapState = {};
        if (state.backend) {
          if (wires) {
            const shredded = new Shredder(state.backend);
            if (!shredded.has(connectId)) {
              return {_no_props_: true};
            }
            Object.keys(wires).forEach(wire => {
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
      {pure: true}
    );
  }

  static Wired(component) {
    if (!component) {
      throw new Error('You must provide a component!');
    }
    return id => Widget.wire(id, component.wiring)(component);
  }

  static shred(state) {
    return new Shredder(state);
  }

  withState(mapProps, path) {
    return connect(
      state => {
        const s = new Shredder(state);
        if (isFunction(mapProps)) {
          return Object.assign(
            mapProps(s.get(`backend.${this.props.id}${path}`))
          );
        } else {
          return {
            [mapProps]: s.get(`backend.${this.props.id}${path}`),
          };
        }
      },
      null,
      null,
      {pure: true}
    );
  }

  WithState(component, mapProps) {
    return path => {
      return this.withState(mapProps, path)(component);
    };
  }

  withModel(model, mapProps, fullPath) {
    return connect(
      state => {
        const s = new Shredder(state);
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
      {pure: true}
    );
  }

  WithModel(component, mapProps, useEntityId) {
    return model => {
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
            return props => {
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
            const finalPath = this.getEntityPathInCollection(prePath, itemId)(
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

  buildLoader(branch, Loaded) {
    const Loader = props => {
      if (props.loaded) {
        return <Loaded />;
      } else {
        return null;
      }
    };

    const Renderer = this.mapWidget(
      Loader,
      entityId => {
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
    args.labId = this.context.labId;
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
   * Dispatch an action in the frontend reducer for this widget.
   *
   * The `reducer.js` file must be present for working.
   *
   * @param {Object} action - Redux action.
   */
  dispatch(action) {
    action._id = this.props.id;
    action._type = this.name;
    action.type = `@widgets_${action.type}`;
    this.context.store.dispatch(action);
  }

  ///////////NAVIGATION:

  nav(path) {
    this.context.dispatch(push(path));
  }

  static GetParameter(search, name) {
    if (!search) {
      return null;
    }
    const query = search.substring(1);
    const vars = query.split('&');
    for (const v of vars) {
      const pair = v.split('=');
      if (decodeURIComponent(pair[0]) === name) {
        return decodeURIComponent(pair[1]);
      }
    }
    return null;
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
    this.context.dispatch(actions.change(path, value));
  }

  setModelValue(path, value, useEntity) {
    let fullPath = 'backend.' + this.props.id + path;
    if (useEntity) {
      fullPath = 'backend.' + this.props.entityId + path;
    }
    this.context.dispatch(actions.change(fullPath, value));
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
    const state = new Shredder(this.getState());
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
    const state = new Shredder(this.getState());
    return state.get(fullpath);
  }

  getFormValue(path) {
    return this.getModelValue(path);
  }

  getFormPluginValue(pluginName, path) {
    return this.getBackendValue(
      `backend.${pluginName}@${this.props.id}${path}`
    );
  }

  getEntityPluginValue(pluginName, path) {
    return this.getBackendValue(
      `backend.${pluginName}@${this.props.entityId}${path}`
    );
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
    const state = new Shredder(this.getState());
    return state.get(`backend.${entityId}`);
  }

  getEntityPathInCollection(collectionPath, id, entityPath) {
    return entity => {
      const item = entity
        .get(collectionPath)
        .shrinq.single(pack => pack.get('id') === id);

      return entityPath
        ? `.${collectionPath}[${item.key}].${entityPath}`
        : `.${collectionPath}[${item.key}]`;
    };
  }

  getState() {
    return this.context.store.getState();
  }

  getMyState() {
    if (!this.props.id) {
      throw new Error('Cannot resolve widget state without an valid id');
    }
    return this.getState().backend.get(this.props.id);
  }

  getRouting() {
    return new Shredder(this.context.store.getState().routing);
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
      const hinterType = path.substr(path.lastIndexOf('/'), path.length);
      path = path.substr(0, path.lastIndexOf('/'));
      this.nav(`${path}${hinterType}-hidden${search}${hash}`);
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
          `${path}/${hinterType}${search}#${this.context.model}.${
            this.props.hinter
          }`
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
}

export default Widget;
