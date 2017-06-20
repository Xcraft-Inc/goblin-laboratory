import React from 'react';
import ReactList from 'react-list';
import Widget from 'laboratory/widget';

class List extends Widget {
  constructor (props) {
    super (props);
  }

  getList (item, type, length) {
    return props => (
      <ReactList length={length} type={type} itemRenderer={item} {...props} />
    );
  }

  render () {
    return <div>Missing widget implementation</div>;
  }
}

export default List;
