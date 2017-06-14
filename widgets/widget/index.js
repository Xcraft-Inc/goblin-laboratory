import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import Shredder from 'xcraft-core-shredder';
import moize from 'moize';
import {push} from 'react-router-redux';
import {LocalForm} from 'react-redux-form';
import importer from '../importer/';
import Radium from 'radium';

const stylesImporter = importer ('styles');

const jsifyPropsNames = props => {
  const jsified = {};
  Object.keys (props).forEach (k => {
    jsified[k.replace (/-([a-z])/g, (m, g1) => g1.toUpperCase ())] = props[k];
  });
  return jsified;
};
const fastJsifyPropsName = moize (jsifyPropsNames);

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

  wire (connectId, wires) {
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

  wired (connectId, otherProps) {
    let Widget = this.widget ();
    return this.wire (connectId, this.wiring) (props => {
      const newProps = Object.assign ({}, otherProps, props);
      this.mergedProps = newProps;
      if (props.id) {
        this.styles = this.getStyles (newProps);
        if (this.isForm) {
          let formInitialState = {};
          Object.keys (this.wiring).forEach (
            k => (formInitialState[k] = props[k])
          );

          return (
            <LocalForm
              onSubmit={values => this.handleFormSubmit (values)}
              initialState={formInitialState}
            >
              <Widget {...newProps} />
            </LocalForm>
          );
        }
        return Widget (newProps);
      }
      return <span>requesting for {this.props.id}</span>;
    });
  }

  get myStyle () {
    const styleSheet = stylesImporter (this.name);
    if (styleSheet) {
      return moize (styleSheet);
    }
    return null;
  }

  read (key) {
    if (this.props.id) {
      return this.mergedProps[key];
    }
    return this.props[key];
  }

  readActive () {
    return this.props[key];
  }

  useMyStyle (styleProps, theme) {
    return this.myStyle (theme, styleProps);
  }

  useStyle (name, styleProps, theme) {
    return stylesImporter (name) (theme, styleProps);
  }

  getStyles (props) {
    if (!this.myStyle) {
      return {};
    }

    const styleProps = fastJsifyPropsName (props);
    return this.useMyStyle (styleProps, this.context.theme);
  }

  attachFormDispatch (formDispatch) {
    this.formDispatch = formDispatch;
  }

  handleFormSubmit (values) {
    this.do ('submit', values);
  }

  componentWillMount () {
    if (this.props.id) {
      const state = this.context.store.getState ();
      if (state.backend.has (this.props.id)) {
        return;
      }
      this.cmd ('laboratory.add', {
        id: this.context.labId,
        widgetId: this.props.id,
      });
    }
  }

  render () {
    if (this.props.id) {
      const WiredWidget = this.wired (this.props.id, this.props);
      const FinalWidget = Radium (WiredWidget);
      return <FinalWidget />;
    } else {
      this.styles = this.getStyles (this.props);
      const Widget = this.widget ();
      const FinalWidget = Radium (Widget);
      return <FinalWidget {...this.props} />;
    }
  }
}

export default Widget;
