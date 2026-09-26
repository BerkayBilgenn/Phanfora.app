# Phanfora Functional Market Cockpit

**Durum:** Kullanıcı tarafından onaylanan birinci yerel ürün fazı  
**Tarih:** 26 Eylül 2026  
**Önceki çalışma:** `2026-09-24-phanfora-live-market-redesign.md`

## Amaç

Phanfora'nın ana analiz deneyimini, koyu glassmorphism görsel diline sahip fakat hiçbir dekoratif veya sahte kontrol içermeyen işlevsel bir piyasa kontrol merkezine dönüştürmek. Kullanıcı tek bir yüzeyden canlı varlıkları arayabilmeli, gerçek OHLCV serilerini inceleyebilmeli, göstergeleri açabilmeli, grafik üzerinde trend çizgisi çizebilmeli, piyasayı tarayabilmeli ve seçtiği fırsat için açıklanabilir Phanfora analizini çalıştırabilmelidir.

Bu belge yalnız ilk dikey ürünü kapsar: piyasa kontrol merkezi, grafik çalışma alanı, radar taraması ve analiz paneli. İzleme listesi, alarmlar, portföy, kalıcı analiz geçmişi ve raporlama sonraki yerel alt projelerdir. Bu özellikler tamamlanana kadar navigasyonda çalışıyormuş gibi gösterilmez.

## Başarı ölçütü

Ekranda görünen her etkileşim gerçek bir davranışa sahiptir. Sağlayıcıdan gelmeyen veri üretilmez; eksik, gecikmiş, kota nedeniyle alınamamış veya desteklenmeyen veri açık bir durumla gösterilir. Kullanıcı aşağıdaki yolculuğu tamamlayabilir:

1. Canlı varlık evreninde arama yapar ve bir varlık seçer.
2. Günlük, haftalık veya aylık gerçek OHLCV serisini açar.
3. Mum grafiği, hacim ve seçili teknik göstergeleri inceler.
4. Grafik üzerinde geçici trend çizgileri oluşturur veya siler.
5. Uygun varlık evrenini radar taramasından geçirir.
6. Sıralanmış fırsatlardan birini seçip grafiği ve skor açıklamasını günceller.
7. Tutar, para birimi, vade ve risk profilini tek ekranda değiştirerek yeni analiz çalıştırır.

## Kapsam ve faz sınırı

### Bu fazda

- Gerçek OHLCV veri modeli ve sağlayıcı normalizasyonu
- Varlık kataloğu ve arama
- Zaman aralığına göre seri API'si
- Piyasa özeti ve tarama API'si
- İşlevsel mum/hacim grafiği
- Hareketli ortalama göstergeleri
- Trend çizgisi aracı ve tam ekran modu
- Mevcut açıklanabilir analiz akışının kontrol merkezine entegrasyonu
- Tek-ekran `AnalysisPanel`
- Yerel görünüm tercihleri ve grafik çizimlerinin tarayıcıda saklanması
- Masaüstü ve mobil uyarlama
- Erişilebilirlik, düşük hareket tercihi ve hata durumları

### Sonraki yerel alt projelerde

- İzleme listesi ve fiyat alarmları
- Portföy pozisyonları ve performans hesabı
- Kalıcı analiz geçmişi
- Rapor üretimi ve dışa aktarma
- Bildirim merkezi ve ayrıntılı kullanıcı ayarları

### SQL/çok kullanıcı fazında

- Kimlik doğrulama
- PostgreSQL kalıcılığı ve kullanıcı sahipliği
- Sunucu taraflı alarm değerlendirmesi
- Cihazlar arası eşitleme

## Tasarım ilkeleri

### İşlevsel dürüstlük

- Veri sağlayıcı tarafından desteklenmeyen enstrüman, sayı veya piyasa kapsamı gösterilmez.
- Radar sayacı `listAssets` ve tarama sonucundan hesaplanır; sabit metin değildir.
- Piyasa durumu, veri modu, kaynak, gözlem zamanı ve gecikme her sonuçta görünür.
- Bir kontrolün arkasında uygulanmış davranış yoksa kontrol render edilmez.
- Fixture verisi yalnız testlerde kullanılabilir ve her zaman fixture olarak etiketlenir.

