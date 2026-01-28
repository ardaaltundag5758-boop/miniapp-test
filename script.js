const tg = window.Telegram.WebApp;
tg.expand();

// Verileri Yükle
let balance = parseFloat(localStorage.getItem('f_bal')) || 0;
let lastClaim = parseInt(localStorage.getItem('f_last')) || Date.now();
let isFarming = localStorage.getItem('f_active') === 'true';
let friendsCount = parseInt(localStorage.getItem('f_refs')) || 0;
let tasksStatus = JSON.parse(localStorage.getItem('f_tasks')) || { tg: 'none', ref1: 'none' };

const HOURLY_RATE = 22;
const CLAIM_MS = 3600000; // 1 Saat

// Telegram Profil Bilgileri
document.getElementById('user-name').innerText = tg.initDataUnsafe.user?.first_name || "Bilinmeyen Kullanıcı";
document.getElementById('user-photo').src = tg.initDataUnsafe.user?.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

function updateUI() {
    document.getElementById('total-balance').innerText = Math.floor(balance).toLocaleString();
    
    // Görev Butonlarını Güncelle
    updateTaskButton('tg', 'btn-task-tg');
    updateTaskButton('ref1', 'btn-task-ref1');
}

function updateTaskButton(taskId, btnId) {
    const btn = document.getElementById(btnId);
    if (tasksStatus[taskId] === 'ready') {
        btn.innerText = "Talep Et";
        btn.className = "btn-claim";
    } else if (tasksStatus[taskId] === 'claimed') {
        btn.innerText = "Tamamlandı";
        btn.disabled = true;
        btn.style.opacity = "0.5";
    }
}

// FARMING SÜRECİ
setInterval(() => {
    if (isFarming) {
        let now = Date.now();
        let elapsed = now - lastClaim;
        
        if (elapsed < CLAIM_MS) {
            let earned = (elapsed / CLAIM_MS) * HOURLY_RATE;
            document.getElementById('live-farm-val').innerText = earned.toFixed(5);
            
            let remaining = CLAIM_MS - elapsed;
            let mins = Math.floor(remaining / 60000);
            let secs = Math.floor((remaining % 60000) / 1000);
            document.getElementById('timer').innerText = `${mins}m ${secs}s`;
            
            document.getElementById('farm-btn').disabled = true;
            document.getElementById('farm-btn').innerText = "Farming...";
        } else {
            document.getElementById('live-farm-val').innerText = HOURLY_RATE.toFixed(5);
            document.getElementById('timer').innerText = "Ready to Claim!";
            document.getElementById('farm-btn').disabled = false;
            document.getElementById('farm-btn').innerText = "Claim Flashy";
            document.getElementById('farm-status').innerText = "● Ready";
            document.getElementById('farm-status').style.color = "yellow";
        }
    }
}, 1000);

function handleFarmClick() {
    let now = Date.now();
    if (now - lastClaim >= CLAIM_MS) {
        // Claim Et
        balance += HOURLY_RATE;
        lastClaim = now;
        localStorage.setItem('f_bal', balance);
        localStorage.setItem('f_last', lastClaim);
        tg.HapticFeedback.notificationOccurred('success');
    } else if (!isFarming) {
        // Farmı Başlat
        isFarming = true;
        lastClaim = now;
        localStorage.setItem('f_active', 'true');
        localStorage.setItem('f_last', lastClaim);
    }
    updateUI();
}

// GÖREVLER
function doTask(type) {
    if (tasksStatus[type] === 'none') {
        if (type === 'tg') {
            tg.openTelegramLink("https://t.me/AirdropNoktasiDuyuru");
            tasksStatus.tg = 'ready';
        } else if (type === 'ref1' && friendsCount >= 1) {
            tasksStatus.ref1 = 'ready';
        } else {
            tg.showAlert("Önce görevi tamamlamalısın!");
            return;
        }
    } else if (tasksStatus[type] === 'ready') {
        let reward = (type === 'tg') ? 100 : 50;
        balance += reward;
        tasksStatus[type] = 'claimed';
        tg.showAlert(`${reward} Flashy Hesabına Eklendi!`);
    }
    localStorage.setItem('f_tasks', JSON.stringify(tasksStatus));
    localStorage.setItem('f_bal', balance);
    updateUI();
}

function inviteFriend() {
    const userId = tg.initDataUnsafe.user?.id || "0";
    const link = `https://t.me/BOT_ADINIZ?start=${userId}`;
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=Flashy Farm'da benimle birlikte kazan!`);
}

function switchPage(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById('page-' + pageId).classList.add('active-page');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
}

updateUI();
