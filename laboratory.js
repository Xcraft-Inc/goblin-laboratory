'use strict';

/**
 * Retrieve the list of available commands.
 *
 * @returns {Object} The list and definitions of commands.
 */
exports.xcraftCommands = function () {
  return {
    handlers: require ('./lib/service.js'),
    rc: {
      create: {
        parallel: true,
        desc: 'create a widget',
        options: {
          params: {
            optional: 'config...',
          },
        },
      },
      _ready: {
        parallel: true,
        options: {
          params: {
            required: 'wid',
          },
        },
      },
      open: {
        parallel: true,
        desc: 'open a widget',
        options: {
          params: {
            required: 'route',
          },
        },
      },
      'widget.add': {
        parallel: true,
        desc: 'add a widget to a window',
        options: {
          params: {
            required: 'id',
          },
        },
      },
      'widget.del': {
        parallel: true,
        desc: 'delete a widget from a window',
        options: {
          params: {
            required: 'id',
          },
        },
      },
    },
  };
};
