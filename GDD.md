# Sim of World - Oyun Tasarım Belgesi (GDD)

## 1. Oyun Özeti (Game Overview)
**Oyun Adı:** Sim of World
**Tür:** Simülasyon / Tycoon / Idle RPG
**Platform:** Web Tarayıcısı (Mobil Uyumlu)
**Konsept:** Oyuncuların sıfırdan başlayarak madenler kurduğu, fabrikalar işlettiği, ticaret yaptığı ve karakterini geliştirdiği gerçek zamanlı bir dünya simülasyonu.

### 1.1. Temel Amaç
Oyuncu, kaynakları toplayarak ve işleyerek ekonomik gücünü artırmalı, lisanslar alarak yeni sektörlere (Hastane, Banka, Fabrika) girmeli ve sıralamada en üst seviyeye çıkmalıdır.

---

## 2. Oynanış Mekanikleri (Gameplay Mechanics)

### 2.1. Madencilik ve Kaynaklar
Oyunun temel ekonomi döngüsüdür.
*   **Maden Türleri:** Odun, Taş, Demir, Kömür, Petrol, Bakır, Altın, Elmas, Uranyum.
*   **İşleyiş:** Her maden belirli bir süre ve kapasite ile üretim yapar.
*   **Geliştirme:** Maden seviyesi arttıkça üretim hızı ve depo kapasitesi artar.

### 2.2. AR-GE (Araştırma ve Geliştirme)
Oyuncunun teknolojisini geliştirdiği merkezdir.
*   **Sistem:** Her maden veya işletme türü için ayrı araştırma ağacı bulunur.
*   **Maliyet:** Para, Altın ve ileri seviyelerde Elmas gerektirir.
*   **Süreç:** Gerçek zamanlı sayaç işler (Sunucu tabanlı).
*   **Etki:** Araştırma tamamlandığında ilgili sektörde %5-%10 verimlilik artışı sağlar.

### 2.3. Lisans Sistemi
Yeni sektörlere giriş kapısıdır.
*   **Mantık:** Bir madeni veya işletmeyi kurmak/yükseltmek için önce o işin "Lisansına" sahip olunmalıdır.
*   **Kademeler:** Her lisansın seviyesi vardır. Örneğin, 5. Seviye Demir Madeni kurmak için 5. Seviye Demir Lisansı gerekir.
*   **Satın Alma:** Yüksek miktarda Para ve İtibar (veya Altın) gerektirir.

### 2.4. Günlük İşler (Daily Jobs)
Oyuncunun oyunda aktif kalmasını sağlayan kısa süreli görevlerdir.
*   **Örnekler:** "Kargo Taşıma", "Güvenlik Vardiyası", "Veri Girişi".
*   **Ödül:** Para, XP (Tecrübe Puanı) ve nadiren Altın.
*   **Mekanik:** İşi başlat -> Süre sayar -> Bitince ödülü topla.

### 2.5. İşletmeler (Businesses)
*   **Fabrikalar:** Ham madenleri işleyerek daha değerli materyallere dönüştürür (Örn: Odun -> Kereste).
*   **Hastane:** Oyuncunun "Sağlık" değerini yeniler. Sağlık düşükse çalışma verimi düşer.
*   **Banka:** Para yatırma (Faiz geliri) ve Kredi çekme işlemleri.

---

## 3. Ekonomi Sistemi (Economy)

### 3.1. Para Birimleri
1.  **TL (Nakit):** Temel harcama birimi. Maden satışından ve işlerden kazanılır.
2.  **Altın (Gold):** Değerli birim. Lisans yükseltme ve hızlı işlemler için kullanılır.
3.  **Elmas (Diamond):** Premium birim. Çok ileri seviye AR-GE ve özel eşyalar için kullanılır.

### 3.2. Karakter İstatistikleri
*   **Enerji:** İş yapmak için gereklidir. Zamanla veya yemekle dolar.
*   **Sağlık:** Hastalanınca düşer, hastanede iyileşir.
*   **XP / Seviye:** Oyuncu seviyesi arttıkça yeni bölgeler ve özellikler açılır.

---

## 4. Kullanıcı Arayüzü (UI/UX)

*   **Tema:** "Dark Mode" (Koyu Tema).
*   **Renk Paleti:**
    *   Arkaplan: `#0d0d0d` (Koyu Gri/Siyah)
    *   Vurgular: `#00e5ff` (Camgöbeği), `#2ecc71` (Yeşil), `#ffd700` (Altın).
*   **Font:** 'Rajdhani' (Teknolojik ve modern görünüm).
*   **Bildirimler:** `Toastr.js` kullanılarak sağ üst köşede şık uyarılar.
*   **Navigasyon:** Alt bar (Mobil uyumlu) veya Sol Sidebar (Masaüstü).

---

## 5. Teknik Altyapı (Technical Architecture)

*   **Backend:** Node.js + Express.
*   **Veritabanı:** MySQL (İlişkisel veritabanı).
    *   *Tablolar:* `users`, `inventory`, `arge_levels`, `licenses`, `active_daily_jobs`.
*   **Güvenlik:**
    *   Tüm zamanlayıcılar (Timer) sunucu tarafında (`Date.now()`) kontrol edilir.
    *   Maliyet hesaplamaları sunucuda yapılır, istemciye güvenilmez.
*   **Frontend:** HTML5, CSS3, Vanilla JS + jQuery (AJAX işlemleri için).

---

## 6. Gelecek Planları (Roadmap)

1.  **Pazar Yeri (Marketplace):** Oyuncuların birbirine hammadde satabilmesi.
2.  **Klan/Şirket Sistemi:** Oyuncuların birleşip ortak fabrika kurması.
3.  **Borsa:** Maden fiyatlarının arza/talebe göre değişmesi.
4.  **Liderlik Tablosu:** En zengin ve en gelişmiş oyuncuların sıralaması.
