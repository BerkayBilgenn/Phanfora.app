'use client';

import { useState } from 'react';
import type { NewsCategory } from '../lib/api';
import { useNews } from '../lib/use-news';
import { Icon } from './cockpit-icons';
import { AssetLogo, assetLogoUrl, headlineAssetSymbol } from './asset-logo';

const categories: { value: NewsCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'stock', label: 'Hisse' },
  { value: 'crypto', label: 'Kripto' },
  { value: 'commodity', label: 'Emtia' },
];

const categoryNames: Record<NewsCategory, string> = {
  stock: 'Hisse', crypto: 'Kripto', commodity: 'Emtia',
};

function publishedTime(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  }).format(new Date(value));
}

function sourceMark(source: string) {
  if (source === 'CoinDesk') return 'CD';
  if (source === 'Nasdaq Trader') return 'NQ';
  if (source === 'EIA') return 'EIA';
  return source.trim().split(/\s+/).map((word) => word[0]).join('').slice(0, 3).toUpperCase();
}

export function NewsPanel() {
  const [category, setCategory] = useState<NewsCategory | 'all'>('all');
  const news = useNews();
  const visible = news.items.filter((item) => category === 'all' || item.category === category);
  const status = news.error || news.stale
    ? 'Kaynak gecikmesi'
    : news.loading && !news.updatedAt
      ? 'Yükleniyor'
      : news.updatedAt
        ? `Güncellendi ${publishedTime(news.updatedAt)}`
        : 'Haber bekleniyor';

  return (
    <section className="ph-panel ph-news-panel" aria-label="Piyasa haberleri">
      <div className="ph-panel-header">
        <h2><i />Güncel haberler</h2>
        <span className={news.error || news.stale ? 'is-delayed' : ''}>{status}</span>
      </div>
      <div className="ph-filter-tabs" aria-label="Haber kategorisi">
        {categories.map((entry) => (
          <button
            key={entry.value}
            type="button"
            className={category === entry.value ? 'is-active' : ''}
            aria-pressed={category === entry.value}
            onClick={() => setCategory(entry.value)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      {!!visible.length && <p className="ph-news-count" role="status">{visible.length} haber · Kaydırarak tüm başlıkları gör</p>}
      {visible.length ? (
        <div className="ph-news-list" role="region" aria-label="Haber akışı" tabIndex={0}>
          {visible.map((item) => {
            const symbol = headlineAssetSymbol(item.title, item.category);
            return (
              <article className="ph-news-item" key={item.url}>
                <span className={`ph-news-mark ${symbol && assetLogoUrl(symbol, item.category) ? 'has-asset-logo' : ''}`} aria-hidden="true">
                  {symbol ? <AssetLogo symbol={symbol} assetClass={item.category} size={34} /> : sourceMark(item.source)}
                </span>
                <div className="ph-news-content">
                  <div className="ph-news-meta">
                    <span>{categoryNames[item.category]}</span>
                    <span>{item.source}</span>
                    <time dateTime={item.publishedAt}>{publishedTime(item.publishedAt)}</time>
                  </div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.title}<span aria-hidden="true"> ↗</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="ph-news-empty" role="status">
          <Icon name="file" size={22} />
          <strong>{news.loading ? 'Haberler yükleniyor' : news.error || news.stale ? 'Haberler alınamadı' : 'Bu kategoride güncel haber yok'}</strong>
          <p>{news.error || (news.stale ? 'Haber kaynaklarına şu anda ulaşılamıyor.' : news.loading ? 'Kaynaklardan yeni başlıklar alınıyor.' : 'Kaynakta yeni haber yayımlandığında burada görünecek.')}</p>
        </div>
      )}
      {(news.stale || news.error) && visible.length > 0 && (
        <p className="ph-news-note">Bazı kaynaklara erişilemiyor. Son alınan başlıklar gösteriliyor.</p>
      )}
    </section>
  );
}
