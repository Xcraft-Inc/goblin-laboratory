import React from 'react';
import ReactList from 'react-list';
import Widget from 'laboratory/widget';

class List extends Widget {
  constructor (props) {
    super (props);
  }

  get items () {
    const {type, length, item} = this.props;
    return <ReactList length={length} type={type} itemRenderer={item} />;
  }

  render () {
    return <div>Missing widget implementation</div>;
  }
}

export default List;
