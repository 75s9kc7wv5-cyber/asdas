// Settings Logic

document.addEventListener('DOMContentLoaded', () => {
    initSettings();
});

function initSettings() {
    // Load Preferences
    const sound = localStorage.getItem('sow_sound') !== 'false'; // Default true
    const notif = localStorage.getItem('sow_notif') !== 'false'; // Default true

    document.getElementById('toggleSound').checked = sound;
    document.getElementById('toggleNotif').checked = notif;

    // Load User Info
    const userStr = localStorage.getItem('simWorldUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        document.getElementById('userIdDisplay').innerText = user.id;
        
        // Load Avatar
        loadAvatar(user.id);
    }
}

async function loadAvatar(userId) {
    try {
        const response = await fetch(`/api/profile/${userId}`);
        const data = await response.json();
        if (data.avatar) {
            document.getElementById('currentAvatar').src = data.avatar;
        } else {
            document.getElementById('currentAvatar').src = 'uploads/avatars/default.png';
        }
    } catch (e) {
        console.error("Avatar load error", e);
    }
}

async function uploadAvatar() {
    const fileInput = document.getElementById('avatarInput');
    const file = fileInput.files[0];

    if (!file) {
        toastr.warning('Lütfen bir dosya seçin.');
        return;
    }

    // 5MB Limit Check
    if (file.size > 5 * 1024 * 1024) {
        toastr.warning('Dosya boyutu 5MB\'dan küçük olmalıdır.');
        return;
    }

    const userStr = localStorage.getItem('simWorldUser');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    const formData = new FormData();
    formData.append('userId', user.id); // ID'yi önce ekle
    formData.append('avatar', file);

    try {
        const response = await fetch('/api/user/upload-avatar', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            toastr.success('Avatar güncellendi!');
            // Cache-busting için timestamp ekle
            document.getElementById('currentAvatar').src = result.avatarUrl + '?t=' + new Date().getTime();
            
            // Header'ı da güncelle (global fonksiyon varsa)
            if (window.updateHeaderStats) {
                window.updateHeaderStats();
            }
        } else {
            toastr.error(result.message);
        }
    } catch (error) {
        console.error(error);
        toastr.error('Yükleme hatası.');
    }
}

async function changeUsername() {
    const newUsername = document.getElementById('newUsername').value.trim();
    
    if (!newUsername || newUsername.length < 3) {
        toastr.warning('Kullanıcı adı en az 3 karakter olmalı.');
        return;
    }

    if (!confirm('Kullanıcı adını değiştirmek için 100 Elmas harcanacak. Onaylıyor musun?')) return;

    const userStr = localStorage.getItem('simWorldUser');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
        const response = await fetch('/api/user/change-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                newUsername: newUsername
            })
        });

        const result = await response.json();

        if (result.success) {
            toastr.success('Kullanıcı adı değiştirildi!');
            user.username = newUsername;
            localStorage.setItem('simWorldUser', JSON.stringify(user));
            document.getElementById('newUsername').value = '';
            
            // Refresh avatar if it was using default initials
            loadAvatar(user.id);
        } else {
            toastr.error(result.message);
        }
    } catch (error) {
        console.error(error);
        toastr.error('Hata oluştu.');
    }
}

function savePreferences() {
    const sound = document.getElementById('toggleSound').checked;
    const notif = document.getElementById('toggleNotif').checked;

    localStorage.setItem('sow_sound', sound);
    localStorage.setItem('sow_notif', notif);

    toastr.info('Tercihler kaydedildi.');
}

async function changePassword() {
    const currentPass = document.getElementById('currentPass').value;
    const newPass = document.getElementById('newPass').value;

    if (!currentPass || !newPass) {
        toastr.warning('Lütfen tüm alanları doldurun.');
        return;
    }

    if (newPass.length < 4) {
        toastr.warning('Yeni şifre en az 4 karakter olmalı.');
        return;
    }

    const userStr = localStorage.getItem('simWorldUser');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
        const response = await fetch('/api/user/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                currentPass: currentPass,
                newPass: newPass
            })
        });

        const result = await response.json();

        if (result.success) {
            toastr.success('Şifreniz başarıyla güncellendi.');
            document.getElementById('currentPass').value = '';
            document.getElementById('newPass').value = '';
        } else {
            toastr.error(result.message || 'Şifre değiştirilemedi.');
        }

    } catch (error) {
        console.error(error);
        toastr.error('Bir hata oluştu.');
    }
}

function logout() {
    if(confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        localStorage.removeItem('simWorldUser');
        window.location.href = 'login.html';
    }
}