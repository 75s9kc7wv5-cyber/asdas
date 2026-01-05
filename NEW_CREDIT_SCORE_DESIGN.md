# Kredi Puanı Sistemi - Banka Karlılığı Odaklı

## 📊 Genel Yapı

**Puan Aralığı:** 0 - 1000 puan
**Başlangıç Puanı:** 500 puan (orta seviye)
**Güncelleme:** Her işlemde anlık
**Mantık:** Bankaya ne kadar para kazandırırsan o kadar puan
**Hedef:** Orta vadeli, dengeli ilerleme (1-2 hafta)

---

## 💰 İşlem Bazlı Puan Kuralları (BANKA KARLILIK ODAKLI)

### 🏆 YÜKSEK PUAN (Bankaya Çok Para Kazandıran)

#### 1. MEVDUAT HESABI AÇMA
**Mantık:** Bankanın en karlı müşterisi! Para yatırıp faiz alırsın ama banka o parayı kullanarak daha fazla kazanır.

**Formül:** `Puan = (Miktar / 5000) + (Faiz Oranı × 10) + 20`

**Örnekler:**
- 50,000 TL, %5 faiz → (50000/5000) + (5×10) + 20 = **+80 puan** 🔥
- 100,000 TL, %10 faiz → (100000/5000) + (10×10) + 20 = **+140 puan** 🔥
- 200,000 TL, %3 faiz → (200000/5000) + (3×10) + 20 = **+90 puan**

**Bonus:** Süre önemli değil, miktar ve faiz oranı önemli!

---

#### 2. KREDİ FAİZİ ÖDEME (Bankaya Direkt Gelir!)
**Mantık:** Kredi faizi bankanın en büyük gelir kaynağı!

**Formül:** `Puan = (Ödenen Faiz / 100) + 30`

**Örnekler:**
- 100,000 TL kredi, %6 faiz, tam ödeme → Ödenen faiz: 6,000 TL
  → (6000/100) + 30 = **+90 puan** 🔥
  
- 500,000 TL kredi, %10 faiz → Faiz: 50,000 TL
  → (50000/100) + 30 = **+530 puan** 🔥🔥🔥
  
- 50,000 TL kredi, %5 faiz → Faiz: 2,500 TL
  → (2500/100) + 30 = **+55 puan**

**Not:** Sadece TAM ÖDEME yapılırsa puan verilir (çünkü banka kazancını almış olur)

---

### 💚 ORTA PUAN (Bankaya Katkı Sağlayan)

#### 3. PARA YATIRMA (Likidite Sağlar)
**Mantık:** Bakiye artışı bankanın gücünü artırır, ama direkt kazanç değil.

**Formül:** `Puan = Miktar / 20000`

**Örnekler:**
- 20,000 TL → **+1 puan**
- 100,000 TL → **+5 puan**
- 500,000 TL → **+25 puan**
- 1,000,000 TL → **+50 puan**

---

#### 4. YÜKSEK BAKİYE TUTMA (Günlük Bonus)
**Mantık:** Yüksek bakiye bankanın kullanabileceği para havuzunu artırır.

**Formül:** Günde 1 kez hesaplanır: `Bonus = Bakiye / 100000`

**Örnekler:**
- 100,000 TL bakiye → Günde **+1 puan**
- 500,000 TL bakiye → Günde **+5 puan**
- 1,000,000 TL bakiye → Günde **+10 puan**

**Not:** Her gece 00:00'da otomatik eklenir

---

#### 5. TRANSFER YAPMA (İşlem Ücreti)
**Mantık:** Her transferden banka küçük bir ücret alır.

**Formül:** `Puan = (Miktar × Transfer Ücreti) / 1000`

**Örnekler:**
- 100,000 TL transfer, %2 ücret → (100000 × 0.02) / 1000 = **+2 puan**
- 500,000 TL transfer, %3 ücret → (500000 × 0.03) / 1000 = **+15 puan**

---

### ⚠️ DÜŞÜK/NEGATİF PUAN (Bankaya Yük)

#### 6. PARA ÇEKME
**Mantık:** Likidite azalır, banka zayıflar.

**Formül:** `Puan = -(Miktar / 50000)`

**Örnekler:**
- 50,000 TL → **-1 puan**
- 100,000 TL → **-2 puan**
- 500,000 TL → **-10 puan**

---

#### 7. KREDİ ALMA (Risk!)
**Mantık:** Kredi vermek risk, ama faiz geliri var. Açılışta küçük ceza.

**Formül:** `Puan = -20 (sabit açılış cezası)`

**Örnekler:**
- Her kredi → **-20 puan**

**Not:** Ama krediyi ödeyince faiz üzerinden büyük puan gelir!

