import React from 'react';
import {connect} from 'react-redux';
import Shredder from 'xcraft-core-shredder';
import VirtualList from 'react-virtual-list';
import uuidV4 from 'uuid/v4';

const defaultMapToVirtualProps = (
  {items, itemHeight},
  {firstItemIndex, lastItemIndex}
) => {
  console.log ('Virtual Mapper:');
  console.log (itemHeight);
  console.dir (items);
  const data = items.select ((d, id) => id);
  console.dir (data);
  const visibleItems = lastItemIndex > -1
    ? data.slice (firstItemIndex, lastItemIndex + 1)
    : [];
  console.dir (visibleItems);
  // style
  const height = items.length * itemHeight;
  const paddingTop = firstItemIndex * itemHeight;

  return {
    virtual: {
      items: visibleItems,
      style: {
        height,
        paddingTop,
      },
    },
  };
};

class Widget extends React.PureComponent {
  constructor (props) {
    super (props);
  }

  get name () {
    return this.constructor.name
      .replace (/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase ();
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
    const {labId, id, items} = this.props;
    console.log ('Widget will mount');
    console.dir (this.props);
    const widgetId = id || `${this.name}@${uuidV4 ()}`;
    this.setState ({widgetId});
    this.cmd (`laboratory.widget.add`, {
      id: labId,
      widgetId,
      name: this.name,
      items: items ? items.select (i => i) : null,
    });
  }

  componentWillUnmount () {
    const {labId} = this.props;
    const widgetId = this.state.widgetId;
    this.cmd (`${this.name}.delete`, {id: widgetId});
    this.cmd (`laboratory.widget.del`, {
      id: labId,
      branch: widgetId,
    });
  }

  render () {
    let Widget = this.widget ();
    const wiring = this.wiring (this.state.widgetId);

    const WiredWidget = this.wire (wiring) (props => {
      if (props.id) {
        return Widget (props);
      } else {
        return <div>waiting {this.name}</div>;
      }
    });

    if (this.isVirtualList) {
      console.dir ('Widget behave now like virtual list');
      const VirtualListWidget = VirtualList (
        {
          initialState: {
            firstItemIndex: 0, // show first ten items
            lastItemIndex: 9, // during initial render
          },
        },
        defaultMapToVirtualProps
      ) (Widget);
      return <VirtualListWidget {...this.props} />;
    }

    return (
      <WiredWidget labId={this.props.labId} dispatch={this.props.dispatch} />
    );
  }
}

export default Widget;
