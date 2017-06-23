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

  navToHinter (contextId, view, workItemId, hinter) {
    this.nav (`/${contextId}/${view}/${hinter}?wid=${workItemId}`);
    this.cmd ('laboratory.nav-to-workitem', {
      id: this.context.labId,
      contextId,
      view,
      workItemId,
      skipNav: true,
    });
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
