import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import Shredder from 'xcraft-core-shredder';
import {push, replace} from 'react-router-redux';
import {matchPath} from 'react-router';
import {actions} from 'react-redux-form';
import importer from '../importer/';

const stylesImporter = importer ('styles');

const jsifyPropsNames = props => {
  const jsified = {};
  Object.keys (props).forEach (k => {
    jsified[k.replace (/-([a-z])/g, (m, g1) => g1.toUpperCase ())] = props[k];
  });
  return jsified;
};

class Widget extends React.PureComponent {
  constructor (cProps) {
    super (cProps);
  }

  static get contextTypes () {
    return {
      labId: PropTypes.string,
      dispatch: PropTypes.func,
      store: PropTypes.object,
      theme: PropTypes.object,
    };
  }

  get name () {
    return this.constructor.name
      .replace (/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase ();
  }

  static withRoute (path, watchedParams) {
    return connect (
      state => {
        const routing = new Shredder (state.routing);
        const pathName = routing.get ('location.pathname');
        const match = matchPath (pathName, {
          path,
          exact: false,
          strict: false,
        });
        return {
          isDisplayed: !!match,
          [watchedParams]: !match ? null : match.params[watchedParams],
        };
      },
      null,
      null,
      {pure: true}
    );
  }

  static WithRoute (component, watchedParams) {
    return path => {
      return Widget.withRoute (path, watchedParams) (props => {
        const Component = component;
        return <Component {...props} />;
      });
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
    return id => Widget.wire (id, component.wiring) (component);
  }

  shred (state) {
    return new Shredder (state);
  }

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
    if (!this.props.id) {
      console.error (`${this.name} is not a connected widget (need an id)`);
      return;
    }
    this.cmd (
      `${this.name}.${action}`,
      Object.assign ({id: this.props.id}, args)
    );
  }

  nav (path) {
    console.log (`push (${path})`);
    this.context.dispatch (push (path));
  }

  navToContext (contextId) {
    this.cmd ('laboratory.nav-to-context', {
      id: this.context.labId,
      contextId,
    });
  }

  navToWorkItem (contextId, view, workItemId) {
    this.nav (`/${contextId}/${view}?wid=${workItemId}`);
    this.cmd ('laboratory.nav-to-workitem', {
      id: this.context.labId,
      contextId,
      view,
      workItemId,
      skipNav: true,
    });
  }

  _getParameter (search, name) {
    const query = search.substring (1);
    const vars = query.split ('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split ('=');
      if (decodeURIComponent (pair[0]) === name) {
        return decodeURIComponent (pair[1]);
      }
    }
    return null;
  }

  getWorkItemId () {
    const search = this.getRouting ().get ('location.search');
    if (search) {
      return this._getParameter (search, 'wid');
    }
  }

  getModelId () {
    const search = this.getRouting ().get ('location.search');
    if (search) {
      return this._getParameter (search, 'mid');
    }
  }

  getHinterId () {
    const search = this.getRouting ().get ('location.search');
    if (search) {
      return this._getParameter (search, 'hid');
    }
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

  navToHinter () {
    let path = this.getRouting ().get ('location.pathname');
    const search = this.getRouting ().get ('location.search');
    if (path.split ('/').length === 4) {
      path = path.substr (0, path.lastIndexOf ('/'));
    }

    const hinterType = this.getHinterType (this.props.hinter);

    if (!hinterType) {
      this.nav (`${path}${search}`);
      return;
    }

    this.nav (`${path}/${hinterType}${search}`);
  }

  replaceNav (path) {
    this.context.dispatch (replace (path));
  }

  attachDispatch (dispatch) {
    this.formDispatch = dispatch;
  }

  formFocus () {
    if (this.formDispatch) {
      this.formDispatch (actions.focus (this.props.model));
    }
  }

  get myStyle () {
    return stylesImporter (this.name);
  }

  set styles (value) {
    this._styles = value;
  }

  get styles () {
    /* for the moment recalculate the styles each time */
    return this.getStyles (this.props);
  }

  read (key) {
    return this.props[key];
  }

  useMyStyle (styleProps, theme) {
    return this.myStyle (theme, styleProps);
  }

  getStyles (props) {
    if (!this.myStyle) {
      return {};
    }

    const styleProps = jsifyPropsNames (props);
    return this.useMyStyle (styleProps, this.context.theme);
  }

  attachFormDispatch (formDispatch) {
    this.formDispatch = formDispatch;
  }

  handleFormSubmit (values) {
    this.do ('submit', values);
  }
}

Widget.propTypes = {
  id: PropTypes.string,
};

export default Widget;
