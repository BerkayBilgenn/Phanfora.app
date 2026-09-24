# Phanfora App — Ürün, Deneyim ve Sistem Tasarım Spec'i

**Durum:** Onaylanmış ürün yönünün uygulama spec'i  
**Tarih:** 24 Eylül 2026  
**Ürün:** Phanfora App  
**Hedef adres:** `app.phanfora.com`  
**Landing page:** `phanfora.com` — ayrı repo ve ayrı dağıtım  

## 1. Ürün özeti

Phanfora, kullanıcının değerlendirmek istediği para miktarını, vadesini ve risk tercihini alır; dünya genelindeki hisse, kripto, emtia, döviz ve endeksleri ortak ama adil bir metodolojiyle tarar; o anki koşullarda kullanıcı profiline en uygun fırsatları sade grafikler ve kısa gerekçelerle sunar.

Ürün bir sohbet robotu gibi davranmaz. Kullanıcıdan prompt istemez, uzun metin üretmez ve yapay zekâyı arayüzün ana metaforu yapmaz. Otomasyon ve yapay zekâ arka planda veri sınıflandırma, anomali kontrolü, açıklama üretimi ve sıralama desteği için kullanılabilir; kullanıcı arayüzünde görünen ürün ise hızlı, sakin ve güvenilir bir finansal karar destek deneyimidir. Otomatik analiz kullanımı metodoloji ve yasal bilgilendirme alanlarında şeffaf biçimde açıklanır; kullanıcıya sistemin insan analist olduğu izlenimi verilmez.

Phanfora'nın temel vaadi:

> Ne kadar ayırdığını, ne kadar bekleyebileceğini ve ne kadar risk kabul ettiğini söyle. Phanfora küresel piyasaları tarasın, en uygun fırsatları nedenleriyle birlikte göstersin.

## 2. Ürün ilkeleri

### 2.1 Önce karar, sonra ayrıntı

Kullanıcı ilk ekranda bir terminal veya yüzlerce veri noktasıyla karşılaşmaz. Önce bir ana fırsat, iki güçlü alternatif ve bunların temel gerekçelerini görür. Derin indikatör ve metodoloji bilgisi isteğe bağlı olarak açılır.

### 2.2 Az metin, yüksek bilgi yoğunluğu

Her metin bir karar vermeye yardım etmelidir. Pazarlama cümleleri, tekrarlanan açıklamalar ve genel piyasa yorumları uygulama yüzeylerinden çıkarılır. Ana sonuç kartında en fazla üç kısa gerekçe ve bir temel risk bulunur.

### 2.3 Puan açıklanabilir olmalıdır

Her Phanfora Skoru; trend, momentum, hacim/likidite, risk uyumu ve piyasa koşulları alt puanlarına ayrılır. Kullanıcı puanın hangi veri zamanı, hangi vade ve hangi göstergelerle üretildiğini görebilir.

### 2.4 Kesinlik değil, olasılık

Ürün “kesin yükselir”, “garanti kazanç” veya “kaçırılmayacak yatırım” dili kullanmaz. Sonuçlar uygunluk, güven düzeyi, senaryo ve risk üzerinden anlatılır. Tek bir sonuç mutlak doğru gibi sunulmaz.

### 2.5 Küresel ama yerelleştirilebilir

Varlık evreni küreseldir. Dil, para birimi, saat dilimi, sayı biçimi ve piyasa seansları kullanıcıya göre yerelleştirilir. Veri modeli hiçbir ülkeyi veya para birimini varsayılan gerçeklik olarak kabul etmez.

### 2.6 Veri yoksa sonuç yok

Eski, eksik veya güvenilirliği doğrulanmamış veri üzerinden skor üretilmez. Kaynak, son güncelleme zamanı, piyasa durumu ve gecikme bilgisi görünürdür.

## 3. Hedef kullanıcı ve temel iş

Birincil kullanıcı; profesyonel terminal kullanmak istemeyen, küresel piyasalara ilgi duyan fakat yüzlerce varlığı ve indikatörü tek başına karşılaştırmak için zamanı veya uzmanlığı olmayan bireysel kullanıcıdır.

Kullanıcının temel işi:

> Elimdeki belirli bir miktarı, seçtiğim zaman aralığında ve kabul ettiğim risk düzeyinde değerlendirmek için hangi küresel piyasa fırsatlarına bakmam gerektiğini hızlıca anlamak istiyorum.

