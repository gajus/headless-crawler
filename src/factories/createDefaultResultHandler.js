// @flow

import type {
  ResultHandlerType
} from '../types';
import Logger from '../Logger';

const log = Logger.child({
  namespace: 'createDefaultResultHandler'
});

export default (): ResultHandlerType => {
  return (scrapeResult) => {
    log.debug({
      scrapeResult
    }, 'new result');

    return true;
  };
};
