<a name="headless-crawler"></a>
# headless-crawler 👻

[![Travis build status](http://img.shields.io/travis/gajus/headless-crawler/master.svg?style=flat-square)](https://travis-ci.org/gajus/headless-crawler)
[![Coveralls](https://img.shields.io/coveralls/gajus/headless-crawler.svg?style=flat-square)](https://coveralls.io/github/gajus/headless-crawler)
[![NPM version](http://img.shields.io/npm/v/headless-crawler.svg?style=flat-square)](https://www.npmjs.org/package/headless-crawler)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A crawler implemented using a headless browser (Chrome).

* [headless-crawler 👻](#headless-crawler)
    * [Features](#headless-crawler-features)
    * [Usage](#headless-crawler-usage)
    * [Configuration](#headless-crawler-configuration)
        * [Default `extractContent`](#headless-crawler-configuration-default-extractcontent)
        * [Default `filterLink`](#headless-crawler-configuration-default-filterlink)
        * [Default `onResult`](#headless-crawler-configuration-default-onresult)
    * [Types](#headless-crawler-types)
    * [Logging](#headless-crawler-logging)
    * [FAQ](#headless-crawler-faq)
        * [What makes `headless-crawler` different from `headless-chrome-crawler`?](#headless-crawler-faq-what-makes-headless-crawler-different-from-headless-chrome-crawler)


<a name="headless-crawler-features"></a>
## Features

* Scrapes websites using user-provided `extractContent` function and follows the observed URLs as instructed by `filterLink` and `onResult`.

<a name="headless-crawler-usage"></a>
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

<a name="headless-crawler-configuration"></a>
## Configuration

```js
/**
 * @property browser Instance of [Puppeteer Browser](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-class-browser).
 * @property extractContent A function (as a string) [evaluted](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-pageevaluatepagefunction-args) in the context of the browser. The result of the function is used to describe the contents of the website (see `ScrapeResultType#content` property).
 * @property filterLink Identifies which URLs to follow.
 * @property onResult Invoked after content is extracted from a new page. Must return a boolean value indicating whether the crawler should advance to the next URL.
 */
type HeadlessCrawlerConfigurationType = {|
  +browser: PuppeteerBrowserType,
  +extractContent?: string,
  +filterLink?: (link: SiteLinkType) => boolean,
  +onResult?: (scrapeResult: ScrapeResultType) => MaybePromiseType<boolean>
|};

```

<a name="headless-crawler-configuration-default-extractcontent"></a>
### Default <code>extractContent</code>

The default `extractContent` function extracts page title.

```js
() => {
  return {
    title: document.title
  };
};

```

<a name="headless-crawler-configuration-default-filterlink"></a>
### Default <code>filterLink</code>

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

<a name="headless-crawler-configuration-default-onresult"></a>
### Default <code>onResult</code>

The default `onResult` logs the result and advances crawler to the next URL.

```js
(scrapeResult) => {
  log.debug({
    scrapeResult
  }, 'new result');

  return true;
};

```

<a name="headless-crawler-types"></a>
## Types

This package is using [Flow](https://flow.org/) type annotations.

Refer to [`./src/types.js`](./src/types.js) for method parameter and result types.

<a name="headless-crawler-logging"></a>
## Logging

This package is using [`roarr`](https://www.npmjs.com/package/roarr) logger to log the program's state.

Export `ROARR_LOG=true` environment variable to enable log printing to stdout.

Use [`roarr-cli`](https://github.com/gajus/roarr-cli) program to pretty-print the logs.

<a name="headless-crawler-faq"></a>
## FAQ

<a name="headless-crawler-faq-what-makes-headless-crawler-different-from-headless-chrome-crawler"></a>
### What makes <code>headless-crawler</code> different from <code>headless-chrome-crawler</code>?

[`headless-chrome-crawler`](https://github.com/yujiosaka/headless-chrome-crawler) is the only other maintained headless crawler in the Node.js ecosystem.

It appears that `headless-chrome-crawler` is no longer maintained. At the time of this writing, the author of `headless-chrome-crawler` has not made public contributions in over 6 months and the package includes bugs as a result of [hardcoded dependency versions](https://github.com/yujiosaka/headless-chrome-crawler/blob/ad95c2c4b356c8fdc60d16f8b013cc9a043a9bc6/package.json#L28-L34).

`headless-crawler` implements core features of `headless-chrome-crawler`.
