// @flow

/* eslint-disable import/exports-last */

// eslint-disable-next-line flowtype/no-weak-types
export type PuppeteerBrowserType = any;

// eslint-disable-next-line flowtype/no-weak-types
export type PuppeteerPageType = any;

type SiteLinkType = {|
  +linkUrl: string,
  +originUrl: string
|};

// @todo Use Flow generic.
// eslint-disable-next-line flowtype/no-weak-types
type ContentType = any;

type ScrapeResultType = {|
  +content: ContentType,
  +links: $ReadOnlyArray<string>,
  +url: string
|};

/**
 * @property browser Instance of [Puppeteer Browser](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-class-browser).
 * @property extractContent A function [evaluted](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-pageevaluatepagefunction-args) in the context of the browser. The result of the function is used to describe the contents of the website (see `ScrapeResultType#content` property).
 * @property filterLink Identifies which URLs to follow.
 * @property onResult Invoked after content is extracted from a new page.
 */
type HeadlessCrawlerUserConfigurationType = {|
  +browser: PuppeteerBrowserType,
  +extractContent?: string,
  +filterLink?: (link: SiteLinkType) => boolean,
  +onResult?: (result: ScrapeResultType) => void
|};

type HeadlessCrawlerConfigurationType = {|
  +browser: PuppeteerBrowserType,
  +extractContent: string,
  +filterLink: (link: SiteLinkType, scrapedLinkHistory: $ReadOnlyArray<SiteLinkType>) => boolean,
  +onResult: (result: ScrapeResultType) => void
|};

export type ScrapeConfigurationType = {|
  +url: string
|};

export type CrawlConfigurationType = {|
  +startUrl: string
|};

export type CreateHeadlessCrawlerType = (headlessCrawlerUserConfiguration: HeadlessCrawlerUserConfigurationType) => {|
  crawl: (configuration: CrawlConfigurationType) => Promise<void>,
  scrape: (configuration: ScrapeConfigurationType) => Promise<ScrapeResultType>
|};

export type CreateHeadlessCrawlerConfigurationType = (headlessCrawlerUserConfiguration: HeadlessCrawlerUserConfigurationType) => HeadlessCrawlerConfigurationType;
