import {useContext} from 'react';
import DesktopIdContext from './context.js';

export default function useDesktopId() {
  return useContext(DesktopIdContext);
}
