# Phanfora App

Phanfora, kullanıcının tutar, vade ve risk tercihini alıp küresel varlık sınıflarını açıklanabilir bir metodolojiyle karşılaştıran finansal karar destek uygulamasıdır.

Bu repo `app.phanfora.com` uygulamasını içerir. Tanıtım sitesi `phanfora.com` ayrı repo ve dağıtım olarak kalır.

## Şu anda çalışan kapsam

- Referans mockup’a göre kurulmuş piyasa kontrol merkezi; fiyat ve OHLCV grafiği API cevabından gelir.
- Piyasalar, Radar, Analizler, Portföy, Takip Listesi, Alarmlar, Raporlar ve Ayarlar sayfaları çalışır.
- Takip listesi, pozisyonlar, fiyat eşikleri, analiz geçmişi ve tercihler tarayıcının yerel depolamasında tutulur.
- Alarmlar yalnız ilgili sayfa açıkken ve fiyat yenilendiğinde değerlendirilir; sunucu tarafı bildirim sistemi henüz yoktur.
- Portföy CSV ve kişisel kayıtlar JSON olarak indirilebilir.
- Analiz, tutar/para birimi/vade/risk profiliyle bir ana fırsat ve iki alternatif döndürür; kaynak ve gözlem zamanı gösterilir.

## Piyasa verisi

`TWELVE_DATA_API_KEY` sunucu ortamında varsa hisse, kripto, emtia ve döviz için Twelve Data kullanılır. Anahtar yoksa Kraken'in açık spot OHLC uç noktasıyla BTC, ETH, SOL, XRP ve ADA fiyatları; döviz dönüşümlerinde Frankfurter'ın günlük kurları kullanılır. Anahtarsız mod hisse, endeks veya emtia verisi sunmaz. Ekran, mevcut veri kaynağını ve gözlem zamanını belirtir; sağlayıcı erişilemezse fiyat oluşturmaz.

```bash
TWELVE_DATA_API_KEY=... pnpm dev
```

Geliştirme ortamındaki `pnpm dev:e2e` komutu test amacıyla `PHANFORA_E2E_FIXTURE=1` kullanır. Bu deterministik değerler normal `pnpm dev` veya üretim ekranında gösterilmez.

Kişisel kayıtlar bu tarayıcıya özeldir; hesaplar arası senkronizasyon veya yedekleme yoktur. İstersen kayıtları Raporlar bölümünden JSON olarak indirebilirsin.

## Gereksinimler

- Node.js 24 LTS
- pnpm 9.15 veya üzeri

## Yerelde çalıştırma

```bash
pnpm install
pnpm dev
```

Ardından:

- Uygulama: [http://127.0.0.1:3300](http://127.0.0.1:3300)
- API sağlık kontrolü: [http://127.0.0.1:4300/health](http://127.0.0.1:4300/health)

Bu bilgisayarda `3000` portu başka bir yerel uygulama tarafından kullanıldığı için Phanfora varsayılan olarak `3300`, API ise `4300` portunda çalışır.

Worker sınırını tek bir fixture işiyle doğrulamak için:

```bash
pnpm dev:worker
```

## Kalite komutları

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e --project=chromium
```

Playwright tarayıcısı sistemde yoksa bir kez kur:

```bash
pnpm exec playwright install chromium
```

## Repo yapısı

```text
apps/
  web/       Next.js kullanıcı arayüzü
  api/       Fastify HTTP API
  worker/    Tarama işi yürütme sınırı
packages/
  domain/       Kanonik finans ve analiz tipleri
  contracts/    Sürümlenebilir API şemaları
  currency/     ISO 4217 kataloğu ve hassas kur dönüşümü
  market-data/  Twelve Data, Kraken, Frankfurter ve test fixture sağlayıcıları
  scoring/      Deterministik Phanfora Skoru v1
  analysis/     Tarama ve sıralama orkestrasyonu
```

## Mimari kararlar

- Para değerleri API sınırlarında ondalık metin olarak taşınır.
- Yetkili para hesaplarında JavaScript kayan nokta aritmetiği kullanılmaz.
- Bir analiz içindeki tüm dönüşümler aynı değişmez kur snapshot’ını kullanır.
- Aynı idempotency anahtarı aynı analiz sonucunu döndürür.
- Skor, veri snapshot’ı ve metodoloji sürümü birlikte saklanabilecek biçimdedir.
- Web, API ve worker ayrı ayrı dağıtılabilir; domain paketleri framework bağımsızdır.

## Sonraki üretim fazları

PostgreSQL kalıcılığı, Redis kuyruğu, üretim kimliği, lisanslı canlı veri, hata izleme, yedekleme ve hukuk incelemesi ayrı planlarla eklenmelidir. Mevcut sınırlar bu entegrasyonların kullanıcı akışını veya skor motorunu yeniden yazmadan yapılması için oluşturulmuştur.
