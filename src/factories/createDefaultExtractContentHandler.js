// @flow

import type {
  ExtractContentHandlerType
} from '../types';

export default (): ExtractContentHandlerType => {
  return () => {
    return `(() => {
      return {
        title: document.title
      };
    })()`;
  };
};
