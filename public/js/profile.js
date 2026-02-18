document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});

const fmt = (n) => n.toLocaleString('tr-TR');

async function loadProfile() {
    try {
        // Get user ID from URL or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id') || localStorage.getItem('userId') || 1; 

        // Get current logged in user for visitor tracking
        const currentUser = JSON.parse(localStorage.getItem('simWorldUser'));
        const visitorId = currentUser ? currentUser.id : null;

        const response = await fetch(`/api/profile/${userId}?visitorId=${visitorId}`);
        if (!response.ok) throw new Error('Profil yüklenemedi');

        const user = await response.json();
        renderProfile(user);
        
        // Load visitors
        loadVisitors(userId);
    } catch (error) {
        console.error('Hata:', error);
    }
}

async function loadVisitors(profileId) {
    try {
        const res = await fetch(`/api/profile/${profileId}/visitors`);
        const visitors = await res.json();
        
        const container = document.getElementById('lastVisitorsList');
        if (!container) return;
        
        if (visitors.length === 0) {
            container.innerHTML = '<div style="color:#666; font-size:0.8rem; padding:10px;">Henüz ziyaretçi yok.</div>';
            return;
        }
        
        container.innerHTML = '';
        visitors.forEach(v => {
            const div = document.createElement('div');
            div.style.cssText = 'min-width:70px; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;';
            div.onclick = () => location.href = `profile.html?id=${v.id}`;
            
            const img = document.createElement('img');
            img.src = v.avatar || 'uploads/avatars/default.png';
            img.style.cssText = 'width:50px; height:50px; border-radius:50%; border:1px solid #333; object-fit:cover;';
            
            const idSpan = document.createElement('div');
            idSpan.innerText = `#${v.id}`;
            idSpan.style.cssText = 'font-size:0.65rem; color:#666; margin-top:2px;';

            const name = document.createElement('div');
            name.innerText = v.username;
            name.style.cssText = 'font-size:0.75rem; color:#ccc; max-width:70px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
            
            div.appendChild(img);
            div.appendChild(idSpan);
            div.appendChild(name);
            container.appendChild(div);
        });
    } catch (e) {
        console.error("Visitors load error", e);
    }
}