İlk sürüm profesyonel trader terminali, aracı kurum, portföy saklama hizmeti veya otomatik işlem sistemi değildir.

## 4. MVP kapsamı

### Dahil

- E-posta veya desteklenen kimlik sağlayıcıyla hesap oluşturma ve giriş.
- Tercih edilen dil, ana para birimi ve saat dilimi.
- Değerlendirilecek tutarın girilmesi.
- Günlük, haftalık veya aylık vade seçimi.
- Düşük, dengeli veya yüksek risk profili seçimi.
- Hisse, kripto, emtia, döviz ve endeks evreninin taranması.
- Bir ana fırsat ve iki alternatif sonuç.
- Phanfora Skoru ve tüm alt puanları.
- Fiyat grafiği, önemli seviyeler ve seçili indikatör katmanları.
- En fazla üç kısa gerekçe ve görünür temel risk.
- Veri kaynağı, veri zamanı, piyasa açık/kapalı durumu ve veri kalitesi.
- Son analizleri görüntüleme ve varlığı izleme listesine ekleme.
- Skor metodolojisi ekranı.
- Türkçe ve İngilizce arayüz altyapısı.

### MVP dışında

- Phanfora üzerinden emir iletme veya işlem gerçekleştirme.
- Kullanıcı parasını ya da varlığını saklama.
- Otomatik portföy yönetimi.
- Sosyal akış, yorumlar veya takipçi sistemi.
- Kullanıcılar arası mesajlaşma.
- Sürekli açık chatbot veya serbest biçimli prompt ekranı.
- Garanti getiri, kesin hedef fiyat veya kişiye özel hukuki/vergi tavsiyesi.

## 5. Bilgi mimarisi

Ana uygulama navigasyonu beş hedefle sınırlıdır:

1. **Bugün:** Yeni analiz başlatma ve güncel sonuçlar.
2. **Keşfet:** Varlık evrenini filtreleyerek inceleme.
3. **İzleme:** Kaydedilen varlıklar ve skor değişimleri.
4. **Geçmiş:** Kullanıcının önceki analizleri.
5. **Hesap:** Profil, dil, para birimi, veri ve yasal tercihler.

Mobilde ilk dört hedef alt navigasyonda yer alır; hesap, üst çubuktaki profil kontrolünden açılır. Masaüstünde dar bir sol navigasyon kullanılır. Navigasyon içeriğin önüne geçmez ve yalnızca aktif bölümde dolu ikon kullanır.

## 6. Ana kullanıcı akışı

### 6.1 İlk kullanım

İlk girişten sonra kullanıcı tek bir odaklı kurulum akışına alınır:

1. **Tutar:** Sayısal tutar ve para birimi.
2. **Vade:** Günlük, haftalık veya aylık.
3. **Risk:** Düşük, dengeli veya yüksek.
4. **Özet:** Seçimler ve “Piyasaları tara” eylemi.

Her adım aynı yüzeyde ilerler. Ayrı sayfalar arasında sert geçiş yapılmaz. İlerleme göstergesi `1 / 3` gibi sessiz ve metinseldir. Geri dönüldüğünde girilen bilgiler korunur.

Tutar alanı:

- Kullanıcının yerel sayı biçimini kabul eder.
- Para birimini ayrı bir kontrol olarak gösterir.
- Mobilde sayısal klavye açar.
- Geçersiz girişleri yazma sırasında cezalandırmaz; kullanıcı devam etmeye çalıştığında kısa ve doğrudan hata verir.
- Gerekli minimum veya maksimum tutar veri kapsamı nedeniyle değişiyorsa bunu alanın altında önceden belirtir.

### 6.2 Tarama durumu

Tarama ekranı yapay bir sohbet veya uzun bekleme animasyonu değildir. Dört gerçek iş adımı gösterilir:

- Piyasalar güncelleniyor
- Varlıklar filtreleniyor
- Risk uyumu hesaplanıyor
- Sonuçlar sıralanıyor

Bir adım gerçekten tamamlanmadan tamamlanmış görünmez. Tahmini süre verilmez. İşlem uzarsa kullanıcı uygulamada kalmaya zorlanmaz; analiz tamamlandığında sonuç geçmişe kaydedilir.

### 6.3 Sonuç ekranı

Sonuç ekranının ilk görünümünde şu sıra korunur:

