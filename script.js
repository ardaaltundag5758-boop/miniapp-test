const tg = window.Telegram.WebApp;
tg.expand();

let balance = parseFloat(localStorage.getItem('f_bal')) || 0;
let lastClaim = parseInt(localStorage.getItem('f_last')) || Date.now();
let tasksStatus = JSON.parse(localStorage.getItem('f_tasks')) || { tg: 'none', ref1: 'none' };

const HOURLY_RATE = 22;
const CLAIM_MS = 3600000;

document.getElementById('user-name').innerText = tg.initDataUnsafe.user?.first_name || "Flashy User";
if (tg.initDataUnsafe.user?.photo_url) document.getElementById('user-photo').src = tg.initDataUnsafe.user.photo_url;

function updateUI() {
    document.getElementById('total-balance').innerText = Math.floor(balance).toLocaleString();
    ['tg', 'ref1'].forEach(id => {
        const btn = document.getElementById('btn-task-' + id);
        if (btn && tasksStatus[id] === 'ready') { btn.innerText = "Talep Et"; btn.className = "btn-claim"; }
        if (btn && tasksStatus[id] === 'claimed') { btn.innerText = "Bitti"; btn.disabled = true; btn.style.opacity = "0.5"; }
    });
}

setInterval(() => {
    let now = Date.now();
    let elapsed = now - lastClaim;
    if (elapsed < CLAIM_MS) {
        document.getElementById('live-farm-val').innerText = ((elapsed / CLAIM_MS) * HOURLY_RATE).toFixed(5);
        let rem = CLAIM_MS - elapsed;
        document.getElementById('timer').innerText = `${Math.floor(rem / 60000)}m ${Math.floor((rem % 60000) / 1000)}s`;
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
    if (Date.now() - lastClaim >= CLAIM_MS) {
        balance += HOURLY_RATE; lastClaim = Date.now();
        localStorage.setItem('f_bal', balance); localStorage.setItem('f_last', lastClaim);
        tg.HapticFeedback.notificationOccurred('success'); updateUI();
    }
}

function doTask(type) {
    if (tasksStatus[type] === 'none') {
        if (type === 'tg') { tg.openTelegramLink("https://t.me/AirdropNoktasiDuyuru"); tasksStatus.tg = 'ready'; }
        else { tg.showAlert("Önce bir arkadaş davet etmelisin!"); tasksStatus.ref1 = 'ready'; }
    } else if (tasksStatus[type] === 'ready') {
        balance += (type === 'tg' ? 100 : 50); tasksStatus[type] = 'claimed';
    }
    localStorage.setItem('f_tasks', JSON.stringify(tasksStatus)); localStorage.setItem('f_bal', balance);
    updateUI();
}

function switchPage(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById('page-' + pageId).classList.add('active-page');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
}
updateUI();
