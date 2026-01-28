const tg = window.Telegram.WebApp;
tg.expand();

let score = parseInt(localStorage.getItem('flashy_balance')) || 0;
let friends = JSON.parse(localStorage.getItem('flashy_friends')) || [];
let botUsername = "SeninBotAdin"; 

function showToast(message) {
    const toast = document.getElementById('custom-toast');
    document.getElementById('toast-msg').innerText = message;
    toast.style.top = "20px";
    setTimeout(() => { toast.style.top = "-100px"; }, 3000);
}

function updateUI() {
    document.getElementById('score').innerText = score.toLocaleString();
    document.getElementById('wallet-balance').innerText = score.toLocaleString();
    document.getElementById('friend-count').innerText = friends.length;
    
    // Davet Listesi Güncelleme
    const list = document.getElementById('friend-list-container');
    if(friends.length > 0) {
        list.innerHTML = friends.map(f => `<div class="friend-item"><span>${f.name}</span><span style="color:gold">+500 F</span></div>`).join('');
    }

    // Görev Durumları
    document.getElementById('ref-count-1').innerText = `(${friends.length}/1)`;
    document.getElementById('ref-count-5').innerText = `(${friends.length}/5)`;
}

// DAVET MANTĞI (Simülasyon: İlk kez giren biri ref ile gelirse listeye eklenir)
function checkReferral() {
    const urlParams = new URLSearchParams(window.location.search);
    const refId = urlParams.get('start');
    if (refId && !localStorage.getItem('i_was_referred')) {
        // Gerçekte bu bilgi backend'e gider, şimdilik test için kendimizi listeye ekliyoruz
        localStorage.setItem('i_was_referred', 'true');
        // Bu bölümü gerçek bir kullanıcı geldiğinde tetiklenecek şekilde düşün
    }
}

function shareTelegram() {
    const userId = tg.initDataUnsafe.user?.id || "user";
    const link = `https://t.me/${botUsername}?start=${userId}`;
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=Flashy kazanmaya başla! ⚡`);
}

function doTask(url, reward) {
    tg.openLink(url);
    setTimeout(() => {
        score += reward;
        localStorage.setItem('flash_balance', score);
        updateUI();
        showToast(`${reward} FLASHY Eklendi!`);
    }, 4000);
}

// --- OYUN (FLASHY JUMP) ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let gameActive = false;
let bird = { x: 50, y: 150, v: 0 };
let gravity = 0.4;
let pipes = [];

function startGame() {
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    gameActive = true;
    bird.y = 150; bird.v = 0; pipes = [];
    requestAnimationFrame(gameLoop);
}

canvas.onclick = () => { bird.v = -6; tg.HapticFeedback.impactOccurred('light'); };

function gameLoop() {
    if(!gameActive) return;
    ctx.clearRect(0,0, canvas.width, canvas.height);
    
    bird.v += gravity;
    bird.y += bird.v;
    
    // Flashy Görselini Çiz
    const img = new Image();
    img.src = "https://cdn.discordapp.com/attachments/539009365391441921/1465903677524017421/5769619140443311194_99.jpg?ex=697accaf&is=69797b2f&hm=bd5109b04f86f6ded0f30cd3a19944d060f22a65084d2caa821df5b8995dd604&";
    ctx.drawImage(img, bird.x, bird.y, 30, 30);

    if(bird.y > canvas.height || bird.y < 0) {
        gameActive = false;
        alert("Oyun Bitti!");
        document.getElementById('start-btn').style.display = 'block';
        document.getElementById('game-container').style.display = 'none';
    }
    requestAnimationFrame(gameLoop);
}

function showPage(pageId, element) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active-nav'));
    element.classList.add('active-nav');
}

updateUI();
checkReferral();
