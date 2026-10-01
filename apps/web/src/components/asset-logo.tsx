"use client";

import Image from 'next/image';
import { useState } from 'react';
import type { AssetClass } from '@phanfora/domain';
import type { NewsCategory } from '../lib/api';

const logos: Record<string, string> = {
  BTC: '/asset-logos/btc.svg',
  ETH: '/asset-logos/eth.svg',
  SOL: '/asset-logos/sol.svg',
  XRP: '/asset-logos/xrp.svg',
  ADA: '/asset-logos/ada.svg',
};

export function assetLogoUrl(symbol: string, assetClass?: AssetClass) {
  const normalized = symbol.toUpperCase();
  if (logos[normalized]) return logos[normalized];
  if (assetClass === 'crypto' && /^[A-Z0-9]{2,12}$/.test(normalized)) {
    return `https://assets.kraken.com/marketing/web/icons-uni-webp/s_${normalized.toLowerCase()}.webp`;
  }
  return null;
}

function fallback(symbol: string) {
  if (symbol === 'XAU') return 'Au';
  if (symbol === 'EUR/USD') return '€';
  if (symbol === 'SPX') return '500';
  return symbol.slice(0, 4);
}

function LogoImage({ symbol, url, size }: { symbol: string; url: string; size: number }) {
  const [failed, setFailed] = useState(false);
  return failed
    ? <span className="ph-asset-logo-fallback">{fallback(symbol)}</span>
    : <Image src={url} width={size} height={size} alt="" unoptimized className="ph-asset-logo-image" onError={() => setFailed(true)} />;
}

export function AssetLogo({ symbol, size = 32, assetClass }: { symbol: string; size?: number; assetClass?: AssetClass | undefined }) {
  const url = assetLogoUrl(symbol, assetClass);
  if (!url) return <span className="ph-asset-logo-fallback">{fallback(symbol)}</span>;
  if (url.startsWith('/')) return <Image src={url} width={size} height={size} alt="" unoptimized className="ph-asset-logo-image" />;
  return <LogoImage key={url} symbol={symbol} url={url} size={size} />;
}

export function AssetLogoBadge({ symbol, size, className, assetClass }: { symbol: string; size: number; className: string; assetClass?: AssetClass | undefined }) {
  return (
    <span className={`${className} ${assetLogoUrl(symbol, assetClass) ? 'has-logo' : ''}`} aria-hidden="true">
      <AssetLogo symbol={symbol} size={size} assetClass={assetClass} />
    </span>
  );
}

const headlineAssets = [
  { symbol: 'BTC', category: 'crypto', pattern: /\b(?:bitcoin|btc)\b/i },
  { symbol: 'ETH', category: 'crypto', pattern: /\b(?:ethereum|ether|eth)\b/i },
  { symbol: 'SOL', category: 'crypto', pattern: /\b(?:solana|sol)\b/i },
  { symbol: 'XRP', category: 'crypto', pattern: /\b(?:xrp|ripple)\b/i },
  { symbol: 'ADA', category: 'crypto', pattern: /\b(?:cardano|ada)\b/i },
  { symbol: 'AAPL', category: 'stock', pattern: /\b(?:apple|aapl)\b/i },
  { symbol: 'MSFT', category: 'stock', pattern: /\b(?:microsoft|msft)\b/i },
  { symbol: 'XAU', category: 'commodity', pattern: /\b(?:gold|xau)\b/i },
];

export function headlineAssetSymbol(title: string, category: NewsCategory): string | null {
  const matches = headlineAssets
    .filter((asset) => asset.category === category)
    .map(({ symbol, pattern }) => ({ symbol, index: title.search(pattern) }))
    .filter(({ index }) => index >= 0)
    .sort((a, b) => a.index - b.index);
  return matches[0]?.symbol ?? null;
}
