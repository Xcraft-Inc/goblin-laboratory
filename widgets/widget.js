import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import Shredder from 'xcraft-core-shredder';
import uuidV4 from 'uuid/v4';
import moize from 'moize';
import {push} from 'react-router-redux';
import {LocalForm} from 'react-redux-form';

const buildStyleProps = (styleProps, props) => {
  const result = {};

  styleProps.map (k => {
    if (props[k]) {
      result[k] = props[k];
    }
  });
  return result;
};
const fastBuildStyleProps = moize (buildStyleProps);

class Widget extends React.PureComponent {
  constructor (cProps) {
    super (cProps);
    if (this.buildStyles) {
      this.fastBuildStyles = moize (this.buildStyles);
    }
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
      return <span>waiting for {this.props.id}</span>;
    });
  }

  getStyles (props) {
    if (!this.buildStyles) {
      return {};
    }

    if (!this.styleProps) {
      return this.fastBuildStyles (null, this.context.theme);
    }

    const styleProps = fastBuildStyleProps (this.styleProps, props);

    return this.fastBuildStyles (styleProps, this.context.theme);
  }

  attachFormDispatch (formDispatch) {
    this.formDispatch = formDispatch;
  }

  handleFormSubmit (values) {
    this.do ('submit', values);
  }

  render () {
    if (this.props.id) {
      const WiredWidget = this.wired (this.props.id, this.props);
      return <WiredWidget />;
    } else {
      this.styles = this.getStyles (this.props);
      const Widget = this.widget ();
      return <Widget {...this.props} />;
    }
  }
}

export default Widget;
