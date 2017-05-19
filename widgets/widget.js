import React from 'react';
import {connect} from 'react-redux';
import Shredder from 'xcraft-core-shredder';
import uuidV4 from 'uuid/v4';

class Widget extends React.PureComponent {
  constructor (props, name) {
    super (props);
    this._name = name;
  }

  get name () {
    return this._name;
  }

  cmd (cmd, args) {
    const action = {
      type: 'QUEST',
      cmd: cmd,
      args: args,
    };
    this.props.dispatch (action);
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

  componentWillMount () {
    const {labId, id} = this.props;
    const widgetId = id || uuidV4 ();
    this.setState ({widgetId});
    this.cmd (`laboratory.widget.add`, {
      id: labId,
      widgetId,
      name: this.name,
    });
  }

  componentWillUnmount () {
    const {labId} = this.props;
    const widgetId = this.state.widgetId;
    this.cmd (`${this.name}.delete`, {id: `${this.name}@${widgetId}`});
    this.cmd (`laboratory.widget.del`, {
      id: labId,
      branch: `${this.name}@${widgetId}`,
    });
  }

  render () {
    const Widget = this.widget ();
    const wiring = this.wiring (this.state.widgetId);
    const WiredWidget = this.wire (wiring) (
      props => (props.id ? Widget (props) : <div>waiting {this.name}</div>)
    );
    return (
      <WiredWidget labId={this.props.labId} dispatch={this.props.dispatch} />
    );
  }
}

export default Widget;
