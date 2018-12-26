// @flow

import {
  constant,
  uniq
} from 'lodash';
import type {
  CrawlConfigurationType,
  CreateHeadlessCrawlerConfigurationType,
  CreateHeadlessCrawlerType,
  PuppeteerPageType,
  ScrapeConfigurationType
} from '../types';
import Logger from '../Logger';

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