1. Kullanıcı özeti: tutar, vade, risk.
2. Ana fırsat.
3. İki alternatif.
4. Piyasa kapsamı ve elenen varlıkların kısa özeti.
5. Metodoloji ve veri bilgisi.

Ana fırsat kartı şunları gösterir:

- Varlık sembolü, tam adı, kategori ve ilgili piyasa.
- Güncel fiyat ve kullanıcının para birimindeki karşılığı.
- `Phanfora Skoru: 84 / 100`.
- Güven düzeyi: düşük, orta veya yüksek.
- Seçilen vadeyle eşleşen sade fiyat grafiği.
- En fazla üç kısa neden.
- Tek satırlık ana risk.
- “Detayı gör” ve “İzlemeye ekle” eylemleri.

“Al” veya “Sat” birincil buton olarak kullanılmaz. Ana eylem “Analizi incele”dir. Sonuç, bir işlem talimatı değil araştırılacak öncelikli fırsattır.

### 6.4 Varlık detayı

Detay ekranı katmanlıdır:

- **Özet:** Skor, fiyat, değişim, vade uyumu ve ana gerekçeler.
- **Grafik:** Fiyat, hacim, destek/direnç ve seçilen indikatörler.
- **Skor dökümü:** Beş ana boyut, ağırlıklar ve katkılar.
- **Senaryolar:** Olumlu, nötr ve olumsuz koşullar.
- **Veri:** Kaynak, zaman, piyasa, gecikme ve kalite bilgisi.

Grafiğin üzerinde aynı anda en fazla iki indikatör katmanı açık olabilir. Varsayılan görünüm fiyat, hacim ve önemli seviyelerden oluşur. Kullanıcı indikatör seçebilir; ancak grafik ilk açılışta teknik analiz panosuna dönüştürülmez.

## 7. Phanfora Skoru

### 7.1 Amaç

Phanfora Skoru, bir varlığın genel olarak “iyi” olup olmadığını değil, belirli bir kullanıcı girdisi ve belirli bir zaman anında ne kadar uygun olduğunu ölçer.

Skor girdisi:

```text
varlık + veri zamanı + tutar + para birimi + vade + risk profili
```

Aynı varlık farklı vade veya risk profillerinde farklı skor alabilir.

### 7.2 Ana boyutlar

Toplam skor 0–100 aralığındadır ve beş açıklanabilir boyuttan oluşur:

| Boyut | Ölçtüğü şey | Temel sinyaller |
| --- | --- | --- |
| Trend | Fiyat hareketinin yönü ve sürekliliği | EMA 20/50/200, piyasa yapısı, ADX |
| Momentum | Hareketin hızı ve devam olasılığı | RSI, MACD, göreceli güç, momentum sapmaları |
| Hacim ve likidite | Hareketin katılımı ve uygulanabilirliği | Hacim değişimi, OBV, spread, piyasa derinliği |
| Risk uyumu | Varlığın kullanıcının risk tercihiyle uyumu | ATR, gerçekleşen volatilite, maksimum düşüş, gap riski |
| Piyasa koşulları | Varlığın çevresiyle uyumu | Kategori rejimi, korelasyon, seans durumu, piyasa genişliği |

### 7.3 Vade ağırlıkları

| Boyut | Günlük | Haftalık | Aylık |
| --- | ---: | ---: | ---: |
| Trend | %15 | %25 | %30 |
| Momentum | %30 | %25 | %15 |
| Hacim ve likidite | %25 | %20 | %15 |
| Risk uyumu | %20 | %20 | %25 |
| Piyasa koşulları | %10 | %10 | %15 |

Bu ağırlıklar MVP başlangıç varsayımıdır. Değişiklikler versiyonlanır ve geçmiş skorların hangi metodoloji sürümüyle üretildiği saklanır. Ağırlıklar kullanıcıya açıklanır; sessizce değiştirilmez.

### 7.4 Risk profili etkisi

- **Düşük risk:** Yüksek volatilite, düşük likidite, geniş spread ve sert düşüş geçmişini güçlü biçimde cezalandırır.
- **Dengeli:** Trend ve momentum fırsatını risk cezasıyla dengeler.
- **Yüksek risk:** Volatil fırsatları tamamen elemez; ancak düşük likidite ve veri kalitesi kurallarından taviz vermez.

Risk profili hiçbir zaman veri güvenliği filtresini aşamaz. Kullanıcı “yüksek risk” seçse bile manipülasyona açık, veri kalitesi düşük veya uygulanabilir likiditesi olmayan varlık öneri evrenine alınmaz.

