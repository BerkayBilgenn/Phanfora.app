'use client';

import type { MarketCandidate } from '@phanfora/domain';
import { tapeHeadline, tapeLayout, tapeQuotes, type TapeQuote } from '../lib/explore-tape';
import type { MarketTab } from '../lib/market-tabs';

function Cell({ quote }: { quote: TapeQuote }) {
  return (
    <span className={`explore-tape-cell ${quote.up ? 'is-up' : 'is-down'}`}>
      <strong>{quote.symbol}</strong>
      <em>{quote.price}</em>
      <small>{quote.change}</small>
    </span>
  );
}

export function ExploreTape({ tab, items }: { tab: MarketTab; items: readonly MarketCandidate[] }) {
  const layout = tapeLayout(tab);
  const quotes = tapeQuotes(items);
  const bids = quotes.filter((_, index) => index % 2 === 0);
  const asks = quotes.filter((_, index) => index % 2 === 1);

  return (
    <div className="explore-tape" data-layout={layout} aria-hidden="true">
      <p className="explore-tape-head">{tapeHeadline(tab)}</p>
      {!quotes.length && <p className="explore-tape-empty">Bu kanalda kotasyon yok</p>}
      {quotes.length > 0 && layout === 'tape' && (
        <div className="explore-tape-rail">
          <div className="explore-tape-track">
            {[...quotes, ...quotes].map((quote, index) => <Cell quote={quote} key={`${quote.symbol}-${index}`} />)}
          </div>
        </div>
      )}
      {quotes.length > 0 && layout === 'book' && (
        <div className="explore-tape-book">
          <div>
            <span>BID</span>
            {bids.map((quote) => <Cell quote={quote} key={`b-${quote.symbol}`} />)}
          </div>
          <div>
            <span>ASK</span>
            {asks.map((quote) => <Cell quote={quote} key={`a-${quote.symbol}`} />)}
          </div>
        </div>
      )}
      {quotes.length > 0 && layout === 'board' && (
        <div className="explore-tape-board">
          {quotes.map((quote) => <Cell quote={quote} key={quote.symbol} />)}
        </div>
      )}
    </div>
  );
}
