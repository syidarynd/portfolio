import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const pageErrors = [];

page.on('pageerror', error => pageErrors.push(error.message));

try {
  const response = await page.goto('http://127.0.0.1:4173/', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  assert.ok(response && response.ok(), 'Portfolio page should return HTTP 200');
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 10000 });
  assert.match(await page.title(), /Said Ariyandi/i, 'Document title should identify the portfolio');

  const widths = [320, 360, 390, 768, 1024, 1440];
  const layoutResults = [];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    const metrics = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth
    }));
    layoutResults.push(metrics);
    assert.ok(
      metrics.document <= metrics.viewport + 1 && metrics.body <= metrics.viewport + 1,
      `Horizontal overflow at viewport ${width}px: ${JSON.stringify(metrics)}`
    );
  }

  assert.equal(pageErrors.length, 0, `Browser runtime errors: ${pageErrors.join(' | ')}`);
  console.log(JSON.stringify({
    status: 'PASS',
    title: await page.title(),
    viewportWidths: layoutResults,
    runtimeErrors: pageErrors.length
  }, null, 2));
} finally {
  await browser.close();
}
