# Sim of World - Detaylı Oyun Tasarım Belgesi (GDD)

## 1. Oyun Özeti (Game Overview)
**Oyun Adı:** Sim of World
**Tür:** Simülasyon / Tycoon / Idle RPG / Strateji
**Platform:** Web Tarayıcısı (Mobil Uyumlu / PWA)
**Konsept:** Oyuncuların sıfırdan başlayarak madencilik, tarım, hayvancılık ve sanayi sektörlerinde imparatorluk kurduğu, siyaset ve ticaretle etkileşime girdiği kapsamlı bir dünya simülasyonu.

---

## 2. Temel Oynanış Döngüsü (Core Loop)
1.  **Üret:** Maden, Tarla veya Çiftlik kurarak hammadde üret.
2.  **İşle:** Fabrikalar kurarak hammaddeleri değerli ürünlere dönüştür (Örn: Odun -> Kereste).
3.  **Sat/Ticaret Yap:** Ürünleri sistem marketine veya diğer oyunculara satarak Para kazan.
4.  **Geliştir:** Kazanılan parayla tesis seviyelerini yükselt, kapasiteyi ve hızı artır.
5.  **Eğitim & Lisans:** Yeni sektörlere girmek için karakterini eğit ve lisans satın al.
6.  **Yönet & Sosyalleş:** Mülk satın al, partilere katıl, siyasete gir veya banka/hastane işlet.

---

## 3. Ekonomi ve Kaynaklar (Economy & Resources)

### 3.1. Para Birimleri
*   **TL (Nakit):** Temel harcama birimi. Üretim satışından, günlük işlerden ve ticaretten kazanılır.
*   **Altın (Gold):** Nadir birim. Lisans yükseltmeleri, hızlı işlemler ve özel eşyalar için kullanılır.
*   **Elmas (Diamond):** Premium birim. Üst düzey geliştirmeler ve özel avantajlar için kullanılır.

### 3.2. Hammaddeler (Raw Materials)
*   **Madenler:** Odun, Taş, Demir, Kömür, Kum, Petrol, Bakır, Altın Parçası, Elmas, Uranyum.
*   **Tarım Ürünleri:** Buğday, Mısır, Meyve, Sebze, Pirinç, Patates, Zeytin.
*   **Hayvansal Ürünler:** Yumurta, Yün, Süt, Bal.

### 3.3. İşlenmiş Ürünler (Manufactured Goods)
*   **İnşaat:** Kereste, Tuğla, Cam, Çimento, Çelik.
*   **Gıda:** Unlu Mamuller, Hazır Yemek, Zeytinyağı, Tatlı & Şekerleme.
*   **Enerji:** Rüzgar Enerjisi, Güneş Enerjisi, Fosil Yakıt Enerjisi, Nükleer Enerji.
*   **Diğer:** Altın Külçe, Silah.

---

## 4. Üretim Tesisleri (Production Facilities)

### 4.1. Madenler (Mines)
Yerin altından veya doğadan hammadde çıkarılan tesislerdir.
*   **Türler:** Odun Kampı, Taş Ocağı, Demir Madeni, Kömür Madeni, Kum Ocağı, Petrol Kuyusu, Elmas Madeni, Uranyum Madeni, Bakır Madeni, Altın Madeni.
*   **Mekanik:** Belirli bir üretim süresi (sn/dk) sonunda depoya hammadde ekler.
*   **Gereksinim:** İlgili maden lisansı.

### 4.2. Tarlalar (Farms)
Topraktan bitkisel ürün elde edilen alanlardır.
*   **Türler:** Buğday, Mısır, Meyve Bahçesi, Sebze, Pirinç, Patates, Zeytinlik.
*   **Mekanik:** Ekim yapılır, süre sonunda hasat edilir.
*   **Gereksinim:** Tarım lisansı ve ilgili tohum lisansı.

### 4.3. Çiftlikler (Ranches)
Hayvan yetiştiriciliği yapılan tesislerdir.
*   **Türler:** Tavuk (Yumurta), Koyun (Yün), İnek (Süt), Arı (Bal).
*   **Mekanik:** Hayvanlar beslenir (Yem tüketimi), süre sonunda ürün verir.
*   **Gereksinim:** Hayvancılık lisansı.

### 4.4. Fabrikalar (Factories)
Hammaddeleri işleyerek katma değerli ürünlere dönüştürür.
*   **Dönüşüm Örnekleri:**
    *   Odun -> Kereste Fabrikası -> Kereste
    *   Kum -> Cam Fabrikası -> Cam
    *   Demir + Kömür -> Çelik Fabrikası -> Çelik
*   **Enerji Santralleri:** Şehre veya tesislere enerji sağlar (Rüzgar, Güneş, Kömür, Nükleer).

---

## 5. Yönetim Sistemleri (Management Systems)

### 5.1. Envanter ve Depo (Inventory)
*   Oyuncunun sahip olduğu tüm kaynakların tutulduğu yerdir.
*   Her tesisin kendi iç deposu (Stock) ve oyuncunun genel deposu (Inventory) vardır.
*   Depo kapasitesi sınırlıdır ve geliştirilebilir.