### 7.5 Normalizasyon ve adil karşılaştırma

Hisse, kripto ve emtia aynı ham indikatör değeriyle karşılaştırılmaz. Her varlık önce kendi kategori, piyasa, likidite grubu ve vade bağlamında yüzdelik sıralamaya dönüştürülür. Kategori içi normalize edilen boyutlar daha sonra ortak 0–100 ölçeğine taşınır.

Bu yaklaşım, kriptonun doğal volatilitesinin otomatik olarak daha yüksek momentum skoru üretmesini veya düşük hacimli bir hissenin hacim artışının küresel ölçekte yanıltıcı görünmesini engeller.

### 7.6 Skor formülü

```text
temel_skor = Σ(normalize_boyut × vade_ağırlığı)
risk_ayarlı_skor = temel_skor − risk_uyumsuzluğu − likidite_cezası
phanfora_skoru = kalite_kapısı(risk_ayarlı_skor, veri_tazeliği, veri_bütünlüğü)
```

Kalite kapısı başarısızsa sayı gösterilmez. Arayüz “Bu varlık için güvenilir skor üretilemedi” der ve nedeni açıklar.

### 7.7 Güven düzeyi

Skor ile güven düzeyi birbirinden ayrıdır. Güven düzeyi şu bileşenlerden hesaplanır:

- Veri kapsamı ve tazeliği.
- Sinyallerin birbiriyle tutarlılığı.
- Rejim belirsizliği.
- Ani haber veya olağan dışı volatilite.
- Varlığın likiditesi.

Yüksek skor, otomatik olarak yüksek güven anlamına gelmez. Örneğin yeni oluşmuş güçlü momentum yüksek skor ama orta güven üretebilir.

## 8. Açıklama sistemi

Her sonuç için açıklama katmanı yapılandırılmış veriden üretilir. Serbest biçimli model metni tek gerçeklik kaynağı değildir.

Ana kart açıklaması:

- Üç nedeni geçmez.
- Her neden tek cümle ve yaklaşık 70 karakteri geçmeyecek biçimde hedeflenir.
- Sayısal bir sinyale dayanır.
- Seçilen vadeyle ilişkisini belirtir.

Örnek:

- “20 ve 50 günlük ortalamaların üzerinde güçlü trend.”
- “Hacim, son 30 gün ortalamasının %38 üzerinde.”
- “Haftalık oynaklık dengeli risk profiliyle uyumlu.”

Temel risk örneği:

- “RSI yüksek bölgede; kısa vadeli geri çekilme riski arttı.”

“Skor nasıl hesaplandı?” paneli her alt puanı, kullanılan temel göstergeleri, ağırlığı, katkıyı ve veri zamanını gösterir. Kullanıcı tüm matematiği okumadan sonucu anlayabilir; isteyen kullanıcı hiçbir şeyi gizli kabul etmek zorunda kalmaz.

## 9. Görsel tasarım yönü

### 9.1 Karakter

Uygulama “premium finans terminali” ciddiyetine sahip olmalı, ancak geleneksel terminallerin yoğunluğunu kopyalamamalıdır. Görünüm sakin, kesin ve kontrollüdür. Dekorasyon yerine hiyerarşi; parlak efektler yerine veri kalitesi; çok sayıda kart yerine güçlü bir odak kullanılır.

Ana sıfatlar:

- Sessiz
- Keskin
- Güvenilir
- Küresel
- Modern
- Gösterişsiz premium

Kaçınılacak görünüm:

- Neon kripto arayüzü.
- Yoğun cam efekti ve blur.
- Her yüzeyde gradient.
- Sürekli akan ticker şeritleri.
- Fazla yuvarlak, oyuncak hissi veren kartlar.
- Chatbot balonları ve parlayan AI sembolleri.
- Kırmızı/yeşili tek anlam taşıyıcısı olarak kullanmak.

### 9.2 Renk sistemi

Landing page ile marka devamlılığı korunur:

| Token | Değer | Kullanım |
| --- | --- | --- |
| `canvas` | `#0c1013` | Uygulama zemini |
| `surface` | `#11171c` | Ana paneller |
| `surface-raised` | `#171f25` | Açılan paneller ve seçili yüzeyler |
| `text-primary` | `#edf1f2` | Ana içerik |
| `text-secondary` | `#a2adb5` | Yardımcı metin |
| `accent` | `#83c9ad` | Seçim, odak ve olumlu vurgu |
| `action` | `#9bd8be` | Birincil eylem zemini |
| `action-ink` | `#0c211a` | Birincil eylem metni |
| `divider` | `#ffffff14` | Zorunlu yapısal ayırıcı |