### Görsel dil

- Ana grafik, radar ve analiz yüzeyi kontrollü cam malzeme kullanır.
- İkincil KPI yüzeyleri daha opak ve sakin tutulur; her kart aynı parlaklığa sahip olmaz.
- Köşe yarıçapları üç seviyedir: kontroller `6px`, kartlar `10px`, ana yüzeyler `14px`.
- Mint yalnız canlı, seçili veya olumlu durumlar için; amber gecikme/uyarı, mercan olumsuz durumlar için kullanılır.
- Büyük sayılarda tabular rakamlar ve sıkı harf aralığı; yardımcı metinlerde yüksek okunabilirlik korunur.
- Cam efekti bilgi kontrastını azaltamaz. Metin ve veri çizgileri bulanık arka plandan bağımsız kontrasta sahip olur.

## Sistem mimarisi

Mevcut monorepo sınırları korunur:

- `packages/domain`: OHLCV, piyasa özeti, seri ve tarama tipleri
- `packages/contracts`: yeni HTTP istek/yanıt şemaları
- `packages/market-data`: Twelve Data yanıtlarını kanonik modele çeviren sağlayıcı
- `packages/analysis`: mevcut kalite kapıları ve skor sıralaması
- `apps/api`: varlık, seri, piyasa özeti ve analiz uçları
- `apps/web`: kontrol merkezi bileşenleri, etkileşim durumu ve yerel tercih deposu

UI yalnız `apps/web/src/lib/api.ts` üzerinden sunucu verisi tüketir. Sağlayıcı anahtarı istemciye taşınmaz. Sağlayıcı adaptörü ile UI arasında doğrudan bağlantı kurulmaz.

## Veri modeli

`PricePoint` aşağıdaki alanları taşır:

- `time`
- `open`
- `high`
- `low`
- `close`
- `volume`

Fixture sağlayıcı test amacıyla deterministik OHLCV üretir. Twelve Data sağlayıcısı dış yanıtın tüm OHLCV alanlarını doğrular. Sayısal olmayan, ters aralıklı (`low > high`) veya eksik noktalar seri bütünlüğü hatası sayılır; grafik için uydurma mum üretilmez.

Yeni okuma modelleri:

- `MarketOverview`: gerçek varlık sayısı, sınıf dağılımı, tazelik ve sağlayıcı durumu
- `AssetSeries`: varlık, vade, OHLCV noktaları, kaynak ve gözlem metadata'sı
- `MarketScanResult`: uygun, elenen ve riskli varlık sayıları ile sıralanmış analiz sonuçları

Analiz skorları OHLCV serisinin kapanış ve hacim değerlerinden türetilmeye devam eder. UI yalnız domain sonucunu görselleştirir; istemcide ikinci bir skor algoritması oluşturulmaz.

## HTTP yüzeyi

- `GET /v1/assets`: aranabilir kanonik varlık kataloğu
- `GET /v1/assets/:id/series?horizon=daily|weekly|monthly`: seçilen varlığın OHLCV serisi
- `GET /v1/market/overview`: sağlayıcı ve mevcut evren özeti
- `POST /v1/analyses`: mevcut tutar/vade/risk tabanlı tarama ve skor üretimi

Radar, ayrı ve çelişen bir algoritma çalıştırmaz; `POST /v1/analyses` sonucunun gerçek tarama metadata'sını görselleştirir. Analiz sonucu taranan toplam varlık, uygun varlık ve elenme nedenlerinin özetini taşıyacak şekilde genişletilir.

## Web bileşenleri

### `MarketCockpit`

Ana sayfa durumunu orkestre eder: seçili varlık, vade, gösterge tercihleri, tam ekran hedefi, analiz sonucu ve hata durumları. Veri hesaplamaz; API ve alt bileşenleri bağlar.

### `MarketStatusBar`

Sağlayıcı, veri modu, son gözlem zamanı ve gerçek varlık kapsamını gösterir. Sahte endeks fiyatları veya zamanlayıcı içermez. Periyodik yenileme yalnız sekme görünürken ve sağlayıcı kotasına uygun aralıkta yapılır.

