// @flow

// eslint-disable-next-line fp/no-events
import EventEmitter from 'events';
import {
  uniq
} from 'lodash';
import type {
  BrowserType,
  PageType
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

type HeadlessCrawlerConfigurationType<T: *> = {|
  +browser: BrowserType,
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

const extractLinks = (page: PageType): $ReadOnlyArray<string> => {
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
