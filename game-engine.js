/**
 * Sim of World - Game Engine
 * Handles Game State, LocalStorage, Economy, and Global UI
 */

const Game = {
    // Varsayılan Oyun Durumu
    state: {
        money: 1000.00,
        bank: 0.00,
        debt: 0.00,
        health: 100,
        energy: 100,
        maxEnergy: 100,
        xp: 0,
        level: 1,
        inventory: {
            stone: 0,
            wood: 0,
            iron: 0,
            gold: 0,
            food: 5, // Başlangıç yiyeceği
            weapon: 0
        },
        factories: {
            farm: 0,
            mine: 0
        },
        lastSave: Date.now()
    },

    // Kaynak Fiyatları (Alış/Satış)
    prices: {
        stone: { buy: 15, sell: 10 },
        wood: { buy: 20, sell: 15 },
        iron: { buy: 50, sell: 40 },
        gold: { buy: 500, sell: 450 },
        food: { buy: 50, sell: 25 }, // Enerji verir
        weapon: { buy: 2500, sell: 1000 }
    },

    init() {
        console.log("Game Engine Initializing...");
        this.load();
        this.startLoop();
        this.updateGlobalUI();
        
        // Sayfa yüklendiğinde UI güncelle
        window.addEventListener('load', () => this.updateGlobalUI());
    },

    // --- SAVE / LOAD SYSTEM ---
    load() {
        const saved = localStorage.getItem('simWorldSave_v1');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Mevcut state ile birleştir (yeni eklenen alanlar kaybolmasın diye)
                this.state = { ...this.state, ...parsed };
                // Inventory merge (eğer yeni itemler eklendiyse)
                this.state.inventory = { ...Game.state.inventory, ...parsed.inventory };
                console.log("Save loaded successfully.");
            } catch (e) {
                console.error("Save file corrupted, resetting.", e);
            }
        }
    },

    save() {
        this.state.lastSave = Date.now();
        localStorage.setItem('simWorldSave_v1', JSON.stringify(this.state));
        // console.log("Game Saved");
    },

    reset() {
        if(confirm("Tüm ilerlemeniz silinecek! Emin misiniz?")) {
            localStorage.removeItem('simWorldSave_v1');
            location.reload();
        }
    },

    // --- GAME LOOP ---
    startLoop() {
        // Her 1 saniyede bir çalışır
        setInterval(() => {
            this.tick();
        }, 1000);

        // Her 10 saniyede bir kaydet
        setInterval(() => {
            this.save();
        }, 10000);
    },

    tick() {
        // Enerji Yenilenmesi (Her saniye +1, Max'a kadar)
        if (this.state.energy < this.state.maxEnergy) {
            this.state.energy += 0.5; // Yavaş yenilenme
            if (this.state.energy > this.state.maxEnergy) this.state.energy = this.state.maxEnergy;
        }

        // Pasif Gelir (Fabrikalar varsa)
        // Örnek: Her fabrika dakikada bir gelir versin (burada basitleştirildi)
        
        this.updateGlobalUI();
    },

    // --- ACTIONS ---
    
    // Para Ekle/Çıkar
    addMoney(amount) {
        this.state.money += amount;
        this.save();
        this.updateGlobalUI();
    },

    spendMoney(amount) {
        if (this.state.money >= amount) {
            this.state.money -= amount;
            this.save();
            this.updateGlobalUI();
            return true;
        }
        return false;
    },

    // Envanter İşlemleri
    addItem(item, qty) {
        if (!this.state.inventory[item]) this.state.inventory[item] = 0;
        this.state.inventory[item] += qty;
        this.save();
        this.showToast(`+${qty} ${item.toUpperCase()}`, 'success');
    },

    removeItem(item, qty) {
        if (this.state.inventory[item] >= qty) {
            this.state.inventory[item] -= qty;
            this.save();
            return true;
        }
        return false;
    },

    // Enerji Kullanımı
    useEnergy(amount) {
        if (this.state.energy >= amount) {
            this.state.energy -= amount;
            this.updateGlobalUI();
            return true;
        }
        this.showToast("Enerji Yetersiz! Yemek ye veya bekle.", 'error');
        return false;
    },

    // XP Kazanma
    gainXp(amount) {
        this.state.xp += amount;
        // Basit Level Formülü: Level * 100 XP
        let reqXp = this.state.level * 100;
        if (this.state.xp >= reqXp) {
            this.state.xp -= reqXp;
            this.state.level++;
            this.state.maxEnergy += 10; // Level atlayınca enerji kapasitesi artar
            this.state.energy = this.state.maxEnergy; // Enerji fullenir
            this.showToast(`TEBRİKLER! SEVİYE ${this.state.level} OLDUNUZ!`, 'gold');
            // Ses efekti eklenebilir
        }
        this.save();
    },

    // --- UI HELPERS ---
    formatMoney(amount) {
        return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
    },

    updateGlobalUI() {
        // Header'daki elementleri bul ve güncelle
        // Not: Her sayfanın header yapısı biraz farklı olabilir, genel seçiciler kullanıyoruz.
        
        // Para
        const moneyEls = document.querySelectorAll('#headerWallet, #walletDisplay, #moneyDisplay, .stat-box.money-display span, .stat-box i.fa-wallet + span');
        moneyEls.forEach(el => {
            // Sadece sayıyı güncelle, ikonu bozma
            el.innerText = this.state.money.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            // Eğer parent'ında ₺ yoksa ekle (bazı sayfalarda span içinde sadece sayı var)
        });

        // Enerji Barı (Varsa)
        const energyBars = document.querySelectorAll('.bar-item i.fa-bolt');
        energyBars.forEach(icon => {
            const parent = icon.parentElement;
            if(parent) {
                parent.innerHTML = `<i class="fas fa-bolt"></i> %${Math.floor(this.state.energy)}`;
            }
        });

        // Sağlık Barı (Varsa)
        const healthBars = document.querySelectorAll('.bar-item i.fa-heart');
        healthBars.forEach(icon => {
            const parent = icon.parentElement;
            if(parent) {
                parent.innerHTML = `<i class="fas fa-heart"></i> %${this.state.health}`;
            }
        });
    },

    showToast(msg, type = 'info') {
        // Basit bir toast bildirimi oluştur
        const container = document.getElementById('game-toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `game-toast toast-${type}`;
        toast.innerText = msg;
        
        container.appendChild(toast);
        
        // Animasyon ve silme
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    },

    createToastContainer() {
        const div = document.createElement('div');
        div.id = 'game-toast-container';
        div.style.cssText = "position: fixed; top: 80px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px;";
        document.body.appendChild(div);
        
        // Toast stillerini ekle
        const style = document.createElement('style');
        style.innerHTML = `
            .game-toast { padding: 12px 20px; border-radius: 5px; color: #fff; font-family: 'Rajdhani', sans-serif; font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.5); animation: slideInRight 0.3s; min-width: 200px; }
            .toast-success { background: #2ecc71; border-left: 5px solid #27ae60; }
            .toast-error { background: #e74c3c; border-left: 5px solid #c0392b; }
            .toast-info { background: #3498db; border-left: 5px solid #2980b9; }
            .toast-gold { background: #f1c40f; border-left: 5px solid #f39c12; color: #000; }
            @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `;
        document.head.appendChild(style);
        return div;
    }
};

// Başlat
Game.init();
