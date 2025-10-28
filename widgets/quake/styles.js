export default function styles() {
  const console = {
    'width': '100vw',
    'height': 0,
    'backgroundColor': 'rgba(0, 0, 0, 0.6)',
    'backdropFilter': 'blur(10px)',
    'position': 'fixed',
    'top': 0,
    'left': 0,
    'transition': 'height 0.2s ease-out, opacity 0.2s',
    'opacity': 0,
    'border': '5px solid transparent',

    'display': 'flex',
    'flexDirection': 'column',
    'overflowY': 'auto',
    'pointerEvents': 'none',

    'fontFamily': 'monospace',

    '&[data-show=true]': {
      pointerEvents: 'auto',
      height: '50vh',
      transition: 'height 0.1s ease-in, opacity 0.2s',
      opacity: 1,
    },

    '& > .history': {
      display: 'flex',
      flexGrow: 1,
      flexFlow: 'column-reverse',
      fontSize: 'medium',
    },

    '& > .cli': {
      'display': 'flex',
      'flexDirection': 'row',

      '& > span': {
        whiteSpace: 'nowrap',
      },
    },

    '& > .cli > .input': {
      'flexGrow': 1,
      'width': '100%',
      'color': 'rgb(200, 200, 200)',
      'border': 0,
      'backgroundColor': 'transparent',
      'fontSize': 'medium',

      '&:focus': {
        outline: 'none',
      },
    },
  };

  return {
    console,
  };
}
