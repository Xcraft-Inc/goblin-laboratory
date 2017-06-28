import React from 'react';
import Widget from 'laboratory/widget';
import importer from 'laboratory/importer/';
import Hinter from 'gadgets/hinter/widget';
const widgetImporter = importer ('widget');

class GenericHinter extends Widget {
  constructor (props) {
    super (props);
  }

  static get wiring () {
    return {
      id: 'id',
      type: 'type',
      kind: 'kind',
      title: 'title',
      glyph: 'glyph',
      rows: 'rows',
      query: 'query',
    };
  }

  render () {
    const {id, type, kind, title, glyph, rows} = this.props;

    if (!id) {
      return null;
    }

    const DedicatedWidget = widgetImporter (`${type}-hinter`);
    if (DedicatedWidget) {
      const wireDedicatedHinter = Widget.Wired (DedicatedWidget);
      const WiredDedicatedWidget = wireDedicatedHinter (id);
      return <WiredDedicatedWidget />;
    } else {
      return (
        <Hinter
          kind={kind}
          title-text={title}
          title-glyph={glyph}
          rows={rows}
        />
      );
    }
  }
}

export default GenericHinter;
