// TARLA AR-GE
const farmsData = [
    { id: 'wheat', name: 'Buğday Yertiştirme', desc: 'Buğday üretim verimini artırır.', image: 'icons/farm-icon/wheat.png', colorClass: 'c-wood' },
    { id: 'corn', name: 'Mısır Ekimi', desc: 'Mısır hasatını optimize eder.', image: 'icons/farm-icon/corn.png', colorClass: 'c-wood' },
    { id: 'fruit', name: 'Meyvecilik', desc: 'Meyve bahçesi üretimini artırır.', image: 'icons/farm-icon/fruit.png', colorClass: 'c-wood' },
    { id: 'vegetable', name: 'Sebze Yertiştirme', desc: 'Sebze bahçesi verimini artırır.', image: 'icons/farm-icon/vegetables.png', colorClass: 'c-wood' },
    { id: 'rice', name: 'Pirinç Tarımı', desc: 'Pirinç tarlası üretimini artırır.', image: 'icons/farm-icon/rice.png', colorClass: 'c-wood' },
    { id: 'potato', name: 'Patates Ekimi', desc: 'Patates hasatını hızlandırır.', image: 'icons/farm-icon/potato.png', colorClass: 'c-wood' },
    { id: 'olive', name: 'Zeytincilik', desc: 'Zeytin bahçesi üretimini optimize eder.', image: 'icons/farm-icon/olive.png', colorClass: 'c-wood' }
];

// ÇİFTİK AR-GE
const ranchesData = [
    { id: 'chicken', name: 'Tavukçuluk', desc: 'Tavuk çiftliği üretimini artırır.', image: 'icons/ranch-icon/chicken.png', colorClass: 'c-wood' },
    { id: 'cow', name: 'Sığır Yetiştiriciliği', desc: 'Süt ve et üretimini artırır.', image: 'icons/ranch-icon/cow.png', colorClass: 'c-wood' },
    { id: 'sheep', name: 'Koyun Yetiştiriciliği', desc: 'Yün ve süt üretimini artırır.', image: 'icons/ranch-icon/sheep.png', colorClass: 'c-wood' },
    { id: 'goat', name: 'Keçi Yetiştiriciliği', desc: 'Keçi sütü ve peynir üretimini artırır.', icon: 'fa-cow', colorClass: 'c-wood' },
    { id: 'bee', name: 'Arıcılık', desc: 'Bal üretimini optimize eder.', image: 'icons/ranch-icon/bee.png', colorClass: 'c-wood' }
];

// MADEN AR-GE
const minesData = [
    { id: 'wood', name: 'Ormancılık Teknikleri', desc: 'Ağaç kesim ve işleme hızını artırır.', image: 'icons/mine-icon/wood.png', colorClass: 'c-wood' },
    { id: 'stone', name: 'Taş Kırma Teknolojisi', desc: 'Taş ocağı verimliliğini artırır.', image: 'icons/mine-icon/stone.png', colorClass: 'c-stone' },
    { id: 'iron', name: 'Demir Eritme Fırınları', desc: 'Demir cevheri işleme kapasitesini yükseltir.', image: 'icons/mine-icon/iron.png', colorClass: 'c-iron' },
    { id: 'coal', name: 'Kömür Ayrıştırma', desc: 'Daha kaliteli kömür çıkarımı sağlar.', image: 'icons/mine-icon/coal.png', colorClass: 'c-coal' },
    { id: 'sand', name: 'Kum Eleme Teknolojisi', desc: 'Kum madeni verimliliğini artırır.', image: 'icons/mine-icon/sand.png', colorClass: 'c-sand' },
    { id: 'oil', name: 'Petrol Sondajı', desc: 'Petrol kuyusu pompa hızını artırır.', image: 'icons/mine-icon/oil-barrel.png', colorClass: 'c-oil' },
    { id: 'copper', name: 'Bakır İletkenliği', desc: 'Bakır madeni üretimini optimize eder.', image: 'icons/mine-icon/copper.png', colorClass: 'c-copper' },
    { id: 'gold', name: 'Altın Eleme Sistemi', desc: 'Altın tozlarını daha verimli ayrıştırır.', image: 'icons/mine-icon/gold-nugget.png', colorClass: 'c-gold' },
    { id: 'diamond', name: 'Elmas Kesim Lazerleri', desc: 'Elmas çıkarma hasarını azaltır.', icon: 'fa-gem', colorClass: 'c-diamond' },
    { id: 'uranium', name: 'Uranyum Zenginleştirme', desc: 'Nükleer yakıt üretimini artırır.', image: 'icons/mine-icon/uranium.png', colorClass: 'c-uranium' }
];

