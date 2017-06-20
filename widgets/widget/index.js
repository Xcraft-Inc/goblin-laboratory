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
    return (id, otherProps) =>
      Widget.wire (id, component.wiring) (props => {
        const Component = component;
        const newProps = Object.assign ({}, otherProps, props);
        if (props.id) {
          if (component.isForm) {
            let formInitialState = {};
            Object.keys (component.wiring).forEach (
              k => (formInitialState[k] = props[k])
            );
            return (
              <LocalForm
                onSubmit={values => component.handleFormSubmit (values)}
                initialState={formInitialState}
              >
                <Component {...newProps} />
              </LocalForm>
            );
          }
          return <Component {...newProps} />;
        }
        return <span>requesting for {id}</span>;
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

  navToWorkItem (contextId, workItemId) {
    this.nav (`/${contextId}/${workItemId}`);
    this.cmd ('laboratory.nav-to-workitem', {
      id: this.context.labId,
      contextId,
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
