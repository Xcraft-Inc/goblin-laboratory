//T:2019-02-27

export default function styles(theme, props) {
  const fullScreenStyle = {
    visibility: 'visible',
    position: 'fixed',
    zIndex: props.zIndex || 10,
    top: '0px',
    left: '0px',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    userSelect: 'none',
    cursor: 'default',
    backgroundColor: theme.palette.flyingDialogFullScreenBackground,
  };

  const gaugeStyle = {
    display: 'flex',
    width: '300px',
    height: '10px',
    transform: 'scale(2)',
  };

  return {
    fullScreen: fullScreenStyle,
    gauge: gaugeStyle,
  };
}

/******************************************************************************/
