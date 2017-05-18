import React from 'react';
import {connect} from 'react-redux';
import Shredder from 'xcraft-core-shredder';
import uuidV4 from 'uuid/v4';

class Widget extends React.PureComponent {
  constructor (name) {
    super ();
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
    this.cmd (`${this.name}.create`, {id});
    this.cmd (`laboratory.feed.add`, {id: labId, feed: `${name}@${id}`});
  }

  componentWillUnmount () {
    const {labId} = this.props;
    this.cmd (`${this.name}.delete`, {id: this.state.widgetId});
    this.cmd (`laboratory.feed.del`, {
      id: labId,
      feed: this.state.widgetId,
    });
  }

  render () {
    const WiredWidget = this.wire (this.wiring (this.state.widgetId)) (
      this.widget ()
    );
    return <WiredWidget {...this.props} />;
  }
}

export default Widget;
