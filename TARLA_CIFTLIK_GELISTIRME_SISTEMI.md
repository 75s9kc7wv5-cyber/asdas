# Tarla ve Çiftlik Geliştirme Sistemi

## 📋 Sistem Özeti
Tarla (Farm) ve Çiftlik (Ranch) işletmelerini seviye bazlı geliştirme sistemi. Oyuncular işletmelerini geliştirerek işçi kapasitesi ve depo kapasitesini artırabilir.

---

## 🏗️ Veritabanı Yapısı

### `player_farms` Tablosu
- **level**: İşletmenin mevcut seviyesi (başlangıç: 1)
- **is_upgrading**: Geliştirme devam ediyor mu? (0/1)
- **upgrade_end_time**: Geliştirme bitiş zamanı (DATETIME)
- **max_workers**: Maksimum işçi sayısı
- **capacity**: Depo kapasitesi

### `player_ranches` Tablosu
- **level**: İşletmenin mevcut seviyesi (başlangıç: 1)
- **is_upgrading**: Geliştirme devam ediyor mu? (0/1)
- **upgrade_end_time**: Geliştirme bitiş zamanı (DATETIME)
- **max_workers**: Maksimum işçi sayısı
- **capacity**: Depo kapasitesi

### `farm_levels` Tablosu (Seviye Maliyetleri)
| Seviye | Para     | Altın | Elmas | Tahta | Tuğla | Çimento | Cam | Çelik | Süre (sn) | İşçi+ | Depo+ |
|--------|----------|-------|-------|-------|-------|---------|-----|-------|-----------|-------|-------|
| 2      | 100,000  | 100   | 20    | 200   | 200   | 100     | 100 | 50    | 600       | +5    | +500  |
| 3      | 100,000  | 150   | 30    | 300   | 300   | 150     | 150 | 75    | 900       | +5    | +500  |
| 4      | 100,000  | 200   | 40    | 400   | 400   | 200     | 200 | 100   | 1200      | +5    | +500  |
| 5      | 100,000  | 250   | 50    | 500   | 500   | 250     | 250 | 125   | 1500      | +5    | +500  |
| 6      | 100,000  | 300   | 60    | 600   | 600   | 300     | 300 | 150   | 1800      | +5    | +500  |

### `ranch_levels` Tablosu (Seviye Maliyetleri)
| Seviye | Para       | Altın | Elmas | Tahta | Tuğla | Çimento | Cam | Çelik | Süre (sn) | İşçi+ | Depo+ |
|--------|------------|-------|-------|-------|-------|---------|-----|-------|-----------|-------|-------|
| 2      | 2,000,000  | 100   | 20    | 200   | 200   | 100     | 100 | 50    | 600       | +5    | +500  |
| 3      | 3,000,000  | 150   | 30    | 300   | 300   | 150     | 150 | 75    | 900       | +5    | +500  |
| 4      | 4,000,000  | 200   | 40    | 400   | 400   | 200     | 200 | 100   | 1200      | +5    | +500  |
| 5      | 5,000,000  | 250   | 50    | 500   | 500   | 250     | 250 | 125   | 1500      | +5    | +500  |
| 6      | 6,000,000  | 300   | 60    | 600   | 600   | 300     | 300 | 150   | 1800      | +5    | +500  |

---

## 🎮 Oyun Mekanikleri

### 1. Geliştirme Başlatma
**Gereksinimler:**
- ✅ Yeterli **Lisans Seviyesi** (işletme tipi için gerekli lisans seviyesi ≥ hedef seviye)
- ✅ Yeterli **Para** (Money)
- ✅ Yeterli **Altın** (Gold)
- ✅ Yeterli **Elmas** (Diamond)
- ✅ Yeterli **Malzemeler** (Tahta, Tuğla, Çimento, Cam, Çelik)
- ⚠️ İşletme şu anda geliştiriliyor olmamalı

**Akış:**
1. Kullanıcı `farm-management.html` veya `ranch-management.html` sayfasında "Geliştir" butonuna tıklar
2. Backend maliyetleri ve lisans seviyesini kontrol eder
3. Tüm kaynakları düşer (transaction ile)
4. `is_upgrading = 1` ve `upgrade_end_time` ayarlanır
5. Geliştirme başlatılır

### 2. Geliştirme Tamamlanması
**2 Yöntem:**

#### A) Otomatik Tamamlama (Background Task)
- Sunucu her 60 saniyede bir `upgrade_end_time <= NOW()` olan işletmeleri kontrol eder
- Süre dolmuş işletmeler otomatik olarak seviye atlar
- Kullanıcıya bildirim gönderilir

#### B) Manuel Tamamlama
- Kullanıcı süre dolduğunda "Tamamla" butonuna tıklar
- API `/api/farms/complete-upgrade/:farmId` veya `/api/ranches/complete-upgrade/:ranchId`
- Seviye artırılır, kapasite güncellemesi yapılır

### 3. Hızlandırma (Elmas ile)
**Maliyet:** `Seviye × 10 Elmas`

