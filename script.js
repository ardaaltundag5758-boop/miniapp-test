const tg = window.Telegram.WebApp;
const BOT_ID = "miniapptestttt123_bot";
tg.expand();

// VERİLER
let balance = parseFloat(localStorage.getItem('f_bal')) || 0;
let lastClaim = parseInt(localStorage.getItem('f_last')) || 0;
let isMining = localStorage.getItem('f_mining') === 'true';
let tasksStatus = JSON.parse(localStorage.getItem('f_tasks')) || { tg: 'none', x: 'none', ref1: 'none' };
let invitedFriends = JSON.parse(localStorage.getItem('f_friends_list')) || [];

const HOURLY_RATE = 22;
const CLAIM_MS = 24 * 3600000;

// BAŞLANGIÇ AYARLARI
document.getElementById('user-name').innerText = tg.initDataUnsafe.user?.first_name || "Flashy User";
if (tg.initDataUnsafe.user?.photo_url) document.getElementById('user-photo').src = tg.initDataUnsafe.user.photo_url;
document.getElementById('invite-link-text').innerText = `https://t.me/${BOT_ID}?start=${tg.initDataUnsafe.user?.id || 0}`;

function updateUI() {
    const val = Math.floor(balance).toLocaleString();
    document.getElementById('top-balance-val').innerText = val;
    document.getElementById('wallet-balance').innerText = val;
    
    Object.keys(tasksStatus).forEach(id => {
        const btn = document.getElementById('btn-task-' + id);
        if (btn) {
            if (tasksStatus[id] === 'ready') { btn.innerText = "Talep Et"; btn.className = "btn-claim"; }
            else if (tasksStatus[id] === 'claimed') { btn.innerText = "Bitti"; btn.disabled = true; btn.style.opacity = "0.5"; }
        }
    });
}

// FARM SİSTEMİ
setInterval(() => {
    if (!isMining) return;
    let elapsed = Date.now() - lastClaim;
    const progress = document.getElementById('farm-progress');
    
    if (elapsed < CLAIM_MS) {
        document.getElementById('live-farm-val').innerText = ((elapsed / 3600000) * HOURLY_RATE).toFixed(5);
        let rem = CLAIM_MS - elapsed;
        document.getElementById('timer').innerText = `Kalan: ${Math.floor(rem/3600000)}s ${Math.floor((rem%3600000)/60000)}d`;
        progress.style.width = (elapsed / CLAIM_MS * 100) + "%";
        document.getElementById('farm-btn').innerText = "Farming...";
        document.getElementById('farm-btn').disabled = true;
    } else {
        isMining = false;
        document.getElementById('farm-btn').innerText = "Bakiyeyi Topla";
        document.getElementById('farm-btn').disabled = false;
    }
}, 1000);

function handleFarmClick() {
    if (!isMining && lastClaim === 0) {
        lastClaim = Date.now(); isMining = true;
        localStorage.setItem('f_last', lastClaim); localStorage.setItem('f_mining', 'true');
    } else if (!isMining && Date.now() - lastClaim >= CLAIM_MS) {
        balance += (HOURLY_RATE * 24); lastClaim = 0;
        localStorage.setItem('f_bal', balance); localStorage.setItem('f_last', 0);
        updateUI();
    }
}

// STACK BALL OYUN MOTORU (2D Canvas Versiyon)
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let gameActive = false, score = 0, ballY = 100, ballV = 0, isPressing = false;
let stacks = [];

function initGame() {
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    stacks = [];
    for(let i=0; i<15; i++) {
        stacks.push({ y: 300 + (i * 50), type: Math.random() > 0.2 ? 'normal' : 'enemy' });
    }
    gameActive = true; animate();
}

function animate() {
    if(!gameActive) return;
    ctx.clearRect(0,0,canvas.width, canvas.height);
    
    // Top fiziği
    if (isPressing) ballV = 8; else ballV += 0.4;
    ballY += ballV;

    // Katman çizimi
    stacks.forEach((s, index) => {
        ctx.fillStyle = s.type === 'enemy' ? '#ff4444' : varColor('--blue');
        ctx.fillRect(canvas.width/2 - 60, s.y - ballY + 300, 120, 20);
        
        // Çarpışma
        if (ballY > s.y && ballY < s.y + 20) {
            if (s.type === 'enemy' && !isPressing) {
                gameOver();
            } else {
                stacks.splice(index, 1);
                stacks.push({ y: stacks[stacks.length-1].y + 50, type: Math.random() > 0.2 ? 'normal' : 'enemy' });
                score++;
                document.getElementById('game-score').innerText = score;
                if (score % 50 === 0) addReward(5); // Her 50 skorda 5 FLASHY
            }
        }
    });

    // Top çizimi
    ctx.beginPath();
    ctx.arc(canvas.width/2, 300, 10, 0, Math.PI*2);
    ctx.fillStyle = 'white'; ctx.fill();

    if (ballY > 5000) ballY = 300; // Sonsuz döngü
    requestAnimationFrame(animate);
}

function gameOver() {
    gameActive = false;
    tg.showAlert(`Oyun Bitti! Skor: ${score}`);
    score = 0; ballY = 100; ballV = 0;
    setTimeout(initGame, 1000);
}

function addReward(amt) {
    balance += amt;
    localStorage.setItem('f_bal', balance);
    updateUI();
}

function varColor(name) { return getComputedStyle(document.documentElement).getPropertyValue(name); }

canvas.addEventListener('mousedown', () => isPressing = true);
canvas.addEventListener('mouseup', () => isPressing = false);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isPressing = true; });
canvas.addEventListener('touchend', () => isPressing = false);

// SAYFA GEÇİŞLERİ
function switchPage(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById('page-' + pageId).classList.add('active-page');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    if (pageId === 'game') initGame(); else gameActive = false;
}

function doTask(type) {
    if (tasksStatus[type] === 'none') {
        if (type === 'tg') tg.openTelegramLink("https://t.me/AirdropNoktasiDuyuru");
        if (type === 'x') tg.openLink("https://x.com/ADNFlashy");
        tasksStatus[type] = 'ready';
    } else if (tasksStatus[type] === 'ready') {
        let r = { tg: 100, x: 100, ref1: 50 }[type];
        balance += r; tasksStatus[type] = 'claimed';
        tg.showAlert(`Tebrikler! ${r} FLASHY eklendi.`);
    }
    localStorage.setItem('f_tasks', JSON.stringify(tasksStatus));
    localStorage.setItem('f_bal', balance);
    updateUI();
}

updateUI();
