const tg = window.Telegram.WebApp;
tg.expand();

let balance = parseFloat(localStorage.getItem('f_bal')) || 0;
let lastClaim = parseInt(localStorage.getItem('f_last')) || Date.now();
let tasksStatus = JSON.parse(localStorage.getItem('f_tasks')) || { tg: 'none', ref1: 'none', ref5: 'none', ref10: 'none' };

const HOURLY_RATE = 22;
const CLAIM_MS = 3600000; // 1 Saatlik periyot

// Kullanıcı Bilgileri
const userNameElem = document.getElementById('user-name');
if (userNameElem) userNameElem.innerText = tg.initDataUnsafe.user?.first_name || "Flashy User";

const userPhotoElem = document.getElementById('user-photo');
if (tg.initDataUnsafe.user?.photo_url && userPhotoElem) {
    userPhotoElem.src = tg.initDataUnsafe.user.photo_url;
}

function updateUI() {
    const balElem = document.getElementById('total-balance');
    if (balElem) balElem.innerText = Math.floor(balance).toLocaleString();
    
    // Tüm görev butonlarını kontrol et
    ['tg', 'ref1', 'ref5', 'ref10'].forEach(id => {
        const btn = document.getElementById('btn-task-' + id);
        if (btn) {
            if (tasksStatus[id] === 'ready') { 
                btn.innerText = "Talep Et"; 
                btn.className = "btn-claim"; 
            } else if (tasksStatus[id] === 'claimed') { 
                btn.innerText = "Bitti"; 
                btn.disabled = true; 
                btn.style.opacity = "0.5"; 
            }
        }
    });
}

// Canlı Takip Sistemi
setInterval(() => {
    let now = Date.now();
    let elapsed = now - lastClaim;
    const liveValElem = document.getElementById('live-farm-val');
    const timerElem = document.getElementById('timer');
    const farmBtn = document.getElementById('farm-btn');

    if (elapsed < CLAIM_MS) {
        // Canlı artan bakiye (Saatte 22 ise saniyede 0.00611)
        if (liveValElem) liveValElem.innerText = ((elapsed / CLAIM_MS) * HOURLY_RATE).toFixed(5);
        
        // Geri sayım
        let rem = CLAIM_MS - elapsed;
        let h = Math.floor(rem / 3600000);
        let m = Math.floor((rem % 3600000) / 60000);
        let s = Math.floor((rem % 60000) / 1000);
        if (timerElem) timerElem.innerText = `${h}h ${m}m ${s}s`;
        
        if (farmBtn) {
            farmBtn.innerText = "Farming...";
            farmBtn.disabled = true;
            farmBtn.style.background = "#1a1a1a";
        }
    } else {
        if (liveValElem) liveValElem.innerText = HOURLY_RATE.toFixed(5);
        if (timerElem) timerElem.innerText = "Ready to Claim!";
        if (farmBtn) {
            farmBtn.innerText = "Claim FLASHY";
            farmBtn.disabled = false;
            farmBtn.style.background = "var(--blue)";
        }
    }
}, 1000);

function handleFarmClick() {
    if (Date.now() - lastClaim >= CLAIM_MS) {
        balance += HOURLY_RATE; 
        lastClaim = Date.now();
        localStorage.setItem('f_bal', balance); 
        localStorage.setItem('f_last', lastClaim);
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success'); 
        updateUI();
    }
}

function doTask(type) {
    if (tasksStatus[type] === 'none') {
        if (type === 'tg') { 
            tg.openTelegramLink("https://t.me/AirdropNoktasiDuyuru"); 
            tasksStatus.tg = 'ready'; 
        } else { 
            // Arkadaş davet görevleri için önce davet sayfasına yönlendir
            tg.showAlert("Önce arkadaş davet etmelisin! Arkadaşlarını davet etmek için 'Friends' sekmesini kullan.");
            tasksStatus[type] = 'ready'; 
        }
    } else if (tasksStatus[type] === 'ready') {
        let reward = 0;
        if (type === 'tg') reward = 100;
        if (type === 'ref1') reward = 50;
        if (type === 'ref5') reward = 300;
        if (type === 'ref10') reward = 600;

        balance += reward; 
        tasksStatus[type] = 'claimed';
        tg.showAlert(`${reward} FLASHY eklendi!`);
    }
    localStorage.setItem('f_tasks', JSON.stringify(tasksStatus)); 
    localStorage.setItem('f_bal', balance);
    updateUI();
}

function inviteFriend() {
    // Davet başı 30 flashy ödülü burada tetiklenir (Simüle edilmiş)
    balance += 30;
    localStorage.setItem('f_bal', balance);
    updateUI();

    const inviteLink = `https://t.me/BOT_ADINIZ?start=${tg.initDataUnsafe.user?.id || 0}`;
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=Flashy Farm'da birlikte kazanalım! Her davet için 30 token kazan!`);
}

function switchPage(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.classList.add('active-page');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
}

updateUI();