### 5.2. Lisans Sistemi (Licenses)
*   Oyunda her türlü üretim faaliyeti için **Lisans** gerekir.
*   **Seviye Sistemi:** Tesis seviyesi, lisans seviyesini geçemez. (Örn: 5. Seviye Maden için 5. Seviye Lisans şarttır).
*   **Maliyet:** Lisanslar Para, Altın ve Elmas ile satın alınır/yükseltilir.

### 5.3. Eğitim Sistemi (Education)
*   Lisans alabilmek için karakterin eğitimli olması gerekir.
*   **Kademeler:** İlkokul, Ortaokul, Lise, Önlisans, Lisans, Yüksek Lisans, Doktora vb.
*   **Mekanik:** Eğitim seviyesi arttıkça daha karmaşık ve karlı lisanslar (Nükleer, Bankacılık vb.) açılabilir hale gelir.

### 5.4. Geliştirme (Upgrades)
*   Tesislerin seviyesi artırılabilir.
*   **Etkileri:** Üretim Hızı Artışı, Depo Kapasitesi Artışı, İşçi Kapasitesi Artışı.
*   **Maliyet:** Para + İnşaat Malzemeleri (Kereste, Tuğla, Çimento, Demir vb.).
*   **Süre:** Geliştirme işlemi gerçek zamanlı bir süre alır (Örn: 10 dakika).

---

## 6. İşletme ve Mülkler (Business & Properties)

### 6.1. Mülkler (Real Estate)
Oyuncular pasif gelir veya statü için mülk satın alabilir.
*   **Türler:** Ev, Apartman, Dükkan, Ofis, Otel, Otopark, AVM, Spor Salonu, Kahve Dükkanı, Lunapark.
*   **Getiri:** Belirli aralıklarla kira geliri sağlar.
*   **Gereksinim:** Mülk Lisansı.

### 6.2. Banka
*   Oyuncular paralarını faize yatırabilir.
*   Kredi çekerek nakit ihtiyaçlarını karşılayabilirler.
*   Banka işletme lisansı alan oyuncular kendi bankalarını kurabilir.

### 6.3. Hastane
*   Karakterin sağlık durumunu iyileştirir.
*   Düşük sağlık, üretim verimliliğini düşürür.
*   Hastane işletmeciliği yapılabilir.

---

## 7. Sosyal ve Siyaset (Social & Politics)

### 7.1. Siyasi Partiler
*   Oyuncular parti kurabilir veya var olan partilere katılabilir.
*   **Roller:** Parti Başkanı, Başkan Yardımcısı, Genel Sekreter, Üye.
*   **Mekanik:** Partiler arası rekabet, bağış toplama ve seçimlere katılma.

### 7.2. Sohbet (Chat)
*   Global sohbet odası.
*   Oyuncular arası iletişim, ticaret pazarlığı ve siyasi propaganda.
*   "Toxic" mesaj filtresi ve loglama sistemi.

### 7.3. Profil
*   Her oyuncunun detaylı bir profili vardır.
*   İstatistikler, sahip olunan rozetler, parti üyeliği ve avatar görüntülenir.
*   Profil ziyaretçi sayısı takip edilir.

---

## 8. Teknik Altyapı (Technical Architecture)

### 8.1. Backend (Sunucu)
*   **Dil:** Node.js
*   **Framework:** Express.js
*   **Veritabanı:** MySQL (mysql2 kütüphanesi ile).
*   **Resim İşleme:** `sharp` kütüphanesi (Yüklenen resimleri optimize etmek ve boyutlandırmak için).
*   **Dosya Yükleme:** `multer` (Avatar ve parti logoları için).

### 8.2. Frontend (İstemci)
*   **Diller:** HTML5, CSS3, Vanilla JavaScript.
*   **Kütüphaneler:**
    *   `jQuery` (DOM manipülasyonu ve AJAX için).
    *   `Toastr.js` (Bildirimler için).
    *   `FontAwesome` (İkonlar için).
    *   `Google Fonts` (Rajdhani fontu).

### 8.3. Güvenlik ve Doğrulama
*   Tüm kritik işlemler (Satın alma, Yükseltme, Üretim) sunucu tarafında doğrulanır.
*   Zamanlayıcılar sunucu saati (`Date.now()`) ile senkronize edilir.
*   SQL Injection koruması (Prepared Statements).

### 8.4. Veritabanı Yapısı (Önemli Tablolar)
*   `users`: Kullanıcı temel verileri.
*   `inventory`: Kullanıcı eşyaları.
*   `licenses`: Kullanıcı lisans seviyeleri.
*   `player_mines`, `player_factories`, `player_farms`, `player_ranches`: Oyuncu tesisleri.
*   `mine_types`, `factory_types`, `farm_types`, `ranch_types`: Tesis konfigürasyonları.
*   `parties`, `party_members`: Siyaset sistemi.
*   `chat_messages`: Sohbet kayıtları.
