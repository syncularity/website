import { expect, test } from '@playwright/test';

const hqEntry = 'https://www.syncularity.io/hq';

test('production landing loads its assets and supports keyboard pause and resume', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Syncularity' })).toBeVisible();
  await expect(page).toHaveTitle('Syncularity');
  for (const image of await page.locator('img').all()) {
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  }

  const canvas = page.locator('canvas');
  const pixels = () => canvas.evaluate(async (element: HTMLCanvasElement) => {
    const bytes = element.getContext('2d')!.getImageData(0, 0, element.width, element.height).data;
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  });
  const initial = await pixels();
  await expect.poll(pixels).not.toBe(initial);
  const pause = page.getByRole('button', { name: 'Pause motion' });
  await page.keyboard.press('Tab'); // Home link.
  await page.keyboard.press('Tab');
  await expect(pause).toBeFocused();
  await page.keyboard.press('Enter');
  const play = page.getByRole('button', { name: 'Play motion' });
  await expect(play).toHaveAttribute('aria-pressed', 'true');
  const stopped = await pixels();
  // A bounded negative observation catches a label-only pause that still draws.
  await page.waitForTimeout(250);
  expect(await pixels()).toBe(stopped);
  await page.keyboard.press('Space');
  await expect(pause).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(pixels).not.toBe(stopped);
  await page.keyboard.press('Tab');
  const backstage = page.getByRole('link', { name: 'Go backstage' });
  await expect(backstage).toBeFocused();
  await expect(backstage).toHaveAttribute('href', hqEntry);

  const share = page.locator('meta[property="og:image"]');
  const shareUrl = await share.getAttribute('content');
  expect(shareUrl).toMatch(/^https:\/\/www\.syncularity\.io\//);
  const response = await page.request.get(new URL(shareUrl!).pathname);
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('image/png');
  const png = await response.body();
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  expect(errors).toEqual([]);
});

test('mobile landing stays readable with artwork and HQ entry when JavaScript is disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:3107/');
    await expect(page.getByRole('heading', { level: 1, name: 'Syncularity' })).toBeVisible();
    const still = page.locator('.art-still');
    await expect(still).toBeVisible();
    await expect.poll(() => still.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
    await expect(page.getByRole('button', { name: /motion/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Go backstage' })).toHaveAttribute('href', hqEntry);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    await context.close();
  }
});