Kazanç ve kayıp renkleri erişilebilir, daha düşük doygunluklu semantik tokenlardan gelir. Renk yanında yön oku, işaret ve metin etiketi bulunur. Skorun kendisi kırmızıdan yeşile dekoratif bir göstergeye dönüştürülmez; sayı ve açıklama önceliklidir.

### 9.3 Tipografi

- Ana aile: yerel sunulan **Manrope Variable**, `.woff2`.
- Logo haricinde ek gösterişli font kullanılmaz.
- Değişen tüm fiyat, yüzde, saat ve skor değerlerinde tabular rakamlar kullanılır.
- Metin ağırlığı 400–650 aralığında tutulur; küçük metinlerde ince ağırlık kullanılmaz.
- Büyük ekran başlığı: 40–48 px, 550 ağırlık, yaklaşık 1.1 satır yüksekliği.
- Sonuç fiyatı: 32–40 px, 550 ağırlık, tabular rakamlar.
- Bölüm başlığı: 20–24 px, 600 ağırlık.
- Gövde: 15–16 px, 1.5–1.6 satır yüksekliği.
- Etiket: 12–13 px, 500–600 ağırlık; gerektiğinde ölçülü pozitif harf aralığı.
- Mobil input metni en az 16 px.

Başlıklar dengeli, açıklamalar düzgün satır sonlarıyla sarılır. Uzun açıklamalar yaklaşık 65 karakterlik satır uzunluğunu aşmaz. Finansal değerler satır değiştirerek anlamını kaybetmez.

### 9.4 Düzen ve boşluk

8 px tabanlı boşluk sistemi kullanılır. Bileşen içi boşluk ile gruplar arası boşluk oranı en az 1:2'dir. Gruplama öncelikle boşlukla, sonra yüzey değişimiyle, yalnızca zorunlu olduğunda çizgiyle yapılır.

Masaüstü sonuç ekranı:

- 72 px dar sol navigasyon.
- En fazla 1440 px içerik alanı.
- Ana fırsata ayrılan geniş birincil kolon.
- Alternatifler ve analiz özeti için daha dar ikincil kolon.
- Ortak hizalama çizgileri; rastgele kart ızgarası yoktur.

Mobil sonuç ekranı:

- Tek kolon.
- 16–20 px yatay güvenli boşluk.
- Ana sonuç önce, alternatifler yatay veya dikey akışta sonra.
- Grafik içerik kenarına yaklaşabilir; kontroller içerik kenar boşluğu içinde kalır.
- Ana eylemler güvenli alanı hesaba katan sabit alt bölgede gösterilebilir.

Breakpoint değerleri cihaz isimlerinden değil, içeriğin kırıldığı noktadan belirlenir. Arayüz %200 zoom, uzun İngilizce/Türkçe metin ve dar genişlik altında temel eylemleri kaybetmemelidir.

### 9.5 Yüzeyler ve detaylar

- Temel köşe yarıçapı 10–12 px.
- İç içe yüzeylerde dış yarıçap, iç yarıçap + padding ilişkisini korur.
- İnce yapısal sınırlar dışında derinlik için düşük opaklıklı katmanlı gölgeler kullanılır.
- İkonlar tek aileden, varsayılan 1.5 px çizgi ağırlığında ve `currentColor` ile çalışır.
- Aktif ikon dolu, pasif ikon çizgi stilinde olabilir.
- Kontroller en az 44 × 44 px etkileşim alanına sahiptir.
- Birincil buton basıldığında `scale(0.96)` geri bildirimi verir.
- Focus görünümü her koyu yüzeyde belirgin ve kesintisizdir.

### 9.6 Hareket

Hareket bilgi hiyerarşisini açıklamak veya durum değişimini göstermek için kullanılır.

- Renk ve opacity geçişleri: 120–180 ms.
- Panel açılışı: 220–280 ms, düşük mesafe ve ease-out.
- Grafik veri güncellemeleri ani sıçrama yerine ölçülü interpolasyon kullanabilir; gerçek değeri geciktirmez.
- İlk sonuç gelişinde ana bloklar en fazla 60–80 ms aralıklarla görünebilir.
- Hover, fiyat güncellemesi ve yüksek frekanslı kontrollerde dekoratif animasyon kullanılmaz.
- `prefers-reduced-motion` durumunda dönüşüm ve sıralı girişler kaldırılır.
- Hiçbir yükleme göstergesi gerçek işlem ilerlemesini taklit etmez.

