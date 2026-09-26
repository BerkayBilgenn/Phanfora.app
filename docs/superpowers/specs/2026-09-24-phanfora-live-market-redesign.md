# Phanfora Live Market Redesign

**Durum:** Kullanıcı geri bildirimi sonrası uygulama tasarımı  
**Tarih:** 24 Eylül 2026  
**İlişkili ana spec:** `2026-09-24-phanfora-production-foundation-design.md`

## Amaç

Mevcut demo deneyimini gerçek piyasa verisi kullanan, profesyonel yoğunlukta ve veri kaynağını dürüstçe açıklayan bir analiz yüzeyine dönüştürmek. Bu değişiklik dört doğrulanmış sorunu giderir:

1. Üç adımlı soru akışı acemi ve yavaştır.
2. BTC gibi USD kotasyonlu varlıklarda çevrilmiş TRY değeri ana fiyat olarak gösterilmektedir.
3. Kullanıcı deneyimi deterministik fixture verisi döndürmektedir.
4. Sonuçlarda canlı veya gecikmeli dış piyasa verisi yoktur.

## Kararlar

### Veri sağlayıcısı

- İlk canlı sağlayıcı Twelve Data'dır.
- Anahtar yalnız API sürecinde `TWELVE_DATA_API_KEY` ortam değişkeninden okunur; istemci paketine, loglara veya repoya yazılmaz.
- Sağlayıcı başarısız olduğunda fixture verisine sessiz geçiş yapılmaz. İstek açık ve kullanıcıya gösterilebilir bir veri hatasıyla başarısız olur.
- Fixture sağlayıcılar yalnız otomatik testlerde kalır.
- Ücretsiz kota için tek analizde en fazla altı piyasa sembolü ve kullanıcının seçtiği para birimi için en fazla bir USD çapraz kuru istenir.
- Aynı vade ve para birimi için başarılı yanıtlar 60 saniye bellek içinde önbelleğe alınır; eşzamanlı aynı istekler tek dış istekte birleştirilir.

### İlk ücretsiz canlı evren

| Varlık | Sağlayıcı sembolü | Sınıf | Doğal kotasyon |
| --- | --- | --- | --- |
| Bitcoin | `BTC/USD` | Kripto | USD |
| Ethereum | `ETH/USD` | Kripto | USD |
| Apple | `AAPL` | Hisse | USD |
| Microsoft | `MSFT` | Hisse | USD |
| Euro / US Dollar | `EUR/USD` | Döviz | USD |
| Gold Spot | `XAU/USD` | Emtia | USD |

Twelve Data'nın mevcut ücretsiz planı gerçek endeks sembolü `SPX` erişimini reddettiği için endeks sonucu uydurulmaz veya ETF yanlış biçimde endeks olarak etiketlenmez. Arayüz ilk canlı sürümde dört aktif varlık sınıfını ve plan nedeniyle kullanılamayan endeks kapsamını açıkça belirtir. Sağlayıcı planı genişlediğinde aynı adaptöre endeks eklenebilir.

### Veri dönüştürme ve puanlama

- Vade `daily` için 15 dakikalık, `weekly` için 1 saatlik, `monthly` için 1 günlük seriler istenir.
- Her sembol için en yeni kapanış doğal fiyat, bir önceki kapanış değişim yüzdesi, seri ise grafik girdisidir.
- Trend, momentum ve volatilite değerleri seriden deterministik olarak türetilir; likidite skoru yalnız doğrulanmış yüksek likiditeli başlangıç evreni için katalog metadata'sından gelir.
- En yeni gözlemin yaşına göre veri modu `live`, `delayed`, `end-of-day` veya `stale` olarak belirlenir. `stale` veri kalite kapısından geçmez.
- Sağlayıcının kısmi başarısında yalnız doğrulanan semboller değerlendirilir; üçten az uygun varlık kalırsa analiz üretilmez.

### Para birimi davranışı

- Varlığın doğal piyasa fiyatı her zaman ana fiyat olarak gösterilir. `BTC/USD` ve diğer USD kotasyonlu varlıklarda ana fiyat USD'dir.
- Kullanıcının seçtiği para birimi farklıysa dönüştürülmüş karşılık daha küçük, ikincil satırda gösterilir.
- Para birimi kataloğu ISO/Intl tabanlı mevcut 150+ seçenek olarak kalır. Analiz sırasında yalnız seçilen para biriminin `USD/<kod>` kuru canlı alınır.
- Desteklenmeyen veya sağlayıcıda bulunmayan kur için uydurma oran üretilmez; anlaşılır veri hatası döner.

### Ana deneyim

- Üç adımlı sihirbaz kaldırılır.
- Masaüstünde tutar, para birimi, vade ve risk tek bir yatay “Analiz ayarları” yüzeyinde görünür; mobilde aynı kontroller doğal sırayla sarılır.
- Tek bir `Canlı piyasaları analiz et` eylemi vardır. Seçili değerler her zaman görünür ve değiştirilebilir.
- Üst bölüm gerçek kapsamı gösterir: `6 canlı enstrüman`, `4 varlık sınıfı`, sağlayıcı ve son güncelleme.
- Sonuç ekranında canlı/gecikmeli/EOD etiketi, gözlem zamanı, kaynak ve kapsam açıkça gösterilir. “Demo veri” metni canlı akışta bulunmaz.
- Sonuç hiyerarşisi doğal fiyat → değişim → Phanfora skoru → ikincil yerel karşılık → nedenler/risk şeklindedir.

## Hata ve güvenlik davranışı

- Eksik anahtar: API sağlık yanıtı `degraded`, analiz isteği `503 MARKET_DATA_NOT_CONFIGURED`.
- Kota aşımı: `503 MARKET_DATA_RATE_LIMITED`; kullanıcıya kısa süre sonra tekrar denemesi söylenir.
- Sağlayıcı şema hatası veya ağ hatası: `502 MARKET_DATA_UNAVAILABLE`.
- Dış servis hata mesajları ve anahtar istemciye veya loglara taşınmaz.
- `TWELVE_DATA_API_KEY` log redaction listesine eklenir ve `.env.example` yalnız değişken adını içerir.

## Kabul ölçütleri

- Yerel ana sayfada üç adımlı soru akışı bulunmaz.
- Canlı anahtarla analiz sonucu `dataMode !== "fixture"` döndürür.
- BTC ana fiyatı USD, seçili TRY karşılığı ikincil görünür.
- Sonuçlarda “Demo veri” bulunmaz; kaynak, gözlem zamanı ve tazelik bulunur.
- Fixture sağlayıcı canlı API uygulama kurulumunda kullanılmaz.
- Anahtar kaynak kodda, git diff'inde veya istemci ağ yanıtında görünmez.
- Sağlayıcı erişilemediğinde uygulama sahte sonuç üretmez.

