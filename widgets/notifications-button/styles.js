import {Unit} from 'electrum-theme';

/******************************************************************************/

export default function styles (theme, props) {
  const buttonHeight = Unit.add (
    theme.shapes.containerMargin,
    theme.shapes.viewTabHeight
  );

  const notificationsBoxStyle = {
    position: 'absolute',
    right: '0px',
    top: buttonHeight,
    zIndex: 5,
  };

  return {
    notificationsBox: notificationsBoxStyle,
  };
}

/******************************************************************************/
