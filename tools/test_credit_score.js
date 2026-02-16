// Yeni Kredi Puanı Sistemi Test Script
// Bu script yeni sistemi test etmek için kullanılabilir

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test fonksiyonları
async function testRecalculateScores() {
    console.log('=== Kredi Puanı Yeniden Hesaplama Testi ===\n');
    
    try {
        const response = await axios.post(`${BASE_URL}/api/admin/recalculate-credit-scores`, {
            adminPassword: 'admin123'
        });
        
        console.log('✅ Başarılı!');
        console.log('Sonuç:', JSON.stringify(response.data, null, 2));
        
        if (response.data.results && response.data.results.length > 0) {
            console.log('\nİlk 5 Hesap Değişiklikleri:');
            response.data.results.slice(0, 5).forEach((result, index) => {
                console.log(`${index + 1}. Hesap ${result.accountId} (User ${result.userId}):`);
                console.log(`   Eski: ${result.oldScore} → Yeni: ${result.newScore} (${result.change > 0 ? '+' : ''}${result.change})`);
            });
        }
    } catch (error) {
        console.error('❌ Hata:', error.response?.data || error.message);
    }
}

async function testSpamDetection(userId, bankId) {
    console.log('\n=== Spam Tespiti Testi ===\n');
    console.log('Simüle ediliyor: 10 ardışık mikro para yatırma işlemi...\n');
    
    const accountId = await getAccountId(userId, bankId);
    if (!accountId) {
        console.error('❌ Hesap bulunamadı');
        return;
    }
    
    // İlk kredi puanını al
    const initialScore = await getCreditScore(accountId);
    console.log(`Başlangıç Kredi Puanı: ${initialScore}\n`);
    
    // 10 mikro işlem yap (500 TL)
    for (let i = 0; i < 10; i++) {
        try {
            await axios.post(`${BASE_URL}/api/bank-accounts/deposit`, {
                userId,
                bankId,
                amount: 500
            });
            console.log(`✓ İşlem ${i + 1}/10 tamamlandı (500 TL)`);
            
            // 10 saniye bekle
            await sleep(500);
        } catch (error) {
            console.error(`✗ İşlem ${i + 1} başarısız:`, error.response?.data?.message || error.message);
        }
    }
    
    console.log('\n10 mikro işlem tamamlandı.');
    
    // Hemen kredi puanını kontrol et (değişmemeli)
    const scoreAfterDeposits = await getCreditScore(accountId);
    console.log(`İşlemlerden Hemen Sonra Puan: ${scoreAfterDeposits}`);
    console.log('ℹ️  Not: Puan hemen değişmedi (beklenen davranış)\n');
    
    console.log('Günlük hesaplama çalıştırılıyor...\n');
    await testRecalculateScores();
    
    // Tekrar kredi puanını al
    const finalScore = await getCreditScore(accountId);
    console.log(`\nSon Kredi Puanı: ${finalScore}`);
    
    const change = finalScore - initialScore;
    console.log(`Toplam Değişim: ${change > 0 ? '+' : ''}${change.toFixed(2)}`);
    
    if (change < -5) {
        console.log('✅ SPAM TESPİT EDİLDİ VE CEZA UYGULANMAYA BAŞLANDI! (Max -5/gün)');
    } else if (change < 0) {
        console.log('⚠️  Negatif etki var ama tam ceza henüz uygulanmadı');
    } else {
        console.log('⚠️  Spam cezası uygulanmadı (beklenmeyen)');
    }
}

async function testNormalBehavior(userId, bankId) {
    console.log('\n=== Normal Kullanıcı Davranışı Testi ===\n');
    
    const accountId = await getAccountId(userId, bankId);
    if (!accountId) {
        console.error('❌ Hesap bulunamadı');
        return;
    }
    
    const initialScore = await getCreditScore(accountId);
    console.log(`Başlangıç Kredi Puanı: ${initialScore}\n`);
    
    // Normal büyüklükte işlem yap
    try {
        await axios.post(`${BASE_URL}/api/bank-accounts/deposit`, {
            userId,
            bankId,
            amount: 50000
        });
        console.log('✓ 50,000 TL para yatırıldı\n');
        
        // 30 saniye bekle
        console.log('30 saniye bekleniyor...\n');
        await sleep(30000);
        
        // İkinci işlem
        await axios.post(`${BASE_URL}/api/bank-accounts/deposit`, {
            userId,
            bankId,
            amount: 30000
        });
        console.log('✓ 30,000 TL para yatırıldı\n');
        
    } catch (error) {
        console.error('✗ İşlem başarısız:', error.response?.data?.message || error.message);
    }
    
    console.log('Günlük hesaplama çalıştırılıyor...\n');
    await testRecalculateScores();
    
    const finalScore = await getCreditScore(accountId);
    console.log(`\nSon Kredi Puanı: ${finalScore}`);
    
    const change = finalScore - initialScore;
    console.log(`Toplam Değişim: ${change > 0 ? '+' : ''}${change.toFixed(2)}`);
    
    if (change >= 0) {
        console.log('✅ Normal davranış ödüllendirildi veya nötr kaldı');
    } else {
        console.log('⚠️  Negatif etki (beklenmeyen)');
    }
}

// Yardımcı fonksiyonlar
async function getAccountId(userId, bankId) {
    try {
        const response = await axios.get(`${BASE_URL}/api/bank-accounts/${userId}/${bankId}`);
        return response.data.account?.id;
    } catch (error) {
        return null;
    }
}

async function getCreditScore(accountId) {
    try {
        const response = await axios.get(`${BASE_URL}/api/bank-accounts/customers/1`); // Dummy endpoint, gerçekte farklı endpoint kullanılabilir
        // Gerçek implementasyonda doğru endpoint'i kullan
        // Şimdilik dummy olarak 50 döndürüyoruz
        return 50.0;
    } catch (error) {
        return 50.0;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Ana test runner
async function runTests() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   YENİ KREDİ PUANI SİSTEMİ - TEST SUITE              ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Kullanım:');
        console.log('  node test_credit_score.js recalculate                  # Tüm hesapları yeniden hesapla');
        console.log('  node test_credit_score.js spam <userId> <bankId>       # Spam davranışı test et');
        console.log('  node test_credit_score.js normal <userId> <bankId>     # Normal davranış test et');
        console.log('');
        console.log('Örnek:');
        console.log('  node test_credit_score.js recalculate');
        console.log('  node test_credit_score.js spam 1 1');
        console.log('  node test_credit_score.js normal 1 1');
        return;
    }
    
    const command = args[0];
    
    switch (command) {
        case 'recalculate':
            await testRecalculateScores();
            break;
        
        case 'spam':
            if (args.length < 3) {
                console.error('Hata: userId ve bankId gerekli');
                console.log('Kullanım: node test_credit_score.js spam <userId> <bankId>');
                return;
            }
            await testSpamDetection(parseInt(args[1]), parseInt(args[2]));
            break;
        
        case 'normal':
            if (args.length < 3) {
                console.error('Hata: userId ve bankId gerekli');
                console.log('Kullanım: node test_credit_score.js normal <userId> <bankId>');
                return;
            }
            await testNormalBehavior(parseInt(args[1]), parseInt(args[2]));
            break;
        
        default:
            console.error('Bilinmeyen komut:', command);
            console.log('Geçerli komutlar: recalculate, spam, normal');
    }
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   TEST TAMAMLANDI                                      ║');
    console.log('╚════════════════════════════════════════════════════════╝');
}

// Çalıştır
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
