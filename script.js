const tg = window.Telegram.WebApp;
tg.expand();

let state = {
    bal: parseInt(localStorage.getItem('f_bal')) || 0,
    farmStartTime: parseInt(localStorage.getItem('f_start')) || 0,
    hourlyRate: 22,
    claimDuration: 43200 // 12 Saat (saniye)
};

window.onload = () => {
    initUser();
    updateUI();
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
    document.getElementById('global-bal').innerText = state.bal.toLocaleString();
}

function updateFarm() {
    const btn = document.getElementById('btn-claim');
    const timer = document.getElementById('claim-timer');
    const amount = document.getElementById('farm-amount');
    const progress = document.getElementById('farm-progress');
    const dot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');

    if (state.farmStartTime === 0) {
        timer.innerText = "Ready to start";
        btn.innerText = "START FARMING";
        btn.disabled = false;
        return;
    }

    const elapsed = Math.floor((Date.now() - state.farmStartTime) / 1000);
    const remaining = Math.max(0, state.claimDuration - elapsed);
    const mined = Math.min(state.hourlyRate * 12, (elapsed * (state.hourlyRate / 3600)));
    
    amount.innerText = mined.toFixed(5);
    
    // Progress Bar (12 saate göre)
    const percent = Math.min(100, (elapsed / state.claimDuration) * 100);
    progress.style.width = percent + "%";

    if (elapsed >= state.claimDuration) {
        timer.innerText = "Claim Ready!";
        btn.innerText = "CLAIM REWARDS";
        btn.disabled = false;
        dot.style.background = "#4cd137";
        dot.style.boxShadow = "0 0 8px #4cd137";
        statusText.innerText = "Claim Ready";
    } else {
        const h = Math.floor(remaining / 3600);
        const m = Math.floor((remaining % 3600) / 60);
        const s = remaining % 60;
        timer.innerText = `${h}h ${m}m ${s}s`;
        btn.innerText = "FARMING...";
        btn.disabled = true;
        dot.style.background = "#ff2d55"; // Çalışırken pembe-kırmızı dot
        dot.style.boxShadow = "0 0 8px #ff2d55";
        statusText.innerText = "Active";
    }
}

function processClaim() {
    const elapsed = Math.floor((Date.now() - state.farmStartTime) / 1000);
    
    if (state.farmStartTime === 0 || elapsed >= state.claimDuration) {
        if (state.farmStartTime !== 0) {
            state.bal += (state.hourlyRate * 12);
            localStorage.setItem('f_bal', state.bal);
        }
        state.farmStartTime = Date.now();
        localStorage.setItem('f_start', state.farmStartTime);
        updateUI();
        tg.HapticFeedback.notificationOccurred('success');
    }
}
