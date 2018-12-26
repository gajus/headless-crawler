// @flow

import puppeteer from 'puppeteer';

export default async () => {
  const browser = puppeteer.launch({
    args: [
      '--disable-dev-shm-usage'
    ]
  });

  return browser;
};
