// Telegram WebApp Başlatma
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Puanı Hafızadan Çek (Yoksa 0 yap)
let score = parseInt(localStorage.getItem('btc_balance')) || 0;

// Elementleri Seç
const scoreDisplay = document.getElementById('score');
const walletDisplay = document.getElementById('walletScore');
const clickBtn = document.getElementById('clickBtn');

// İlk açılışta puanları yazdır
updateDisplays();

// Tıklama Fonksiyonu
clickBtn.addEventListener('click', () => {
    score += 1;
    saveScore();
    updateDisplays();
    tg.HapticFeedback.impactOccurred('medium'); // Telefon titretme
});

// Puanı Güncelleme ve Kaydetme
function updateDisplays() {
    scoreDisplay.innerText = score.toLocaleString(); // Rakamları 1,000 şeklinde formatlar
    walletDisplay.innerText = score.toLocaleString();
}

function saveScore() {
    localStorage.setItem('btc_balance', score);
}

// Sayfa Değiştirme
function showPage(pageId, element) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active-nav'));
    element.classList.add('active-nav');
    tg.HapticFeedback.selectionChanged();
}

// Görev Yapma
function doTask(url, reward) {
    tg.openLink(url);
    // 5 saniye bekleme simülasyonu
    setTimeout(() => {
        score += reward;
        saveScore();
        updateDisplays();
        tg.showAlert("Tebrikler! " + reward + " BTC kazandın.");
    }, 5000);
}

// Arkadaş Davet Sistemi (Dinamik Link)
function inviteFriend() {
    const userId = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : "testuser";
    const botUsername = "SeninBotUserAdin"; // BURAYI KENDİ BOT ADINLA DEĞİŞTİR (Örn: FlashyGoldBot)
    const inviteLink = `https://t.me/${botUsername}?start=ref_${userId}`;
    
    // Telegram paylaşma penceresini açar
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent("BTC madenciliği yapmaya başla! 🚀")}`;
    tg.openTelegramLink(shareUrl);
}
