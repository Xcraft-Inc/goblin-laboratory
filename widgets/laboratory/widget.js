import React from 'react';
import {Helmet} from 'react-helmet';
import toCss from 'obj-to-css';
import cssKey from 'css-key';
import PropTypes from 'prop-types';
import {Theme} from 'electrum-theme';
import Widget from 'laboratory/widget';
import importer from '../importer/';
const widgetImporter = importer ('widget');

import fontawesome from '@fortawesome/fontawesome';
import solid from '@fortawesome/fontawesome-pro-solid';
import regular from '@fortawesome/fontawesome-pro-regular';
import light from '@fortawesome/fontawesome-pro-light';
import brands from '@fortawesome/fontawesome-free-brands';

// TODO: add support for free version (for the open-source version of westeros)
if (solid) {
  fontawesome.library.add (solid);
}
if (regular) {
  fontawesome.library.add (regular);
}
if (light) {
  fontawesome.library.add (light);
}
if (brands) {
  fontawesome.library.add (brands);
}

function jsToCSS (jsStyles) {
  return toCss (
    Object.assign (
      {},
      ...Object.keys (jsStyles).map (className => {
        return {
          [cssKey (className)]: Object.assign (
            {},
            ...Object.keys (jsStyles[className]).map (key => {
              return {[cssKey (key)]: jsStyles[className][key]};
            })
          ),
        };
      })
    )
  );
}

class ThemeContext extends React.PureComponent {
  getChildContext () {
    return {
      theme: this.props.theme,
    };
  }

  static get childContextTypes () {
    return {
      theme: PropTypes.object,
    };
  }

  get globalStyles () {
    if (!this.props.theme) {
      console.warn ('Theme is undefined in globalStyles');
    }
    return {
      body: {
        color: '#999',
        fontFamily: [
          'Open Sans',
          'Helvetica',
          'Arial',
          'Verdana',
          'sans-serif',
        ],
        fontWeight: 300,
        margin: 0,
        padding: 0,
        userSelect: 'none',
      },

      pre: {
        display: 'block',
        margin: 0,
      },

      xmp: {
        display: 'block',
        margin: 0,
      },

      plaintext: {
        display: 'block',
        margin: 0,
      },

      listing: {
        display: 'block',
        margin: 0,
      },

      code: {
        font: 'inherit',
        color: this.props.theme.palette.markdownHiliteText,
        backgroundColor: this.props.theme.palette.markdownHiliteBackground,
        padding: '1px',
        margin: 0,
      },

      h1: {
        fontSize: this.props.theme.shapes.markdownH1FontSize,
        fontWeight: 300,
        color: this.props.theme.palette.markdownText,
        margin: '0px',
        marginTop: '8px',
      },

      'h1:firstOfType': {
        marginTop: '0px',
      },

      h2: {
        fontSize: this.props.theme.shapes.markdownH2FontSize,
        fontWeight: 300,
        color: this.props.theme.palette.markdownText,
        margin: '0px',
        marginTop: '8px',
      },

      'h2:firstOfType': {
        marginTop: 0,
      },

      p: {
        margin: 0,
      },

      ul: {
        fontSize: this.props.theme.shapes.markdownListFontSize,
        margin: 0,
        paddingLeft: this.props.theme.shapes.markdownListPadding,
        listStyleType: 'disc',
      },

      ol: {
        fontSize: this.props.theme.shapes.markdownListFontSize,
        margin: 0,
        paddingLeft: this.props.theme.shapes.markdownListPadding,
      },

      '::WebkitScrollbar': {
        width: this.props.theme.shapes.scrollerThickness,
        height: this.props.theme.shapes.scrollerThickness,
      },

      '::WebkitScrollbarTrack': {},

      '::WebkitScrollbarCorner': {
        backgroundColor: 'transparent',
      },

      '::WebkitScrollbarThumb': {
        boxShadow: 'inset 0 0 ' +
          this.props.theme.shapes.scrollerThickness +
          ' ' +
          this.props.theme.shapes.scrollerThickness +
          ' ' +
          this.props.theme.palette.scrollerThumbBackground,
        border: 'solid 2px transparent',
        borderRadius: '8px',
      },

      '::WebkitScrollbarThumb:hover': {
        boxShadow: 'inset 0 0 ' +
          this.props.theme.shapes.scrollerThickness +
          ' ' +
          this.props.theme.shapes.scrollerThickness +
          ' ' +
          this.props.theme.palette.scrollerThumbHoverBackground,
      },
    };
  }

  render () {
    return (
      <div>
        <Helmet>
          <style>{jsToCSS (this.globalStyles)}</style>
        </Helmet>
        {this.props.children}
      </div>
    );
  }
}

class Laboratory extends Widget {
  constructor () {
    super (...arguments);
  }

  static get wiring () {
    return {
      id: 'id',
      root: 'root',
      theme: 'theme',
    };
  }

  render () {
    const {id, root} = this.props;

    if (!id) {
      return null;
    }

    if (!root) {
      return (
        <div>Missing root widget, please use lab.setRoot ({`{widgetId}`})</div>
      );
    }

    const widgetName = root.split ('@')[0];
    const RootWidget = widgetImporter (widgetName);
    const WiredRoot = Widget.Wired (RootWidget) (root);
    return (
      <ThemeContext theme={Theme.create (this.props.theme)}>
        <WiredRoot />
      </ThemeContext>
    );
  }
}

export default Laboratory;
