import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import Shredder from 'xcraft-core-shredder';
import {push, replace} from 'react-router-redux';
import {LocalForm} from 'react-redux-form';
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
              if (val !== undefined) {
                mapState[wire] = val;
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
    return id =>
      Widget.wire (id, component.wiring) (props => {
        const Component = component;
        if (props._no_props_) {
          console.warn (
            `No props wired for component ${component.name} with id ${id}`
          );
          return null;
        }
        if (component.isForm) {
          let formInitialState = {};
          Object.keys (component.wiring).forEach (
            k => (formInitialState[k] = props[k])
          );
          return (
            <LocalForm
              onSubmit={values => console.dir (values)}
              initialState={formInitialState}
            >
              <Component {...props} />
            </LocalForm>
          );
        }
        return <Component {...props} />;
      });
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

  getParameter (search, name) {
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

  replaceParameter (search, name, value) {
    let query = search.substring (1);
    const vars = query.split ('&');
    for (var i = 0; i < vars.length; i++) {
      let pair = vars[i].split ('=');
      if (decodeURIComponent (pair[0]) === name) {
        const toReplace = `${pair[0]}=${pair[1]}`;
        return (
          '?' +
          query.replace (toReplace, `${pair[0]}=${encodeURIComponent (value)}`)
        );
      }
    }
    return search;
  }

  removeParameter (search, name) {
    let query = search.substring (1);
    const vars = query.split ('&');
    for (var i = 0; i < vars.length; i++) {
      let pair = vars[i].split ('=');
      if (decodeURIComponent (pair[0]) === name) {
        let toReplace = `${pair[0]}=${pair[1]}`;
        const raw = '?' + query.replace (toReplace, '');
        if (raw.endsWith ('&')) {
          return raw.substr (0, raw.length - 1);
        }
        return raw;
      }
    }
    return search;
  }

  addParameter (search, name, value) {
    return (
      search + `&${encodeURIComponent (name)}=${encodeURIComponent (value)}`
    );
  }

  getWorkItemId () {
    const search = this.context.store.getState ().routing.location.search;
    if (search) {
      return this.getParameter (search, 'wid');
    }
  }

  getHinterId () {
    const search = this.context.store.getState ().routing.location.search;
    if (search) {
      return this.getParameter (search, 'hid');
    }
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

  getSelectionStateInParams () {
    const search = this.context.store.getState ().routing.location.search;
    if (search) {
      return {
        ss: this.getParameter (search, 'ss'),
        se: this.getParameter (search, 'ss'),
        sd: this.getParameter (search, 'sd'),
      };
    }
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

  replaceOrAddParameter (search, name, value) {
    if (this.getParameter (search, name)) {
      return this.replaceParameter (search, name, value);
    } else {
      return this.addParameter (search, name, value);
    }
  }

  onFocusHinter (e) {
    const hid = this.getHinterId ();
    if (hid) {
      if (hid === this.props.hinter) {
        console.log (this.props.hinter);
        console.log ('no nav needed');
        return;
      }
    }
    this.navToHinter (this.props.hinter, this.getSelectionState (e.target));
  }

  navToHinter (hinterId, selectionState) {
    const location = this.context.store.getState ().routing.location;
    let path = location.pathname;

    if (path.split ('/').length === 4) {
      path = path.substr (0, path.lastIndexOf ('/'));
    }

    const hinterType = this.getHinterType (hinterId);

    if (!hinterType) {
      let newSearch = this.removeParameter (location.search, 'hid');
      newSearch = this.removeParameter (newSearch, 'ss');
      newSearch = this.removeParameter (newSearch, 'se');
      newSearch = this.removeParameter (newSearch, 'sd');
      this.nav (`${path}${newSearch}`);
      console.log (`${path}${newSearch}`);
      return;
    }

    let newSearch = this.replaceOrAddParameter (
      location.search,
      'hid',
      hinterId
    );

    if (selectionState) {
      newSearch = this.replaceOrAddParameter (
        newSearch,
        'ss',
        selectionState.ss
      );
      newSearch = this.replaceOrAddParameter (
        newSearch,
        'se',
        selectionState.se
      );
      newSearch = this.replaceOrAddParameter (
        newSearch,
        'sd',
        selectionState.sd
      );
    }

    this.nav (`${path}/${hinterType}${newSearch}`);
    console.log (`${path}/${hinterType}${newSearch}`);
  }

  replaceNav (path) {
    this.context.dispatch (replace (path));
  }

  get myStyle () {
    return stylesImporter (this.name);
  }

  set styles (value) {
    this._styles = value;
  }

  get styles () {
    if (!this._styles) {
      this._styles = this.getStyles (this.props);
    }
    return this._styles;
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
