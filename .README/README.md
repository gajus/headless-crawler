# headless-crawler 👻

[![Travis build status](http://img.shields.io/travis/gajus/headless-crawler/master.svg?style=flat-square)](https://travis-ci.org/gajus/headless-crawler)
[![Coveralls](https://img.shields.io/coveralls/gajus/headless-crawler.svg?style=flat-square)](https://coveralls.io/github/gajus/headless-crawler)
[![NPM version](http://img.shields.io/npm/v/headless-crawler.svg?style=flat-square)](https://www.npmjs.org/package/headless-crawler)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A crawler implemented using a headless browser (Chrome).

## Usage

```js
import puppeteer from 'puppeteer';
import {
  createHeadlessCrawler
} from 'headless-crawler';

const main = async () => {
  const browser = puppeteer.launch();

  const headlessCrawler = createHeadlessCrawler({
    onResult: (resource) => {
      console.log(resource.content.title);
    },
    browser
  });

  headlessCrawler.crawl('http://gajus.com/');
};

main();

```

## Configuration

```js
/**
 * @property browser Instance of [Puppeteer Browser](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-class-browser).
 * @property extractContent A function [evaluted](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-pageevaluatepagefunction-args) in the context of the browser. The result of the function is used to describe the contents of the website (see `ScrapeResultType#content` property).
 * @property filterLink Identifies which URLs to follow.
 * @property onResult Invoked after content is extracted from a new page.
 */
type HeadlessCrawlerConfigurationType<T: *> = {|
  +browser: PuppeteerBrowserType,
  +extractContent: () => ScrapeResultType<T>,
  +filterLink: (link: SiteLinkType) => boolean,
  +onResult?: (result: T) => void
|};

```

## Logging

This package is using [`roarr`](https://www.npmjs.com/package/roarr) logger to log the program's state.

Export `ROARR_LOG=true` environment variable to enable log printing to stdout.

Use [`roarr-cli`](https://github.com/gajus/roarr-cli) program to pretty-print the logs.

## FAQ

### What makes `headless-crawler` different from `headless-chrome-crawler`?

[`headless-chrome-crawler`](https://github.com/yujiosaka/headless-chrome-crawler) is the only other maintained crawler in the Node.js ecosystem that is using a headless browser to crawl websites.

It appears that `headless-chrome-crawler` is no longer maintained. At the time of this writing, author of `headless-chrome-crawler` has not made public contributions in over 6 months and the package includes bugs as a result of [hardcoded dependency versions](https://github.com/yujiosaka/headless-chrome-crawler/blob/ad95c2c4b356c8fdc60d16f8b013cc9a043a9bc6/package.json#L28-L34).

`headless-crawler` implements core features of `headless-chrome-crawler`.
