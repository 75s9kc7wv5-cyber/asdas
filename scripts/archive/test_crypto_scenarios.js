const fs = require('fs');
const path = require('path');

function calculatePrice(mined, floating) {
    if (mined <= 0) return 100.00;
    
    const basePrice = mined * 0.05;
    let floatRatio = (mined > 0) ? floating / mined : 0;
    if (floatRatio > 1) floatRatio = 1;
    
    // Scarcity: 1.0 (All Floating) -> 2.0 (None Floating)
    const scarcity = 1 + (1 - floatRatio);
    
    return Math.max(10, basePrice * scarcity);
}

console.log('--- KRİPTO EKONOMİ SİMÜLASYONU ---');
console.log(
    'Senaryo'.padEnd(35) + 
    'Kazılan'.padEnd(10) + 
    'Piyasa'.padEnd(10) + 
    'Oran'.padEnd(8) + 
    'Çarpan'.padEnd(8) + 
    'Fiyat'
);
console.log('-'.repeat(80));

const scenarios = [
    { name: 'Başlangıç (Sıfır)', mined: 0, floating: 0 },
    { name: 'İlk 100 BTC (HODL - Satılmadı)', mined: 100, floating: 0 },
    { name: '100 BTC (Yarısı Satıldı)', mined: 100, floating: 50 },
    { name: '100 BTC (Hepsi Satıldı - Çöp)', mined: 100, floating: 100 },
    { name: '1.000 BTC Üretildi (Karaborsa)', mined: 1000, floating: 0 },
    { name: '1.000 BTC (%20 Piyasada)', mined: 1000, floating: 200 },
    { name: '1.000 BTC (%50 Piyasada)', mined: 1000, floating: 500 },
    { name: '1.000 BTC (%90 Piyasada - Kriz)', mined: 1000, floating: 900 },
    { name: '10.000 BTC (Büyük Ekonomi)', mined: 10000, floating: 2000 },
];

scenarios.forEach(s => {
    const price = calculatePrice(s.mined, s.floating);
    const ratio = s.mined > 0 ? (s.floating / s.mined).toFixed(2) : '0.00';
    const scarcity = (1 + (1 - (s.mined > 0 ? Math.min(1, s.floating / s.mined) : 0))).toFixed(2);
    
    console.log(
        s.name.padEnd(35) + 
        s.mined.toString().padEnd(10) + 
        s.floating.toString().padEnd(10) + 
        ratio.padEnd(8) + 
        scarcity.padEnd(8) + 
        '$' + price.toFixed(2)
    );
});
