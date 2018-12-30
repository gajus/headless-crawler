// @flow

import serializeError from 'serialize-error';
import Queue from 'better-queue';
import {
  uniq
} from 'lodash';
import type {
  CreateHeadlessCrawlerType,
  PuppeteerPageType,
  QueueConfigurationType,
  ScrapeConfigurationType,
  SiteLinkType
} from '../types';
import Logger from '../Logger';
import createHeadlessCrawlerConfiguration from './createHeadlessCrawlerConfiguration';

type QueueTaskType = {|
  +path: $ReadOnlyArray<SiteLinkType>
|};

const log = Logger.child({
  namespace: 'createHeadlessCrawler'
});

const extractLinks = (page: PuppeteerPageType): $ReadOnlyArray<string> => {
  return page.evaluate(new Function(`
    return [].slice.apply(document.querySelectorAll('a')).map(node => node.href);
  `));
};

const createHeadlessCrawler: CreateHeadlessCrawlerType = (headlessCrawlerUserConfiguration) => {
  let scrapedLinkHistory = [];

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

  const runQueueTask = async (input: QueueTaskType, callback) => {
    const currentLink = {
      ...input.path[input.path.length - 1],
      lastAttemptedAt: Date.now()
    };

    const currentPath = input.path.slice(0, -1).concat([currentLink]);

    scrapedLinkHistory = scrapedLinkHistory.concat([currentLink]);

    let resource;

    try {
      resource = await scrape({
        url: currentLink.linkUrl
      });
    } catch (error) {
      log.error({
        error: serializeError(error)
      }, 'error has occured');

      headlessCrawlerConfiguration.onError(error);
    }

    if (!resource) {
      callback(null);

      return;
    }

    log.debug('discovered %d new links', resource.links.length);

    const shouldAdvance = await headlessCrawlerConfiguration.onResult(resource);

    if (!shouldAdvance) {
      log.info('onResult result signaled a stop');

      callback(null);

      return;
    }

    for (const descendentLink of resource.links) {
      const queuedLink = {
        lastAttemptedAt: null,
        linkDepth: currentPath.length,
        linkUrl: descendentLink,
        originUrl: currentLink.linkUrl,
        path: currentPath
      };

      log.trace({
        link: queuedLink.linkUrl
      }, 'attempting to queue a link');

      if (await headlessCrawlerConfiguration.filterLink(queuedLink, scrapedLinkHistory)) {
        log.trace('link queued');

        // eslint-disable-next-line no-use-before-define
        localQueue.push({
          path: currentPath.concat([
            queuedLink
          ]),
          url: queuedLink.linkUrl
        });
      } else {
        log.trace('link filtered out');
      }
    }

    callback(null, resource);
  };

  const localQueue = new Queue(runQueueTask, {
    concurrent: headlessCrawlerUserConfiguration.concurrency
  });

  const queue = (queueConfiguration: QueueConfigurationType) => {
    localQueue.push({
      path: [
        {
          lastAttemptedAt: null,
          linkDepth: 0,
          linkUrl: queueConfiguration.url,
          originUrl: null,
          path: []
        }
      ]
    });

    return new Promise((resolve) => {
      localQueue.on('drain', () => {
        resolve();
      });
    });
  };

  return {
    queue,
    scrape
  };
};

export default createHeadlessCrawler;
