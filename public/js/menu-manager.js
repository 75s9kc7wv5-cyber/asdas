(function() {
    // 1. Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/menu-style.css';
    document.head.appendChild(link);

    // 2. Define Menu Items
    const menuItems = [
        { label: 'Meydan', icon: 'fa-chess-board', href: 'home.html' },
        { label: 'Sohbet', icon: 'fa-comments', href: 'chat.html' },
        { label: 'İşler', icon: 'fa-calendar-check', href: 'daily-job.html' },
        { label: 'Fabrika', icon: 'fa-industry', href: 'factory-category.html' },
        { label: 'Eğitim', icon: 'fa-graduation-cap', href: 'education.html' },
        { label: 'AR-GE', icon: 'fa-flask', href: 'research.html' },
        { label: 'Harita', icon: 'fa-map-marked-alt', href: 'mines-category.html' }
    ];

    // 3. Determine Active Page
    const path = window.location.pathname;
    let page = path.split("/").pop();
    // Remove query params or hashes if any (though pathname usually doesn't have hash, it might have params in some server setups, but standard window.location.pathname doesn't include search/hash. window.location.href does.)
    // Just in case:
    if (page.includes('?')) page = page.split('?')[0];
    if (page.includes('#')) page = page.split('#')[0];
    
    // 4. Build HTML
    let navHTML = '<nav class="bottom-nav">';
    
    menuItems.forEach(item => {
        // Basit aktiflik kontrolü
        let isActive = false;
        if (page === item.href) {
            isActive = true;
        }
        // Özel Durum: mine-list.html, mine-work.html, mine-management.html ise Harita (mines-category.html) aktif olsun
        if ((page === 'mine-list.html' || page === 'mine-work.html' || page === 'mine-management.html') && item.href === 'mines-category.html') {
            isActive = true;
        }
        // Özel Durum: factory sayfaları için Fabrika aktif olsun
        if ((page === 'factory-list.html' || page === 'factory-work.html' || page === 'factory-management.html') && item.href === 'factory-category.html') {
            isActive = true;
        }
        
        navHTML += `
            <a href="${item.href}" class="nav-item ${isActive ? 'active' : ''}" onclick="menuClick(this)">
                <i class="fas ${item.icon} nav-icon"></i>
                <span class="nav-label">${item.label}</span>
            </a>
        `;
    });
    
    navHTML += '</nav>';

    // 5. Inject HTML at the end of body
    function injectMenu() {
        // Remove existing menus to prevent duplicates (Fix for double menu issue)
        const existingMenus = document.querySelectorAll('.bottom-nav');
        existingMenus.forEach(m => m.remove());

        document.body.insertAdjacentHTML('beforeend', navHTML);

        // 6. Add padding/spacer to prevent content overlap
        // Body padding fallback
        document.body.style.paddingBottom = '80px'; 

        // Game Container Spacer (for flex layouts)
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            const spacer = document.createElement('div');
            spacer.className = 'layout-spacer';
            spacer.style.height = '80px';
            spacer.style.width = '100%';
            spacer.style.flexShrink = '0'; // Prevent shrinking
            gameContainer.appendChild(spacer);
        }
    }

    if (document.body) {
        injectMenu();
    } else {
        window.addEventListener('DOMContentLoaded', injectMenu);
    }

    // 7. Animation Function
    window.menuClick = function(element) {
        // Remove active class from all (visual only, page will reload)
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        element.classList.add('active');

        const icon = element.querySelector('.nav-icon');
        if(icon) {
            icon.style.transform = "scale(1.2)";
            setTimeout(() => {
                icon.style.transform = "scale(1) translateY(-2px)";
            }, 200);
        }
    }
})();
