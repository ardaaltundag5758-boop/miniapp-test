const tg = window.Telegram.WebApp;
tg.expand();

let balance = parseFloat(localStorage.getItem('f_bal')) || 0;
let lastClaim = parseInt(localStorage.getItem('f_last')) || Date.now();
let tasksStatus = JSON.parse(localStorage.getItem('f_tasks')) || { tg: 'none', ref1: 'none' };

const HOURLY_RATE = 22;
const CLAIM_MS = 3600000;

// Kullanıcı Bilgilerini Güncelle
const userNameElem = document.getElementById('user-name');
if (userNameElem) userNameElem.innerText = tg.initDataUnsafe.user?.first_name || "Flashy User";

const userPhotoElem = document.getElementById('user-photo');
if (tg.initDataUnsafe.user?.photo_url && userPhotoElem) {
    userPhotoElem.src = tg.initDataUnsafe.user.photo_url;
}

function updateUI() {
    const balElem = document.getElementById('total-balance');
    if (balElem) balElem.innerText = Math.floor(balance).toLocaleString();
    
    ['tg', 'ref1'].forEach(id => {
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

setInterval(() => {
    let now = Date.now();
    let elapsed = now - lastClaim;
    const liveValElem = document.getElementById('live-farm-val');
    const timerElem = document.getElementById('timer');
    const farmBtn = document.getElementById('farm-btn');

    if (elapsed < CLAIM_MS) {
        if (liveValElem) liveValElem.innerText = ((elapsed / CLAIM_MS) * HOURLY_RATE).toFixed(5);
        let rem = CLAIM_MS - elapsed;
        if (timerElem) timerElem.innerText = `${Math.floor(rem / 60000)}m ${Math.floor((rem % 60000) / 1000)}s`;
        if (farmBtn) {
            farmBtn.innerText = "Farming...";
            farmBtn.disabled = true;
        }
    } else {
        if (liveValElem) liveValElem.innerText = HOURLY_RATE.toFixed(5);
        if (timerElem) timerElem.innerText = "Ready!";
        if (farmBtn) {
            farmBtn.innerText = "Claim Flashy";
            farmBtn.disabled = false;
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
            tg.showAlert("Önce bir arkadaş davet etmelisin!"); 
            tasksStatus.ref1 = 'ready'; 
        }
    } else if (tasksStatus[type] === 'ready') {
        balance += (type === 'tg' ? 100 : 50); 
        tasksStatus[type] = 'claimed';
        tg.showAlert("Ödül başarıyla eklendi!");
    }
    localStorage.setItem('f_tasks', JSON.stringify(tasksStatus)); 
    localStorage.setItem('f_bal', balance);
    updateUI();
}

function inviteFriend() {
    const inviteLink = `https://t.me/BOT_ADINIZ?start=${tg.initDataUnsafe.user?.id || 0}`;
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=Flashy Farm'da birlikte kazanalım!`);
}

function switchPage(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.classList.add('active-page');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
}

updateUI();
