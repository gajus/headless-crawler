// @flow

import test, {
  after,
  before
} from 'ava';
import {
  stub
} from 'sinon';
import deepMap from 'map-obj';
import createHeadlessCrawler from '../../../../src/factories/createHeadlessCrawler';
import createHttpServer from '../../../helpers/createHttpServer';
import createBrowser from '../../../helpers/createBrowser';

let httpServer;
let serverAddress;

before(async () => {
  httpServer = await createHttpServer();
  serverAddress = 'http://127.0.0.1:' + httpServer.port;
});

after(() => {
  httpServer.close();
});

const overrideLastAttemptedAt = (path) => {
  return deepMap(path, (key, value) => {
    if (key === 'lastAttemptedAt' && typeof value === 'number') {
      return [
        key,
        '[OVERRIDDEN]'
      ];
    }

    return [
      key,
      value
    ];
  }, {
    deep: true
  });
};

const extractContentConstantNull = () => {
  return `(() => {
    return null;
  })()`;
};

test('uses `filterLink` to evaluate which URLs to scrape', async (t) => {
  const browser = await createBrowser();

  const filterLink = stub().returns(false);

  const headlessCrawler = createHeadlessCrawler({
    browser,
    extractContent: extractContentConstantNull,
    filterLink
  });

  await headlessCrawler.crawl({
    startUrl: serverAddress + '/crawl/single-page-with-links'
  });

  t.true(filterLink.callCount === 3);

  const args = overrideLastAttemptedAt(filterLink.args);

  t.deepEqual(args[0][0], {
    lastAttemptedAt: null,
    linkDepth: 1,
    linkUrl: serverAddress + '/crawl/single-page-with-links/a',
    originUrl: serverAddress + '/crawl/single-page-with-links',
    path: [
      {
        lastAttemptedAt: '[OVERRIDDEN]',
        linkDepth: 0,
        linkUrl: serverAddress + '/crawl/single-page-with-links',
        originUrl: null,
        path: []
      }
    ]
  });

  t.deepEqual(args[1][0], {
    lastAttemptedAt: null,
    linkDepth: 1,
    linkUrl: serverAddress + '/crawl/single-page-with-links/b',
    originUrl: serverAddress + '/crawl/single-page-with-links',
    path: [
      {
        lastAttemptedAt: '[OVERRIDDEN]',
        linkDepth: 0,
        linkUrl: serverAddress + '/crawl/single-page-with-links',
        originUrl: null,
        path: []
      }
    ]
  });

  t.deepEqual(args[2][0], {
    lastAttemptedAt: null,
    linkDepth: 1,
    linkUrl: serverAddress + '/crawl/single-page-with-links/c',
    originUrl: serverAddress + '/crawl/single-page-with-links',
    path: [
      {
        lastAttemptedAt: '[OVERRIDDEN]',
        linkDepth: 0,
        linkUrl: serverAddress + '/crawl/single-page-with-links',
        originUrl: null,
        path: []
      }
    ]
  });
});

