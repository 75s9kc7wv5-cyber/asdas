(function() {
    // 1. Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'header-style.css';
    document.head.appendChild(link);

    // 2. Create Header HTML
    const headerHTML = `
    <header class="game-header-v2">
        
        <div class="gh-top">
            <a href="index.html" class="gh-logo">SIM <span>OF WORLD</span></a>
            <div style="display:flex; align-items:center;">
                <div class="gh-level-badge">
                    <i class="fas fa-crown"></i>
                    <span id="headerLevel">Lv. 1</span>
                </div>
                <button class="gh-menu-btn" onclick="toggleGlobalMenu()">☰</button>
            </div>
        </div>

        <div class="gh-currencies">
            <div class="gh-curr-item">
                <i class="fas fa-wallet gc-money"></i>
                <span class="gh-curr-val" id="headerMoney">0 ₺</span>
            </div>
            <div class="gh-curr-item">
                <i class="fas fa-coins gc-gold"></i>
                <span class="gh-curr-val" id="headerGold">0</span>
            </div>
            <div class="gh-curr-item">
                <i class="fas fa-gem gc-diamond"></i>
                <span class="gh-curr-val" id="headerDiamond">0</span>
            </div>
        </div>

        <div class="gh-stats">
            <div class="gh-stat-row">
                <i class="fas fa-heart gh-stat-icon icon-health"></i>
                <div class="gh-progress-bg">
                    <div class="gh-progress-fill fill-health" id="barHealth" style="width: 0%"></div>
                </div>
                <span class="gh-stat-text" id="textHealth">0%</span>
            </div>
            
            <div class="gh-stat-row">
                <i class="fas fa-bolt gh-stat-icon icon-energy"></i>
                <div class="gh-progress-bg">
                    <div class="gh-progress-fill fill-energy" id="barEnergy" style="width: 0%"></div>
                </div>
                <span class="gh-stat-text" id="textEnergy">0%</span>
            </div>
        </div>

    </header>
    `;

    // Insert Header at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    // 3. Fetch and Update Data
    async function updateHeaderStats() {
        const userId = localStorage.getItem('userId') || 1; // Default to 1 if not set
        
        try {
            const response = await fetch(`/api/user-stats/${userId}`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            updateHeader(data);
            
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
    }

    // HEADER GÜNCELLEME SİSTEMİ
    // Bu fonksiyonu oyunun herhangi bir yerinden çağırarak header'ı güncelleyebilirsin.
    function updateHeader(data) {
        // Sayı Formatlama (1.000.000 gibi)
        const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        // Değerleri DOM'a yazma
        if(data.money !== undefined) document.getElementById('headerMoney').innerText = fmt(data.money) + " ₺";
        if(data.gold !== undefined) document.getElementById('headerGold').innerText = fmt(data.gold);
        if(data.diamond !== undefined) document.getElementById('headerDiamond').innerText = fmt(data.diamond);
        if(data.level !== undefined) document.getElementById('headerLevel').innerText = "Lv. " + data.level;

        // Barların güncellenmesi
        if(data.health !== undefined) {
            document.getElementById('barHealth').style.width = data.health + "%";
            document.getElementById('textHealth').innerText = data.health + "%";
        }
        if(data.energy !== undefined) {
            document.getElementById('barEnergy').style.width = data.energy + "%";
            document.getElementById('textEnergy').innerText = data.energy + "%";
        }
    }

    // Initial update
    updateHeaderStats();

    // Update every 10 seconds
    setInterval(updateHeaderStats, 10000);

    // Expose update function globally if needed
    window.updateHeaderStats = updateHeaderStats;
    window.updateHeader = updateHeader;

    // --- GLOBAL MENU LOGIC (Merged) ---
    const menuPages = [
        { href: 'bank.html', icon: 'fas fa-university', label: 'Banka' },
        { href: 'envanter.html', icon: 'fas fa-briefcase', label: 'Envanter' },
        { href: 'factory.html', icon: 'fas fa-industry', label: 'Fabrikalar' },
        { href: 'hospital.html', icon: 'fas fa-hospital-alt', label: 'Hastane' },
        { href: 'market.html', icon: 'fas fa-shopping-basket', label: 'Pazar' },
        { href: 'meclis.html', icon: 'fas fa-landmark', label: 'Meclis' },
        { href: 'mines.html', icon: 'fas fa-coins', label: 'Madenler' },
        { href: 'licence.html', icon: 'fas fa-id-card', label: 'Lisanslar' },
        { href: 'arge.html', icon: 'fas fa-flask', label: 'AR-GE Merkezi' },
        { href: 'Untitled-1.html', icon: 'fas fa-hammer', label: 'Manuel Maden' }
    ];

    function buildMenu() {
        if (document.getElementById('globalMenu')) return;

        const overlay = document.createElement('div');
        overlay.id = 'globalMenu';
        overlay.className = 'global-menu-overlay';
        overlay.innerHTML = `
        <div class="global-menu-card" role="dialog" aria-modal="true">
            <div class="global-menu-header">
            <h3>Gezinme Menüsü</h3>
            <div class="global-menu-close" onclick="closeGlobalMenu()"><i class="fas fa-times"></i></div>
            </div>
            <div class="global-menu-list"></div>
        </div>`;

        document.body.appendChild(overlay);

        const list = overlay.querySelector('.global-menu-list');
        menuPages.forEach(p => {
        const a = document.createElement('a');
        a.className = 'global-menu-item';
        a.href = p.href;
        a.innerHTML = `<div class="global-menu-icon"><i class="${p.icon}"></i></div><div>
                        <div class="global-menu-label">${p.label}</div>
                        </div>`;
        list.appendChild(a);
        });

        // Logout Button
        const logoutBtn = document.createElement('div');
        logoutBtn.className = 'global-menu-item';
        logoutBtn.style.cursor = 'pointer';
        logoutBtn.style.marginTop = '10px';
        logoutBtn.style.borderTop = '1px solid #333';
        logoutBtn.onclick = () => {
            localStorage.removeItem('simWorldUser');
            window.location.href = 'login.html';
        };
        logoutBtn.innerHTML = `<div class="global-menu-icon"><i class="fas fa-sign-out-alt" style="color:var(--accent-red)"></i></div><div>
                        <div class="global-menu-label" style="color:var(--accent-red)">Çıkış Yap</div>
                        </div>`;
        list.appendChild(logoutBtn);

        // close when clicking outside card
        overlay.addEventListener('click', (ev) => {
        if (ev.target === overlay) closeGlobalMenu();
        });
    }

    window.openGlobalMenu = function() {
        buildMenu();
        const el = document.getElementById('globalMenu');
        if (!el) return;
        el.style.display = 'flex';
    };

    window.closeGlobalMenu = function() {
        const el = document.getElementById('globalMenu');
        if (!el) return;
        el.style.display = 'none';
    };

    window.toggleGlobalMenu = function() {
        const el = document.getElementById('globalMenu');
        if (!el) {
            buildMenu();
            document.getElementById('globalMenu').style.display = 'flex';
        } else {
            if (el.style.display === 'none' || el.style.display === '') {
                el.style.display = 'flex';
            } else {
                el.style.display = 'none';
            }
        }
    };

    // Build early so CSS doesn't flash when opening
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildMenu);
    } else {
        buildMenu();
    }

})();
