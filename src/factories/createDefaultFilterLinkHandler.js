// @flow

import {
  createRobotsAgent
} from 'robots-agent';
import type {
  FilterLinkHandlerType
} from '../types';

export default (): FilterLinkHandlerType => {
  const robotsAgent = createRobotsAgent();

  return async (link, scrapedLinkHistory) => {
    if (robotsAgent.isRobotsAvailable(link.linkUrl) && !robotsAgent.isAllowed(link.linkUrl)) {
      return false;
    }

    for (const scrapedLink of scrapedLinkHistory) {
      if (scrapedLink.linkUrl === link.linkUrl) {
        return false;
      }
    }

    return true;
  };
};
