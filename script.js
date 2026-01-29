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
    document.getElementById('global-bal').innerText = b;
    document.getElementById('wallet-bal').innerText = b;
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
            btnEl.style.background = "var(--blue)";
            btnEl.innerText = "CLAIM OXN";
        }
    } else {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        if(timerEl) timerEl.innerText = `Next Claim in ${mins}m ${secs}s`;
        if(btnEl) {
            btnEl.disabled = true;
            btnEl.style.opacity = "0.6";
            btnEl.innerText = "Farming...";
        }
    }
}

function processClaim() {
    addBal(state.hourlyRate);
    state.farmStartTime = Date.now();
    localStorage.setItem('f_start', state.farmStartTime);
    tg.HapticFeedback.notificationOccurred('success');
}

function addBal(amt) {
    state.bal += amt;
    localStorage.setItem('f_bal', state.bal);
    updateUI();
}

function renderTasks() {
    const cont = document.getElementById('tasks-list');
    if(!cont) return;
    cont.innerHTML = '';
    const TASK_DATA = [
        { id: 1, txt: "Kanalı Takip Et", reward: 100 },
        { id: 2, txt: "Arkadaş Davet Et", reward: 60 }
    ];
    TASK_DATA.forEach(t => {
        const done = state.tasks.includes(t.id);
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div><b>${t.txt}</b><br><small style="color:var(--accent)">+${t.reward}</small></div>
            ${done ? '<span>Tamamlandı</span>' : `<button class="btn btn-accent" onclick="claimTask(${t.id}, ${t.reward})">Git</button>`}
        `;
        cont.appendChild(item);
    });
}

function claimTask(id, reward) {
    if (state.tasks.includes(id)) return;
    state.tasks.push(id);
    localStorage.setItem('f_done_tasks', JSON.stringify(state.tasks));
    addBal(reward);
    renderTasks();
}

function renderFriends() {
    const cont = document.getElementById('friends-list');
    if(cont) cont.innerHTML = '<p style="text-align:center; color:var(--gray); margin-top:20px;">Henüz kimse yok.</p>';
}

function copyRef() { tg.showAlert("Link kopyalandı!"); }
function shareRef() { tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(REF_LINK)}`); }
