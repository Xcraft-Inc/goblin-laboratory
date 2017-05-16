import {connect} from 'react-redux';
import Shredder from 'xcraft-core-shredder';

export const wire = wires => {
  return connect (
    state => {
      let mapState = {};
      if (state.backend && state.backend.toJS) {
        const shredded = new Shredder (state.backend.toJS ());
        Object.keys (wires).forEach (wire => {
          const val = shredded.get (wires[wire], {});
          mapState[wire] = val;
        });

        return mapState;
      }

      return {};
    },
    null,
    null,
    {pure: true}
  );
};
