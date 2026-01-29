const tg = window.Telegram.WebApp;
tg.expand();

// GLOBAL STATE - KORUNDU (Sadece oyun değişkenleri çıkarıldı)
let state = {
    bal: parseInt(localStorage.getItem('f_bal')) || 0,
    friends: JSON.parse(localStorage.getItem('f_friends')) || [],
    tasks: JSON.parse(localStorage.getItem('f_done_tasks')) || []
};

const BOT_NAME = "FlashyGameBot";
const REF_LINK = `https://t.me/${BOT_NAME}?start=${tg.initDataUnsafe.user?.id || '123'}`;

window.onload = () => {
    initUser();
    updateUI();
    renderTasks();
    renderFriends();
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

function addBal(amt, toast = true) {
    state.bal += amt;
    localStorage.setItem('f_bal', state.bal);
    updateUI();
    if(toast) {
        const t = document.getElementById('toast');
        t.style.top = "20px";
        setTimeout(() => t.style.top = "-100px", 3000);
    }
}

function claimTask(id, reward) {
    if (state.tasks.includes(id)) return;
    state.tasks.push(id);
    localStorage.setItem('f_done_tasks', JSON.stringify(state.tasks));
    addBal(reward);
    renderTasks();
}

function renderTasks() {
    const cont = document.getElementById('tasks-list');
    if(!cont) return;
    cont.innerHTML = '';
    const TASK_DATA = [
        { id: 1, txt: "Kanalı Takip Et", reward: 100, link: "https://t.me/AirdropNoktasiDuyuru" },
        { id: 2, txt: "1 Arkadaş Davet Et", reward: 60, req: 1 },
        { id: 3, txt: "5 Arkadaş Davet Et", reward: 300, req: 5 }
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

function renderFriends() {
    const cont = document.getElementById('friends-list');
    if(!cont) return;
    document.getElementById('friend-count').innerText = `Dostların (${state.friends.length})`;
    cont.innerHTML = state.friends.length ? '' : '<p style="text-align:center; color:var(--gray);">Henüz kimse yok.</p>';
}

function copyRef() { tg.showAlert("Link kopyalandı!"); }
function shareRef() { tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(REF_LINK)}`); }

function nav(id, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if(el) el.classList.add('active');
}
