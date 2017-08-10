import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import Shredder from 'xcraft-core-shredder';
import {push, replace} from 'react-router-redux';
import {matchPath} from 'react-router';
import fasterStringify from 'faster-stable-stringify';
import {StyleSheet, css} from 'aphrodite/no-important';
import {flushToStyleTag} from 'aphrodite/lib/inject'; // HACK
import traverse from 'traverse';
import deepFreeze from 'deep-freeze';
import importer from '../importer/';

const stylesImporter = importer ('styles');

const hashStyles = {};

/**
 * Remove props that are functions, 'children' or undefined, null
 *
 * @param {object} props - Component properties.
 * @returns {object} the filtered props.
 */
const getPropsForStyles = props =>
  Object.assign (
    {},
    ...Object.keys (props)
      .filter (
        k =>
          props[k] !== undefined &&
          props[k] !== null &&
          k !== 'children' &&
          typeof props[k] !== 'function'
      )
      .map (k => ({
        [k]: props[k],
      }))
  );

const injectCSS = classes => {
  traverse (classes).forEach (function (style) {
    if (style === undefined || style === null) {
      this.delete ();
    }
  });

  const sheet = StyleSheet.create (classes);
  Object.keys (sheet).forEach (key => (sheet[key] = css (sheet[key])));
  return sheet;
};