const factoriesData = [
    { id: 'lumber', name: 'Kereste İşleme', desc: 'Kereste üretim verimliliğini artırır.', image: 'icons/factory-icon/wood-plank.png', colorClass: 'c-wood' },
    { id: 'brick', name: 'Tuğla Fırınları', desc: 'Tuğla pişirme süresini kısaltır.', image: 'icons/factory-icon/brick.png', colorClass: 'c-stone' },
    { id: 'glass', name: 'Cam Üfleme', desc: 'Cam üretim kalitesini artırır.', image: 'icons/factory-icon/window.png', colorClass: 'c-sand' },
    { id: 'concrete', name: 'Çimento Karışımı', desc: 'Çimento üretimini optimize eder.', image: 'icons/factory-icon/cement.png', colorClass: 'c-stone' },
    { id: 'steel', name: 'Çelik Alaşımları', desc: 'Çelik üretim dayanıklılığını artırır.', image: 'icons/factory-icon/steel.png', colorClass: 'c-iron' },
    { id: 'agricultural', name: 'Modern Tarım', desc: 'Tarım ürünleri verimini artırır.', icon: 'fa-tractor', colorClass: 'c-wood' },
    { id: 'animal', name: 'Hayvancılık', desc: 'Hayvansal üretim hızını artırır.', icon: 'fa-egg', colorClass: 'c-wood' },
    { id: 'bakery', name: 'Fırıncılık', desc: 'Ekmek ve pasta üretim hızını artırır.', image: 'icons/food-factory/bread.png', colorClass: 'c-wood' },
    { id: 'ready_food', name: 'Hazır Gıda Teknolojisi', desc: 'Konserve ve yemek üretimini hızlandırır.', image: 'icons/food-factory/fruit-canned.png', colorClass: 'c-wood' },
    { id: 'olive_oil', name: 'Zeytinyağı Presleme', desc: 'Zeytinyağı üretim verimini artırır.', image: 'icons/food-factory/olive-oil.png', colorClass: 'c-wood' },
    { id: 'sweets', name: 'Şekerleme Üretimi', desc: 'Enerji barı üretimini optimize eder.', image: 'icons/food-factory/energy-bar.png', colorClass: 'c-wood' },
    { id: 'gold_factory', name: 'Altın Külçe Fabrikası', desc: 'Altın külçe üretimini hızlandırır.', image: 'icons/inventory-icon/gold.png', colorClass: 'c-gold' },
    { id: 'weapon', name: 'Silah Teknolojisi', desc: 'Silah üretim hassasiyetini artırır.', icon: 'fa-jet-fighter', colorClass: 'c-iron' },
    { id: 'wind_turbine', name: 'Rüzgar Türbini', desc: 'Rüzgar enerjisi üretimini artırır.', image: 'icons/energy-factory-icon/wind-turbine.png', colorClass: 'c-sand' },
    { id: 'solar_plant', name: 'Güneş Santrali', desc: 'Güneş enerjisi verimliliğini artırır.', image: 'icons/energy-factory-icon/solar-panel.png', colorClass: 'c-gold' },
    { id: 'coal_plant', name: 'Termik Santral', desc: 'Kömürden enerji üretimini artırır.', image: 'icons/energy-factory-icon/fossil-fuel.png', colorClass: 'c-coal' },
    { id: 'nuclear_plant', name: 'Nükleer Santral', desc: 'Nükleer enerji üretimini artırır.', image: 'icons/energy-factory-icon/nuclear-plant.png', colorClass: 'c-uranium' }
];

let currentTab = 'farms';
let argeData = {};
let activeTimers = {};
let selectedResearchId = null;
let userEducationSkill = 0;

