# Yeni Kredi Puanı Sistemi - Test ve Kullanım Kılavuzu

## Sistem Özeti

Eski sistem, kullanıcıların para yatırma spamı yaparak kolayca kredi puanı kasmasına izin veriyordu. Yeni sistem, bu sorunu çözmek için kapsamlı bir algoritma kullanır.

## Yeni Algoritmanın Özellikleri

### 1. Çoklu Faktör Analizi
Kredi puanı artık 7 farklı faktöre göre hesaplanıyor:

- **Hesap Yaşı** (0-10 puan): Eski hesaplar daha güvenilir
- **Borç Oranı** (0-20 puan): Bakiye/Borç oranı yüksekse iyi
- **Ödeme Geçmişi** (0-20 puan): Kredi ödemelerinde geçmiş performans
- **Spam Cezası** (0 ila -30 puan): Kötü davranışları cezalandırır
- **Bakiye İstikrarı** (0-10 puan): Yüksek ve istikrarlı bakiye
- **İşlem Çeşitliliği** (0-10 puan): Farklı işlem türleri
- **Mevduat Kullanımı** (0-10 puan): Mevduat hesabı kullanımı

**Toplam Puan:** 0-100 arası

### 2. Spam Tespiti ve Cezalandırma

#### Tespit Edilen Spam Davranışları:
- **Hızlı Ardışık İşlemler**: 5 dakikada 3'ten fazla aynı tip işlem
- **Mikro İşlemler**: 1000 TL altındaki çok sayıda işlem
- **24 Saat Limiti**: Günde 30'dan fazla işlem

#### Ceza Mekanizması:
- Her spam kriteri için -10 puan
- Maksimum ceza: -30 puan
- Cezalar günlük hesaplamada uygulanır

### 3. Günlük Değişim Sınırı

- Kredi puanı **günde maksimum ±5 puan** değişebilir
- Ani sıçramalar ve düşüşler engellenir
- Kademeli ve gerçekçi puan değişimi

### 4. Anlık Güncellemeler KALDIRILDİ

Artık şu işlemler kredi puanını **ANINDA** değiştirmez:
- ❌ Para yatırma (deposit)
- ❌ Para çekme (withdraw)
- ❌ Kredi ödeme (loan payment)
- ❌ Mevduat açma (deposit creation)
- ❌ Mevduat bozma (deposit break)
- ❌ Hesap kapatma girişimi

Tüm puanlar **günlük toplu hesaplama** ile güncellenir.

## Günlük Kredi Puanı Hesaplama Endpoint'i

### Kullanım
```bash
POST http://localhost:3000/api/admin/recalculate-credit-scores
Content-Type: application/json

{
  "adminPassword": "admin123"
}
```

### Özellikler
- Tüm banka hesaplarını tarar
- Her hesap için kapsamlı kredi analizi yapar
- Spam tespiti yapar
- Puanları kademeli günceller (±5 limit)
- Değişiklikleri transaction log'a kaydeder
- Özet rapor döner

### Cron Job Önerisi
Bu endpoint'i her gün bir kere çalıştırmak için cron job eklenebilir:
```bash
0 0 * * * curl -X POST http://localhost:3000/api/admin/recalculate-credit-scores \
  -H "Content-Type: application/json" \
  -d '{"adminPassword":"admin123"}'
```

## Algoritma Detayları

### 1. Hesap Yaşı Hesaplama
```javascript
const ageMonths = (now - createdAt) / (1000 * 60 * 60 * 24 * 30);
ageScore = Math.min(10, ageMonths * 2); // Her ay 2 puan, max 10
```

### 2. Borç Oranı Hesaplama
```javascript
if (loanDebt === 0) {
  debtScore = 20; // Borcu olmayan tam puan
} else {
  const ratio = balance / loanDebt;
  if (ratio >= 2) debtScore = 15;
  else if (ratio >= 1) debtScore = 10;
  else if (ratio >= 0.5) debtScore = 5;
  else debtScore = 0;
}
```

