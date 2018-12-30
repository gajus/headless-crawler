// @flow

export {
  createDefaultErrorHandler,
  createDefaultExtractContentHandler,
  createDefaultFilterLinkHandler,
  createDefaultResultHandler,
  createDefaultSortQueuedLinksHandler,
  createDefaultWaitForHandler,
  createHeadlessCrawler
} from './factories';
export type {
  ExtractContentHandlerType,
  FilterLinkHandlerType,
  PageHandlerType,
  ResultHandlerType,
  SortQueuedLinksHandlerType,
  WaitForHandlerType
} from './types';
