# Veritabanı Kurulumu

Bu proje için gerekli tüm veritabanı tablolarını oluşturmak ve varsayılan verileri yüklemek için aşağıdaki adımları izleyin.

## Gereksinimler

- MySQL sunucusu çalışıyor olmalıdır.
- `simworld` adında bir veritabanı oluşturulmuş olmalıdır (veya script içindeki bağlantı ayarlarını düzenleyin).
- `package.json` içindeki bağımlılıklar yüklenmiş olmalıdır (`npm install`).

## Kurulum Scripti

Tüm tabloları oluşturmak ve başlangıç verilerini (maden ayarları, mülk tipleri, işler vb.) yüklemek için şu komutu çalıştırın:

```bash
node scripts/setup_full_database.js
```

Bu script şunları yapar:
1. Veritabanına bağlanır.
2. Eksik olan tüm tabloları (`IF NOT EXISTS` kullanarak) oluşturur.
3. `property_types`, `mine_settings`, `daily_jobs`, `farm_types`, `ranch_types` gibi tablolara varsayılan verileri ekler.

## Tablolar

Oluşturulan tablolar:
- `users`: Kullanıcı bilgileri
- `notifications`: Bildirimler
- `toxic_logs`: Küfür/hakaret logları
- `profile_visits`: Profil ziyaretleri
- `profile_comments`: Profil yorumları
- `user_logs`: Kullanıcı aktivite logları
- `active_educations`: Devam eden eğitimler
- `licenses`: Lisanslar (kod içinde yönetilir, tablo opsiyonel)
- `player_mines`: Oyuncu madenleri
- `mine_logs`: Maden üretim logları
- `mine_active_workers`: Maden işçileri
- `mine_settings`: Maden üretim süreleri
- `arge_levels`: Ar-Ge seviyeleri
- `property_types`: Mülk tipleri ve özellikleri
- `player_properties`: Oyuncu mülkleri
- `parties`: Siyasi partiler
- `chat_messages`: Sohbet mesajları
- `message_reports`: Mesaj şikayetleri
- `daily_jobs`: Günlük işler
- `active_daily_jobs`: Devam eden işler
- `completed_daily_jobs`: Tamamlanan işler
- `hospitals`: Hastaneler
- `hospital_treatments`: Tedavi geçmişi
- `hospital_active_treatments`: Yatan hastalar
- `farm_types`: Çiftlik tipleri
- `player_farms`: Oyuncu çiftlikleri
- `ranch_types`: Hayvancılık tipleri
- `player_ranches`: Oyuncu hayvancılık tesisleri
- `ranch_active_workers`: Çiftlik işçileri
- `ranch_logs`: Çiftlik logları
- `banks`: Bankalar
- `bank_accounts`: Banka hesapları
- `bank_deposits`: Vadeli hesaplar
