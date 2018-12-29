// @flow

import type {
  WaitForHandlerType
} from '../types';

export default (): WaitForHandlerType => {
  return (page) => {
    return page.waitForNavigation({
      waitUntil: 'networkidle2'
    });
  };
};
