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

    if (elapsed >= state.claimDuration) {
        timer.innerText = "Ready!";
        btn.innerText = "CLAIM REWARDS";
        btn.disabled = false;
        dot.style.backgroundColor = "#4cd137";
        statusText.innerText = "Claim Ready";
    } else {
        const h = Math.floor(remaining / 3600);
        const m = Math.floor((remaining % 3600) / 60);
        const s = remaining % 60;
        timer.innerText = `${h}h ${m}m ${s}s`;
        btn.innerText = "FARMING...";
        btn.disabled = true;
        dot.style.backgroundColor = "#ff2d55"; // Farming sırasında kırmızı-pembe nokta
        statusText.innerText = "Farming";
    }
}

function processClaim() {
    if (state.farmStartTime === 0 || (Math.floor((Date.now() - state.farmStartTime) / 1000) >= state.claimDuration)) {
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

function nav(id, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}