const eduStages = [
    { name: "İlkokul", max: 10 },
    { name: "Ortaokul", max: 20 },
    { name: "Lise", max: 30 },
    { name: "Üniversite", max: 40 },
    { name: "Yüksek Lisans", max: 50 },
    { name: "Doktora", max: 60 },
    { name: "Doçent", max: 70 },
    { name: "Profesör", max: 80 },
    { name: "Ord. Profesör", max: 90 },
    { name: "Bilim İnsanı", max: 100 }
];

async function initArgePage() {
    const user = JSON.parse(localStorage.getItem('simWorldUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Update money in header if available
    if (document.getElementById('userMoney')) {
        document.getElementById('userMoney').innerText = formatMoney(user.money);
    }

    // Show loading state
    const container = document.getElementById('researchList');
    if (container) container.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Veriler yükleniyor...</div>';

    // Get User Stats for Education
    try {
        const statsRes = await fetch(`/api/user-stats/${user.id}`);
        const stats = await statsRes.json();
        if (stats) {
            userEducationSkill = stats.education_skill || 0;
        }
    } catch (e) {
        console.error("Stats fetch error", e);
    }

    await getCurrentArgeData(user.id);
}

async function getCurrentArgeData(userId) {
    try {
        const response = await fetch(`/api/arge/status/${userId}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('AR-GE API Error:', response.status, errorData);
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        argeData = data || {};
        renderArgeList();
    } catch (error) {
        console.error('AR-GE verisi alınamadı:', error);
        argeData = {}; // Use empty data instead of showing error
        renderArgeList(); // Try to render with empty data
    }
}

// Wrapper for API calls to satisfy naming requirements
async function saveToDatabase(endpoint, data) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await response.json();
}

async function loadArgeFromDatabase(userId) {
    return getCurrentArgeData(userId);
}

function switchTab(tab) {
    currentTab = tab;
    
    // Update UI
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    renderArgeList();
}

function renderArgeList() {
    const container = document.getElementById('researchList');
    if (!container) return;
    
    container.innerHTML = '';

    let dataList;
    if (currentTab === 'farms') {
        dataList = farmsData;
    } else if (currentTab === 'ranches') {
        dataList = ranchesData;
    } else if (currentTab === 'mines') {
        dataList = minesData;
    } else if (currentTab === 'factories') {
        dataList = factoriesData;
    } else {
        dataList = [];
    }

    if (!dataList || dataList.length === 0) {
        container.innerHTML = '<div style="text-align:center;">Görüntülenecek araştırma yok.</div>';
        return;
    }

    // Check if there's any active research
    const hasActiveResearch = Object.values(argeData).some(arge => arge.is_researching);

    dataList.forEach(item => {
        const itemArge = argeData[item.id] || { level: 0, is_researching: 0, research_end_time: null };
        const level = itemArge.level;
        const isMaxed = level >= 10;
        const nextLevel = level + 1;
        
        // Stats
        const bonus = level * 10; // +10% per level

        // Cost
        const costMoney = Math.floor(5000 * Math.pow(1.8, level));
        const duration = (level + 1) * 60;

        const card = document.createElement('div');
        card.className = 'research-card';
        
        let actionHTML = '';
        
        if (isMaxed) {
            actionHTML = `
                <button class="btn-research" style="background:#333; border-color:#333; cursor:default;">
                    <span>Maksimum Seviye</span>
                    <i class="fas fa-check"></i>
                </button>
            `;
        } else if (itemArge.is_researching) {
            actionHTML = `
                <div class="timer-box" style="border-color:var(--accent-purple)">
                    <div class="timer-bar" id="bar-${item.id}" style="background:rgba(155, 89, 182, 0.3)"></div>
                    <div class="timer-text" id="timer-${item.id}">00:00</div>
                </div>
            `;
            // Start timer if not already running
            if (!activeTimers[item.id]) {
                updateResearchTimer(item.id, itemArge.research_end_time, duration);
            }
        } else if (hasActiveResearch) {
            // If another research is active, disable this button
            actionHTML = `
                <button class="btn-research" style="background: var(--accent-red); border-color: var(--accent-red); cursor: not-allowed; opacity: 0.6;" disabled>
                    <span>Başka Araştırma Devam Ediyor</span>
                </button>
            `;
        } else {
            actionHTML = `
                <button class="btn-research" style="background: var(--accent-green); border-color: var(--accent-green); text-align: center;" onclick="openModal('${item.id}')">
                    <span>Geliştirmeyi Başlat</span>
                </button>
            `;
        }

        let iconHtml = '';
        if (item.image) {
            iconHtml = `<img src="${item.image}" alt="${item.name}" style="width: 32px; height: 32px;">`;
        } else {
            iconHtml = `<i class="fas ${item.icon}"></i>`;
        }

        card.innerHTML = `
            <div class="r-top">
                <div class="r-icon-box ${item.colorClass}">
                    ${iconHtml}
                </div>
                <div class="r-info">
                    <div class="r-title">
                        ${item.name}
                        <span class="r-level">Seviye ${level} / 10</span>
                    </div>
                    <div class="r-desc">${item.desc}</div>
                    <div class="r-bonus">Verimlilik: +%${bonus}</div>
                </div>
            </div>
            <div class="r-action">
                ${actionHTML}
            </div>
        `;

        container.appendChild(card);
    });
}

function openModal(itemId) {
    selectedResearchId = itemId;
    
    // Search in all data arrays
    let item = farmsData.find(m => m.id === itemId);
    if (!item) item = ranchesData.find(m => m.id === itemId);
    if (!item) item = minesData.find(m => m.id === itemId);
    if (!item) item = factoriesData.find(m => m.id === itemId);
    
    if (!item) return;

    const itemArge = argeData[itemId] || { level: 0 };
    const level = itemArge.level;
    const nextLevel = level + 1;
    
    const costMoney = Math.floor(5000 * Math.pow(1.8, level));
    const costGold = 50 * nextLevel;
    const costDiamond = nextLevel >= 5 ? (nextLevel - 4) * 2 : 0;

    const duration = nextLevel * 60;
    const bonus = 10; // +10% per level
    const requiredEdu = nextLevel * 10;

    document.getElementById('mTitle').innerText = item.name;
    document.getElementById('mTime').innerText = formatTime(duration);
    
    let costText = `<div style="display:flex; flex-direction:column; gap:5px;">
        <span style="color:var(--accent-green)">${formatMoney(costMoney)} ₺</span>
        <span style="color:var(--accent-gold)">${formatMoney(costGold)} Altın</span>`;
    
    if (costDiamond > 0) {
        costText += `<span style="color:var(--accent-cyan)">${costDiamond} Elmas</span>`;
    }
    costText += `</div>`;

    // Education Requirement
    let eduColor = userEducationSkill >= requiredEdu ? 'var(--accent-green)' : 'var(--accent-red)';
    let eduIcon = userEducationSkill >= requiredEdu ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
    
    // Find stage name
    const stage = eduStages.find(s => s.max === requiredEdu);
    const stageName = stage ? stage.name + " Mezunu" : requiredEdu + ". Seviye";

    let eduHtml = `
        <div class="m-row">
            <span style="display:flex;align-items:center;gap:6px;">
                <i class="fas fa-graduation-cap" style="color:var(--accent-purple);"></i>
                Gereken Eğitim:
            </span>
            <span style="color:${eduColor}">${eduIcon} ${stageName}</span>
        </div>
    `;

    // Insert Edu HTML before Cost
    const detailsContainer = document.querySelector('.m-details');
    
    detailsContainer.innerHTML = `
        <div class="m-row">
            <span style="display:flex;align-items:center;gap:6px;">
                <i class="fas fa-clock" style="color:var(--accent-cyan);"></i>
                Süre:
            </span>
            <span id="mTime" style="color:var(--accent-cyan)">${formatTime(duration)}</span>
        </div>
        ${eduHtml}
        <div class="m-row">
            <span style="display:flex;align-items:center;gap:6px;">
                <i class="fas fa-coins" style="color:var(--accent-gold);"></i>
                Maliyet:
            </span>
            <span id="mCost">${costText}</span>
        </div>
        <div class="m-row">
            <span style="display:flex;align-items:center;gap:6px;">
                <i class="fas fa-chart-line" style="color:var(--accent-green);"></i>
                Etki:
            </span>
            <span id="mEffect" style="color:var(--accent-green)">+%${bonus} Verimlilik</span>
        </div>
    `;

    document.getElementById('confirmModal').style.display = 'flex';
}

async function startResearch() {
    if (!selectedResearchId) return;
    
    const user = JSON.parse(localStorage.getItem('simWorldUser'));
    const mineType = selectedResearchId;
    const mineArge = argeData[mineType] || { level: 0 };
    const nextLevel = mineArge.level + 1;
    const requiredEdu = nextLevel * 10;

    if (userEducationSkill < requiredEdu) {
        const stage = eduStages.find(s => s.max === requiredEdu);
        const stageName = stage ? stage.name + " Mezunu" : requiredEdu + ". Seviye";
        toastr.error(`Eğitim seviyeniz yetersiz! Gereken: ${stageName}`, 'Hata');
        closeModal();
        return;
    }
    
    try {
        const result = await saveToDatabase('/api/arge/start', { userId: user.id, mineType: mineType });
        
        if (result.success) {
            // Update local data immediately to reflect UI change
            if (!argeData[mineType]) argeData[mineType] = { level: 0 };
            argeData[mineType].is_researching = 1;
            argeData[mineType].research_end_time = result.endTime;
            
            // Update money/gold/diamond display
            if (result.newMoney !== undefined) {
                user.money = result.newMoney;
                user.gold = result.newGold;
                user.diamond = result.newDiamond;
                localStorage.setItem('simWorldUser', JSON.stringify(user));
                
                if (document.getElementById('userMoney')) document.getElementById('userMoney').innerText = formatMoney(user.money);
                if (document.getElementById('userGold')) document.getElementById('userGold').innerText = formatMoney(user.gold);
                if (document.getElementById('userDiamond')) document.getElementById('userDiamond').innerText = formatMoney(user.diamond);
            }
            
            closeModal();
            renderArgeList();
            toastr.success('Araştırma başlatıldı!', 'Başarılı');
        } else {
            toastr.error(result.message || 'Başlatılamadı.', 'Hata');
            closeModal();
        }
    } catch (error) {
        console.error(error);
        toastr.error('Bir hata oluştu.', 'Hata');
    }
}

async function finishResearch(mineType) {
    const user = JSON.parse(localStorage.getItem('simWorldUser'));
    
    try {
        const result = await saveToDatabase('/api/arge/finish', { userId: user.id, mineType: mineType });
        
        if (result.success) {
            // Update local data
            if (!argeData[mineType]) argeData[mineType] = { level: 0 };
            argeData[mineType].level = result.newLevel;
            argeData[mineType].is_researching = 0;
            argeData[mineType].research_end_time = null;
            
            toastr.success('Araştırma Tamamlandı! Seviye Atladı.', 'Tebrikler');
            
            renderArgeList();
        }
    } catch (error) {
        console.error(error);
    }
}

function closeModal() {
    document.getElementById('confirmModal').style.display = 'none';
    selectedResearchId = null;
}

function updateResearchTimer(mineType, endTime, totalDurationSeconds) {
    if (activeTimers[mineType]) clearInterval(activeTimers[mineType]);
    
    const update = () => {
        const now = Date.now();
        const diff = endTime - now;
        const elText = document.getElementById(`timer-${mineType}`);
        const elBar = document.getElementById(`bar-${mineType}`);
        
        if (diff <= 0) {
            clearInterval(activeTimers[mineType]);
            delete activeTimers[mineType];
            finishResearch(mineType);
            return;
        }
        
        if (elText) elText.textContent = formatTime(Math.ceil(diff / 1000));
        
        if (elBar && totalDurationSeconds) {
            const remainingSeconds = diff / 1000;
            const passed = totalDurationSeconds - remainingSeconds;
            const percent = (passed / totalDurationSeconds) * 100;
            elBar.style.width = `${Math.min(percent, 100)}%`;
        } else if (elBar) {
             elBar.style.width = '100%'; // Fallback
        }
    };
    
    update();
    activeTimers[mineType] = setInterval(update, 1000);
}

function formatMoney(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

window.addEventListener('load', initArgePage);