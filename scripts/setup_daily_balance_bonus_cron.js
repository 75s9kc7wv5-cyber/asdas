/**
 * Günlük Bakiye Bonusu Cron Job
 * Her gün sabah 00:00'da tüm banka hesapları için bakiye bonusu hesaplar
 * 
 * Kurulum:
 * 1. npm install node-cron
 * 2. Bu scripti server.js'e import et veya ayrı bir servis olarak çalıştır
 */

const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

// Günlük bakiye bonusu hesapla ve uygula
function applyDailyBalanceBonusForAll() {
    console.log('🕐 Günlük bakiye bonusu işlemi başladı...');
    
    const query = `
        SELECT ba.id, ba.user_id, ba.bank_id, ba.balance, ba.last_balance_bonus_date
        FROM bank_accounts ba
        WHERE ba.balance > 0
    `;
    
    db.query(query, (err, accounts) => {
        if (err) {
            console.error('❌ Hesapları çekerken hata:', err);
            return;
        }
        
        console.log(`📊 ${accounts.length} hesap bulundu`);
        const today = new Date().toISOString().split('T')[0];
        let processed = 0;
        let bonusGiven = 0;
        
        accounts.forEach(acc => {
            // Bugün zaten bonus verdiyse pas geç
            if (acc.last_balance_bonus_date === today) {
                processed++;
                return;
            }
            
            // Bonus hesapla (Balance/100,000)
            const bonusPoints = Math.floor(acc.balance / 100000);
            
            if (bonusPoints > 0) {
                // Kredi puanını güncelle
                const updateQuery = `
                    UPDATE bank_accounts 
                    SET credit_score = GREATEST(0, LEAST(1000, credit_score + ?)),
                        last_balance_bonus_date = CURDATE()
                    WHERE id = ?
                `;
                
                db.query(updateQuery, [bonusPoints, acc.id], (err) => {
                    if (err) {
                        console.error(`❌ Hesap ${acc.id} güncellenemedi:`, err);
                        return;
                    }
                    
                    // Log kaydet
                    const logQuery = `
                        INSERT INTO bank_transactions (user_id, bank_id, transaction_type, amount, description)
                        VALUES (?, ?, 'credit_score_change', ?, ?)
                    `;
                    
                    db.query(logQuery, [
                        acc.user_id, 
                        acc.bank_id, 
                        bonusPoints, 
                        `Günlük Bakiye Bonusu (+${bonusPoints} puan, ${acc.balance} TL)`
                    ], (err) => {
                        if (err) console.error('❌ Log kaydedilemedi:', err);
                    });
                    
                    bonusGiven++;
                    console.log(`✅ Hesap ${acc.id}: +${bonusPoints} puan (Bakiye: ${acc.balance})`);
                });
            } else {
                // Bonus yok ama tarihi güncelle
                db.query('UPDATE bank_accounts SET last_balance_bonus_date = CURDATE() WHERE id = ?', [acc.id]);
            }
            
            processed++;
        });
        
        setTimeout(() => {
            console.log(`✅ İşlem tamamlandı: ${processed} hesap işlendi, ${bonusGiven} hesaba bonus verildi`);
        }, 2000);
    });
}

// Eğer direkt çalıştırılırsa
if (require.main === module) {
    console.log('🚀 Günlük bakiye bonusu script çalıştırılıyor...');
    applyDailyBalanceBonusForAll();
    
    // İşlem bittikten sonra 5 saniye bekle ve kapat
    setTimeout(() => {
        console.log('👋 Script kapatılıyor...');
        db.end();
        process.exit(0);
    }, 5000);
}

module.exports = { applyDailyBalanceBonusForAll };
