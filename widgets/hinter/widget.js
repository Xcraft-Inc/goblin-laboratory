import React from 'react';
import Widget from 'laboratory/widget';
import importer from 'laboratory/importer/';
import HinterColumn from 'gadgets/hinter-column/widget';
const widgetImporter = importer ('widget');

class Hinter extends Widget {
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
      selectedIndex: 'selectedIndex',
    };
  }

  render () {
    const {id, type, kind, title, glyph, rows, selectedIndex} = this.props;
    console.log (selectedIndex);
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
        <HinterColumn
          kind={kind}
          title-text={title}
          title-glyph={glyph}
          rows={rows}
          selectedIndex={selectedIndex}
          onRowClick={(index, text) => this.do ('select-row', {index, text})}
        />
      );
    }
  }
}

export default Hinter;
