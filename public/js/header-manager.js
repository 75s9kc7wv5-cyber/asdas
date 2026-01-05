(function() {
    // Prevent Duplicate Execution
    if (document.getElementById('gameHeader')) {
        console.warn("Header Manager already initialized.");
        return;
    }

    // 1. Check Authentication
    const userStr = localStorage.getItem('simWorldUser');
    if (!userStr) {
        console.log("No user logged in. Header stats will not be displayed.");
        return; 
    }

    const user = JSON.parse(userStr);
    const userId = user.id;

    // 2. Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/header-style.css';
    document.head.appendChild(link);

    // Inject Global Menu CSS
    const gmLink = document.createElement('link');
    gmLink.rel = 'stylesheet';
    gmLink.href = 'css/global-menu.css';
    document.head.appendChild(gmLink);

    // Inject Global Menu JS
    const gmScript = document.createElement('script');
    gmScript.src = 'js/global-menu.js';
    document.head.appendChild(gmScript);

    // Inject Bottom Menu JS (Standardize Menu System)
    const menuScript = document.createElement('script');
    menuScript.src = 'js/menu-manager.js';
    document.head.appendChild(menuScript);

    // 3. Create Header HTML
    const headerHTML = `
    <header class="game-header-v2" id="gameHeader">
        
        <div class="gh-top" style="display: flex; justify-content: space-between; align-items: center; padding: 0 5px;">
            <div class="gh-notif-btn" onclick="toggleNotifications()" style="margin-right: 0;">
                <i class="fas fa-bell"></i>
                <span class="gh-notif-badge" id="notifBadge" style="display:none">0</span>
            </div>
            
            <a href="index.html" class="gh-logo" style="margin: 0 auto;">SIM <span>OF WORLD</span></a>
            
            <button class="gh-menu-btn" onclick="toggleGlobalMenu()">☰</button>
        </div>

        <div class="gh-currencies">
            <div class="gh-curr-item">
                <img src="icons/inventory-icon/money.png" style="width: 18px; height: 18px; object-fit: contain;" alt="Para">
                <span class="gh-curr-val" id="headerMoney">...</span>
            </div>
            <div class="gh-curr-item">
                <img src="icons/inventory-icon/gold.png" style="width: 18px; height: 18px; object-fit: contain;" alt="Altın">
                <span class="gh-curr-val" id="headerGold">...</span>
            </div>
            <div class="gh-curr-item">
                <img src="icons/inventory-icon/diamond.png" style="width: 18px; height: 18px; object-fit: contain;" alt="Elmas">
                <span class="gh-curr-val" id="headerDiamond">...</span>
            </div>
        </div>

        <div class="gh-stats">
            <div class="gh-stat-row">
                <i class="fas fa-crown gh-stat-icon icon-level" style="color: var(--c-level);"></i>
                <div class="gh-progress-bg">
                    <div class="gh-progress-fill fill-level" id="barLevel" style="width: 0%; background: var(--c-level); box-shadow: 0 0 8px var(--c-level);"></div>
                </div>
                <span class="gh-stat-text" id="textLevel">...</span>
            </div>

            <div class="gh-stat-row">
                <i class="fas fa-heart gh-stat-icon icon-health"></i>
                <div class="gh-progress-bg">
                    <div class="gh-progress-fill fill-health" id="barHealth" style="width: 0%"></div>
                </div>
                <span class="gh-stat-text" id="textHealth">...</span>
            </div>
            
            <div class="gh-stat-row">
                <i class="fas fa-bolt gh-stat-icon icon-energy"></i>
                <div class="gh-progress-bg">
                    <div class="gh-progress-fill fill-energy" id="barEnergy" style="width: 0%"></div>
                </div>
                <span class="gh-stat-text" id="textEnergy">...</span>
            </div>
        </div>

    </header>

    <!-- Notification Modal -->
    <div id="notifModal" class="notif-modal" style="display:none;">
        <div class="notif-header">
            <h3>Bildirimler</h3>
            <span onclick="toggleNotifications()" style="cursor:pointer"><i class="fas fa-times"></i></span>
        </div>
        <div id="notifList" class="notif-list">
            <div style="padding:20px; text-align:center; color:#666;">Yükleniyor...</div>
        </div>
    </div>
    `;

    // Insert Header into .game-container if exists, otherwise body
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.insertAdjacentHTML('afterbegin', headerHTML);
    } else {
        document.body.insertAdjacentHTML('afterbegin', headerHTML);
    }

    // 4. Fetch and Update Data
    async function updateHeaderStats() {
        // Re-check auth in case user logged out in another tab
        const currentUserStr = localStorage.getItem('simWorldUser');
        if (!currentUserStr) {
            clearInterval(statsInterval);
            const header = document.getElementById('gameHeader');
            if (header) header.style.display = 'none';
            return;
        }
        
        try {
            const response = await fetch(`/api/user-stats/${userId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.error("User not found in DB");
                    localStorage.removeItem('simWorldUser');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            updateHeader(data);
            
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
    }

    // HEADER GÜNCELLEME SİSTEMİ
    function updateHeader(data) {
        // Sayı Formatlama (1.000.000 gibi)
        const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        // Değerleri DOM'a yazma
        if(data.money !== undefined) document.getElementById('headerMoney').innerText = fmt(data.money) + " ₺";
        if(data.gold !== undefined) document.getElementById('headerGold').innerText = fmt(data.gold);
        if(data.diamond !== undefined) document.getElementById('headerDiamond').innerText = fmt(data.diamond);
        
        // Level Bar Update
        if(data.level !== undefined) {
            const lvlText = document.getElementById('textLevel');
            const lvlBar = document.getElementById('barLevel');
            if(lvlText) lvlText.innerText = "Lv." + data.level;
            if(lvlBar) lvlBar.style.width = "100%";
        }

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

    // Update every 2 seconds (Faster polling for near-instant updates)
    const statsInterval = setInterval(updateHeaderStats, 2000);

    // Expose update function globally if needed
    window.updateHeaderStats = updateHeaderStats;
    window.updateHeader = updateHeader;

    // Listen for custom event 'userStatsUpdated' to trigger immediate update
    window.addEventListener('userStatsUpdated', () => {
        updateHeaderStats();
    });

    // --- GLOBAL MENU LOGIC (Merged) ---
    const menuPages = [
        { href: 'bank-list.html', icon: 'fas fa-university', label: 'Banka' },
        { href: 'inventory.html', icon: 'fas fa-briefcase', label: 'Envanter' },
        { href: 'factory.html', icon: 'fas fa-industry', label: 'Fabrikalar' },
        { href: 'hospital-list.html', icon: 'fas fa-hospital-alt', label: 'Hastane' },
        { href: 'market.html', icon: 'fas fa-shopping-basket', label: 'Pazar' },
        { href: 'council.html', icon: 'fas fa-landmark', label: 'Meclis' },
        { href: 'mine-list.html', icon: 'fas fa-coins', label: 'Madenler' },
        { href: 'licence.html', icon: 'fas fa-id-card', label: 'Lisanslar' },
        { href: 'research.html', icon: 'fas fa-flask', label: 'AR-GE Merkezi' },
        { href: 'Untitled-1.html', icon: 'fas fa-hammer', label: 'Manuel Maden' },
        { href: 'admin.html', icon: 'fas fa-user-shield', label: 'Admin Paneli' }
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

    // --- NOTIFICATIONS LOGIC ---
    let isNotifOpen = false;

    window.toggleNotifications = function() {
        const modal = document.getElementById('notifModal');
        if (!modal) return;
        
        isNotifOpen = !isNotifOpen;
        modal.style.display = isNotifOpen ? 'flex' : 'none';
        
        if (isNotifOpen) {
            fetchNotifications();
            markNotificationsRead();
        }
    };

    async function fetchNotifications() {
        try {
            const response = await fetch(`/api/notifications/${userId}`);
            const data = await response.json();
            
            renderNotifications(data.notifications);
            updateBadge(data.unreadCount);
        } catch (e) {
            console.error('Notif fetch error:', e);
        }
    }

    function renderNotifications(list) {
        const container = document.getElementById('notifList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!list || list.length === 0) {
            container.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">Bildirim yok.</div>';
            return;
        }
        
        list.forEach(n => {
            const div = document.createElement('div');
            div.className = `notif-item ${n.is_read ? '' : 'unread'}`;
            
            const date = new Date(n.created_at);
            const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            div.innerHTML = `
                <div class="notif-title">${n.title}</div>
                <div class="notif-msg">${n.message}</div>
                <div class="notif-time">${timeStr}</div>
            `;
            container.appendChild(div);
        });
    }

    function updateBadge(count) {
        const badge = document.getElementById('notifBadge');
        if (!badge) return;
        
        if (count > 0) {
            badge.style.display = 'block';
            badge.innerText = count > 9 ? '9+' : count;
        } else {
            badge.style.display = 'none';
        }
    }

    async function markNotificationsRead() {
        try {
            await fetch('/api/notifications/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            // Badge will be cleared on next fetch or manually here
            setTimeout(() => updateBadge(0), 1000);
        } catch (e) {
            console.error(e);
        }
    }

    // Initial Fetch
    fetchNotifications();
    // Poll every 30 seconds
    setInterval(fetchNotifications, 30000);

    // Expose globally
    window.fetchNotifications = fetchNotifications;

})();
