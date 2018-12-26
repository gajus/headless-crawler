# headless-crawler 👻

[![Travis build status](http://img.shields.io/travis/gajus/headless-crawler/master.svg?style=flat-square)](https://travis-ci.org/gajus/headless-crawler)
[![Coveralls](https://img.shields.io/coveralls/gajus/headless-crawler.svg?style=flat-square)](https://coveralls.io/github/gajus/headless-crawler)
[![NPM version](http://img.shields.io/npm/v/headless-crawler.svg?style=flat-square)](https://www.npmjs.org/package/headless-crawler)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A crawler implemented using a headless browser (Chrome).

{"gitdown": "contents"}

## Features

* Scrapes websites using user-provided `extractContent` function and follows the observed URLs as instructed by `filterLink` and `onResult`.

## Usage

```js
import puppeteer from 'puppeteer';
import {
  createHeadlessCrawler
} from 'headless-crawler';

const main = async () => {
  const browser = puppeteer.launch();

  // See Configuration documentation.
  const headlessCrawler = createHeadlessCrawler({
    onResult: (resource) => {
      console.log(resource.content.title);
    },
    browser
  });

  await headlessCrawler.crawl('http://gajus.com/');
};

main();

```

## Configuration

```js
/**
 * @property browser Instance of [Puppeteer Browser](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-class-browser).
 * @property extractContent Creates a function that is [evaluted](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-pageevaluatepagefunction-args) in the context of the browser. The result of the evaluated function describes the contents of the website (see `ScrapeResultType#content` property).
 * @property filterLink Identifies which URLs to follow.
 * @property onPage Invoked when [Puppeteer Page](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-class-page) instance is instantiated.
 * @property onResult Invoked after content is extracted from a new page. Must return a boolean value indicating whether the crawler should advance to the next URL.
 */
type HeadlessCrawlerConfigurationType = {|
  +browser: PuppeteerBrowserType,
  +extractContent?: (scrapeConfiguration: ScrapeConfigurationType, page: PuppeteerPageType) => MaybePromiseType<string>,
  +filterLink?: (link: SiteLinkType) => boolean,
  +onPage?: (scrapeConfiguration: ScrapeConfigurationType, page: PuppeteerPageType) => MaybePromiseType<void>,
  +onResult?: (scrapeResult: ScrapeResultType) => MaybePromiseType<boolean>
|};

```

### Default `extractContent`

The default `extractContent` function extracts page title.

```js
() => {
  return `(() => {
    return {
      title: document.title
    };
  })();`;
};

```

### Default `filterLink`

The default `filterLink` function includes all URLs and does not visit previously scraped URLs.

```js
(link, scrapedLinkHistory) => {
  for (const scrapedLink of scrapedLinkHistory) {
    if (scrapedLink.linkUrl === link.linkUrl) {
      return false;
    }
  }

  return true;
};

```

### Default `onResult`

The default `onResult` logs the result and advances crawler to the next URL.

```js
(scrapeResult) => {
  log.debug({
    scrapeResult
  }, 'new result');

  return true;
};

```

## Recipes

### Configuring request parameters

Request parameters (such as geolocation, user-agent and viewport) can be configured using `onPage` handler, e.g.

```js
const main = async () => {
  const browser = await puppeteer.launch();

  const onPage = async (scrapeConfiguration, page) => {
    await page.setGeolocation({
      latitude: 59.95,
      longitude: 30.31667
    });
    await page.setUserAgent('headless-crawler');
  };

  const headlessCrawler = createHeadlessCrawler({
    browser,
    onPage
  });
};

main();

```

Use `onPage` to

## Types

This package is using [Flow](https://flow.org/) type annotations.

Refer to [`./src/types.js`](./src/types.js) for method parameter and result types.

## Logging

This package is using [`roarr`](https://www.npmjs.com/package/roarr) logger to log the program's state.

Export `ROARR_LOG=true` environment variable to enable log printing to stdout.

Use [`roarr-cli`](https://github.com/gajus/roarr-cli) program to pretty-print the logs.

## FAQ

### What makes `headless-crawler` different from `headless-chrome-crawler`?

[`headless-chrome-crawler`](https://github.com/yujiosaka/headless-chrome-crawler) is the only other maintained headless crawler in the Node.js ecosystem.

It appears that `headless-chrome-crawler` is no longer maintained. At the time of this writing, the author of `headless-chrome-crawler` has not made public contributions in over 6 months and the package includes bugs as a result of [hardcoded dependency versions](https://github.com/yujiosaka/headless-chrome-crawler/blob/ad95c2c4b356c8fdc60d16f8b013cc9a043a9bc6/package.json#L28-L34).

`headless-crawler` implements core features of `headless-chrome-crawler`.
