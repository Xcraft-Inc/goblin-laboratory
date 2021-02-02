export const propNames = ['zIndex'];

export default function styles(theme, props) {
  const {zIndex} = props;

  const fullScreenStyle = {
    visibility: 'visible',
    position: 'fixed',
    zIndex: zIndex || 20,
    top: '0px',
    left: '0px',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    userSelect: 'none',
    cursor: 'wait',
    opacity: '80%',
    backgroundColor: 'black',
  };

  const messageStyle = {
    width: '80%',
    textAlign: 'center',
    marginTop: '50px',
    border: '4px solid',
    borderRadius: '20px',
    padding: '20px',
  };

  const blinkStyle = {
    animationName: {
      '50%': {
        opacity: 0,
      },
    },
    animationDuration: '1.2s',
    animationIterationCount: 'infinite',
  };

  return {
    fullScreen: fullScreenStyle,
    message: messageStyle,
    blink: blinkStyle,
  };
}

/******************************************************************************/