### 3. Spam Tespiti
```javascript
// Aynı tip işlemleri grupla
const depositGroup = transactions.filter(t => t.transaction_type === 'deposit');

// 5 dakikalık pencereler kontrol et
for (let i = 0; i < depositGroup.length - 2; i++) {
  const timeDiff = depositGroup[i] - depositGroup[i+2];
  if (timeDiff < 5 * 60 * 1000) {
    rapidTransactionPenalty = -10; // SPAM!
  }
}

// Mikro işlem kontrolü (< 1000 TL)
const microCount = transactions.filter(t => t.amount < 1000).length;
if (microCount > 20) {
  microTransactionPenalty = -10;
}

// 24 saat limit kontrolü
const last24h = transactions.filter(t => now - t.created_at < 24*60*60*1000);
if (last24h.length > 30) {
  dailyLimitPenalty = -10;
}
```

### 4. Final Hesaplama
```javascript
let score = 50; // Base score
score += ageScore;          // +0 to +10
score += debtScore;         // +0 to +20
score += paymentScore;      // +0 to +20
score += spamPenalty;       // -30 to 0
score += stabilityScore;    // +0 to +10
score += diversityScore;    // +0 to +10
score += depositScore;      // +0 to +10

score = Math.max(0, Math.min(100, score)); // Clamp 0-100
```

## Test Senaryoları

### Senaryo 1: Normal Kullanıcı
```
İşlemler:
- Ayda 1-2 kez para yatırma (>10000 TL)
- Düzenli mevduat kullanımı
- Kredi alıp zamanında ödeme

Beklenen Sonuç: 70-85 puan
```

### Senaryo 2: Spam Kullanıcı
```
İşlemler:
- 5 dakikada 10 kez 500 TL yatırma
- Günde 50+ mikro işlem
- Hiç mevduat kullanmama

Beklenen Sonuç: 30-45 puan (spam cezası -30)
```

### Senaryo 3: Yeni Kullanıcı
```
İşlemler:
- Hesap 1 haftalık
- Az işlem
- Borç yok

Beklenen Sonuç: 50-55 puan (base score)
```

### Senaryo 4: Kötü Kredi Geçmişi
```
İşlemler:
- Kredi aldı ama ödemedi
- Bakiye < Borç
- Sık mevduat bozma

Beklenen Sonuç: 20-35 puan
```

## Manuel Test

1. **Sunucuyu Başlat**
   ```bash
   npm start
   ```

2. **Spam Davranışı Simüle Et**
   - Bank Account Detail sayfasını aç
   - Hızlıca 10 kez ardışık 500 TL yatır
   - Not: Puan hemen değişmez!

3. **Günlük Hesaplamayı Çalıştır**
   ```bash
   curl -X POST http://localhost:3000/api/admin/recalculate-credit-scores \
     -H "Content-Type: application/json" \
     -d '{"adminPassword":"admin123"}'
   ```

4. **Sonuçları Kontrol Et**
   - Response'da score değişikliklerini gör
   - Bank Transaction log'larında "Günlük Kredi Puanı Hesaplaması" kayıtlarını kontrol et
   - Spam cezasının uygulandığını doğrula

## Sistem Avantajları

✅ **Spam Koruması**: Para yatırma spamı artık işe yaramaz  
✅ **Gerçekçi Puanlar**: Kademeli değişim, ani sıçramalar yok  
✅ **Adil Sistem**: Çoklu faktör, tek boyutlu değil  
✅ **Performans**: Günlük batch işlem, anlık hesaplama yok  
✅ **Şeffaflık**: Tüm değişiklikler transaction log'da  
✅ **Esneklik**: Faktör ağırlıkları kolayca ayarlanabilir  

## Gelecek İyileştirmeler

- [ ] Node-cron ile otomatik günlük çalıştırma
- [ ] Admin panelde score hesaplama tetikleme butonu
- [ ] Kullanıcıya score breakdown gösterme (hangi faktör ne kadar etkiledi)
- [ ] Spam threshold'larını config dosyasında tutma
- [ ] Score değişim geçmişi grafiği
