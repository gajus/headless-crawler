// @flow

import {
  constant,
  uniq
} from 'lodash';
import type {
  PuppeteerBrowserType,
  PuppeteerPageType
} from '../types';
import Logger from '../Logger';

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

type ScrapeConfigurationType = {|
  +url: string
|};

type CrawlConfigurationType = {|
  +startUrl: string
|};

type CreateHeadlessCrawlerType = (headlessCrawlerUserConfiguration: HeadlessCrawlerUserConfigurationType) => {|
  crawl: (configuration: CrawlConfigurationType) => Promise<void>,
  scrape: (configuration: ScrapeConfigurationType) => Promise<ScrapeResultType>
|};

type CreateHeadlessCrawlerConfigurationType = (headlessCrawlerUserConfiguration: HeadlessCrawlerUserConfigurationType) => HeadlessCrawlerConfigurationType;

const log = Logger.child({
  namespace: 'createHeadlessCrawler'
});

const defaultExtractContent = `(() => {
  return {
    title: document.title
  };
})`;

const defaultFilterLink = (link, scrapedLinkHistory) => {
  for (const scrapedLink of scrapedLinkHistory) {
    if (scrapedLink.linkUrl === link.linkUrl) {
      return false;
    }
  }

  return true;
};

const createHeadlessCrawlerConfiguration: CreateHeadlessCrawlerConfigurationType = (headlessCrawlerUserConfiguration) => {
  return {
    browser: headlessCrawlerUserConfiguration.browser,
    extractContent: headlessCrawlerUserConfiguration.extractContent || defaultExtractContent,
    filterLink: headlessCrawlerUserConfiguration.filterLink || defaultFilterLink,
    onResult: headlessCrawlerUserConfiguration.onResult || constant(null)
  };
};

const extractLinks = (page: PuppeteerPageType): $ReadOnlyArray<string> => {
  return page.evaluate(new Function(`
    return [].slice.apply(document.querySelectorAll('a')).map(node => node.href);
  `));
};

const createHeadlessCrawler: CreateHeadlessCrawlerType = (headlessCrawlerUserConfiguration) => {
  const headlessCrawlerConfiguration = createHeadlessCrawlerConfiguration(headlessCrawlerUserConfiguration);

  const browser = headlessCrawlerConfiguration.browser;

  const scrape = async (scrapeConfiguration: ScrapeConfigurationType) => {
    log.debug('opening %s URL', scrapeConfiguration.url);

    const page = await browser.newPage();

    await page.goto(scrapeConfiguration.url);

    const links = await extractLinks(page);

    log.debug({
      links
    }, 'found links');

    const content = await page.evaluate(headlessCrawlerConfiguration.extractContent);

    await page.close();

    return {
      content,
      links: uniq(links),
      url: page.url()
    };
  };

  const crawl = async (crawlConfiguration: CrawlConfigurationType) => {
    const linkQueue = [];
    const scrapedLinkHistory = [];

    let nextUrl = crawlConfiguration.startUrl;

    while (true) {
      const resource = await scrape({
        url: nextUrl
      });

      headlessCrawlerConfiguration.onResult(resource);

      log.debug('discovered %d new links', resource.links.length);

      for (const link of resource.links) {
        const queueLink = {
          linkUrl: link,
          originUrl: nextUrl
        };

        if (headlessCrawlerConfiguration.filterLink(queueLink, scrapedLinkHistory)) {
          linkQueue.push(queueLink);
        }
      }

      log.debug('link queue size %d', linkQueue.length);

      if (linkQueue.length) {
        const nextLink = linkQueue.shift();

        scrapedLinkHistory.push(nextLink);

        nextUrl = nextLink.linkUrl;
      } else {
        break;
      }
    }
  };

  return {
    crawl,
    scrape
  };
};

export default createHeadlessCrawler;