## 10. Grafik tasarımı

Grafik ürünün kanıt alanıdır; dekoratif arka plan değildir.

- Varsayılan grafik, ilk okumayı kolaylaştırmak için çizgi görünümüdür; MVP'de kullanıcı mum görünümüne geçebilir.
- Seçilen vadeye uygun varsayılan zaman aralığı açılır.
- Fiyat ekseni kullanıcının para birimi ve varlık hassasiyetine göre biçimlenir.
- Destek ve direnç seviyeleri ince çizgi ve doğrudan etiketle gösterilir.
- Tooltip; zaman, açık/yüksek/düşük/kapanış, hacim ve açık indikatör değerlerini içerir.
- Canlı veri güncellemesi grafik alanını yeniden ölçekleyerek sürekli zıplatmaz.
- Pozitif ve negatif seri ayrımı yalnızca renge bağlı değildir.
- Veri boşluğu, piyasa kapalı durumu ve gecikme grafiğin üzerinde açıkça belirtilir.
- Grafik, klavye ve ekran okuyucu kullanıcıları için eşdeğer kısa veri özeti sunar.

## 11. Durum tasarımları

Her ana yüzey aşağıdaki durumları tasarlanmadan tamamlanmış sayılmaz:

- İlk kullanım.
- Yükleniyor.
- Kısmi veri.
- Veri gecikmesi.
- Piyasa kapalı.
- Sonuç üretilemedi.
- Ağ bağlantısı kesildi.
- Yetki süresi doldu.
- Boş izleme listesi.
- Güncel veri geldi.

Hata mesajları teknik sağlayıcı adını kullanıcıya yüklemez. Mesaj; ne olduğunu, kullanıcının ne yapabileceğini ve verinin korunup korunmadığını söyler.

Örnek:

> Piyasa verisi şu anda güncellenemiyor. Seçimlerin kaydedildi; birkaç dakika sonra yeniden deneyebilirsin.

## 12. Veri ve sistem mimarisi

Sistem beş bağımsız sınırdan oluşur:

### 12.1 Web uygulaması

Kimlik, tercih akışı, sonuçlar, grafikler, izleme ve geçmiş ekranlarını sunar. Sunucu durumu ile arayüz durumu ayrıdır; fiyat akışı kesildiğinde uygulamanın geri kalanı çalışmaya devam eder.

### 12.2 Uygulama API'si

Kimlik doğrulama, kullanıcı tercihleri, analiz talepleri, geçmiş ve izleme listesi için kararlı bir sözleşme sağlar. İstemci hiçbir veri sağlayıcısına doğrudan gizli anahtarla bağlanmaz.

### 12.3 Piyasa veri katmanı

Her sağlayıcı bir adaptör arkasında tutulur. Adaptörler sağlayıcıya özel sembolleri ortak varlık kimliğine, fiyatları ortak zaman biçimine ve veri kalitesini standart meta verilere dönüştürür. Sağlayıcı değişikliği skor motorunu veya UI'ı yeniden yazmayı gerektirmez.

### 12.4 Özellik ve skor motoru

Zaman serilerinden indikatörleri hesaplar, kategori içi normalizasyon yapar, kalite kapılarını uygular ve versiyonlanmış skor çıktısı üretir. Aynı giriş ve aynı veri snapshot'ı aynı sonucu üretmelidir.

### 12.5 İş kuyruğu ve cache

Küresel taramalar istek süresine bağlanmaz. Tarama işi kuyruğa alınır; veri snapshot'ları ve hesaplanan özellikler uygun ömürlerle cache'lenir. Canlı fiyat ile tarihsel indikatör hesapları ayrı güncelleme hızlarına sahiptir.

## 13. Temel veri modeli

### User

- `id`
- `email`
- `locale`
- `baseCurrency`
- `timeZone`
- `createdAt`

### AnalysisRequest

- `id`
- `userId`
- `amount`
- `currency`
- `horizon`: `daily | weekly | monthly`
- `riskProfile`: `low | balanced | high`
- `requestedAt`
- `status`

### Asset

