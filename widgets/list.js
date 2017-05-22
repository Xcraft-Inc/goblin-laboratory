import React from 'react';
import ReactList from 'react-list';
import Widget from 'laboratory/widget';

class List extends Widget {
  constructor (props) {
    super (props);
  }

  renderItem (index, key) {
    return <div key={key}>Waiting for item {index}</div>;
  }

  Items () {
    return props => {
      const {type, length} = props;
      return (
        <ReactList itemRenderer={this.renderItem} length={length} type={type} />
      );
    };
  }

  widget () {
    return <div>Missing widget implementation</div>;
  }
}

export default List;
