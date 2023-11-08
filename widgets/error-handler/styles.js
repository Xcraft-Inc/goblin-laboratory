export default function styles() {
  const errorHandler = {
    'display': 'inline-flex',

    '&[data-big=true]': {
      'fontSize': '400%',

      '& .icons .hover-icon': {
        fontSize: '28px',
      },
    },

    '& .icons': {
      'margin': 'auto',
      'position': 'relative',
      'padding': '0 8px',
      'cursor': 'pointer',

      '& .icon': {
        color: 'rgba(250,130,0,1)',
      },

      '& .hover-icon': {
        display: 'none',
        position: 'absolute',
        top: 0,
        right: 0,
        fontSize: '10px',
        color: 'rgba(255,255,255,0.8)',
      },

      ':hover': {
        'opacity': 0.7,

        '& .hover-icon': {
          display: 'block',
        },
      },
    },
  };

  return {
    errorHandler,
  };
}

/******************************************************************************/