- `id`
- `symbol`
- `name`
- `assetClass`
- `exchangeOrVenue`
- `quoteCurrency`
- `tradingCalendar`
- `liquidityTier`

### ScoreResult

- `analysisRequestId`
- `assetId`
- `totalScore`
- `confidenceLevel`
- `dimensionScores`
- `reasons`
- `primaryRisk`
- `methodologyVersion`
- `dataSnapshotId`
- `calculatedAt`

### DataSnapshot

- `id`
- `providerReferences`
- `observedAt`
- `freshness`
- `completeness`
- `marketStatus`

Para değerleri kayan noktalı sayı olarak saklanmaz. Zamanlar UTC tutulur, kullanıcı saat diliminde gösterilir. Varlık sembolü tek başına kimlik olarak kullanılmaz.

## 14. Gizlilik, güvenlik ve ürün güveni

- Repo gizli anahtar içermez; yalnızca `.env.example` bulunur.
- İstemciye veri sağlayıcı anahtarı veya skor motorunun ayrıcalıklı yapılandırması gönderilmez.
- Oturumlar güvenli, süreli ve iptal edilebilir olur.
- Kullanıcı girdileri sunucu tarafında doğrulanır.
- Rate limit, kötüye kullanım tespiti ve audit log kritik uçlarda uygulanır.
- Analiz snapshot'ı, metodoloji sürümü ve veri zamanı denetlenebilir biçimde saklanır.
- Kullanıcı hesabını ve kişisel verisini silebilir.
- Üretim öncesi ürünün faaliyet gösterdiği pazarlarda finansal tanıtım, uygunluk ve yatırım tavsiyesi sınırları için uzman hukuk incelemesi yapılır.
- Yasal metinler arayüzün güven açığını kapatmak için kullanılmaz; risk bilgisi kararın yanında görünür.

## 15. Performans hedefleri

- Uygulama kabuğu hızlı bağlantıda 2 saniye içinde kullanılabilir olmayı hedefler.
- Daha önce hesaplanmış sonuçlar 1 saniye içinde açılır.
- Yeni küresel tarama ilerleme durumunu 500 ms içinde göstermeye başlar.
- İlk sonuç hedefi normal yükte 8 saniyenin altıdır; süre aşılırsa işlem arka planda güvenilir şekilde devam eder.
- Navigasyon ve input geri bildirimi 100 ms içinde hissedilir.
- Fiyat güncellemesi metin veya kolon genişliğinde kaymaya neden olmaz.
- Büyük grafik ve veri modülleri ihtiyaç anında yüklenir.

Bu değerler kullanıcı deneyimi hedefidir; gerçek sağlayıcı limitleriyle ölçülüp izlenir.

## 16. Erişilebilirlik ve yerelleştirme

- WCAG 2.2 AA hedeflenir.
- Tüm akış yalnızca klavyeyle tamamlanabilir.
- Görünür focus, semantik başlık sırası ve doğru form etiketleri zorunludur.
- Grafiklerin metinsel özeti ve veri tablosu alternatifi bulunur.
- Canlı fiyat değişimleri ekran okuyucuyu her tick'te rahatsız etmez; yalnızca anlamlı durum değişimleri duyurulur.
- Türkçe ve İngilizce metin uzunlukları test edilir.
- RTL desteği için fiziksel `left/right` yerine mantıksal yön özellikleri kullanılır.
- Para, yüzde, tarih ve saat `locale` ile biçimlenir.
- Renk körlüğü durumunda yükseliş/düşüş ve seçili/pasif ayrımları korunur.

## 17. Ölçüm ve analitik

Başarı yalnızca tıklamayla ölçülmez. MVP olayları:

- Kurulum akışının başlatılması ve tamamlanması.
- Tutar, vade ve risk adımlarındaki terk oranı.
- Analizin başarıyla sonuçlanması veya hata türü.
- Ana sonuç ile alternatiflerin açılma oranı.
- “Skor nasıl hesaplandı?” panelinin açılması.
- İzleme listesine ekleme.
- Aynı kullanıcı tarafından tekrar analiz başlatma.
- Veri gecikmesi veya kalite kapısı nedeniyle sonuç üretilememe.

Hedef metrikler:

- İlk analize ulaşma süresi.
- Tamamlanan analiz oranı.
- Sonuçtan detaya geçiş oranı.
- 7 ve 30 günlük geri dönüş.
- Skor açıklamasını gördükten sonra kullanıcı güveni araştırması.

