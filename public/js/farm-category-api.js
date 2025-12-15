// Bu dosya, farm-category.html için dinamik farm sayısı ve farm tiplerini API'den çeken kodu içerir.
// Kullanıcı oturumundan userId alınması gereklidir. Demo için localStorage'dan alınacak.

// Sadece tarla tipleri (hayvan çiftlikleri hariç) filtrele
const FIELD_SLUGS = ['wheat', 'corn', 'fruit', 'vegetable', 'rice', 'potato', 'olive'];
async function fetchFarmTypesAndCounts() {
    // Farm tiplerini çek
    const farmTypesRes = await fetch('/api/farm-types');
    let farmTypes = await farmTypesRes.json();
    // Sadece tarlalar (hayvan çiftlikleri hariç)
    farmTypes = farmTypes.filter(type => FIELD_SLUGS.includes(type.slug));
    // Kullanıcı ID'si (örnek: localStorage'dan)
    const userId = localStorage.getItem('userId');
    let myFarms = [];
    if (userId) {
        const myFarmsRes = await fetch(`/api/my-farms?user_id=${userId}`);
        myFarms = await myFarmsRes.json();
    }
    // Her farm tipine göre sayıları hesapla
    const counts = {};
    farmTypes.forEach(type => {
        const count = myFarms.filter(f => f.farm_type_id === type.id).length;
        counts[type.slug] = count;
    });
    return { farmTypes, counts };
}

window.farmCategory = { fetchFarmTypesAndCounts };
