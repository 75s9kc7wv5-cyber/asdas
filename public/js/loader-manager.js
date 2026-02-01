(function() {
    // 0. Immediate State Control
    document.documentElement.classList.add('loading-state');

    // 1. Inject CSS (Inlined for speed)
    const css = `
    :root { --bg-dark: #0d0d0d; --accent-cyan: #00e5ff; --text-white: #ffffff; --font-main: 'Rajdhani', sans-serif; }
    ::-webkit-scrollbar { display: none; }
    * { -ms-overflow-style: none; scrollbar-width: none; }
    
    /* Loading State Logic */
    html.loading-state body { visibility: hidden; background-color: var(--bg-dark); overflow: hidden; }
    html.loading-state body #game-loader { visibility: visible; }

    #game-loader { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: var(--bg-dark); z-index: 99999; display: flex; flex-direction: column; justify-content: center; align-items: center; transition: opacity 0.3s ease, visibility 0.3s ease; }
    #game-loader.hidden { opacity: 0; visibility: hidden; pointer-events: none; }
    .loader-logo { font-size: 2.5rem; font-weight: 900; letter-spacing: 2px; margin-bottom: 40px; animation: pulseLogo 2s infinite ease-in-out; color: #fff; }
    .loader-logo span { color: var(--accent-cyan); }
    .spinner-container { position: relative; width: 80px; height: 80px; margin-bottom: 30px; }
    .spinner-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 3px solid transparent; border-top-color: var(--accent-cyan); animation: spin 1s linear infinite; box-shadow: 0 0 15px rgba(0, 229, 255, 0.5); }
    .spinner-ring::before { content: ""; position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px; border-radius: 50%; border: 3px solid transparent; border-top-color: rgba(255, 255, 255, 0.5); animation: spinReverse 2s linear infinite; }
    .spinner-ring::after { content: ""; position: absolute; top: 15px; left: 15px; right: 15px; bottom: 15px; border-radius: 50%; border: 3px solid transparent; border-top-color: var(--accent-cyan); animation: spin 3s linear infinite; }
    .loading-text { font-size: 1.2rem; font-weight: bold; letter-spacing: 2px; color: var(--accent-cyan); margin-bottom: 10px; text-transform: uppercase; }
    .loading-tip { font-size: 0.8rem; color: #777; min-height: 20px; text-align: center; padding: 0 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes spinReverse { 0% { transform: rotate(0deg); } 100% { transform: rotate(-360deg); } }
    @keyframes pulseLogo { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.8; } }
    `;
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);

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

    window.hideLoader = function() {
        const loader = document.getElementById('game-loader');
        if (!loader) return;
        
        if(tipInterval) clearInterval(tipInterval);
        loader.classList.add('hidden');
        document.documentElement.classList.remove('loading-state');
    };

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
        if (!window.holdingLoader) {
            setTimeout(window.hideLoader || hideLoader, 300);
        }
    });

    // Handle back/forward cache (Example: navigating back to this page)
    window.addEventListener('pageshow', (event) => {
        if (!window.holdingLoader) {
            if (event.persisted) {
                 setTimeout(window.hideLoader || hideLoader, 100);
            } else {
                 setTimeout(window.hideLoader || hideLoader, 300);
            }
        }
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
