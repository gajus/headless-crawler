// @flow

import test, {
  after,
  before
} from 'ava';
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

const extractContentConstantNull = new Function('return null;');

test('evaluates `extractContent` to extract content from the resulint page', async (t) => {
  const browser = await createBrowser();

  const headlessCrawler = await createHeadlessCrawler({
    browser,
    extractContent: new Function('return 1;')
  });

  const result = await headlessCrawler.scrape(serverAddress + '/scrape/single-page-with-no-links');

  t.deepEqual(result, {
    content: 1,
    links: [],
    url: serverAddress + '/scrape/single-page-with-no-links'
  });
});

test('extracts all links', async (t) => {
  const browser = await createBrowser();

  const headlessCrawler = await createHeadlessCrawler({
    browser,
    extractContent: extractContentConstantNull
  });

  const result = await headlessCrawler.scrape(serverAddress + '/scrape/single-page-with-links');

  t.deepEqual(result, {
    content: null,
    links: [
      serverAddress + '/scrape/single-page-with-links/a',
      serverAddress + '/scrape/single-page-with-links/b'
    ],
    url: serverAddress + '/scrape/single-page-with-links'
  });
});

test('removes duplicate links', async (t) => {
  const browser = await createBrowser();

  const headlessCrawler = await createHeadlessCrawler({
    browser,
    extractContent: extractContentConstantNull
  });

  const result = await headlessCrawler.scrape(serverAddress + '/scrape/single-page-with-duplicate-links');

  t.deepEqual(result, {
    content: null,
    links: [
      serverAddress + '/scrape/single-page-with-duplicate-links/a'
    ],
    url: serverAddress + '/scrape/single-page-with-duplicate-links'
  });
});