test('`filterLink` tracks link depth', async (t) => {
  const browser = await createBrowser();

  const filterLink = stub().returns(true);

  const headlessCrawler = createHeadlessCrawler({
    browser,
    extractContent: extractContentConstantNull,
    filterLink
  });

  await headlessCrawler.crawl({
    startUrl: serverAddress + '/crawl/deep-links'
  });

  t.true(filterLink.callCount === 3);

  const args = overrideLastAttemptedAt(filterLink.args);

  t.deepEqual(args[0][0], {
    lastAttemptedAt: null,
    linkDepth: 1,
    linkUrl: serverAddress + '/crawl/deep-links/a',
    originUrl: serverAddress + '/crawl/deep-links',
    path: [
      {
        lastAttemptedAt: '[OVERRIDDEN]',
        linkDepth: 0,
        linkUrl: serverAddress + '/crawl/deep-links',
        originUrl: null,
        path: []
      }
    ]
  });

  t.deepEqual(args[1][0], {
    lastAttemptedAt: null,
    linkDepth: 2,
    linkUrl: serverAddress + '/crawl/deep-links/b',
    originUrl: serverAddress + '/crawl/deep-links/a',
    path: [
      {
        lastAttemptedAt: '[OVERRIDDEN]',
        linkDepth: 0,
        linkUrl: serverAddress + '/crawl/deep-links',
        originUrl: null,
        path: []
      },
      {
        lastAttemptedAt: '[OVERRIDDEN]',
        linkDepth: 1,
        linkUrl: serverAddress + '/crawl/deep-links/a',
        originUrl: serverAddress + '/crawl/deep-links',
        path: [
          {
            lastAttemptedAt: '[OVERRIDDEN]',
            linkDepth: 0,
            linkUrl: serverAddress + '/crawl/deep-links',
            originUrl: null,
            path: []
          }
        ]
      }
    ]
  });

  t.deepEqual(args[2][0], {
    lastAttemptedAt: null,
    linkDepth: 3,
    linkUrl: serverAddress + '/crawl/deep-links/c',
    originUrl: serverAddress + '/crawl/deep-links/b',
    path: [
      {
        lastAttemptedAt: '[OVERRIDDEN]',
        linkDepth: 0,
        linkUrl: serverAddress + '/crawl/deep-links',
        originUrl: null,
        path: []
      },
      {
        lastAttemptedAt: '[OVERRIDDEN]',
        linkDepth: 1,
        linkUrl: serverAddress + '/crawl/deep-links/a',
        originUrl: serverAddress + '/crawl/deep-links',
        path: [
          {
            lastAttemptedAt: '[OVERRIDDEN]',
            linkDepth: 0,
            linkUrl: serverAddress + '/crawl/deep-links',
            originUrl: null,
            path: []
          }
        ]
      },
      {
        lastAttemptedAt: '[OVERRIDDEN]',
        linkDepth: 2,
        linkUrl: serverAddress + '/crawl/deep-links/b',
        originUrl: serverAddress + '/crawl/deep-links/a',
        path: [
          {
            lastAttemptedAt: '[OVERRIDDEN]',
            linkDepth: 0,
            linkUrl: serverAddress + '/crawl/deep-links',
            originUrl: null,
            path: []
          },
          {
            lastAttemptedAt: '[OVERRIDDEN]',
            linkDepth: 1,
            linkUrl: serverAddress + '/crawl/deep-links/a',
            originUrl: serverAddress + '/crawl/deep-links',
            path: [
              {
                lastAttemptedAt: '[OVERRIDDEN]',
                linkDepth: 0,
                linkUrl: serverAddress + '/crawl/deep-links',
                originUrl: null,
                path: []
              }
            ]
          }
        ]
      }
    ]
  });
});

test('scrapes descendent links', async (t) => {
  const browser = await createBrowser();
  const onResult = stub().returns(true);

  const headlessCrawler = createHeadlessCrawler({
    browser,
    extractContent: extractContentConstantNull,
    filterLink: () => {
      return true;
    },
    onResult
  });

  await headlessCrawler.crawl({
    startUrl: serverAddress + '/crawl/single-page-with-links'
  });

  t.true(onResult.callCount === 4);

  t.deepEqual(onResult.args[0][0], {
    content: null,
    links: [
      serverAddress + '/crawl/single-page-with-links/a',
      serverAddress + '/crawl/single-page-with-links/b',
      serverAddress + '/crawl/single-page-with-links/c'
    ],
    url: serverAddress + '/crawl/single-page-with-links'
  });

  t.deepEqual(onResult.args[1][0], {
    content: null,
    links: [],
    url: serverAddress + '/crawl/single-page-with-links/a'
  });

  t.deepEqual(onResult.args[2][0], {
    content: null,
    links: [],
    url: serverAddress + '/crawl/single-page-with-links/b'
  });

  t.deepEqual(onResult.args[3][0], {
    content: null,
    links: [],
    url: serverAddress + '/crawl/single-page-with-links/c'
  });
});

test('scrapes descendent until `onResult` returns `false`', async (t) => {
  const browser = await createBrowser();
  const onResult = stub().returns(false);

  const headlessCrawler = createHeadlessCrawler({
    browser,
    extractContent: extractContentConstantNull,
    filterLink: () => {
      return true;
    },
    onResult
  });

  await headlessCrawler.crawl({
    startUrl: serverAddress + '/crawl/single-page-with-links'
  });

  t.true(onResult.callCount === 1);

  t.deepEqual(onResult.args[0][0], {
    content: null,
    links: [
      serverAddress + '/crawl/single-page-with-links/a',
      serverAddress + '/crawl/single-page-with-links/b',
      serverAddress + '/crawl/single-page-with-links/c'
    ],
    url: serverAddress + '/crawl/single-page-with-links'
  });
});