class Widget extends React.PureComponent {
  constructor () {
    super (...arguments);
    this._name = this.constructor.name
      .replace (/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase ();
  }

  static get propTypes () {
    return {
      id: PropTypes.string,
      hinter: PropTypes.string,
    };
  }

  static get contextTypes () {
    return {
      labId: PropTypes.string,
      dispatch: PropTypes.func,
      store: PropTypes.object,
      theme: PropTypes.object,
      model: PropTypes.any,
    };
  }

  get name () {
    return this._name;
  }

  get styles () {
    const myStyle = stylesImporter (this.name);
    if (!myStyle) {
      return {};
    }

    const styleProps = getPropsForStyles (this.props);
    const h = fasterStringify (styleProps);
    const k = `${this.name}${this.context.theme.name}${h}`;

    if (hashStyles[k]) {
      return hashStyles[k];
    }

    const styles = myStyle (this.context.theme, styleProps);
    return (hashStyles[k] = {
      classNames: injectCSS (styles),
      props: deepFreeze (styles),
    });
  }

  read (key) {
    return this.props[key];
  }

  componentDidMount () {
    /* HACK: flush explicitly all aphrodite styles in order to remove the
     * flickers and bugs in some systems where the styles are not applied.
     * Note that this API should not be called directly because it's an
     * internal function of aphrodite.
     */
    flushToStyleTag ();
  }

  ///////////STATE MGMT:
  static withRoute (path, watchedParams, watchedSearchs, watchHash) {
    return connect (
      state => {
        const routing = new Shredder (state.routing);
        const pathName = routing.get ('location.pathname');
        const search = routing.get ('location.search');

        const match = matchPath (pathName, {
          path,
          exact: false,
          strict: false,
        });

        let withSearch = null;
        if (watchedSearchs) {
          withSearch = {
            [watchedSearchs]: Widget.GetParameter (search, watchedSearchs),
          };
        }

        let withHash = null;
        if (watchHash) {
          withHash = {hash: routing.get ('location.hash')};
        }
        return {
          isDisplayed: !!match,
          [watchedParams]: !match ? null : match.params[watchedParams],
          ...withSearch,
          ...withHash,
        };
      },
      null,
      null,
      {pure: true}
    );
  }

  static WithRoute (component, watchedParams, watchedSearchs, watchHash) {
    return path => {
      return Widget.withRoute (path, watchedParams, watchedSearchs, watchHash) (
        component
      );
    };
  }

  static wire (connectId, wires) {
    return connect (
      state => {
        let mapState = {};
        if (state.backend) {
          if (wires) {
            const shredded = new Shredder (state.backend);
            if (!shredded.has (connectId)) {
              return {_no_props_: true};
            }
            Object.keys (wires).forEach (wire => {
              const val = shredded.get (`${connectId}.${wires[wire]}`, null);
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

  static Wired (component) {
    if (!component) {
      throw new Error ('You must provide a component!');
    }
    return id => Widget.wire (id, component.wiring) (component);
  }

  shred (state) {
    return new Shredder (state);
  }

  withModel (model, propName) {
    return connect (
      state => {
        const s = new Shredder (state);
        const parentModel = `backend.${this.props.id}`;
        if (!propName) {
          propName = 'defaultValue';
        }
        return {
          [propName]: s.get (`${parentModel}${model}`),
          model,
        };
      },
      null,
      null,
      {pure: true}
    );
  }

  WithModel (component, propName) {
    return model => {
      // Optional choice
      if (model.indexOf ('||') !== -1) {
        const choices = model.split ('||');
        const first = this.getModelValue (choices[0]);
        if (first) {
          return this.withModel (choices[0], propName) (component);
        }
        const second = choices[0].replace ().replace (/[^\.]+$/, choices[1]);
        return this.withModel (second, propName) (component);
      }
      // Collections
      if (model.endsWith ('[]')) {
        const path = model.replace ('[]', '');
        const coll = this.getModelValue (path);
        return props => {
          return (
            <div>
              {coll.map ((v, k) => {
                const Item = this.withModel (`${path}.${k}`, propName) (
                  component
                );
                return <Item key={k} {...props} />;
              })}
            </div>
          );
        };
      }
      // Std
      return this.withModel (model, propName) (component);
    };
  }

  ///////////GOBLIN BUS:

  cmd (cmd, args) {
    args.labId = this.context.labId;
    const action = {
      type: 'QUEST',
      cmd: cmd,
      args: args,
    };
    this.context.dispatch (action);
  }

  do (action, args) {
    return this.doAs (this.name, action, args);
  }

  doAs (service, action, args) {
    if (!this.props.id) {
      console.error (`${this.name} is not a connected widget (need an id)`);
      return;
    }
    this.cmd (
      `${service}.${action}`,
      Object.assign ({id: this.props.id}, args)
    );
  }

  ///////////NAVIGATION:

  nav (path) {
    this.context.dispatch (push (path));
  }

  static GetParameter (search, name) {
    if (!search) {
      return null;
    }
    const query = search.substring (1);
    const vars = query.split ('&');
    for (const v of vars) {
      const pair = v.split ('=');
      if (decodeURIComponent (pair[0]) === name) {
        return decodeURIComponent (pair[1]);
      }
    }
    return null;
  }

  getWorkItemId () {
    const search = this.getRouting ().get ('location.search');
    if (search) {
      return Widget.GetParameter (search, 'wid');
    }
  }

  getModelId () {
    const search = this.getRouting ().get ('location.search');
    if (search) {
      return Widget.GetParameter (search, 'mid');
    }
  }

  getHinterId () {
    const search = this.getRouting ().get ('location.search');
    if (search) {
      return Widget.GetParameter (search, 'hid');
    }
  }

  getModelValue (model) {
    const state = new Shredder (this.getState ());
    const parentModel = this.context.model || `backend.${this.props.id}`;
    return state.get (`${parentModel}${model}`);
  }

  getState () {
    return this.context.store.getState ();
  }

  getRouting () {
    return new Shredder (this.context.store.getState ().routing);
  }

  getSelectionState (target) {
    if (target.type !== 'text') {
      return null;
    }
    return {
      ss: target.selectionStart,
      se: target.selectionEnd,
      sd: target.selectionDirection,
    };
  }

  getHinterType (hinterId) {
    let type = hinterId;
    if (!type || type === '') {
      return null;
    }
    const index = hinterId.indexOf ('@');
    if (index !== -1) {
      type = hinterId.substr (0, index);
    }
    return type;
  }

  getHash () {
    return this.getRouting ().get ('location.hash');
  }

  navToHinter () {
    if (this.props.hinter) {
      let path = this.getRouting ().get ('location.pathname');
      const search = this.getRouting ().get ('location.search');
      if (path.split ('/').length === 4) {
        path = path.substr (0, path.lastIndexOf ('/'));
      }

      const hinterType = this.getHinterType (this.props.hinter);

      if (!hinterType) {
        this.nav (
          `${path}${search}#${this.context.model}.${this.props.hinter}`
        );
        return;
      }

      this.nav (
        `${path}/${hinterType}${search}#${this.context.model}.${this.props.hinter}`
      );
    }
  }

  replaceNav (path) {
    this.context.dispatch (replace (path));
  }
}

export default Widget;
