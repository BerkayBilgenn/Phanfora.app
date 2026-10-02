import { describe, expect, it } from 'vitest';
import { TcmbDailyFxProvider } from './index';

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Tarih_Date Tarih="28.09.2026" Date="09/28/2026" Bulten_No="2026/186">
  <Currency Kod="USD" CurrencyCode="USD">
    <Unit>1</Unit>
    <Isim>ABD DOLARI</Isim>
    <ForexBuying>41.10</ForexBuying>
    <ForexSelling>41.25</ForexSelling>
  </Currency>
  <Currency Kod="EUR" CurrencyCode="EUR">
    <Unit>1</Unit>
    <Isim>EURO</Isim>
    <ForexBuying>48.00</ForexBuying>
    <ForexSelling>48.40</ForexSelling>
  </Currency>
</Tarih_Date>`;

describe('TcmbDailyFxProvider', () => {
  it('publishes official TCMB selling rates as end-of-day forex', async () => {
    const provider = new TcmbDailyFxProvider({
      fetch: async () => new Response(xml, { status: 200, headers: { 'content-type': 'text/xml' } }),
      clock: () => '2026-09-28T12:00:00.000Z',
    });
    const result = await provider.getCandidates('daily');
    const usdTry = result.find((item) => item.asset.id === 'forex:usd-try-tcmb');
    expect(usdTry).toMatchObject({
      price: { amount: '41.25', currency: 'TRY' },
      source: 'TCMB',
      dataMode: 'end-of-day',
      quality: { freshness: 'end-of-day' },
      changePercent: '0.0000',
    });
    expect(usdTry?.observedAt).toBe('2026-09-28T00:00:00.000Z');
  });
});
