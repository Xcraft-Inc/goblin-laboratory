import React from 'react';
import {connect} from 'react-redux';
import {reduxForm, Field} from 'redux-form';
import PropTypes from 'prop-types';
import Shredder from 'xcraft-core-shredder';
import uuidV4 from 'uuid/v4';

class Widget extends React.PureComponent {
  constructor (props) {
    super (props);
  }

  static get contextTypes () {
    return {
      labId: PropTypes.string,
      dispatch: PropTypes.func,
      store: PropTypes.object,
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

  wire (wires) {
    return connect (
      state => {
        let mapState = {};
        if (state.backend && state.backend.toJS) {
          if (wires) {
            const shredded = new Shredder (state.backend);
            Object.keys (wires).forEach (wire => {
              const val = shredded.get (
                `${this.state.widgetId}.${wires[wire]}`,
                null
              );
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

  /**
   * Add the widget to the laboratory if necessary
   */
  componentWillMount () {
    const {id} = this.props;

    const widgetId = id || `${this.name}@${uuidV4 ()}`;
    this.setState ({widgetId, delete: !id});

    /* Returns if this widget is already in the state.
     * It happens for example with the virtual lists where only visible
     * widgets are mount in the DOM and not the whole list.
     */
    const state = this.context.store.getState ();
    if (state.backend.has (widgetId)) {
      return;
    }

    const questParams = {};
    Object.keys (this.props).filter (k => /^quest-/.test (k)).forEach (k => {
      questParams[k.replace ('quest-', '')] = this.props[k];
    });

    this.cmd (`laboratory.widget.add`, {
      id: this.context.labId,
      widgetId,
      name: this.name,
      create: !id,
      questParams,
    });
  }

  /**
   * Remove the widget from the laboratory if it's was mount by itself.
   */
  componentWillUnmount () {
    const widgetId = this.state.widgetId;
    if (!this.state.delete) {
      return;
    }

    this.cmd (`laboratory.widget.del`, {
      id: this.context.labId,
      widgetId: widgetId,
      name: this.name,
      delete: this.state.delete,
    });
  }

  getStyles (props) {
    if (!this.buildStyles) {
      return {};
    }

    if (!this.styleProps) {
      return this.buildStyles (null);
    }

    const styleProps = {};

    this.styleProps.map (k => {
      if (props[k]) {
        styleProps[k] = props[k];
      }
    });

    return this.buildStyles (styleProps);
  }

  get Field () {
    return Field;
  }

  get WiredWidget () {
    let Widget = this.widget ();
    const Wired = this.wire (this.wiring) (props => {
      const newProps = Object.assign ({}, this.props, props);
      if (newProps.id) {
        this.styles = this.getStyles (newProps);
        return Widget (newProps);
      }
      return <span>waiting for {this.widgetId}</span>;
    });
    return Wired;
  }

  render () {
    const WiredWidget = this.WiredWidget;
    return <WiredWidget {...this.props} />;
  }
}

export default Widget;
