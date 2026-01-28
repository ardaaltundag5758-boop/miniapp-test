/**
 * 3D STACK BALL ENGINE - HELIX VERSIYONU (MEVCUT OYUN SİLİNDİ, YENİ HELIX YAPISI)
 */
const tg = window.Telegram.WebApp;
tg.expand();
// GLOBAL STATE (Cüzdan, Görevler ve Dostlar alanına dokunulmadı)
let state = {
    bal: parseInt(localStorage.getItem('f_bal')) || 0,
    lvl: 1,
    score: 0,
    friends: JSON.parse(localStorage.getItem('f_friends')) || [],
    tasks: JSON.parse(localStorage.getItem('f_done_tasks')) || [],
    lastTime: performance.now()
};
const BOT_NAME = "FlashyGameBot";
const REF_LINK = `https://t.me/${BOT_NAME}?start=${tg.initDataUnsafe.user?.id || '123'}`;
// 3D OYUN DEĞİŞKENLERİ (YENİ HELIX İÇİN)
let scene, camera, renderer, ball, layers = [], fragments = [];
let isDown = false, gameActive = false, sectionActive = true;
// Fizik Ayarları (Helix için optimize)
let ballVel = 0;
const gravity = 0.008;
const crushSpeed = 0.3;
const layerGap = 3;
const startY = 15;
const radius = 4; // Helix yarıçapı
const segments = 8; // Platform segment sayısı
// Renk Paletleri (Arka plan ve platform renkleri)
const palettes = [
    { bg: ['#ff9a9e', '#fecfef'], plate: 0x4facfe, black: 0x222222 },
    { bg: ['#84fab0', '#8fd3f4'], plate: 0xfa709a, black: 0x222222 },
    { bg: ['#a1c4fd', '#c2e9fb'], plate: 0xf6d365, black: 0x222222 },
    { bg: ['#f093fb', '#f5576c'], plate: 0x5eeff5, black: 0x222222 }
];
window.onload = () => {
    initUser();
    updateUI();
    init3D();
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
    document.getElementById('cur-lvl').innerText = state.lvl;
}
// ---------------- YENİ HELIX OYUNU (MEVCUT SİLİNDİ) ----------------
function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    // Kamera: Helix için dinamik takip
    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    // Işıklar
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const direct = new THREE.DirectionalLight(0xffffff, 0.8);
    direct.position.set(10, 10, 5);
    scene.add(ambient, direct);
    createLevel();
    animate();
}
function createLevel() {
    // Temizle
    layers.forEach(l => scene.remove(l));
    layers = [];
    const p = palettes[(state.lvl - 1) % palettes.length];
    document.getElementById('page-game').style.background = `linear-gradient(to bottom, ${p.bg[0]}, ${p.bg[1]})`;
    // Top (beyaz küre)
    if (!ball) {
        ball = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshPhongMaterial({ color: 0xffffff })
        );
        scene.add(ball);
    }
    ball.position.set(0, startY, 0);
    ballVel = 0;
    // Helix Platformlar (Dönen, segmentli, gap'li)
    const count = 25 + (state.lvl * 3); // Level'e göre artan katman
    for (let i = 0; i < count; i++) {
        const layerGroup = new THREE.Group();
        const isBlack = i > 3 && Math.random() < 0.15 && i < count - 3; // Rastgele siyah (fatal)
        const color = isBlack ? p.black : p.plate;
        const heightOffset = startY - (i * layerGap);
        // Segmentler (8 adet, her 2. eksik için gap simüle et)
        for (let j = 0; j < segments; j++) {
            if (j % 2 === 0) { // Gap: Tek sayıları atla (dönme için boşluk)
                const segmentGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 8);
                const segmentMaterial = new THREE.MeshPhongMaterial({ color });
                const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
                // Helix pozisyon: Dairesel yerleştir
                const angle = (j / segments) * Math.PI * 2;
                segment.position.x = Math.cos(angle) * radius;
                segment.position.z = Math.sin(angle) * radius;
                segment.position.y = heightOffset;
                // Helix twist: Her katman biraz döndür
                segment.rotation.y = angle + (i * 0.2); // Dönme offset
                layerGroup.add(segment);
            }
        }
        layerGroup.userData = { fatal: isBlack, index: i, y: heightOffset };
        scene.add(layerGroup);
        layers.push(layerGroup);
    }
}
function animate() {
    requestAnimationFrame(animate);
    if (!sectionActive) return;
    // Fragment animasyonları (kırık parçalar düşsün)
    for (let i = fragments.length - 1; i >= 0; i--) {
        const f = fragments[i];
        f.position.add(f.userData.vel);
        f.userData.vel.y -= 0.015;
        f.rotation.x += 0.05;
        f.rotation.z += 0.05;
        if (f.position.y < -30) {
            scene.remove(f);
            fragments.splice(i, 1);
        }
    }
    if (gameActive) {
        // Helix Dönme (Tüm katmanlar yavaş dön)
        layers.forEach((layer, i) => {
            layer.rotation.y += 0.01 * (i % 2 ? 1 : -1); // Alternatif yön
        });
        // Top Fizik
        if (isDown) {
            ballVel = -crushSpeed; // Basılı: Hızlı düş
            ball.rotation.x += 0.1; // Dönme efekti
        } else {
            ballVel += gravity; // Normal yerçekimi
        }
        ball.position.y += ballVel; // Düşme
        // Kamera Takip (Topu izle)
        camera.position.y = ball.position.y + 8;
        camera.lookAt(ball.position.x, ball.position.y, ball.position.z + 5);
        // Çarpışma Kontrol
        checkCollision();
        // Kazanma: Tüm layer'lar kırılınca
        if (layers.length === 0) winLevel();
        // Ölüm: Aşağı düşerse
        if (ball.position.y < -50) die();
    }
    renderer.render(scene, camera);
}
function checkCollision() {
    const ballY = ball.position.y - 0.5; // Top alt
    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (Math.abs(ballY - layer.userData.y) < 0.6) {
            // Segment çarpışma (basit distance check)
            const dist = Math.sqrt(
                Math.pow(ball.position.x - layer.position.x, 2) +
                Math.pow(ball.position.z - layer.position.z, 2)
            );
            if (dist < radius + 0.5) { // Yakınsa çarp
                if (layer.userData.fatal) {
                    die();
                    return;
                }
                // Kır: Tüm segmentleri fragment yap
                explodeLayer(layer);
                state.score += 10; // Skor artır
                document.getElementById('cur-score').innerText = state.score;
                ballVel = -0.1; // Hafif sekme
                return;
            }
        }
    }
}
function explodeLayer(layer) {
    // Segmentleri tek tek düşür (helix efekti)
    layer.children.forEach(segment => {
        segment.userData.vel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            -0.25,
            (Math.random() - 0.5) * 0.3
        );
        fragments.push(segment);
        scene.remove(segment);
    });
    scene.remove(layer);
    const idx = layers.indexOf(layer);
    if (idx > -1) layers.splice(idx, 1);
}
function startGame() {
    document.getElementById('game-start-ui').style.display = 'none';
    gameActive = true;
    state.score = 0;
    document.getElementById('cur-score').innerText = 0;
}
function die() {
    gameActive = false;
    isDown = false;
    document.getElementById('pop-reward').innerText = "Skor: " + state.score;
    document.getElementById('game-over').style.display = "flex";
}
function winLevel() {
    gameActive = false;
    isDown = false;
    spawnConfetti();
    setTimeout(() => {
        state.lvl++;
        state.bal += 50;
        localStorage.setItem('f_bal', state.bal);
        updateUI();
        resetGame();
    }, 2000);
}
function resetGame() {
    document.getElementById('game-over').style.display = "none";
    document.getElementById('game-start-ui').style.display = "flex";
    gameActive = false;
    ball.position.y = startY;
    ballVel = 0;
    createLevel();
}
function spawnConfetti() {
    for(let i=0; i<30; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + "vw";
        c.style.top = "-10px";
        c.style.backgroundColor = ["#ff0","#f0f","#0ff","#0f0"][Math.floor(Math.random()*4)];
        document.getElementById('page-game').appendChild(c);
       
        const anime = c.animate([
            { transform: 'translateY(0) rotate(0)', opacity: 1 },
            { transform: `translateY(100vh) rotate(${Math.random()*360}deg)`, opacity: 0 }
        ], { duration: 2000, easing: 'ease-out' });
       
        anime.onfinish = () => c.remove();
    }
}
// ---------------- DEĞİŞTİRİLMEYEN CÜZDAN/GÖREV/DOSTLAR ----------------
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
        const canClaim = t.req ? (state.friends.length >= t.req) : true;
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
    sectionActive = (id === 'game');
}
// KONTROLLER (Basılı tutunca hızlı düşme - helix için)
const canvasCont = document.getElementById('canvas-container');
canvasCont.addEventListener('mousedown', () => { if(gameActive) isDown = true; });
window.addEventListener('mouseup', () => isDown = false);
canvasCont.addEventListener('touchstart', (e) => { if(gameActive) isDown = true; e.preventDefault(); }, {passive: false});
window.addEventListener('touchend', () => isDown = false);
window.addEventListener('resize', () => {
    camera.aspect = canvasCont.clientWidth / canvasCont.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasCont.clientWidth, canvasCont.clientHeight);
});
