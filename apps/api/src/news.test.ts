import { describe, expect, it, vi } from 'vitest';

import { createNewsService, parseRss } from './news';

const xml = (title: string, link: string, date = 'Thu, 01 Oct 2026 08:00:00 GMT') => `
  <rss version="2.0"><channel><item>
    <title><![CDATA[${title}]]></title>
    <link>${link.replaceAll('&', '&amp;')}</link>
    <pubDate>${date}</pubDate>
  </item></channel></rss>`;

describe('RSS news', () => {
  it('parses headlines and rejects links outside the publisher domain', () => {
    const feed = `<rss><channel>
      <item><title>Oil &amp; gas</title><link>https://www.eia.gov/todayinenergy/detail.php?id=1</link><pubDate>Thu, 01 Oct 2026 08:00:00 GMT</pubDate></item>
      <item><title>Bad link</title><link>https://example.com/story</link><pubDate>Thu, 01 Oct 2026 08:00:00 GMT</pubDate></item>
      <item><title>Nasdaq link</title><link>http://www.eia.gov/todayinenergy/detail.php?id=2</link><pubDate>Thu, 01 Oct 2026 07:00:00 GMT</pubDate></item>
    </channel></rss>`;
    expect(parseRss(feed, { category: 'commodity', source: 'EIA', url: 'https://www.eia.gov/rss/todayinenergy.xml', host: 'eia.gov' })).toEqual([
      { title: 'Oil & gas', url: 'https://www.eia.gov/todayinenergy/detail.php?id=1', publishedAt: '2026-10-01T08:00:00.000Z', category: 'commodity', source: 'EIA' },
      { title: 'Nasdaq link', url: 'https://www.eia.gov/todayinenergy/detail.php?id=2', publishedAt: '2026-10-01T07:00:00.000Z', category: 'commodity', source: 'EIA' },
    ]);
  });

  it('combines successful feeds, preserves their dates, and caches requests', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.includes('coindesk')) return new Response(xml('Crypto story', 'https://www.coindesk.com/story/1'));
      if (url.includes('nasdaqtrader')) return new Response(xml('Equity story', 'https://www.nasdaqtrader.com/trader.aspx?id=1', 'Thu, 01 Oct 2026 09:00:00 GMT'));
      return new Response(xml('Energy story', 'https://www.eia.gov/todayinenergy/detail.php?id=1', 'Thu, 01 Oct 2026 07:00:00 GMT'));
    });
    const service = createNewsService({ fetcher: fetcher as typeof fetch, now: () => new Date('2026-10-01T10:00:00Z') });
    const first = await service.getNews();
    expect(first.items.map((item) => item.category)).toEqual(['stock', 'crypto', 'commodity']);
    expect(first.updatedAt).toBe('2026-10-01T10:00:00.000Z');
    expect(first.unavailableSources).toEqual([]);
    expect((await service.getNews()).items).toEqual(first.items);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('keeps a recent successful snapshot when sources temporarily fail', async () => {
    let current = new Date('2026-10-01T10:00:00Z');
    let online = true;
    const fetcher = vi.fn(async (url: string) => {
      if (!online) throw new Error('offline');
      const host = new URL(url).hostname;
      return new Response(xml('A real headline', `https://${host}/story`));
    });
    const service = createNewsService({ fetcher: fetcher as typeof fetch, now: () => current });
    const first = await service.getNews();
    online = false;
    current = new Date('2026-10-01T10:16:00Z');
    const stale = await service.getNews();
    expect(stale.items).toEqual(first.items);
    expect(stale.stale).toBe(true);
    expect(stale.updatedAt).toBe(first.updatedAt);
    expect(stale.unavailableSources).toHaveLength(3);
  });

  it('returns every headline supplied by the feeds', async () => {
    const manyCrypto = `<rss><channel>${Array.from({ length: 20 }, (_, index) => `
      <item><title>Crypto ${index}</title><link>https://www.coindesk.com/story/${index}</link><pubDate>Thu, 01 Oct 2026 09:00:00 GMT</pubDate></item>
    `).join('')}</channel></rss>`;
    const fetcher = vi.fn(async (url: string) => new Response(url.includes('coindesk')
      ? manyCrypto
      : url.includes('nasdaqtrader')
        ? xml('Equity story', 'http://www.nasdaqtrader.com/story')
        : xml('Energy story', 'https://www.eia.gov/story')));
    const result = await createNewsService({ fetcher: fetcher as typeof fetch, now: () => new Date('2026-10-01T10:00:00Z') }).getNews();
    expect(result.items.filter((item) => item.category === 'crypto')).toHaveLength(20);
    expect(result.items.map((item) => item.category)).toContain('stock');
    expect(result.items.map((item) => item.category)).toContain('commodity');
  });

  it('checks fast feeds again after one minute without polling slower feeds early', async () => {
    let current = new Date('2026-10-01T10:00:00Z');
    let equityTitle = 'First equity update';
    const fetcher = vi.fn(async (url: string) => new Response(url.includes('coindesk')
      ? xml('Crypto story', 'https://www.coindesk.com/story')
      : url.includes('nasdaqtrader')
        ? xml(equityTitle, 'https://www.nasdaqtrader.com/story')
        : xml('Energy story', 'https://www.eia.gov/story')));
    const service = createNewsService({ fetcher: fetcher as typeof fetch, now: () => current });
    await service.getNews();
    current = new Date('2026-10-01T10:01:01Z');
    equityTitle = 'New equity update';
    const refreshed = await service.getNews();
    expect(refreshed.items.find((item) => item.category === 'stock')?.title).toBe('New equity update');
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(fetcher.mock.calls.filter(([url]) => url.includes('coindesk'))).toHaveLength(1);
    expect(fetcher.mock.calls.filter(([url]) => url.includes('eia.gov'))).toHaveLength(1);
  });
});