**Akış:**
1. Kullanıcı geliştirme devam ederken "Hızlandır" butonuna tıklar
2. API `/api/farms/speed-up/:farmId` veya `/api/ranches/speed-up/:ranchId`
3. Elmalar düşer
4. Geliştirme anında tamamlanır
5. Seviye ve kapasiteler güncellenir

---

## 🔌 Backend API Endpoints

### Tarla (Farms)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET`  | `/api/farms/upgrade-info/:farmId?userId=X` | Geliştirme bilgilerini getirir |
| `POST` | `/api/farms/start-upgrade/:farmId` | Geliştirmeyi başlatır |
| `POST` | `/api/farms/complete-upgrade/:farmId` | Geliştirmeyi tamamlar |
| `POST` | `/api/farms/speed-up/:farmId` | Elmas ile hızlandırır |

### Çiftlik (Ranches)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET`  | `/api/ranches/upgrade-info/:ranchId?userId=X` | Geliştirme bilgilerini getirir |
| `POST` | `/api/ranches/start-upgrade/:ranchId` | Geliştirmeyi başlatır |
| `POST` | `/api/ranches/complete-upgrade/:ranchId` | Geliştirmeyi tamamlar |
| `POST` | `/api/ranches/speed-up/:ranchId` | Elmas ile hızlandırır |

---

## 🎨 Frontend Sayfaları

### `farm-management.html`
- Tarla işletmesi detaylarını gösterir
- Geliştirme kartı ile:
  - Mevcut seviye
  - Geliştirme maliyetleri (Para, Altın, Elmas, Malzemeler)
  - Kullanıcının mevcut kaynaklarını gösterir (✅/❌)
  - "Geliştirmeyi Başlat" butonu
  - Geliştirme süreci için sayaç (timer)
  - "Tamamla" / "Hızlandır" butonları

### `ranch-management.html`
- Çiftlik işletmesi detaylarını gösterir
- Aynı geliştirme kartı yapısı

---

## 📊 Seviye Kazanımları

Her seviye artışında:
- **+5 İşçi Kapasitesi** (max_workers)
- **+500 Depo Kapasitesi** (capacity)

**Örnek:**
- Seviye 1: 5 işçi, 10,000 depo
- Seviye 2: 10 işçi, 10,500 depo
- Seviye 3: 15 işçi, 11,000 depo
- ...

---

## ⚙️ Teknik Detaylar

### Transaction Güvenliği
Tüm geliştirme işlemleri database transaction ile yapılır:
```javascript
db.beginTransaction()
  -> Para/Altın/Elmas düş
  -> Malzemeleri düş
  -> is_upgrading = 1 yap
  -> upgrade_end_time ayarla
db.commit()
```

### Otomatik Kontrol (Background Task)
```javascript
setInterval(() => {
    // Her 60 saniyede bir tamamlanmış geliştirmeleri kontrol et
    db.query('SELECT * FROM player_farms WHERE is_upgrading = 1 AND upgrade_end_time <= NOW()')
    // Tamamla ve bildirim gönder
}, 60000);
```

### Lisans Kontrolü
- Her tarla/çiftlik tipi için ayrı lisans gerekir
- Örn: Buğday Tarlası → "wheat" lisansı
- Lisans seviyesi ≥ hedef işletme seviyesi olmalı

---

## 🎯 Kullanım Senaryosu

**Oyuncu: Buğday Tarlasını Seviye 2'ye Geliştirmek İstiyor**

1. ✅ Buğday Lisansı Seviye 2+ var
2. ✅ 100,000₺ parası var
3. ✅ 100 altını var
4. ✅ 20 elması var
5. ✅ Envanterde: 200 Tahta, 200 Tuğla, 100 Çimento, 100 Cam, 50 Çelik var

**Akış:**
1. `farm-management.html?id=7` sayfasına gider
2. Geliştirme kartında tüm maliyetleri ve kazanımları görür
3. "Geliştirmeyi Başlat" butonuna tıklar
4. 600 saniye (10 dakika) sayaç başlar
5. Beklerken başka işlerini yapar

**Tamamlama:**
- **Otomatik:** 10 dakika sonra sunucu otomatik tamamlar, bildirim gelir
- **Manuel:** "Tamamla" butonuna tıklar
- **Hızlandırma:** 20 elmas harcayarak anında tamamlar (Seviye 2 × 10 = 20💎)

---

## ✅ Sistem Durumu

### ✅ Tamamlanmış
- [x] Backend API endpoints (start, complete, speed-up)
- [x] Farm/Ranch levels tabloları ve veri
- [x] Frontend UI (farm-management.html, ranch-management.html)
- [x] Geliştirme kartı ve maliyet gösterimi
- [x] Timer sistemi
- [x] Otomatik background tamamlama
- [x] Transaction güvenliği
- [x] Lisans kontrolü
- [x] Bildirim sistemi

### 🎮 Kullanıma Hazır!
Sistem tamamen fonksiyonel ve test edilebilir durumda.

**Sunucu:** `http://localhost:3000`
**Test Sayfası:** 
- Tarla: `farm-management.html?id=FARM_ID`
- Çiftlik: `ranch-management.html?id=RANCH_ID`
