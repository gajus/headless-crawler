// @flow

/* eslint-disable import/exports-last */

// eslint-disable-next-line flowtype/no-weak-types
export type PuppeteerBrowserType = any;

// eslint-disable-next-line flowtype/no-weak-types
export type PuppeteerPageType = any;

export type SiteLinkType = {|
  +lastAttemptedAt: number | null,
  +linkDepth: number,
  +linkUrl: string,
  +originUrl: string | null,
  +path: $ReadOnlyArray<SiteLinkType>
|};

// @todo Use Flow generic.
// eslint-disable-next-line flowtype/no-weak-types
type ContentType = any;

type ScrapeResultType = {|
  +content: ContentType,
  +links: $ReadOnlyArray<string>,
  +url: string
|};

export type ScrapeConfigurationType = {|
  +url: string
|};

export type CrawlConfigurationType = {|
  +startUrl: string
|};

type MaybePromiseType<R> = R | Promise<R>;

export type ExtractContentHandlerType = (page: PuppeteerPageType, scrapeConfiguration: ScrapeConfigurationType) => MaybePromiseType<string>;
export type FilterLinkHandlerType = (link: SiteLinkType, scrapedLinkHistory: $ReadOnlyArray<SiteLinkType>) => MaybePromiseType<boolean>;
export type PageHandlerType = (page: PuppeteerPageType, scrapeConfiguration: ScrapeConfigurationType) => MaybePromiseType<void>;
export type ResultHandlerType = (result: ScrapeResultType) => MaybePromiseType<boolean>;
export type WaitForHandlerType = (page: PuppeteerPageType, scrapeConfiguration: ScrapeConfigurationType) => Promise<void>;

/**
 * @property browser Instance of [Puppeteer Browser](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-class-browser).
 * @property extractContent A function [evaluted](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-pageevaluatepagefunction-args) in the context of the browser. The result of the function is used to describe the contents of the website (see `ScrapeResultType#content` property).
 * @property filterLink Identifies which URLs to follow.
 * @property onPage Invoked when [Puppeteer Page](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-class-page) instance is instantiated.
 * @property onResult Invoked after content is extracted from a new page. Must return a boolean value indicating whether the crawler should advance to the next URL.
 * @property waitFor Invoked before links are aggregated from the website and before `extractContent`.
 */
type HeadlessCrawlerUserConfigurationType = {|
  +browser: PuppeteerBrowserType,
  +extractContent?: ExtractContentHandlerType,
  +filterLink?: FilterLinkHandlerType,
  +onPage?: PageHandlerType,
  +onResult?: ResultHandlerType,
  +waitFor?: WaitForHandlerType
|};

type HeadlessCrawlerConfigurationType = {|
  +browser: PuppeteerBrowserType,
  +extractContent: ExtractContentHandlerType,
  +filterLink: FilterLinkHandlerType,
  +onPage?: PageHandlerType,
  +onResult: ResultHandlerType,
  +waitFor: WaitForHandlerType
|};

export type CreateHeadlessCrawlerType = (headlessCrawlerUserConfiguration: HeadlessCrawlerUserConfigurationType) => {|
  crawl: (configuration: CrawlConfigurationType) => Promise<void>,
  scrape: (configuration: ScrapeConfigurationType) => Promise<ScrapeResultType>
|};

export type CreateHeadlessCrawlerConfigurationType = (headlessCrawlerUserConfiguration: HeadlessCrawlerUserConfigurationType) => HeadlessCrawlerConfigurationType;
