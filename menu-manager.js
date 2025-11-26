(function() {
    // 1. Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'menu-style.css';
    document.head.appendChild(link);

    // 2. Define Menu Items
    const menuItems = [
        { label: 'Meydan', icon: 'fa-chess-board', href: 'home.html' },
        { label: 'İşler', icon: 'fa-calendar-check', href: 'daily-job.html' },
        { label: 'Fabrika', icon: 'fa-industry', href: 'factory.html' },
        { label: 'AR-GE', icon: 'fa-flask', href: 'arge.html' },
        { label: 'Harita', icon: 'fa-map-marked-alt', href: 'mines.html' }
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
        // Eğer anasayfa ise ve page boşsa veya index.html ise (gerçi login var ama)
        
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
        if (document.querySelector('.bottom-nav')) return; // Prevent duplicate

        document.body.insertAdjacentHTML('beforeend', navHTML);

        // 6. Add padding/spacer to prevent content overlap
        // Body padding fallback
        document.body.style.paddingBottom = '80px'; 

        // Game Container Spacer (for flex layouts)
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            const spacer = document.createElement('div');
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
