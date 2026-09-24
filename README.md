# Phanfora App

Phanfora, kullanıcının tutar, vade ve risk tercihini alıp küresel varlık sınıflarını açıklanabilir bir metodolojiyle karşılaştıran finansal karar destek uygulamasıdır.

Bu repo `app.phanfora.com` uygulamasını içerir. Tanıtım sitesi `phanfora.com` ayrı repo ve dağıtım olarak kalır.

## Şu anda çalışan kapsam

- Tutar ve 150’den fazla ISO 4217 para birimi arasından seçim
- Günlük, haftalık veya aylık vade
- Düşük, dengeli veya yüksek risk profili
- Hisse, kripto, emtia, döviz ve endeks fixture’ları
- Bir ana fırsat ve iki alternatif
- Phanfora Skoru ve beş alt boyut
- Güven düzeyi, en fazla üç gerekçe ve ana risk
- Fiyat grafiği ve ekran okuyucu için metinsel grafik özeti
- Kaynak, gözlem zamanı, piyasa durumu ve metodoloji sürümü
- Responsive masaüstü/mobil uygulama kabuğu
- Fastify API ve bağımsız worker sınırı

## Önemli veri notu

Yerel sürüm deterministik geliştirme verisi kullanır ve arayüzde her zaman **Demo veri** olarak işaretlenir. Bu veri canlı fiyat değildir ve yatırım tavsiyesi oluşturmaz.

Gerçek zamanlı kullanıma geçerken lisanslı piyasa ve döviz sağlayıcıları `MarketDataProvider` ve `FxRateProvider` arayüzleri arkasına eklenir. Sağlayıcı anahtarları yalnızca sunucuda tutulur. Veri tazeliği veya bütünlüğü kalite kapısını geçmezse skor üretilmez.

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
  market-data/  Sağlayıcı sözleşmeleri ve fixture verisi
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