---

#### 8. MEVDUAT ERKEN BOZMA (Çok Kötü!)
**Mantık:** Banka planladığı kazancı kaybeder.

**Formül:** `Puan = -(Açılışta Kazanılan Puan) - 50`

**Örnekler:**
- 100,000 TL mevduat açmıştı (+140 puan)
- Erken bozdu → **-190 puan** (140 + 50 ek ceza) 💀

---

#### 9. HESAP KAPATMA
**Mantık:** Müşteri kaybı.

**Formül:** `Puan = -30 (sabit)`

---

### 🎁 BONUS SİSTEMİ

#### 10. MEVDUAT TAMAMLAMA BONUSU
**Mantık:** Anlaşma tamamlandı, banka kazandı!

**Formül:** `Bonus = +20 puan (sabit)`

**Örnek:**
- Mevduat süresi dolunca otomatik → **+20 puan**
- **Toplam Kazanç:** Açılış (+80-140) + Tamamlama (+20) = **+100-160 puan!**

---

#### 11. SADAKAT BONUSU (Her 10 Başarılı Mevduat)
**Formül:** `Bonus = +50 puan`

**Örnek:**
- 10. mevduatı tamamladın → **+50 puan**
- 20. mevduat → **+50 puan**

---

## 🛡️ SPAM ÖNLEMİ (Minimal)

### Günlük Bakiye Bonusu Limiti
- Günlük bakiye bonusu maksimum **+15 puan**
- Örnek: 2 milyon TL bakiye → Günde +20 hesaplanır ama +15 uygulanır

### Diğer İşlemlerde Limit Yok
- Mevduat, kredi, yatırma, çekme → Limit yok
- Gerçek işlemler, gerçek puan

---

## 📊 KREDİ LİMİTLERİ (0-1000 Puan)

| Kredi Puanı | Maksimum Kredi | Faiz İndirimi |
|-------------|----------------|---------------|
| 0-100       | KREDİ YOK      | - |
| 101-200     | 30,000 TL      | Normal faiz |
| 201-300     | 50,000 TL      | Normal faiz |
| 301-400     | 100,000 TL     | -0.5% |
| 401-500     | 250,000 TL     | -0.5% |
| 501-600     | 500,000 TL     | -1% |
| 601-700     | 1,000,000 TL   | -1.5% |
| 701-800     | 2,000,000 TL   | -2% |
| 801-900     | 5,000,000 TL   | -2.5% |
| 901-1000    | 10,000,000 TL  | -3% |

---

## 💡 ÖRNEK SENARYOLAR (BASİT HES APLAMA)

### Senaryo 1: Yeni Oyuncu (Başlangıç: 500 puan)
```
Gün 1:
- 100,000 TL yatır → +10 puan (510 puan)
- 50,000 TL, 3 saat mevduat aç → +50 puan (560 puan)
- 3 saat sonra mevduat tamamlanır → +10 puan (570 puan)

Gün 2:
- 200,000 TL kredi al → -50 puan (520 puan)
- Krediyi tam öde → +50 puan (570 puan)

SONUÇ: 500 → 570 puan (+70 puan, 2 günde)
```

### Senaryo 1: Akıllı Mevduat Oyuncusu (En Karlı!)
```
Başlangıç: 500 puan

Gün 1:
- 200,000 TL yatır → +10 puan (510)
- 150,000 TL mevduat aç (%8 faiz) → +110 puan (620)

Gün 7 (mevduat tamamlanır):
- Bakiye bonusu (200k) → +2×7 = +14 puan (634)
- Mevduat tamamlama → +20 puan (654)

Gün 8:
- Tekrar 200,000 TL mevduat aç (%10 faiz) → +140 puan (794)

Gün 14:
- Bakiye bonusu → +2×7 = +14 (808)
- Mevduat tamamlama → +20 (828)

SONUÇ: 500 → 828 puan (2 haftada) ⭐
Strateji: Mevduat + Yüksek bakiye = Kazanç!
```

### Senaryo 2: Kredi Faizi Ustası (Büyük Kazanç!)
```
Başlangıç: 500 puan

Gün 1:
- 500,000 TL yatır → +25 puan (525)
- 500,000 TL kredi al (%10 faiz) → -20 puan (505)

Gün 30:
- Bakiye bonusu (500k × 30 gün) → +5×30 = +150 puan (655)
- Krediyi tam öde (faiz: 50,000 TL) → +530 puan! (1185 → MAX 1000!)

SONUÇ: 500 → 1000 puan (1 ayda) 🔥
Strateji: Büyük kredi al, yüksek faiz öde = Büyük puan!
```

