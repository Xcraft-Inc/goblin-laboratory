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
        desc: 'Create a widget',
        options: {
          params: {
            optional: 'config...',
          },
        },
      },
      open: {
        parallel: true,
        desc: 'Open a widget',
        options: {
          params: {
            required: 'route',
          },
        },
      },
    },
  };
};