### `AssetSearch`

API'den gelen katalog üzerinde sembol, ad ve sınıfa göre filtreler. Klavye yön tuşları, Enter ve Escape desteklenir. Seçim seri isteğini tetikler.

### `MarketChart`

SVG tabanlı mum ve hacim katmanlarını çizer. Bağımsız veri-seri yardımcıları fiyat/volume ölçeklerini, tarih etiketlerini ve görünür noktaları hesaplar. Hover/focus çapraz çizgisi gerçek nokta değerlerini gösterir. Grafik metinsel özet ve erişilebilir tablo alternatifi sunar.

### `ChartToolbar`

- Vade düğmeleri seri isteğini yeniler.
- Göstergeler menüsü SMA 20 ve SMA 50 katmanlarını açıp kapatır.
- Çizim modu iki grafik noktası seçerek trend çizgisi oluşturur; çizgiler seçilebilir ve temizlenebilir.
- Tam ekran düğmesi Fullscreen API kullanır; desteklenmiyorsa render edilmez.

### `RadarPanel`

Analiz isteğinin ilerlemesini ve sonucunu gösterir. Tarama animasyonu yalnız istek sürerken çalışır. Tamamlandığında gerçek sayılar ve elenme nedenleri gösterilir. Dekoratif hedef noktaları veya rastgele hareket kullanılmaz.

### `OpportunityList`

Analiz sonucundaki ana ve alternatif varlıkları sıralar. Bir sonuç seçildiğinde ana grafik, fiyat, skor ve açıklama alanı o varlığa geçer.

### `AnalysisPanel`

Kullanıcının çalışma alanındaki değiştirilmiş test sözleşmesine göre tutar, para birimi, vade ve risk kontrollerini aynı anda gösterir. Tek eylem `Canlı piyasaları analiz et` olur. Geçersiz tutarda odak ilgili alana döner.

### `MetricModules`

Momentum, likidite, volatilite ve risk uyumunu yalnız mevcut domain değerlerinden üretir. Veri yoksa boş mini grafik yerine açık durum metni gösterir.

## Yerel durum ve kalıcılık

Bu fazın yerel tercihleri bir `CockpitPreferencesRepository` arayüzü arkasında tutulur. İlk implementasyon sürümlenmiş JSON ile `localStorage` kullanır:

- son seçili varlık
- son seçili vade
- açık teknik göstergeler
- varlık/vade bazlı trend çizgileri
- hareket yoğunluğu tercihi

Repository yöntemleri asenkron tanımlanır. Böylece sonraki çok kullanıcılı fazda HTTP/PostgreSQL implementasyonu UI sözleşmesini değiştirmeden eklenebilir. Bozuk veya eski sürümlü kayıt güvenli varsayılanlara döner.

## Hareket sistemi

- Tarama ışını yalnız gerçek analiz isteği sürerken döner ve sonuç geldiğinde tamamlanma durumuna geçer.
- Mumlar ilk yüklemede kısa bir opacity/scale girişine sahip olabilir; fiyat değişiminde tüm grafik yeniden oynatılmaz.
- Sayısal değişiklikler renk ve kısa opacity geçişiyle belirtilir; sürekli parlayan dekoratif animasyon kullanılmaz.
- Panel geçişleri `transform` ve `opacity` ile yapılır; layout ölçülerini sürekli değiştiren animasyonlardan kaçınılır.
- `prefers-reduced-motion: reduce` altında tarama dönüşü, çizim animasyonu ve geçişler kaldırılır; durum bilgisi metinle korunur.

## Responsive davranış

- Geniş masaüstünde grafik ana sütun, radar ve fırsatlar ikincil sütundur.
- Tablet düzeninde radar ve fırsatlar grafiğin altına iner.
- Mobilde başlık, seçili varlık özeti, grafik, araç çubuğu, fırsatlar ve analiz ayarları tek sütunda bilgi önceliğine göre sıralanır.
- Grafik mobilde yatay kaydırma gerektirmez; daha az eksen etiketi gösterir ve dokunma hedefleri en az `44px` olur.
- Tam ekran modu mobil tarayıcı desteğine bağlıdır; destek yoksa kontrol gizlenir.

