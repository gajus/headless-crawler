// @flow

import express from 'express';

type HttpServerType = {|
  +close: () => void,
  +port: number
|};

export default (): Promise<HttpServerType> => {
  const app = express();

  app.get('/scrape/single-page-with-no-links', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>single-page-with-no-links</title>
        </head>
      </html>
    `);
  });

  app.get('/scrape/single-page-with-links', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>single-page-with-links</title>
        </head>
        <body>
          <a href='/scrape/single-page-with-links/a'>a</a>
          <a href='/scrape/single-page-with-links/b'>b</a>
        </body>
      </html>
    `);
  });

  app.get('/scrape/single-page-with-duplicate-links', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>single-page-with-duplicate-links</title>
        </head>
        <body>
          <a href='/scrape/single-page-with-duplicate-links/a'>a</a>
          <a href='/scrape/single-page-with-duplicate-links/a'>a</a>
        </body>
      </html>
    `);
  });

  app.get('/scrape/title-user-agent', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>${req.get('user-agent')}</title>
        </head>
      </html>
    `);
  });

  app.get('/crawl/single-page-with-links', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>single-page-with-links</title>
        </head>
        <body>
          <a href='/crawl/single-page-with-links/a'>a</a>
          <a href='/crawl/single-page-with-links/b'>b</a>
          <a href='/crawl/single-page-with-links/c'>c</a>
        </body>
      </html>
    `);
  });

  app.get('/crawl/single-page-with-links/a', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>single-page-with-links/a</title>
        </head>
        <body>
        </body>
      </html>
    `);
  });

  app.get('/crawl/single-page-with-links/b', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>single-page-with-links/b</title>
        </head>
        <body>
        </body>
      </html>
    `);
  });

  app.get('/crawl/single-page-with-links/c', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>single-page-with-links/c</title>
        </head>
        <body>
        </body>
      </html>
    `);
  });

  return new Promise((resolve, reject) => {
    const server = app.listen((error) => {
      if (error) {
        reject(error);
      } else {
        resolve({
          close: () => {
            server.close();
          },
          port: server.address().port
        });
      }
    });
  });
};
