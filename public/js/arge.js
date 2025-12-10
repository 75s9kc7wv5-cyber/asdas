const minesData = [
    { id: 'wood', name: 'Ormancılık Teknikleri', desc: 'Ağaç kesim ve işleme hızını artırır.', icon: 'fa-tree', colorClass: 'c-wood' },
    { id: 'stone', name: 'Taş Kırma Teknolojisi', desc: 'Taş ocağı verimliliğini artırır.', icon: 'fa-cubes', colorClass: 'c-stone' },
    { id: 'iron', name: 'Demir Eritme Fırınları', desc: 'Demir cevheri işleme kapasitesini yükseltir.', icon: 'fa-cube', colorClass: 'c-iron' },
    { id: 'coal', name: 'Kömür Ayrıştırma', desc: 'Daha kaliteli kömür çıkarımı sağlar.', icon: 'fa-fire', colorClass: 'c-coal' },
    { id: 'oil', name: 'Petrol Sondajı', desc: 'Petrol kuyusu pompa hızını artırır.', icon: 'fa-oil-can', colorClass: 'c-oil' },
    { id: 'copper', name: 'Bakır İletkenliği', desc: 'Bakır madeni üretimini optimize eder.', icon: 'fa-layer-group', colorClass: 'c-copper' },
    { id: 'gold', name: 'Altın Eleme Sistemi', desc: 'Altın tozlarını daha verimli ayrıştırır.', icon: 'fa-coins', colorClass: 'c-gold' },
    { id: 'diamond', name: 'Elmas Kesim Lazerleri', desc: 'Elmas çıkarma hasarını azaltır.', icon: 'fa-gem', colorClass: 'c-diamond' },
    { id: 'uranium', name: 'Uranyum Zenginleştirme', desc: 'Nükleer yakıt üretimini artırır.', icon: 'fa-radiation', colorClass: 'c-uranium' }
];

let argeData = {};
let activeTimers = {};
let selectedResearchId = null;

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

    await getCurrentArgeData(user.id);
}

async function getCurrentArgeData(userId) {
    try {
        const response = await fetch(`/api/arge/status/${userId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        argeData = data || {};
        renderArgeList();
    } catch (error) {
        console.error('AR-GE verisi alınamadı:', error);
        const container = document.getElementById('researchList');
        if (container) container.innerHTML = '<div style="text-align:center; color:var(--accent-red);">Veri yüklenemedi. Lütfen sayfayı yenileyin.</div>';
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

function renderArgeList() {
    const container = document.getElementById('researchList');
    if (!container) return;
    
    container.innerHTML = '';

    if (!minesData || minesData.length === 0) {
        container.innerHTML = '<div style="text-align:center;">Görüntülenecek araştırma yok.</div>';
        return;
    }

    minesData.forEach(mine => {
        const mineArge = argeData[mine.id] || { level: 1, is_researching: 0, research_end_time: null };
        const level = mineArge.level;
        const isMaxed = level >= 10;
        const nextLevel = level + 1;
        
        // Stats
        const bonus = (level - 1) * 5; // +5% per level above 1

        // Cost
        const costMoney = Math.floor(5000 * Math.pow(1.8, level - 1));
        const duration = level * 60;

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
        } else if (mineArge.is_researching) {
            actionHTML = `
                <div class="timer-box" style="border-color:var(--accent-purple)">
                    <div class="timer-bar" id="bar-${mine.id}" style="background:rgba(155, 89, 182, 0.3)"></div>
                    <div class="timer-text" id="timer-${mine.id}">00:00</div>
                </div>
            `;
            // Start timer if not already running
            if (!activeTimers[mine.id]) {
                updateResearchTimer(mine.id, mineArge.research_end_time, duration);
            }
        } else {
            actionHTML = `
                <button class="btn-research" onclick="openModal('${mine.id}')">
                    <span>Geliştir (Sv. ${nextLevel})</span>
                    <small>Detaylar <i class="fas fa-chevron-right"></i></small>
                </button>
            `;
        }

        card.innerHTML = `
            <div class="r-top">
                <div class="r-icon-box ${mine.colorClass}">
                    <i class="fas ${mine.icon}"></i>
                </div>
                <div class="r-info">
                    <div class="r-title">
                        ${mine.name}
                        <span class="r-level">${level} / 10</span>
                    </div>
                    <div class="r-desc">${mine.desc}</div>
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

function openModal(mineId) {
    selectedResearchId = mineId;
    const mine = minesData.find(m => m.id === mineId);
    const mineArge = argeData[mineId] || { level: 1 };
    const level = mineArge.level;
    
    const costMoney = Math.floor(5000 * Math.pow(1.8, level - 1));
    const costGold = 50 * level;
    const costDiamond = level >= 5 ? (level - 4) * 2 : 0;

    const duration = level * 60;
    const bonus = 5; // +5% per level

    document.getElementById('mTitle').innerText = mine.name;
    document.getElementById('mTime').innerText = formatTime(duration);
    
    let costText = `<div style="display:flex; flex-direction:column; gap:5px;">
        <span style="color:var(--accent-green)">${formatMoney(costMoney)} ₺</span>
        <span style="color:var(--accent-gold)">${formatMoney(costGold)} Altın</span>`;
    
    if (costDiamond > 0) {
        costText += `<span style="color:var(--accent-cyan)">${costDiamond} Elmas</span>`;
    }
    costText += `</div>`;

    document.getElementById('mCost').innerHTML = costText;
    document.getElementById('mEffect').innerText = `+%${bonus} Verimlilik`;

    document.getElementById('confirmModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('confirmModal').style.display = 'none';
    selectedResearchId = null;
}

async function startResearch() {
    if (!selectedResearchId) return;
    
    const user = JSON.parse(localStorage.getItem('simWorldUser'));
    const mineType = selectedResearchId;
    
    try {
        const result = await saveToDatabase('/api/arge/start', { userId: user.id, mineType: mineType });
        
        if (result.success) {
            // Update local data immediately to reflect UI change
            if (!argeData[mineType]) argeData[mineType] = { level: 1 };
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

async function finishResearch(mineType) {
    const user = JSON.parse(localStorage.getItem('simWorldUser'));
    
    try {
        const result = await saveToDatabase('/api/arge/finish', { userId: user.id, mineType: mineType });
        
        if (result.success) {
            // Update local data
            if (!argeData[mineType]) argeData[mineType] = { level: 1 };
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

function formatMoney(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

window.addEventListener('load', initArgePage);