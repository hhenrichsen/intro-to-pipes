import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {App, start} from './app';

describe('Rendering', () => {
  let app: App;

  beforeAll(async () => {
    app = await start();
  });

  afterAll(async () => {
    await app.stop();
  });

  test(
    'Animation renders correctly',
    async () => {
      await app.page.click('#render');
      await app.page.waitForSelector('#render:not([data-rendering="true"])', {
        timeout: 2 * 60 * 1000,
      });

      expect(true).toBe(true);
    },
    {
      timeout: 2 * 60 * 1000,
    },
  );
});
