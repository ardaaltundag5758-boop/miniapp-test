const tg = window.Telegram.WebApp;
tg.expand();

// VERİLERİ YÜKLE
let balance = parseFloat(localStorage.getItem('f_bal')) || 0;
let lastClaim = parseInt(localStorage.getItem('f_last')) || Date.now();
let tasksStatus = JSON.parse(localStorage.getItem('f_tasks')) || { tg: 'none', ref1: 'none' };

const HOURLY_RATE = 22;
const CLAIM_MS = 3600000; // 1 Saat (60 Dakika)

// TELEGRAM BİLGİLERİ
document.getElementById('user-name').innerText = tg.initDataUnsafe.user?.first_name || "Flashy User";
if (tg.initDataUnsafe.user?.photo_url) {
    document.getElementById('user-photo').src = tg.initDataUnsafe.user.photo_url;
}

function updateUI() {
    document.getElementById('total-balance').innerText = Math.floor(balance).toLocaleString();
    
    // Görev butonlarını kontrol et
    checkTaskStatus('tg', 'btn-task-tg');
    checkTaskStatus('ref1', 'btn-task-ref1');
}

function checkTaskStatus(id, btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (tasksStatus[id] === 'ready') {
        btn.innerText = "Talep Et";
        btn.className = "btn-claim";
    } else if (tasksStatus[id] === 'claimed') {
        btn.innerText = "Bitti";
        btn.disabled = true;
        btn.style.opacity = "0.5";
    }
}

// FARM SÜRECİ
setInterval(() => {
    let now = Date.now();
    let elapsed = now - lastClaim;
    
    if (elapsed < CLAIM_MS) {
        let earned = (elapsed / CLAIM_MS) * HOURLY_RATE;
        document.getElementById('live-farm-val').innerText = earned.toFixed(5);
        
        let rem = CLAIM_MS - elapsed;
        let m = Math.floor(rem / 60000);
        let s = Math.floor((rem % 60000) / 1000);
        document.getElementById('timer').innerText = `${m}m ${s}s`;
        
        document.getElementById('farm-btn').innerText = "Farming...";
        document.getElementById('farm-btn').disabled = true;
    } else {
        document.getElementById('live-farm-val').innerText = HOURLY_RATE.toFixed(5);
        document.getElementById('timer').innerText = "Ready!";
        document.getElementById('farm-btn').innerText = "Claim Flashy";
        document.getElementById('farm-btn').disabled = false;
    }
}, 1000);

function handleFarmClick() {
    let now = Date.now();
    if (now - lastClaim >= CLAIM_MS) {
        balance += HOURLY_RATE;
        lastClaim = now;
        localStorage.setItem('f_bal', balance);
        localStorage.setItem('f_last', lastClaim);
        tg.HapticFeedback.notificationOccurred('success');
        updateUI();
    }
}

function doTask(type) {
    if (tasksStatus[type] === 'none') {
        if (type === 'tg') {
            tg.openTelegramLink("https://t.me/AirdropNoktasiDuyuru");
            tasksStatus.tg = 'ready';
        } else {
            tg.showAlert("Önce davet linkini paylaşmalısın!");
            tasksStatus.ref1 = 'ready';
        }
    } else if (tasksStatus[type] === 'ready') {
        let reward = (type === 'tg') ? 100 : 50;
        balance += reward;
        tasksStatus[type] = 'claimed';
        tg.showAlert(reward + " Flashy eklendi!");
    }
    localStorage.setItem('f_tasks', JSON.stringify(tasksStatus));
    localStorage.setItem('f_bal', balance);
    updateUI();
}

function inviteFriend() {
    const link = `https://a90eb892.miniapp-testt.pages.dev/?start=${tg.initDataUnsafe.user?.id || 0}`;
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=Flashy Farm'da birlikte kazanalım!`);
}

function switchPage(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    const target = document.getElementById('page-' + pageId);
    if(target) target.classList.add('active-page');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if(el) el.classList.add('active');
}

updateUI();
