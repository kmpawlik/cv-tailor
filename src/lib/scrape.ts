import { chromium } from 'playwright';

export async function scrapeUrl(url: string): Promise<string> {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1500);
    const text = await page.evaluate(() => {
      const clone = document.body.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('script,style,noscript,svg,nav,footer').forEach(n => n.remove());
      return clone.innerText.replace(/\n{3,}/g, '\n\n').trim();
    });
    return text.slice(0, 40_000);
  } finally {
    await browser.close();
  }
}
