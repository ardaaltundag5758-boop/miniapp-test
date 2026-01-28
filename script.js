const tg = window.Telegram.WebApp;
tg.expand();

let score = parseInt(localStorage.getItem('btc_balance')) || 0;
let botUsername = "@miniapptestttt123_bot"; // BURAYI DEĞİŞTİR

// Başlangıç Ayarları
updateDisplays();

function updateDisplays() {
    document.getElementById('score').innerText = score.toLocaleString();
    document.getElementById('walletScoreDisplay').innerText = score.toLocaleString() + " BTC";
    
    const userId = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : "0000";
    document.getElementById('invite-link-text').innerText = `https://t.me/${botUsername}?start=ref_${userId}`;
}

function showPage(pageId, element) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active-nav'));
    element.classList.add('active-nav');
    tg.HapticFeedback.selectionChanged();
}

// GÖREV VE PAYLAŞIM
function doTask(url, reward) {
    tg.openLink(url);
    setTimeout(() => {
        score += reward;
        saveData();
        tg.showAlert(reward + " BTC Eklendi!");
    }, 3000);
}

function copyLink() {
    const link = document.getElementById('invite-link-text').innerText;
    navigator.clipboard.writeText(link);
    tg.showAlert("Link kopyalandı!");
}

function shareTelegram() {
    const link = document.getElementById('invite-link-text').innerText;
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=BTC kazanmaya başla!`);
}

function saveData() {
    localStorage.setItem('btc_balance', score);
    updateDisplays();
}

// --- OYUN MANTIĞI: BTC SPACE JUMP ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let gameActive = false;
let player = { x: 50, y: 200, w: 30, h: 30, dy: 0 };
let gravity = 0.25;
let jump = -5;
let obstacles = [];
let frame = 0;

function startGame() {
    document.getElementById('game-start-ui').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    gameActive = true;
    player.y = 200;
    player.dy = 0;
    obstacles = [];
    requestAnimationFrame(gameLoop);
}

canvas.onclick = () => { player.dy = jump; tg.HapticFeedback.impactOccurred('light'); };

function gameLoop() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Oyuncu Hareketi
    player.dy += gravity;
    player.y += player.dy;

    // Oyuncu Çizimi (BTC Logosu)
    ctx.fillStyle = "#f7931a";
    ctx.beginPath();
    ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
    ctx.fill();

    // Engeller
    if (frame % 100 === 0) {
        let gap = 120;
        let pos = Math.random() * (canvas.height - gap);
        obstacles.push({ x: canvas.width, y: 0, w: 40, h: pos });
        obstacles.push({ x: canvas.width, y: pos + gap, w: 40, h: canvas.height });
    }

    obstacles.forEach((obs, i) => {
        obs.x -= 2;
        ctx.fillStyle = "#333";
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

        // Çarpışma Kontrolü
        if (player.x + 15 > obs.x && player.x - 15 < obs.x + obs.w &&
            player.y + 15 > obs.y && player.y - 15 < obs.y + obs.h) {
            gameOver();
        }
    });

    if (player.y > canvas.height || player.y < 0) gameOver();

    // Puan Kazanma
    if (frame % 50 === 0) { score += 1; saveData(); }

    frame++;
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameActive = false;
    tg.HapticFeedback.notificationOccurred('error');
    alert("Oyun Bitti! Mevcut Bakiye: " + score);
    document.getElementById('game-start-ui').style.display = 'block';
    document.getElementById('game-container').style.display = 'none';
}
