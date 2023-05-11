import {useContext} from 'react';
import ReadonlyContext from './context.js';

export default function useReadonly() {
  return useContext(ReadonlyContext);
}
