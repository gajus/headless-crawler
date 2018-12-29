// @flow

import {
  uniq
} from 'lodash';
import type {
  CrawlConfigurationType,
  CreateHeadlessCrawlerType,
  PuppeteerPageType,
  ScrapeConfigurationType,
  SiteLinkType
} from '../types';
import Logger from '../Logger';
import createHeadlessCrawlerConfiguration from './createHeadlessCrawlerConfiguration';

const log = Logger.child({
  namespace: 'createHeadlessCrawler'
});

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
    let scrapedLinkHistory = [];

    const run = async (nextUrl: string, path: $ReadOnlyArray<SiteLinkType>) => {
      scrapedLinkHistory = scrapedLinkHistory.concat([path[path.length - 1]]);

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
        const queuedLink = {
          lastAttemptedAt: null,
          linkDepth: path.length,
          linkUrl: link,
          originUrl: nextUrl,
          path
        };

        if (await headlessCrawlerConfiguration.filterLink(queuedLink, scrapedLinkHistory)) {
          linkQueue.push(queuedLink);
        }
      }

      log.debug('link queue size %d', linkQueue.length);

      for (const link of linkQueue) {
        const queuedLink = {
          ...link,
          lastAttemptedAt: Date.now()
        };

        await run(queuedLink.linkUrl, path.concat([
          queuedLink
        ]));
      }
    };

    await run(crawlConfiguration.startUrl, [
      {
        lastAttemptedAt: Date.now(),
        linkDepth: 0,
        linkUrl: crawlConfiguration.startUrl,
        originUrl: null,
        path: []
      }
    ]);
  };

  return {
    crawl,
    scrape
  };
};

export default createHeadlessCrawler;
