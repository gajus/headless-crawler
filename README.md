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
        * [Default `headlessCrawlerConfiguration.extractContent`](#headless-crawler-configuration-default-headlesscrawlerconfiguration-extractcontent)
        * [Default `headlessCrawlerConfiguration.filterLink`](#headless-crawler-configuration-default-headlesscrawlerconfiguration-filterlink)
        * [Default `headlessCrawlerConfiguration.onResult`](#headless-crawler-configuration-default-headlesscrawlerconfiguration-onresult)
        * [Default `headlessCrawlerConfiguration.waitFor`](#headless-crawler-configuration-default-headlesscrawlerconfiguration-waitfor)
    * [Create default handlers](#headless-crawler-create-default-handlers)
    * [Recipes](#headless-crawler-recipes)
        * [Inject jQuery](#headless-crawler-recipes-inject-jquery)
        * [Configure request parameters](#headless-crawler-recipes-configure-request-parameters)
        * [Capture a screenshot](#headless-crawler-recipes-capture-a-screenshot)
        * [Configure a proxy](#headless-crawler-recipes-configure-a-proxy)
    * [Types](#headless-crawler-types)
    * [Logging](#headless-crawler-logging)
    * [FAQ](#headless-crawler-faq)
        * [What makes `headless-crawler` different from `headless-chrome-crawler`?](#headless-crawler-faq-what-makes-headless-crawler-different-from-headless-chrome-crawler)


<a name="headless-crawler-features"></a>
## Features

* Scrapes websites using user-provided `extractContent` function and follows the observed URLs as instructed by `filterLink` and `onResult`.
* Respects [robots.txt](https://en.wikipedia.org/wiki/Robots_exclusion_standard) (configurable) (see [Default `headlessCrawlerConfiguration.filterLink`](#headless-crawler-configuration-default-headlesscrawlerconfiguration-filterlink)).

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
 * @property extractContent Creates a function that is [evaluted](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-pageevaluatepagefunction-args) in the context of the browser. The result of the evaluated function describes the contents of the website (see `ScrapeResultType#content` property).
 * @property filterLink Identifies which URLs to follow.
 * @property onPage Invoked when [Puppeteer Page](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-class-page) instance is instantiated.
 * @property onResult Invoked after content is extracted from a new page. Must return a boolean value indicating whether the crawler should advance to the next URL.
 * @property waitFor Invoked before links are aggregated from the website and before `extractContent`.
 */
type HeadlessCrawlerUserConfigurationType = {|
  +browser: PuppeteerBrowserType,
  +extractContent?: ExtractContentHandlerType,
  +filterLink?: FilterLinkHandlerType,
  +onPage?: PageHandlerType,
  +onResult?: ResultHandlerType,
  +waitFor?: WaitForHandlerType
|};

```

<a name="headless-crawler-configuration-default-headlesscrawlerconfiguration-extractcontent"></a>
### Default <code>headlessCrawlerConfiguration.extractContent</code>

The default `extractContent` function extracts page title.

```js
(): ExtractContentHandlerType => {
  return `(() => {
    return {
      title: document.title
    };
  })();`;
};

```

<a name="headless-crawler-configuration-default-headlesscrawlerconfiguration-filterlink"></a>
### Default <code>headlessCrawlerConfiguration.filterLink</code>

The default `filterLink` function includes all URLs allowed by robots.txt and does not visit previously scraped URLs.

```js
(): FilterLinkHandlerType => {
  const robotsAgent = createRobotsAgent();

  return async (link, scrapedLinkHistory) => {
    if (robotsAgent.isRobotsAvailable(link.linkUrl) && !robotsAgent.isAllowed(link.linkUrl)) {
      return false;
    }

    for (const scrapedLink of scrapedLinkHistory) {
      if (scrapedLink.linkUrl === link.linkUrl) {
        return false;
      }
    }

    return true;
  };
};

```

Note: robots.txt support is implemented using [`robots-agent`](https://github.com/gajus/robots-agent).

<a name="headless-crawler-configuration-default-headlesscrawlerconfiguration-onresult"></a>
### Default <code>headlessCrawlerConfiguration.onResult</code>

The default `onResult` logs the result and advances crawler to the next URL.

```js
(): ResultHandlerType => {
  return (scrapeResult) => {
    log.debug({
      scrapeResult
    }, 'new result');

    return true;
  };
};

```

<a name="headless-crawler-configuration-default-headlesscrawlerconfiguration-waitfor"></a>
### Default <code>headlessCrawlerConfiguration.waitFor</code>

```js
(): WaitForHandlerType => {
  return (page) => {
    return page.waitForNavigation({
      waitUntil: 'networkidle2'
    });
  };
};

```

<a name="headless-crawler-create-default-handlers"></a>
## Create default handlers

You can import factory functions to create default handlers:

```js
import {
  createDefaultExtractContentHandler,
  createDefaultFilterLinkHandler,
  createDefaultResultHandler,
  createDefaultWaitForHandler
} from 'headless-crawler';

```

This is useful for extending the default handlers, e.g.

```js
const defaultFilterHandler = createDefaultFilterLinkHandler();

const myCustomFilterLinkHandler = (link, scrapedLinkHistory) => {
  if (link.linkUrl.startsWith('https://google.com/')) {
    return false;
  }

  return defaultFilterHandler(link, scrapedLinkHistory);
};

```

<a name="headless-crawler-recipes"></a>
## Recipes

<a name="headless-crawler-recipes-inject-jquery"></a>
### Inject jQuery

Use `extractContent` to manipulate the Puppeteer Page object after it has been determined to be ready and create the function used to extract content from the website.

```js
const main = async () => {
  const browser = await puppeteer.launch();

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
};

main();

```

<a name="headless-crawler-recipes-configure-request-parameters"></a>
### Configure request parameters

Request parameters (such as geolocation, user-agent and viewport) can be configured using `onPage` handler, e.g.

```js
const main = async () => {
  const browser = await puppeteer.launch();

  const onPage = async (page, scrapeConfiguration) => {
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

<a name="headless-crawler-recipes-capture-a-screenshot"></a>
### Capture a screenshot

The `extractContent` method can capture the screenshot of the website as it was at the time just before the content-extraction function is executed, e.g.

```js
const extractContent = async (page) => {
  await page.screenshot({
    fullPage: true,
    path: 'screenshot.png'
  });

  return `(() => {
    return {
      title: document.title
    };
  })()`;
};

```

Refer to Puppeteer [`page#screenshot`](https://pptr.dev/#?product=Puppeteer&version=v1.11.0&show=api-pagescreenshotoptions) documentation for other properties.

<a name="headless-crawler-recipes-configure-a-proxy"></a>
### Configure a proxy

Note: These instructions are not specific `headless-crawler`; these are generic instructions for instructing Puppeteer to use HTTP proxy.

You must:

1. Configure `ignoreHTTPSErrors`
2. Configure `--proxy-server`

Example:

```js
import puppeteer from 'puppeteer';
import {
  createHeadlessCrawler
} from 'headless-crawler';

const main = async () => {
  const browser = puppeteer.launch({
    args: [
      '--proxy-server=http://127.0.0.1:8080'
    ],
    ignoreHTTPSErrors: true
  });

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

[`headless-chrome-crawler`](https://github.com/yujiosaka/headless-chrome-crawler) is the only other headless crawler in the Node.js ecosystem.

It appears that `headless-chrome-crawler` is no longer maintained. At the time of this writing, the author of `headless-chrome-crawler` has not made public contributions in over 6 months and the package includes bugs as a result of [hardcoded dependency versions](https://github.com/yujiosaka/headless-chrome-crawler/blob/ad95c2c4b356c8fdc60d16f8b013cc9a043a9bc6/package.json#L28-L34).

Maintenance issues aside, the `headless-chrome-crawler` is a feature-rich and configuration-driven framework. Meanwhile, `headless-crawler` provides a bare-bones framework for navigating the website and extracting the content. The consumer of the framework can extend the functionality using the provided handlers and directly consuming the Puppeteer API (e.g. see [Capture a screenshot](#headless-crawler-recipes-capture-a-screenshots)).
