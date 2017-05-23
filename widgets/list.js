import React from 'react';
import ReactList from 'react-list';
import Widget from 'laboratory/widget';

class List extends Widget {
  constructor (props) {
    super (props);
  }

  get items () {
    return props => {
      const {type, length, item} = props;
      return <ReactList length={length} type={type} itemRenderer={item} />;
    };
  }

  widget () {
    return <div>Missing widget implementation</div>;
  }
}

export default List;
