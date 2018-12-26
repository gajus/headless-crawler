// @flow

import {
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

const defaultExtractContent = () => {
  return `(() => {
    return {
      title: document.title
    };
  })()`;
};

const defaultFilterLink = (link, scrapedLinkHistory) => {
  for (const scrapedLink of scrapedLinkHistory) {
    if (scrapedLink.linkUrl === link.linkUrl) {
      return false;
    }
  }

  return true;
};

const defaultResultHandler = (scrapeResult) => {
  log.debug({
    scrapeResult
  }, 'new result');

  return true;
};

const defaultWaitFor = (page) => {
  return page.waitForNavigation({
    waitUntil: 'networkidle2'
  });
};

const createHeadlessCrawlerConfiguration: CreateHeadlessCrawlerConfigurationType = (headlessCrawlerUserConfiguration) => {
  return {
    browser: headlessCrawlerUserConfiguration.browser,
    extractContent: headlessCrawlerUserConfiguration.extractContent || defaultExtractContent,
    filterLink: headlessCrawlerUserConfiguration.filterLink || defaultFilterLink,
    onPage: headlessCrawlerUserConfiguration.onPage,
    onResult: headlessCrawlerUserConfiguration.onResult || defaultResultHandler,
    waitFor: headlessCrawlerUserConfiguration.waitFor || defaultWaitFor
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

    if (headlessCrawlerConfiguration.onPage) {
      await headlessCrawlerConfiguration.onPage(page, scrapeConfiguration);
    }

    const waitPromise = headlessCrawlerConfiguration.waitFor(page, scrapeConfiguration);

    await page.goto(scrapeConfiguration.url);

    await waitPromise;

    const links = await extractLinks(page);

    log.debug({
      links
    }, 'found links');

    const content = await page.evaluate(await headlessCrawlerConfiguration.extractContent(page, scrapeConfiguration));

    await page.close();

    return {
      content,
      links: uniq(links),
      url: page.url()
    };
  };

  const crawl = async (crawlConfiguration: CrawlConfigurationType) => {
    const scrapedLinkHistory = [];

    const run = async (nextUrl: string, linkDepth: number) => {
      const resource = await scrape({
        url: nextUrl
      });

      const shouldAdvance = await headlessCrawlerConfiguration.onResult(resource);

      if (!shouldAdvance) {
        return;
      }

      log.debug('discovered %d new links', resource.links.length);

      const linkQueue = [];

      for (const link of resource.links) {
        const queueLink = {
          linkDepth,
          linkUrl: link,
          originUrl: nextUrl
        };

        if (headlessCrawlerConfiguration.filterLink(queueLink, scrapedLinkHistory)) {
          linkQueue.push(queueLink);
        }
      }

      log.debug('link queue size %d', linkQueue.length);

      for (const link of linkQueue) {
        await run(link.linkUrl, linkDepth + 1);
      }
    };

    await run(crawlConfiguration.startUrl, 1);
  };

  return {
    crawl,
    scrape
  };
};

export default createHeadlessCrawler;
