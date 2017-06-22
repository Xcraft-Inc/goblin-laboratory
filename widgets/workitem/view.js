import React from 'react';
import Widget from 'laboratory/widget';
import importer from 'laboratory/importer/';

const viewImporter = importer ('view');
class WorkItem extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  shouldComponentUpdate (nP) {
    return nP.match.params.view !== this.props.match.params.view;
  }

  getParameter (search, name) {
    const query = search.substring (1);
    const vars = query.split ('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split ('=');
      if (decodeURIComponent (pair[0]) === name) {
        return decodeURIComponent (pair[1]);
      }
    }
  }

  render () {
    const {match, location} = this.props;
    const view = match.params.view;

    if (!view) {
      return null;
    }

    let wid = null;
    if (location.search) {
      wid = this.getParameter (location.search, 'wid');
    }
    const View = viewImporter (view);
    return <View workitem={wid} />;
  }
}

export default WorkItem;
