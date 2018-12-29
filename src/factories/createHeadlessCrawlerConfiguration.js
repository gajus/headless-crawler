// @flow

import type {
  CreateHeadlessCrawlerConfigurationType
} from '../types';
import createDefaultExtractContentHandler from './createDefaultExtractContentHandler';
import createDefaultFilterLinkHandler from './createDefaultFilterLinkHandler';
import createDefaultResultHandler from './createDefaultResultHandler';
import createDefaultSortQueuedLinksHandler from './createDefaultSortQueuedLinksHandler';
import createDefaultWaitForHandler from './createDefaultWaitForHandler';

const createHeadlessCrawlerConfiguration: CreateHeadlessCrawlerConfigurationType = (headlessCrawlerUserConfiguration) => {
  return {
    browser: headlessCrawlerUserConfiguration.browser,
    extractContent: headlessCrawlerUserConfiguration.extractContent || createDefaultExtractContentHandler(),
    filterLink: headlessCrawlerUserConfiguration.filterLink || createDefaultFilterLinkHandler(),
    onPage: headlessCrawlerUserConfiguration.onPage,
    onResult: headlessCrawlerUserConfiguration.onResult || createDefaultResultHandler(),
    sortQueuedLinks: headlessCrawlerUserConfiguration.sortQueuedLinks || createDefaultSortQueuedLinksHandler(),
    waitFor: headlessCrawlerUserConfiguration.waitFor || createDefaultWaitForHandler()
  };
};

export default createHeadlessCrawlerConfiguration;
