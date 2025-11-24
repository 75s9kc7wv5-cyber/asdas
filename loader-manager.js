(function() {
    // 1. Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'loader-style.css';
    document.head.appendChild(link);

    // 2. Inject HTML
    const loaderHTML = `
    <div id="game-loader">
        <div class="loader-logo">SIM <span>OF WORLD</span></div>
        
        <div class="spinner-container">
            <div class="spinner-ring"></div>
        </div>

        <div class="loading-text">YÜKLENİYOR...</div>
        <div class="loading-tip" id="loadingTip">Sunuculara bağlanılıyor...</div>
    </div>
    `;
    
    // Insert as first child of body to ensure it's on top
    if (document.body) {
        document.body.insertAdjacentHTML('afterbegin', loaderHTML);
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            document.body.insertAdjacentHTML('afterbegin', loaderHTML);
        });
    }

    // 3. Logic
    const tips = [
        "Sunuculara bağlanılıyor...",
        "Kullanıcı verileri şifreleniyor...",
        "Dünya haritası oluşturuluyor...",
        "Piyasa verileri güncelleniyor...",
        "Maden rezervleri kontrol ediliyor...",
        "Varlıklarınız hesaplanıyor..."
    ];

    let tipInterval;

    function startTips() {
        const tipElement = document.getElementById('loadingTip');
        if (!tipElement) return;
        
        if(tipInterval) clearInterval(tipInterval);
        tipElement.innerText = tips[Math.floor(Math.random() * tips.length)];
        tipInterval = setInterval(() => {
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            tipElement.innerText = randomTip;
        }, 800);
    }

    function hideLoader() {
        const loader = document.getElementById('game-loader');
        if (!loader) return;
        
        if(tipInterval) clearInterval(tipInterval);
        loader.classList.add('hidden');
    }

    window.showLoader = function() {
        const loader = document.getElementById('game-loader');
        if (!loader) return;
        
        loader.classList.remove('hidden');
        startTips();
    };

    // Start immediately
    // Wait for element to be in DOM
    setTimeout(startTips, 50);

    // Hide on load
    window.addEventListener('load', () => {
        setTimeout(hideLoader, 1500); // 1.5s delay for effect
    });

    // Intercept links for transition effect
    document.addEventListener('click', function(e) {
        const target = e.target.closest('a');
        // Check if it's a link and not a hash link or new tab
        if (target && target.href && !target.href.includes('#') && target.target !== '_blank') {
            // If it's a local link
            if(target.hostname === window.location.hostname) {
                // Don't prevent default immediately if we want to allow navigation
                // But we want to show loader first.
                e.preventDefault();
                window.showLoader();
                setTimeout(() => {
                    window.location.href = target.href;
                }, 500); // Short delay to show loader start
            }
        }
    });
})();
