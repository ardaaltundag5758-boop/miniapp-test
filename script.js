const tg = window.Telegram.WebApp;
const BOT_ID = "miniapptestttt123_bot";
tg.expand();

// VERİLER
let balance = parseFloat(localStorage.getItem('f_bal')) || 0;
let lastClaim = parseInt(localStorage.getItem('f_last')) || 0;
let isMining = localStorage.getItem('f_mining') === 'true';
let tasksStatus = JSON.parse(localStorage.getItem('f_tasks')) || { tg: 'none', x: 'none', ref1: 'none', ref5: 'none' };
let invitedFriends = JSON.parse(localStorage.getItem('f_friends_list')) || [];

const HOURLY_RATE = 22;
const CLAIM_MS = 24 * 3600000; // 24 Saat

// Kullanıcı Kurulumu
document.getElementById('user-name').innerText = tg.initDataUnsafe.user?.first_name || "Flashy Kullanıcı";
if (tg.initDataUnsafe.user?.photo_url) document.getElementById('user-photo').src = tg.initDataUnsafe.user.photo_url;
document.getElementById('invite-link-text').innerText = `https://t.me/${BOT_ID}?start=${tg.initDataUnsafe.user?.id || 0}`;

function updateUI() {
    const formattedBal = Math.floor(balance).toLocaleString();
    document.getElementById('top-balance-val').innerText = formattedBal;
    document.getElementById('wallet-balance').innerText = formattedBal;

    // Görev Butonları
    Object.keys(tasksStatus).forEach(id => {
        const btn = document.getElementById('btn-task-' + id);
        if (btn) {
            if (tasksStatus[id] === 'ready') { 
                btn.innerText = "Talep Et"; btn.className = "btn-claim"; 
            } else if (tasksStatus[id] === 'claimed') { 
                btn.innerText = "Bitti"; btn.disabled = true; btn.style.opacity = "0.5"; 
            }
        }
    });

    // Arkadaş Listesi
    const list = document.getElementById('friends-list');
    if (invitedFriends.length > 0) {
        list.innerHTML = invitedFriends.map(f => `
            <div class="friend-item">
                <span>👤 ${f.name}</span>
                <span style="color:var(--accent)">+30 FLASHY</span>
            </div>
        `).join('');
    }
}

// 24 Saatlik Sayaç ve Farm Yönetimi
setInterval(() => {
    if (!isMining) return;

    let now = Date.now();
    let elapsed = now - lastClaim;
    const liveValElem = document.getElementById('live-farm-val');
    const timerElem = document.getElementById('timer');
    const farmBtn = document.getElementById('farm-btn');
    const progress = document.getElementById('farm-progress');

    if (elapsed < CLAIM_MS) {
        // Canlı Bakiye
        let currentMining = (elapsed / 3600000) * HOURLY_RATE;
        liveValElem.innerText = currentMining.toFixed(5);
        
        // Geri Sayım
        let rem = CLAIM_MS - elapsed;
        let h = Math.floor(rem / 3600000);
        let m = Math.floor((rem % 3600000) / 60000);
        timerElem.innerText = `Kalan Süre: ${h}s ${m}d`;
        
        // Progress Bar
        progress.style.width = (elapsed / CLAIM_MS * 100) + "%";

        farmBtn.innerText = "Kazım Yapılıyor...";
        farmBtn.disabled = true;
    } else {
        isMining = false;
        localStorage.setItem('f_mining', 'false');
        liveValElem.innerText = (24 * HOURLY_RATE).toFixed(5);
        timerElem.innerText = "Hasat Zamanı!";
        farmBtn.innerText = "Bakiyeyi Topla";
        farmBtn.disabled = false;
        progress.style.width = "100%";
    }
}, 1000);

function handleFarmClick() {
    let now = Date.now();
    if (!isMining && (now - lastClaim >= CLAIM_MS || lastClaim === 0)) {
        // Yeni Farm Başlat
        lastClaim = now;
        isMining = true;
        localStorage.setItem('f_last', lastClaim);
        localStorage.setItem('f_mining', 'true');
        tg.HapticFeedback.impactOccurred('medium');
    } else if (!isMining && now - lastClaim >= CLAIM_MS) {
        // Süre bitti, topla
        balance += (HOURLY_RATE * 24);
        lastClaim = 0; // Reset
        isMining = false;
        localStorage.setItem('f_bal', balance);
        localStorage.setItem('f_last', 0);
        localStorage.setItem('f_mining', 'false');
        updateUI();
    }
}

function doTask(type) {
    if (tasksStatus[type] === 'none') {
        if (type === 'tg') tg.openTelegramLink("https://t.me/AirdropNoktasiDuyuru");
        if (type === 'x') tg.openLink("https://x.com/ADNFlashy");
        
        tasksStatus[type] = 'ready';
    } else if (tasksStatus[type] === 'ready') {
        let reward = { tg: 100, x: 100, ref1: 50, ref5: 300 }[type];
        balance += reward;
        tasksStatus[type] = 'claimed';
        tg.showAlert(`${reward} FLASHY hesabına eklendi!`);
    }
    localStorage.setItem('f_tasks', JSON.stringify(tasksStatus));
    localStorage.setItem('f_bal', balance);
    updateUI();
}

function inviteFriend() {
    const link = `https://t.me/${BOT_ID}?start=${tg.initDataUnsafe.user?.id || 0}`;
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=Flashy'de benimle kazmaya başla!`);
    
    // Test amaçlı arkadaş ekleme simülasyonu
    invitedFriends.push({ name: "Yeni Dost", id: Date.now() });
    balance += 30;
    localStorage.setItem('f_friends_list', JSON.stringify(invitedFriends));
    localStorage.setItem('f_bal', balance);
    updateUI();
}

function copyLink() {
    const link = document.getElementById('invite-link-text').innerText;
    navigator.clipboard.writeText(link);
    tg.showAlert("Link kopyalandı!");
}

function switchPage(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active-page');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
}

updateUI();
