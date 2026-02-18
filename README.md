Geliştirme Dokümantasyonu

Bu proje, "Sim of World" adlı web tabanlı bir strateji ve simülasyon oyununun geliştirme dosyalarını içerir. Proje, **Node.js (Express)** backend ve **MySQL** veritabanı üzerinde çalışan kapsamlı bir ekonomi ve yönetim simülasyonudur.

Aşağıda, aktif olarak çalışan backend sistemlerinin mantığı, matematiksel formülleri ve teknik detayları yer almaktadır.

## 🏥 Hastane Sistemi (Backend Entegre)

Hastane sistemi, oyuncuların sağlık hizmeti alabileceği ve hastane sahiplerinin bu hizmeti sunarak gelir elde edebileceği kapsamlı bir modüldür.

### 1. Hastane Geliştirme Mantığı (Upgrade Logic)

Hastaneler seviye atladıkça kapasiteleri artar, tedavi süreleri kısalır ancak geliştirme maliyetleri ve süreleri "kolaydan zora" doğru artan bir eğri izler.

#### Maliyet Formülleri
Geliştirme maliyetleri her seviyede katlanarak artar:

*   **Para Maliyeti:**
    $$ 250,000 \times 1.65^{(Seviye - 1)} $$
*   **Altın Maliyeti:**
    $$ 100 \times Seviye^{1.8} $$
*   **Elmas Maliyeti:**
    $$ 25 \times (Seviye - 4)^2 $$
    *(Not: Elmas maliyeti sadece 5. seviye ve sonrasında başlar)*

#### Süre ve Kapasite Formülleri

*   **Geliştirme Süresi:** $$ Seviye \times 3 \text{ Saat} $$
*   **Hasta Kapasitesi:** $$ Seviye \times 5 $$

### 2. Tedavi Mantığı

*   **Tedavi Süresi:**
    $$ \text{Süre (dk)} = \max(3, 20 - (Seviye - 1) \times 2) $$
    *(Seviye 1'de 20 dakika, Seviye 10'da 3 dakika)*
*   **İşleyiş:** Oyuncu tedavi ücretini öder, hastane kasasına para girer ve tedavi süresi başlar. Süre bitiminde oyuncunun sağlığı 100 olur.

---

## 🏦 Banka Sistemi (Backend Entegre)

Oyuncuların kendi bankalarını kurabildiği, kredi verip mevduat toplayabildiği gelişmiş finans sistemi.

### 1. Banka Kurulumu ve Yönetimi
*   **Kurulum Maliyeti:** 100.000 Para.
*   **Gelir Modeli:** Hesap açılış ücretleri, transfer ücretleri ve kredi faizleri.
*   **Kasa:** Banka sahibi kasaya para yatırabilir veya çekebilir.

### 2. Bankacılık İşlemleri
*   **Hesap Açma:** Bankanın belirlediği ücret karşılığında IBAN oluşturulur.
*   **Transfer:** Göndericiden `Miktar + Transfer Ücreti` düşer, alıcıya `Miktar` gider. Ücret bankaya kalır.
*   **Mevduat (Vadeli Hesap):**
    *   Oyuncu parasını belirli bir süre kilitler.
    *   **Faiz Geliri:** `Miktar * Faiz Oranı * (Süre / 60)`
    *   **Erken Bozma:** %3 ceza kesilir ve kredi puanı düşer.

### 3. Kredi Sistemi ve Kredi Puanı (Credit Score)
Oyuncuların kredi çekebilmesi için "Kredi Puanı" sistemi geliştirilmiştir.
*   **Puan Kazanma:** Düzenli mevduat kullanımı, para yatırma ve zamanında kredi ödeme puanı artırır.
*   **Limitler:**
    *   < 30k: Puan gerekmez.
    *   50k+: 20 Puan
    *   100k+: 30 Puan
    *   250k+: 50 Puan
    *   500k+: 90 Puan
*   **Faiz:** Bankanın belirlediği kredi faiz oranı eklenerek geri ödeme planı oluşturulur.

---

## ⛏️ Maden ve AR-GE Sistemi (Backend Entegre)

Oyuncuların enerji ve sağlık harcayarak hammadde topladığı sistem.

### 1. Madencilik Mantığı
*   **Tüketim:** Enerji ve Sağlık harcanır. Seviye arttıkça tüketim düşer:
    $$ \text{Tüketim} = \max(5, 10 - \lfloor(Seviye - 1) \times 0.5\rfloor) $$
*   **Şans Faktörü:**
    $$ \text{Şans} = 0.30 + (Seviye - 1) \times 0.05 \quad (\text{Maks } 0.75) $$
    *(Rezerv %20'nin altındaysa şans yarıya düşer)*

### 2. AR-GE (Geliştirme)
Maden seviyesini artırmak için AR-GE yatırımı yapılır.
*   **Maliyet:** $$ 5000 \times 1.8^{(Seviye - 1)} \text{ Para} $$
*   **Süre:** $$ Seviye \times 60 \text{ Saniye} $$

### 3. Rezerv Araştırması
Maden rezervi tükendiğinde "Rezerv Araştırması" yapılarak rezerv yenilenir.
*   **Maliyet:** $$ 2000 \times Seviye $$
*   **Sonuç:** Maksimum kapasitenin %30-%100'ü arasında rastgele rezerv bulunur.

---

## 🏭 Fabrika, Pazar ve Meclis (Frontend / Prototip)

Bu sistemlerin arayüzleri (`factory.html`, `market.html`, `council.html`) hazırlanmış olup, backend entegrasyonları veya `game-engine.js` üzerinden istemci taraflı mantıkları geliştirilme aşamasındadır.
*   **Fabrika:** Hammadde -> Ürün dönüşümü.
*   **Pazar:** Dinamik fiyatlı ticaret borsası.
*   **Meclis:** Oylama ve yasa teklifleri.

---

## 🛠️ Teknik Altyapı

*   **Backend:** Node.js & Express
*   **Veritabanı:** MySQL (İlişkisel veritabanı: `users`, `hospitals`, `banks`, `inventory`, `arge_levels` tabloları)
*   **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
*   **API Yapısı:** RESTful API
    *   `/api/hospitals/*`
    *   `/api/banks/*`
    *   `/api/mine` & `/api/arge/*`
    *   `/api/user-stats/*`

### Önemli Dosyalar
*   `server.js`: Tüm backend mantığı, API endpoint'leri ve oyun döngüleri.
*   `game-engine.js`: İstemci taraflı oyun döngüsü ve UI yardımcıları.
*   `hospital-list.html`: Hastane listesi ve tedavi ekranı.
*   `hospital-management.html`: Hastane yönetim paneli.
*   `bank.html` & `bank-management.html`: Banka arayüzleri.
