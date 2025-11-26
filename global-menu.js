// Global menu script for Sim of World
(() => {
  const pages = [
    { href: 'bank.html', icon: 'fas fa-university', label: 'Banka' },
    { href: 'envanter.html', icon: 'fas fa-briefcase', label: 'Envanter' },
    { href: 'daily-job.html', icon: 'fas fa-calendar-check', label: 'Günlük İşler' },
    { href: 'factory.html', icon: 'fas fa-industry', label: 'Fabrikalar' },
    { href: 'hospital.html', icon: 'fas fa-hospital-alt', label: 'Hastane' },
    { href: 'market.html', icon: 'fas fa-shopping-basket', label: 'Pazar' },
    { href: 'meclis.html', icon: 'fas fa-landmark', label: 'Meclis' },
    { href: 'mines.html', icon: 'fas fa-coins', label: 'Madenler' },
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
    pages.forEach(p => {
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
  document.addEventListener('DOMContentLoaded', buildMenu);
})();
