import React from 'react';
import {connect} from 'react-redux';
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
          const shredded = new Shredder (state.backend);
          Object.keys (wires).forEach (wire => {
            const val = shredded.get (wires[wire], null);
            mapState[wire] = val;
          });
          return mapState;
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

  render () {
    let Widget = this.widget ();
    const wiring = this.wiring (this.state.widgetId);

    const WiredWidget = this.wire (wiring) (
      props => (props.id ? Widget (props) : <div>waiting {this.name}</div>)
    );

    return <WiredWidget {...this.props} />;
  }
}

export default Widget;
