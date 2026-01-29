const tg = window.Telegram.WebApp;
tg.expand();

let state = {
    bal: parseInt(localStorage.getItem('f_bal')) || 0,
    friends: JSON.parse(localStorage.getItem('f_friends')) || [],
    tasks: JSON.parse(localStorage.getItem('f_done_tasks')) || [],
    farmStartTime: parseInt(localStorage.getItem('f_start')) || Date.now(),
    hourlyRate: 9,
    claimDuration: 3600
};

const BOT_NAME = "FlashyGameBot";
const REF_LINK = `https://t.me/${BOT_NAME}?start=${tg.initDataUnsafe.user?.id || '123'}`;

window.onload = () => {
    initUser();
    updateUI();
    renderTasks();
    renderFriends();
    setInterval(updateFarm, 1000);
};

function initUser() {
    const user = tg.initDataUnsafe.user;
    if (user) {
        document.getElementById('u-name').innerText = user.first_name;
        if (user.photo_url) document.getElementById('u-pic').src = user.photo_url;
    }
}

function updateUI() {
    const b = state.bal.toLocaleString();
    const gBal = document.getElementById('global-bal');
    const wBal = document.getElementById('wallet-bal');
    if(gBal) gBal.innerText = b;
    if(wBal) wBal.innerText = b;
}

function nav(id, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + id);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if(el) el.classList.add('active');
}

function updateFarm() {
    const now = Date.now();
    const elapsed = Math.floor((now - state.farmStartTime) / 1000);
    const remaining = Math.max(0, state.claimDuration - (elapsed % state.claimDuration));
    
    const perSecond = state.hourlyRate / 3600;
    const currentMined = (elapsed % state.claimDuration) * perSecond;
    
    const farmAmtEl = document.getElementById('farm-amount');
    const farmProgEl = document.getElementById('farm-progress');
    const timerEl = document.getElementById('claim-timer');
    const btnEl = document.getElementById('btn-claim');

    if(farmAmtEl) farmAmtEl.innerText = currentMined.toFixed(5);
    if(farmProgEl) farmProgEl.style.width = ((state.claimDuration - remaining) / state.claimDuration * 100) + "%";

    if (elapsed >= state.claimDuration) {
        if(timerEl) timerEl.innerText = "Claim Ready!";
        if(btnEl) {
            btnEl.disabled = false;
            btnEl.style.opacity = "1";
            btnEl.innerText = "CLAIM NOW";
        }
    } else {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        if(timerEl) timerEl.innerText = `Next Claim in ${mins}m ${secs}s`;
    }
}

function processClaim() {
    addBal(state.hourlyRate);
    state.farmStartTime = Date.now();
    localStorage.setItem('f_start', state.farmStartTime);
}

function addBal(amt) {
    state.bal += amt;
    localStorage.setItem('f_bal', state.bal);
    updateUI();
}

function renderTasks() {
    const cont = document.getElementById('tasks-list');
    if(!cont) return;
    cont.innerHTML = '<div class="list-item"><b>Kanalı Takip Et</b><br><small>+100 OXN</small></div>';
}

function renderFriends() {
    const cont = document.getElementById('friends-list');
    if(cont) cont.innerHTML = '<p style="text-align:center;color:gray;">Henüz kimse yok.</p>';
}