## Hata ve boş durumlar

- Yapılandırılmamış sağlayıcı: kontrol merkezi eylemleri devre dışı kalır ve kurulum mesajı gösterilir.
- Kota aşımı: mevcut son başarılı veri, tazelik etiketiyle korunur; yeni tarama hata mesajı verir.
- Kısmi seri: bütünlük eşiğini geçerse eksik aralık işaretlenir, geçmezse grafik render edilmez.
- Üçten az uygun analiz sonucu: fırsat sıralaması üretilmez; elenme nedenleri gösterilir.
- Yerel tercih okuma hatası: uygulama varsayılanlarla açılır ve kullanıcı verisi sessizce üzerine yazılmaz.
- Ağ bağlantısı kesilirse son başarılı ekran korunur; canlı durum etiketi çevrimdışıya döner.

## Güvenlik ve performans

- API anahtarı ve sağlayıcı ham hata gövdeleri tarayıcıya gönderilmez.
- Arama istemci katalogunda yapılır; her tuş vuruşunda dış API çağrısı oluşturulmaz.
- Seri yanıtları sağlayıcının mevcut 60 saniyelik istek birleştirme/önbellek yaklaşımını kullanır.
- SVG grafik görünür pencere için gereken noktaları işler; hesaplamalar saf yardımcı fonksiyonlarda tutulur.
- Yenileme sekme görünürlüğüne ve veri moduna göre durdurulur veya yavaşlatılır.

## Test stratejisi

### Domain ve sağlayıcı

- OHLCV doğrulama ve normalizasyon testleri
- Eksik/bozuk mum reddi
- Vade-parametre eşlemesi
- Sağlayıcı kota ve kısmi başarı davranışı

### API

- Seri, özet ve analiz sözleşme testleri
- Geçersiz varlık/vade yanıtları
- Sağlayıcı hata kodlarının kullanıcıya güvenli eşlenmesi
- Tarama metadata'sının gerçek sonuçlarla tutarlılığı

### Web birim testleri

- `AnalysisPanel` için mevcut üç test korunur
- Arama klavye etkileşimleri
- Vade değişiminin yeni seri yüklemesi
- Gösterge ve çizim araçları
- Radarın istek/başarı/hata durumları
- Fırsat seçiminin grafik ve skor değişimi
- Yerel tercih sürümleme/fallback davranışı

### E2E

- Ana kontrol merkezinin fixture API ile deterministik tam yolculuğu
- Canlı sağlayıcı anahtarı olmadan doğru kurulum hatası
- Mobil akışta analiz oluşturma ve sonuç seçimi
- Klavye ile arama, grafik özeti ve analiz formuna erişim

## Teslim sırası

1. OHLCV domain, sağlayıcı ve API uçları
2. Grafik veri yardımcıları ve erişilebilir `MarketChart`
3. Arama, araç çubuğu, göstergeler, çizim ve tam ekran
4. Tek-ekran `AnalysisPanel`, radar ve fırsat seçimi
5. Glassmorphism tasarım tokenları, responsive düzen ve hareket sistemi
6. Entegrasyon/E2E doğrulaması ve çalışmayan eski navigasyonun gizlenmesi

## Kabul ölçütleri

- Ekranda görünen her buton, bağlantı ve grafik kontrolü çalışır.
- Mum ve hacim değerleri API'den gelen OHLCV noktalarıyla birebir eşleşir.
- Zaman aralığı seçimi gerçek veri isteğini değiştirir.
- SMA ve trend çizgileri gerçek grafik koordinatlarında çalışır.
- Radar sayıları analiz sonucuyla aynıdır ve sabit değer içermez.
- Fırsat seçimi ana grafiği ve skor ayrıntısını günceller.
- Veri yokken sahte grafik veya sayı gösterilmez.
- Analiz formu tek ekrandır ve mevcut kullanıcı testlerini geçirir.
- Mobil düzen temel işlevlerin hiçbirini gizlemez.
- Düşük hareket tercihi altında bilgi kaybı olmadan animasyonlar kapanır.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` ve Chromium E2E kontrolleri geçer.

