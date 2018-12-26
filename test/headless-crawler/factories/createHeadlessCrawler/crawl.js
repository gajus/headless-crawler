// @flow

import test, {
  after,
  before
} from 'ava';
import {
  spy,
  stub
} from 'sinon';
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

const extractContentConstantNull = '(() => { return null; })()';

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
  t.deepEqual(filterLink.args, [
    [
      {
        linkUrl: serverAddress + '/crawl/single-page-with-links/a',
        originUrl: serverAddress + '/crawl/single-page-with-links'
      }
    ],
    [
      {
        linkUrl: serverAddress + '/crawl/single-page-with-links/b',
        originUrl: serverAddress + '/crawl/single-page-with-links'
      }
    ],
    [
      {
        linkUrl: serverAddress + '/crawl/single-page-with-links/c',
        originUrl: serverAddress + '/crawl/single-page-with-links'
      }
    ]
  ]);
});

test('scrapes descendent links', async (t) => {
  const browser = await createBrowser();
  const onResult = spy();

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

  t.deepEqual(onResult.args, [
    [
      {
        content: null,
        links: [
          serverAddress + '/crawl/single-page-with-links/a',
          serverAddress + '/crawl/single-page-with-links/b',
          serverAddress + '/crawl/single-page-with-links/c'
        ],
        url: serverAddress + '/crawl/single-page-with-links'
      }
    ],
    [
      {
        content: null,
        links: [],
        url: serverAddress + '/crawl/single-page-with-links/a'
      }
    ],
    [
      {
        content: null,
        links: [],
        url: serverAddress + '/crawl/single-page-with-links/b'
      }
    ],
    [
      {
        content: null,
        links: [],
        url: serverAddress + '/crawl/single-page-with-links/c'
      }
    ]
  ]);
});