function renderProfile(user) {
    // Header & Hero
    const moneyEl = document.getElementById('userMoney');
    if(moneyEl) moneyEl.innerText = fmt(user.money || 0);
    
    const nameEl = document.getElementById('pName');
    if(nameEl) nameEl.innerText = user.username;
    
    // Title logic
    let title = "";
    let badgeColor = "var(--accent-gold)"; // Default
    let showBadge = false;

    if (user.role === 'admin') {
        title = "Admin";
        badgeColor = "var(--accent-red)";
        showBadge = true;
    } else if (user.role === 'moderator') {
        title = "Moderatör";
        badgeColor = "#3498db"; // Blue for moderator
        showBadge = true;
    } else if (user.role === 'vip') {
        title = "VIP";
        badgeColor = "var(--accent-gold)";
        showBadge = true;
    }
    
    const titleEl = document.getElementById('pTitle');
    if(titleEl) {
        titleEl.innerText = title;
        titleEl.style.display = title ? 'block' : 'none';
    }

    // Badge Logic
    const badgeEl = document.querySelector('.p-badge');
    if (badgeEl) {
        if (showBadge) {
            badgeEl.style.display = 'flex';
            badgeEl.style.backgroundColor = badgeColor;
        } else {
            badgeEl.style.display = 'none';
        }
    }

    const levelEl = document.getElementById('pLevel');
    if(levelEl) levelEl.innerText = user.level || 1;
    
    // Avatar
    const avatarImg = document.getElementById('pAvatar');
    if (avatarImg) {
        if (user.avatar) {
            // Check if avatar path already includes uploads/
            if (user.avatar.includes('uploads/')) {
                avatarImg.src = user.avatar.startsWith('/') ? user.avatar : `/${user.avatar}`;
            } else {
                avatarImg.src = `/uploads/avatars/${user.avatar}`;
            }
        } else {
            avatarImg.src = `https://ui-avatars.com/api/?name=${user.username}&background=random`;
        }
    }

    // XP Bar
    const currentXp = (user.level * 100) % 1000; 
    const maxXp = 1000;
    const xpPercent = (currentXp / maxXp) * 100;
    
    const xpBar = document.getElementById('xpBar');
    if (xpBar) {
        xpBar.style.width = xpPercent + "%";
        const xpText = document.querySelector('.lr-xp');
        if(xpText) xpText.innerText = `${currentXp}/${maxXp} XP`;
    }

    // Financials
    const netWorth = (user.money || 0) + ((user.gold || 0) * 10000) + ((user.diamond || 0) * 100000);
    
    const fiVals = document.querySelectorAll('.fi-val');
    if(fiVals.length >= 1) {
        fiVals[0].innerText = fmt(netWorth) + " ₺";
    }

    // User Details (Online, Date, Last Login)
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    if (statusText && statusIndicator) {
        if (user.is_online) {
            statusText.innerText = "Çevrimiçi";
            statusText.className = "status-online";
            statusIndicator.style.color = "var(--accent-green)";
        } else {
            statusText.innerText = "Çevrimdışı";
            statusText.className = "status-offline";
            statusIndicator.style.color = "var(--text-muted)";
        }
    }

    const regDate = document.getElementById('regDate');
    if (regDate && user.created_at) {
        regDate.innerText = new Date(user.created_at).toLocaleDateString('tr-TR');
    }

    const lastLogin = document.getElementById('lastLogin');
    if (lastLogin && user.last_login) {
        const d = new Date(user.last_login);
        const now = new Date();
        const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) lastLogin.innerText = "Bugün";
        else if (diffDays === 1) lastLogin.innerText = "Dün";
        else lastLogin.innerText = `${diffDays} gün önce`;
    }

    // Achievements
    const achGrid = document.getElementById('achievementsGrid');
    if (achGrid) {
        achGrid.innerHTML = '';
        if (user.achievements && user.achievements.length > 0) {
            user.achievements.forEach(ach => {
                const div = document.createElement('div');
                div.className = 'ach-item';
                div.innerHTML = `
                    <i class="fas ${ach.icon}"></i>
                    <span>${ach.name}</span>
                `;
                achGrid.appendChild(div);
            });
        } else {
            achGrid.innerHTML = '<div style="grid-column:span 4; text-align:center; color:#666; font-size:0.8rem;">Henüz başarım yok.</div>';
        }
    }

    // Assets
    const assetGrid = document.getElementById('assetGrid');
    if (assetGrid) {
        assetGrid.innerHTML = '';
        const assets = [
            { type: "mine", name: "Madenler", count: user.mines_count || 0, icon: "fa-hammer", color: "var(--accent-gold)" },
            { type: "factory", name: "Fabrikalar", count: user.factories_count || 0, icon: "fa-industry", color: "var(--accent-red)" },
            { type: "hospital", name: "Hastane", count: user.license_hospital_level > 0 ? 1 : 0, icon: "fa-hospital", color: "var(--accent-green)" },
        ];

        assets.forEach(asset => {
            const opacity = asset.count > 0 ? 1 : 0.5;
            const countText = asset.count > 0 ? `${asset.count} Adet` : 'Yok';
            const div = document.createElement('div');
            div.className = 'asset-card';
            div.style.opacity = opacity;
            div.innerHTML = `
                <div class="ac-icon" style="color:${asset.color}">
                    <i class="fas ${asset.icon}"></i>
                </div>
                <div class="ac-info">
                    <h4>${asset.name}</h4>
                    <span>${countText}</span>
                </div>
            `;
            assetGrid.appendChild(div);
        });
    }

    // Licenses
    const licList = document.getElementById('licenseList');
    if (licList) {
        licList.innerHTML = '';
        const allLicenses = [
            { type: 'hospital', name: "Hastane Ruhsatı", icon: "fa-user-md" },
            { type: 'bank', name: "Banka Ruhsatı", icon: "fa-money-check" },
            { type: 'weapon', name: "Silah Üretimi", icon: "fa-crosshairs" },
            { type: 'export', name: "İhracat İzni", icon: "fa-ship" }
        ];
        const userLicenseTypes = user.licenses ? user.licenses.map(l => l.mine_type) : [];

        allLicenses.forEach(lic => {
            const isOwned = userLicenseTypes.includes(lic.type);
            const span = document.createElement('span');
            span.className = `badge ${isOwned ? 'owned' : ''}`;
            span.innerHTML = `<i class="fas ${lic.icon}"></i> ${lic.name}`;
            licList.appendChild(span);
        });
    }

    // Education Score
    const eduScore = user.education_skill || 0;
    let eduText = "Başlangıç";
    if(eduScore > 20) eduText = "Orta Seviye";
    if(eduScore > 60) eduText = "İleri Seviye";
    if(eduScore > 80) eduText = "Uzman";
    const eduEl = document.getElementById('eduScore');
    if(eduEl) eduEl.innerText = `${eduText} (${eduScore} Puan)`;

    // Visitor Count
    const vCount = document.getElementById('visitorCount');
    if (vCount) {
        vCount.innerText = fmt(user.profile_views || 0);
    }
}