### Senaryo 3: Dengeli Oyuncu
```
Başlangıç: 500 puan

Hafta 1:
- 100,000 TL yatır → +5 (505)
- 80,000 TL mevduat aç (%5 faiz) → +80 puan (585)
- Bakiye bonusu (7 gün × +1) → +7 (592)
- Mevduat tamamlanır → +20 (612)

Hafta 2:
- 100,000 TL yatır → +5 (617)
- 100,000 TL kredi al (%8 faiz) → -20 (597)
- Bakiye bonusu (7 gün × +2) → +14 (611)
- Krediyi öde (faiz 8k) → +110 puan (721)

Hafta 3:
- 150,000 TL mevduat aç (%6 faiz) → +100 (821)
- Bakiye bonusu → +15 (836)
- Mevduat tamamla → +20 (856)

SONUÇ: 500 → 856 puan (3 haftada) 🎯
```

### Senaryo 4: Kötü Strateji (Sadece Yatır-Çek)
```
Başlangıç: 500 puan

Gün 1:
- 1,000,000 TL yatır → +50 (550)

Gün 2-30:
- Bakiye bonusu (30 gün × +10) → +300 (850)

Gün 31:
- 1,000,000 TL çek → -20 (830)

SONUÇ: 500 → 830 puan (1 ayda)
Strateji: Yavaş ama emin. Ama mevduat daha iyi!
```

### Senaryo 5: Mevduat Hatası (Çok Kötü!)
```
Başlangıç: 500 puan

- 100,000 TL yatır → +10 (510 puan)
- 100,000 TL mevduat aç (%10 faiz) → +140 (650)
- Erken boz (hata!) → -190 puan (140+50 ceza) (460 puan)

SONUÇ: Net -40 puan kaybı! Asla erken bozma! 💀
```

---

## 🔧 VERİTABANI DEĞİŞİKLİKLERİ

### bank_accounts Tablosuna Eklenecek Kolonlar:
```sql
-- Sadece kredi puanı, başka bir şey yok (zaten var)
-- credit_score kolonu DECIMAL(7,2) olarak güncellenmeli (0-1000 için)

ALTER TABLE bank_accounts MODIFY COLUMN credit_score DECIMAL(7,2) DEFAULT 500.00;
```

### Yeni Log Tablosu (credit_score_changes):
```sql
CREATE TABLE IF NOT EXISTS credit_score_changes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bank_id INT NOT NULL,
  bank_account_id INT NOT NULL,
  change_type VARCHAR(50) NOT NULL,
  old_score DECIMAL(7,2) NOT NULL,
  new_score DECIMAL(7,2) NOT NULL,
  points_changed DECIMAL(7,2) NOT NULL,
  amount BIGINT DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (bank_id) REFERENCES banks(id),
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
  INDEX idx_user_bank (user_id, bank_id),
  INDEX idx_created (created_at)
);
```

---

## ⚙️ UYGULAMA ÖNCELİĞİ

1. **Faz 1:** Veritabanı değişiklikleri (5 dk)
2. **Faz 2:** Basit hesaplama fonksiyonları (15 dk)
3. **Faz 3:** Her endpoint'e entegrasyon (45 dk)
4. **Faz 4:** Frontend'de puan gösterimi (20 dk)
5. **Faz 5:** Test (15 dk)

**Toplam Süre:** ~2 saat (çok basit sistem)

---

## 📈 BAŞARI KRİTERLERİ

✅ Sistem çok basit, herkes anlıyor
✅ Limit yok, sınırsız kazanç/kayıp
✅ Saf matematik, şeffaf
✅ Para yatıran kazanır, çeken kaybeder
✅ Mevduat en karlı strateji (+60 puan)
✅ Erken mevduat bozma çok kötü (-100 puan)
✅ Zengin oyuncular hızlı yükseliyor

---

## 🎮 SİSTEM MANTĞI

**Basit Formüller:**
```javascript
// Para Yatırma
creditScore += Math.floor(amount / 10000);

// Para Çekme
creditScore -= Math.floor(amount / 10000);
creditScore = Math.max(0, creditScore); // Min 0

// Kredi Alma
creditScore -= 50;

// Kredi Ödeme (Tam)
if (paidAmount === totalDebt) {
  creditScore += 50;
}

// Mevduat Açma
creditScore += 50;

// Mevduat Tamamlama
creditScore += 10;

// Mevduat Erken Bozma
creditScore -= 100;
creditScore = Math.max(0, creditScore); // Min 0

// Max kontrol
creditScore = Math.min(1000, creditScore); // Max 1000
```

---

**Son Güncelleme:** 2026-01-04
**Tasarım Durumu:** BASİT VE NET - Hazır! 🚀
**Uygulama Tahmini:** 2 saat
