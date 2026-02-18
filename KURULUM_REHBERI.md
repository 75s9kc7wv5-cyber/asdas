# Sim of World - Sunucu Kurulum Rehberi

Bu rehber, **Sim of World** projesini sıfırdan bir Linux sunucusuna (Ubuntu 20.04/22.04/24.04 önerilir) kurmanız için gerekli adımları içerir.

## 1. Sunucu Hazırlığı ve Gereksinimler

Öncelikle sunucunuzu güncelleyin ve gerekli paketleri yükleyin.

```bash
sudo apt update && sudo apt upgrade -y
```

### Node.js Kurulumu (v18 veya üzeri önerilir)
Node.js'in güncel bir sürümünü yükleyin:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Kurulumu doğrulayın:
```bash
node -v
npm -v
```

### MySQL Veritabanı Kurulumu
MySQL sunucusunu yükleyin:

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```
*(Güvenlik kurulumunda şifre belirleme ve anonim kullanıcıları silme adımlarını takip edin.)*

## 2. Veritabanı ve Kullanıcı Oluşturma

Projeyi çalıştırmak için MySQL içinde bir veritabanı ve koda uygun bir kullanıcı oluşturmanız gerekir. Varsayılan proje ayarlarında kullanıcı adı `simuser`, şifre `password` ve veritabanı adı `simworld` olarak tanımlıdır.

MySQL konsoluna girin:
```bash
sudo mysql -u root -p
```

Aşağıdaki SQL komutlarını sırasıyla çalıştırın:

```sql
-- Veritabanını oluştur
CREATE DATABASE IF NOT EXISTS simworld CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Kullanıcı oluştur (Şifreyi kendi belirlediğiniz güvenli bir şifre ile değiştirin!)
-- Eğer kodda değişiklik yapmayacaksanız varsayılan şifre 'password'dur, ancak değiştirmelisiniz.
CREATE USER 'simuser'@'localhost' IDENTIFIED BY 'password';

-- Yetkileri ver
GRANT ALL PRIVILEGES ON simworld.* TO 'simuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**ÖNEMLİ:** Eğer yukarıda farklı bir kullanıcı adı veya şifre belirlediyseniz, projedeki şu dosyalarda ilgili kısımları güncellemeniz gerekir:
1. `src/server.js` (Satır ~30 civarı)
2. `scripts/setup_full_database.js` (Satır ~4 civarı)
3. Diğer `scripts/` klasöründeki bakım scriptleri.

## 3. Proje Dosyalarının Yüklenmesi

Proje dosyalarını sunucunuza yükleyin (Git kullanarak veya manuel dosya transferi ile).

Proje klasörüne girin ve bağımlılıkları yükleyin:

```bash
cd /proje/dizini/asdas
npm install
```

## 4. Veritabanı Tablolarının Kurulumu

Proje içindeki hazır kurulum scriptini kullanarak gerekli tüm tabloları ve başlangıç verilerini oluşturun:

```bash
node scripts/setup_full_database.js
```

Eğer "Connected to database" mesajı alırsanız ve hata görmezseniz işlem başarılıdır. 

*Not: Eğer bağlantı hatası alırsanız, 2. adımdaki kullanıcı adı/şifre ile dosyalardaki bilgilerin uyuştuğundan emin olun.*

## 5. Uygulamayı Çalıştırma

### Test Amaçlı Çalıştırma
Uygulamayı terminal üzerinden direkt başlatmak için:

```bash
npm start
```
Uygulama varsayılan olarak **3000** portunda çalışır. Tarayıcınızdan `http://SUNUCU_IP_ADRESI:3000` adresine giderek test edebilirsiniz.

### Prodüksiyon (Kalıcı) Çalıştırma (PM2 Kullanımı)
Terminali kapattığınızda uygulamanın kapanmaması için **PM2** süreç yöneticisini kullanın.

PM2'yi yükleyin:
```bash
sudo npm install -g pm2
```

Uygulamayı başlatın:
```bash
pm2 start src/server.js --name "simworld"
```

Uygulamanın durumunu görmek için:
```bash
pm2 status
```

Sunucu yeniden başladığında uygulamanın otomatik açılması için:
```bash
pm2 startup
pm2 save
```

## 6. Güvenlik Duvarı (Firewall) Ayarları

Sunucunuzda UFW (Uncomplicated Firewall) etkinse, 3000 portuna izin vermelisiniz:

```bash
sudo ufw allow 3000
```
veya Nginx/Apache gibi bir Reverse Proxy kullanarak 80/443 portlarını 3000'e yönlendirebilirsiniz (Önerilen yöntem budur).

---

### Sık Karşılaşılan Sorunlar

- **"Client does not support authentication protocol requested by server"**: MySQL 8.0 kullanıyorsanız, kullanıcı şifresini şu şekilde güncelleyin:
  ```sql
  ALTER USER 'simuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
  FLUSH PRIVILEGES;
  ```
- **"EACCES" Hatası**: Port 3000 kullanımdaysa veya yetki yoksa, `src/server.js` içindeki port numarasını değiştirebilirsiniz.
