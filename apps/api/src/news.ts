import { SaxesParser } from 'saxes';

export type NewsCategory = 'crypto' | 'stock' | 'commodity';

export interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  category: NewsCategory;
  source: string;
}

interface Feed {
  category: NewsCategory;
  source: string;
  url: string;
  host: string;
  refreshMs: number;
}

const feeds: readonly Feed[] = [
  { category: 'crypto', source: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', host: 'coindesk.com', refreshMs: 5 * 60_000 },
  { category: 'stock', source: 'Nasdaq Trader', url: 'https://www.nasdaqtrader.com/rss.aspx?categorylist=2%2C6%2C7&feed=currentheadlines', host: 'nasdaqtrader.com', refreshMs: 60_000 },
  { category: 'commodity', source: 'EIA', url: 'https://www.eia.gov/rss/todayinenergy.xml', host: 'eia.gov', refreshMs: 15 * 60_000 },
];

function validArticle(item: Partial<NewsItem>, feed: Omit<Feed, 'refreshMs'>): NewsItem | null {
  const title = item.title?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 300);
  const published = item.publishedAt ? new Date(item.publishedAt) : null;
  if (!title || !published || Number.isNaN(published.getTime()) || !item.url) return null;
  let url: URL;
  try { url = new URL(item.url.trim()); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol) || (url.hostname !== feed.host && !url.hostname.endsWith(`.${feed.host}`))) return null;
  url.protocol = 'https:';
  return { title, url: url.toString(), publishedAt: published.toISOString(), category: feed.category, source: feed.source };
}

export function parseRss(xml: string, feed: Omit<Feed, 'refreshMs'>): NewsItem[] {
  const parser = new SaxesParser();
  const result: NewsItem[] = [];
  let item: Partial<NewsItem> | null = null;
  let field = '';
  let value = '';
  parser.on('opentag', (tag) => {
    const name = tag.name.toLowerCase();
    if (name === 'item') item = {};
    if (item && ['title', 'link', 'pubdate', 'dc:date'].includes(name)) {
      field = name;
      value = '';
    }
  });
  parser.on('text', (part) => { if (field) value += part; });
  parser.on('cdata', (part) => { if (field) value += part; });
  parser.on('closetag', (tag) => {
    const name = tag.name.toLowerCase();
    if (item && name === field) {
      if (name === 'title') item.title = value;
      if (name === 'link') item.url = value;
      if (name === 'pubdate' || name === 'dc:date') item.publishedAt = value;
      field = '';
      value = '';
    }
    if (name === 'item' && item) {
      const article = validArticle(item, feed);
      if (article) result.push(article);
      item = null;
    }
  });
  parser.write(xml).close();
  return result;
}

export interface NewsResponse {
  items: NewsItem[];
  updatedAt: string | null;
  stale: boolean;
  unavailableSources: string[];
}

export function createNewsService({ fetcher = fetch, now = () => new Date() }: {
  fetcher?: typeof fetch;
  now?: () => Date;
} = {}) {
  const feedCache = new Map<string, { items: NewsItem[]; nextRefreshAt: number; unavailable: boolean }>();
  let cached: NewsResponse | null = null;
  let inFlight: Promise<NewsResponse> | null = null;

  async function refresh(): Promise<NewsResponse> {
    const current = now();
    let anySuccess = false;
    const settled = await Promise.all(feeds.map(async (feed) => {
      const previous = feedCache.get(feed.source);
      if (previous && current.getTime() < previous.nextRefreshAt) return previous;
      try {
        const response = await fetcher(feed.url, {
          headers: { accept: 'application/rss+xml, application/xml, text/xml' },
          signal: AbortSignal.timeout(7_000),
        });
        if (!response.ok) throw new Error(`RSS HTTP ${response.status}`);
        const xml = new TextDecoder(feed.source === 'EIA' ? 'iso-8859-1' : 'utf-8').decode(await response.arrayBuffer());
        if (xml.length > 1_000_000) throw new Error('RSS too large');
        const snapshot = { items: parseRss(xml, feed), nextRefreshAt: current.getTime() + feed.refreshMs, unavailable: false };
        feedCache.set(feed.source, snapshot);
        anySuccess = true;
        return snapshot;
      } catch {
        const snapshot = { items: previous?.items ?? [], nextRefreshAt: current.getTime() + 60_000, unavailable: true };
        feedCache.set(feed.source, snapshot);
        return snapshot;
      }
    }));

    const unavailableSources = settled.flatMap((entry, index) => entry.unavailable ? [feeds[index]!.source] : []);
    const items = settled.flatMap((entry) => entry.items);
    const seen = new Set<string>();
    const valid = items
      .filter((item) => new Date(item.publishedAt).getTime() <= current.getTime() + 5 * 60_000)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });
    cached = {
      items: valid,
      updatedAt: anySuccess ? current.toISOString() : cached?.updatedAt ?? null,
      stale: unavailableSources.length > 0,
      unavailableSources,
    };
    return cached;
  }

  return {
    getNews(): Promise<NewsResponse> {
      if (cached && feeds.every((feed) => (feedCache.get(feed.source)?.nextRefreshAt ?? 0) > now().getTime())) return Promise.resolve(cached);
      if (!inFlight) inFlight = refresh().finally(() => { inFlight = null; });
      return inFlight;
    },
  };
}
