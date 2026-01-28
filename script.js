let score = 0;
const tg = window.Telegram.WebApp;
tg.expand(); // Uygulamayı tam ekran yap

// Sayfa Değiştirme Fonksiyonu
function showPage(pageId, element) {
    // Tüm sayfaları gizle
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Seçilen sayfayı göster
    document.getElementById(pageId).classList.add('active');
    
    // Navigasyon renklerini güncelle
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active-nav'));
    element.classList.add('active-nav');
}

// Tıklama Oyunu
const clickBtn = document.getElementById('clickBtn');
const scoreDisplay = document.getElementById('score');
const walletDisplay = document.getElementById('walletScore');

clickBtn.addEventListener('click', () => {
    score += 1;
    updateDisplays();
    // Hafif titreşim (Haptic Feedback)
    tg.HapticFeedback.impactOccurred('light');
});

function updateDisplays() {
    scoreDisplay.innerText = score;
    walletDisplay.innerText = score;
}

// Görev Yapma
function doTask(url, reward) {
    tg.openLink(url);
    // Basit bir simülasyon: 5 saniye sonra ödül ver (Normalde backend ile kontrol edilir)
    setTimeout(() => {
        score += reward;
        updateDisplays();
        alert(reward + " BTC Ödül Alındı!");
    }, 5000);
}

// Arkadaş Davet Etme
function inviteFriend() {
    const inviteLink = "https://t.me/SeninBotUserAdin?start=" + tg.initDataUnsafe.user.id;
    // Linki kopyalama veya Telegram paylaşım penceresini açma
    alert("Davet Linkin: " + inviteLink);
}
