import React from 'react';
import {Helmet} from 'react-helmet';
import toCss from 'obj-to-css';
import cssKey from 'css-key';
import PropTypes from 'prop-types';
import {Theme} from 'electrum-theme';
import Widget from 'laboratory/widget';
import ReactTooltip from 'react-tooltip';
import Maintenance from 'laboratory/maintenance/widget';
import importer from '../importer/';
const widgetImporter = importer('widget');

import fontawesome from '@fortawesome/fontawesome';
import solid from '@fortawesome/fontawesome-pro-solid';
import regular from '@fortawesome/fontawesome-pro-regular';
import light from '@fortawesome/fontawesome-pro-light';
import brands from '@fortawesome/fontawesome-free-brands';

// TODO: add support for free version (for the open-source version of westeros)
if (solid) {
  fontawesome.library.add(solid);
}
if (regular) {
  fontawesome.library.add(regular);
}
if (light) {
  fontawesome.library.add(light);
}
if (brands) {
  fontawesome.library.add(brands);
}

function jsToCSS(jsStyles) {
  return toCss(
    Object.assign(
      {},
      ...Object.keys(jsStyles).map(className => {
        return {
          [cssKey(className)]: Object.assign(
            {},
            ...Object.keys(jsStyles[className]).map(key => {
              return {[cssKey(key)]: jsStyles[className][key]};
            })
          ),
        };
      })
    )
  );
}

class ThemeContext extends React.PureComponent {
  getChildContext() {
    return {
      theme: this.props.theme,
    };
  }

  static get childContextTypes() {
    return {
      theme: PropTypes.object,
    };
  }

  get globalStyles() {
    if (!this.props.theme) {
      console.warn('Theme is undefined in globalStyles');
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
        margin: '0px',
        marginTop: '8px',
      },

      'h1:firstOfType': {
        marginTop: '0px',
      },

      h2: {
        fontSize: this.props.theme.shapes.markdownH2FontSize,
        fontWeight: 300,
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
        boxShadow:
          'inset 0 0 ' +
          this.props.theme.shapes.scrollerThickness +
          ' ' +
          this.props.theme.shapes.scrollerThickness +
          ' ' +
          this.props.theme.palette.scrollerThumbBackground,
        border: 'solid 2px transparent',
        borderRadius: '8px',
      },

      '::WebkitScrollbarThumb:hover': {
        boxShadow:
          'inset 0 0 ' +
          this.props.theme.shapes.scrollerThickness +
          ' ' +
          this.props.theme.shapes.scrollerThickness +
          ' ' +
          this.props.theme.palette.scrollerThumbHoverBackground,
      },

      /* Begin tooltip section */

      '.tooltip': {
        borderColor: `${
          this.props.theme.palette.isDarkTheme ? '#888' : '#aaa'
        } !important`,
        borderRadius: '2px !important',
        color: `${
          this.props.theme.palette.isDarkTheme ? 'white' : 'black'
        } !important`,
        boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.25) !important',
      },

      '.place-right::before': {
        borderRight: `8px solid ${
          this.props.theme.palette.isDarkTheme ? '#888' : '#aaa'
        } !important`,
      },

      '.place-left::before': {
        borderLeft: `8px solid ${
          this.props.theme.palette.isDarkTheme ? '#888' : '#aaa'
        } !important`,
      },

      '.place-top::before': {
        borderTop: `8px solid ${
          this.props.theme.palette.isDarkTheme ? '#888' : '#aaa'
        } !important`,
      },

      '.place-bottom::before': {
        borderBottom: `8px solid ${
          this.props.theme.palette.isDarkTheme ? '#888' : '#aaa'
        } !important`,
      },

      /* End tooltip section */
    };
  }

  render() {
    return (
      <div>
        <Helmet>
          <style>{jsToCSS(this.globalStyles)}</style>
        </Helmet>
        {this.props.children}
        <ReactTooltip
          type={this.props.theme.palette.isDarkTheme ? 'dark' : 'light'}
          multiline={true}
          delayShow={400}
          effect="solid"
          border={true}
          className={'tooltip'}
        />
      </div>
    );
  }
}

class Laboratory extends Widget {
  constructor() {
    super(...arguments);
  }

  static get wiring() {
    return {
      id: 'id',
      root: 'root',
      rootId: 'rootId',
      theme: 'theme',
    };
  }

  render() {
    const {id, root, rootId, maintenanceMode} = this.props;

    if (!id) {
      return null;
    }

    if (!rootId) {
      return (
        <div>Missing root widget, please use lab.setRoot ({`{widgetId}`})</div>
      );
    }

    const widgetName = root.split('@')[0];
    const RootWidget = widgetImporter(widgetName);
    const WiredRoot = Widget.Wired(RootWidget)(rootId);

    const Root = props => {
      if (props.status && props.status !== 'off') {
        return <Maintenance mode={maintenanceMode} />;
      } else {
        return <WiredRoot />;
      }
    };

    const WithMaintenance = this.mapWidget(
      Root,
      status => {
        return {status};
      },
      'backend.workshop.maintenance.status'
    );

    return (
      <ThemeContext theme={Theme.create(this.props.theme)}>
        <WithMaintenance />
      </ThemeContext>
    );
  }
}

export default Laboratory;
