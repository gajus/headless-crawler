// @flow

import {
  createRobotsAgent
} from 'robots-agent';
import type {
  FilterLinkHandlerType
} from '../types';

type DefaultFilterLinkHandlerConfigurationType = {|
  +maxLinkDepth: number,
  +respectRobots: boolean
|};

type DefaultFilterLinkHandlerUserConfigurationType = {|
  +maxLinkDepth?: number,
  +respectRobots?: boolean
|};

export default (userConfiguration?: DefaultFilterLinkHandlerUserConfigurationType): FilterLinkHandlerType => {
  const configuration: DefaultFilterLinkHandlerConfigurationType = {
    maxLinkDepth: 10,
    respectRobots: true,
    ...userConfiguration
  };

  let robotsAgent;

  if (configuration.respectRobots) {
    robotsAgent = createRobotsAgent();
  }

  return async (link, scrapedLinkHistory) => {
    if (link.linkDepth > configuration.maxLinkDepth) {
      return false;
    }

    if (configuration.respectRobots && robotsAgent.isRobotsAvailable(link.linkUrl) && !robotsAgent.isAllowed(link.linkUrl)) {
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