Analitik olayları para miktarı gibi gereksiz hassas ayrıntıları taşımamalıdır.

## 18. Test stratejisi

### Skor motoru

- Her indikatör için deterministik birim testleri.
- Eksik mum, bölünme, sembol değişimi ve anormal fiyat testleri.
- Kategori içi normalizasyon testleri.
- Vade ve risk ağırlıklarının sınır testleri.
- Aynı snapshot'ın aynı skoru üretmesi.
- Eski veya düşük kaliteli veride skorun engellenmesi.

### Uygulama API'si

- Kimlik ve yetki testleri.
- Şema doğrulama.
- Rate limit ve tekrar deneme davranışı.
- Tarama işinin idempotency testi.
- Sağlayıcı kesintisi ve kısmi başarısızlık testleri.

### Arayüz

- Tutar → vade → risk → sonuç uçtan uca akışı.
- Mobil ve masaüstü kritik viewport'ları.
- Klavye, focus ve ekran okuyucu kontrolleri.
- Türkçe/İngilizce metin büyümesi.
- %200 zoom.
- Loading, empty, stale, offline ve error durumları.
- Değişen fiyatlarda layout shift kontrolü.
- Reduced motion davranışı.

### Görsel kalite kapısı

Her ana ekran uygulama öncesi ve release öncesi şu durumlarda görsel regresyon testine girer:

- Desktop açık veri.
- Desktop gecikmiş veri.
- Mobil açık veri.
- Mobil hata durumu.
- Uzun yerelleştirilmiş metin.
- Klavye focus görünümü.

## 19. Teslimat sırası

### Faz 1 — Ürün temeli

- Repo, kalite kontrolleri ve ortam yapılandırması.
- Tasarım tokenları ve uygulama kabuğu.
- Kimlik ve kullanıcı tercihleri.
- Tutar, vade ve risk akışı.
- Sahte olmayan, sabit test fixture'larıyla sonuç UI'ı.

### Faz 2 — Veri ve skor

- Sağlayıcı adaptör sözleşmesi.
- Varlık kimliklendirme ve tarihsel veri hattı.
- İndikatör hesaplama.
- Normalizasyon ve Phanfora Skoru v1.
- Veri kalite kapıları ve metodoloji sürümleme.

### Faz 3 — Canlı ürün akışı

- Kuyruk tabanlı küresel tarama.
- Gerçek sonuçlar ve grafikler.
- Varlık detayı, alternatifler ve açıklama paneli.
- İzleme listesi ve analiz geçmişi.

### Faz 4 — Güven ve yayın hazırlığı

- Güvenlik ve hukuk incelemeleri.
- Erişilebilirlik denetimi.
- Performans ve sağlayıcı kesinti testleri.
- Türkçe/İngilizce içerik doğrulaması.
- `app.phanfora.com` dağıtımı ve landing page bağlantısı.

## 20. MVP kabul kriterleri

MVP aşağıdakilerin tamamı sağlandığında yayınlanabilir kabul edilir:

1. Kullanıcı tutar, para birimi, vade ve risk profilini girerek analizi tamamlayabilir.
2. Sistem bir ana fırsat ve iki alternatifi gerçek, güncel ve kaynaklandırılmış veriden üretir.
3. Her sonuç toplam skor, beş alt skor, güven düzeyi, üçe kadar neden ve temel risk içerir.
4. Kullanıcı skorun metodolojisini ve veri zamanını görebilir.
5. Eski veya eksik veri yanlış bir güvenle skor üretmez.
6. Hisse, kripto, emtia, döviz ve endeksler kategori içinde normalize edilir.
7. Ana akış mobil ve masaüstünde, klavye ve ekran okuyucuyla tamamlanabilir.
8. Türkçe ve İngilizce arayüz, para ve zaman biçimleri doğru çalışır.
9. Kritik ekranların loading, empty, stale, offline ve error durumları uygulanmıştır.
10. Uygulama emir iletmez, para saklamaz ve garanti getiri dili kullanmaz.
11. Metodoloji sürümü ve veri snapshot'ı her sonuçla denetlenebilir şekilde saklanır.
12. Landing page bağımsız deploy edilmeye devam eder; uygulama `app.phanfora.com` üzerinden çalışır.

## 21. Nihai ürün cümlesi

Phanfora, küresel piyasa karmaşasını kullanıcı için tek bir anlaşılır karara indirger: **neye bakmalı, neden bakmalı ve hangi riski bilmeli.**
