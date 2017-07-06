import {Unit} from 'electrum-theme';

/******************************************************************************/

export default function styles (theme, props) {
  const boxStyle = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
  };

  const notificationsBoxStyle = {
    position: 'absolute',
    right: '0px',
    top: '0px',
    zIndex: 5,
  };

  const anchorStyle = {
    position: 'relative',
    width: '0px',
    height: '0px',
  };

  return {
    box: boxStyle,
    notificationsBox: notificationsBoxStyle,
    anchor: anchorStyle,
  };
}

/******************************************************************************/
