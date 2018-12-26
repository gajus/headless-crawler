// @flow

// eslint-disable-next-line fp/no-events
import EventEmitter from 'events';
import {
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

type ScrapeResultType<T> = {|
  +content: T,
  +links: $ReadOnlyArray<string>,
  +url: string
|};

/**
 * @property browser Instance of [Puppeteer Browser](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-class-browser).
 * @property extractContent A function [evaluted](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-pageevaluatepagefunction-args) in the context of the browser. The result of the function is used to describe the contents of the website (see `ScrapeResultType#content` property).
 * @property filterLink Identifies which URLs to follow.
 * @property onResult Invoked after content is extracted from a new page.
 */
type HeadlessCrawlerConfigurationType<T: *> = {|
  +browser: PuppeteerBrowserType,
  +extractContent: () => ScrapeResultType<T>,
  +filterLink: (link: SiteLinkType) => boolean,
  +onResult?: (result: T) => void
|};

type CrawlConfigurationType = {|
  +startUrl: string
|};

const log = Logger.child({
  namespace: 'headless-crawler'
});

const defaultExtractContent = new Function(`
  return {
    title: document.title
  }
`);

const extractLinks = (page: PuppeteerPageType): $ReadOnlyArray<string> => {
  return page.evaluate(new Function(`
    return [].slice.apply(document.querySelectorAll('a')).map(node => node.href);
  `));
};

export default (headlessCrawlerConfiguration: HeadlessCrawlerConfigurationType) => {
  const eventEmitter = new EventEmitter();

  const browser = headlessCrawlerConfiguration.browser;

  const scrape = async (url: string) => {
    log.debug('opening %s URL', url);

    const page = await browser.newPage();

    await page.goto(url);

    const links = await extractLinks(page);

    log.debug({
      links
    }, 'found links');

    const content = await page.evaluate(headlessCrawlerConfiguration.extractContent || defaultExtractContent);

    await page.close();

    return {
      content,
      links: uniq(links),
      url: page.url()
    };
  };

  const crawl = async (crawlConfiguration: CrawlConfigurationType) => {
    const linkQueue = [];

    let nextUrl = crawlConfiguration.startUrl;

    while (true) {
      const resource = await scrape(nextUrl);

      if (headlessCrawlerConfiguration.onResult) {
        headlessCrawlerConfiguration.onResult(resource);
      }

      log.debug('discovered %d new links', resource.links.length);

      for (const link of resource.links) {
        const queueLink = {
          linkUrl: link,
          originUrl: nextUrl
        };

        if (headlessCrawlerConfiguration.filterLink(queueLink)) {
          linkQueue.push(queueLink);
        }
      }

      log.debug('link queue size %d', linkQueue.length);

      if (linkQueue.length) {
        nextUrl = linkQueue.shift().linkUrl;
      } else {
        break;
      }
    }
  };

  return {
    ...eventEmitter,
    crawl,
    scrape
  };
};
