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

const extractContentConstantNull = () => {
  return '(() => { return null; })()';
};

test('evaluates `extractContent` to extract content from the resulting page', async (t) => {
  const browser = await createBrowser();

  const headlessCrawler = createHeadlessCrawler({
    browser,
    extractContent: () => {
      return '(() => { return 1; })()';
    }
  });

  const result = await headlessCrawler.scrape({
    url: serverAddress + '/scrape/single-page-with-no-links'
  });

  t.deepEqual(result, {
    content: 1,
    links: [],
    url: serverAddress + '/scrape/single-page-with-no-links'
  });
});

test('evaluates `extractContent` with an instance of page', async (t) => {
  const browser = await createBrowser();

  const headlessCrawler = createHeadlessCrawler({
    browser,
    extractContent: async (page) => {
      await page.addScriptTag({
        url: 'https://code.jquery.com/jquery-3.3.1.min.js'
      });

      return `(() => {
        return $('title').text();
      })()`;
    }
  });

  const result = await headlessCrawler.scrape({
    url: serverAddress + '/scrape/single-page-with-no-links'
  });

  t.deepEqual(result, {
    content: 'single-page-with-no-links',
    links: [],
    url: serverAddress + '/scrape/single-page-with-no-links'
  });
});

test('extracts all links', async (t) => {
  const browser = await createBrowser();

  const headlessCrawler = createHeadlessCrawler({
    browser,
    extractContent: extractContentConstantNull
  });

  const result = await headlessCrawler.scrape({
    url: serverAddress + '/scrape/single-page-with-links'
  });

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

  const headlessCrawler = createHeadlessCrawler({
    browser,
    extractContent: extractContentConstantNull
  });

  const result = await headlessCrawler.scrape({
    url: serverAddress + '/scrape/single-page-with-duplicate-links'
  });

  t.deepEqual(result, {
    content: null,
    links: [
      serverAddress + '/scrape/single-page-with-duplicate-links/a'
    ],
    url: serverAddress + '/scrape/single-page-with-duplicate-links'
  });
});

test('evaluates `onPage` before evaluating `extractContent`', async (t) => {
  const browser = await createBrowser();

  const onPage = async (page) => {
    await page.setUserAgent('foo');
  };

  const headlessCrawler = createHeadlessCrawler({
    browser,
    onPage
  });

  const result = await headlessCrawler.scrape({
    url: serverAddress + '/scrape/title-user-agent'
  });

  t.deepEqual(result, {
    content: {
      title: 'foo'
    },
    links: [],
    url: serverAddress + '/scrape/title-user-agent'
  });
});
