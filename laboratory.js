'use strict';

/**
 * Retrieve the list of available commands.
 *
 * @returns {Object} The list and definitions of commands.
 */
exports.xcraftCommands = function () {
  return {
    handlers: require ('./lib/service.js').handlers,
    context: require ('./lib/service.js').context,
    rc: {
      create: {
        parallel: true,
        desc: 'Create a laboratory',
        options: {
          params: {
            required: 'routes',
          },
        },
      },
      duplicate: {
        parallel: true,
        desc: 'Duplicate a laboratory',
        options: {
          params: {
            required: 'id',
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
      add: {
        parallel: true,
        desc: 'Add a widget to a lab',
        options: {
          params: {
            required: 'id',
          },
        },
      },
      del: {
        parallel: true,
        desc: 'Delete a widget from a lab',
        options: {
          params: {
            required: 'id',
          },
        },
      },
    },
  };
};
