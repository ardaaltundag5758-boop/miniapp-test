// Mevcut state'e yeni veriler ekle (SİLMEYİN, SADECE EKLEYİN)
state.farmStartTime = parseInt(localStorage.getItem('f_start')) || Date.now();
state.hourlyRate = 9;
state.claimDuration = 3600; // 1 saat (saniye cinsinden)

// Madencilik Fonksiyonu (Eski script.js'in sonuna ekleyebilirsin)
function updateFarm() {
    const now = Date.now();
    const elapsed = Math.floor((now - state.farmStartTime) / 1000); // Geçen saniye
    const remaining = state.claimDuration - (elapsed % state.claimDuration);
    
    // Biriken miktarı hesapla (Saniye başı kazanç)
    const perSecond = state.hourlyRate / 3600;
    const currentMined = (elapsed % state.claimDuration) * perSecond;
    document.getElementById('farm-amount').innerText = currentMined.toFixed(5);

    // İlerleme çubuğunu güncelle
    const progress = ((state.claimDuration - remaining) / state.claimDuration) * 100;
    document.getElementById('farm-progress').style.width = progress + "%";

    // Sayacı güncelle
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const timerText = document.getElementById('claim-timer');
    const claimBtn = document.getElementById('btn-claim');

    if (elapsed >= state.claimDuration) {
        timerText.innerText = "Ready to Claim!";
        claimBtn.disabled = false;
        claimBtn.style.opacity = "1";
        claimBtn.style.background = "var(--blue)";
        claimBtn.innerText = "CLAIM OXN";
    } else {
        timerText.innerText = `Next Claim in ${mins}m ${secs}s`;
        claimBtn.disabled = true;
        claimBtn.style.opacity = "0.6";
        claimBtn.innerText = "Boost Farm";
    }
}

// Toplama işlemi
function processClaim() {
    addBal(state.hourlyRate); // Saati dolunca saatlik hızı bakiyeye ekle
    state.farmStartTime = Date.now();
    localStorage.setItem('f_start', state.farmStartTime);
    tg.HapticFeedback.notificationOccurred('success');
}

// Her saniye güncelle
setInterval(updateFarm, 1000);
