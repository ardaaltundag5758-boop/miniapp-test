/**
 * 3D STACK BALL ENGINE - VIDEO REFERENCE VERSION
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

// 3D OYUN DEĞİŞKENLERİ
let scene, camera, renderer, ball, pole, layers = [], fragments = [];
let isDown = false, gameActive = false, sectionActive = true;

// Fizik Ayarları (Video Referanslı)
let ballVel = 0;
const gravity = 0.005; 
const jumpForce = 0.12;
const crushSpeed = 0.25;
const layerGap = 2.5;
const startY = 10;

// Renk Paletleri
const palettes = [
    { bg: ['#ff9a9e', '#fecfef'], plate: 0x4facfe },
    { bg: ['#84fab0', '#8fd3f4'], plate: 0xfa709a },
    { bg: ['#a1c4fd', '#c2e9fb'], plate: 0xf6d365 },
    { bg: ['#f093fb', '#f5576c'], plate: 0x5eeff5 }
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

// ---------------- OYUN GÜNCELLEMELERİ (VİDEO BİREBİR) ----------------

function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();

    // Kamera: Videodaki hafif eğik üst bakış açısı
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 5, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    const direct = new THREE.DirectionalLight(0xffffff, 0.5);
    direct.position.set(5, 10, 7);
    scene.add(ambient, direct);

    createLevel();
    animate();
}

function createLevel() {
    layers.forEach(l => scene.remove(l));
    layers = [];

    const p = palettes[(state.lvl - 1) % palettes.length];
    document.getElementById('page-game').style.background = `linear-gradient(to bottom, ${p.bg[0]}, ${p.bg[1]})`;

    // Merkezi Beyaz Direk
    if(!pole) {
        pole = new THREE.Mesh(
            new THREE.CylinderGeometry(1.8, 1.8, 500, 32),
            new THREE.MeshPhongMaterial({color: 0xffffff})
        );
        scene.add(pole);
    }

    // Top
    if(!ball) {
        ball = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 32, 32),
            new THREE.MeshPhongMaterial({color: 0xffffff})
        );
        scene.add(ball);
    }
    ball.position.set(0, startY, 2.8);
    ballVel = 0;

    // Kare Platformlar (Tam dolu, deliksiz)
    const count = 30 + (state.lvl * 2);
    for(let i=0; i<count; i++) {
        const isBlack = i > 5 && Math.random() < 0.2 && i < count - 2;
        const mat = new THREE.MeshPhongMaterial({ color: isBlack ? 0x222222 : p.plate });
        
        const layer = new THREE.Mesh(
            new THREE.BoxGeometry(7, 0.6, 7), 
            mat
        );
        layer.position.y = startY - (i * layerGap) - 1.5;
        layer.userData = { fatal: isBlack, index: i };
        
        scene.add(layer);
        layers.push(layer);
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (!sectionActive) return;

    // Parça Animasyonları
    for (let i = fragments.length - 1; i >= 0; i--) {
        const f = fragments[i];
        f.position.add(f.userData.vel);
        f.userData.vel.y -= 0.01;
        f.rotation.x += 0.1;
        f.rotation.z += 0.1;
        if(f.position.y < -20) {
            scene.remove(f);
            fragments.splice(i, 1);
        }
    }

    if(gameActive) {
        // Fizik
        if(isDown) {
            // Basılı tutulduğunda güçlü iniş
            ballVel = -crushSpeed;
            checkCollision();
        } else {
            // Normal sekme davranışı
            ballVel += gravity;
            const currentLayerIdx = Math.floor((startY - ball.position.y) / layerGap);
            const currentLayer = layers.find(l => l.userData && l.userData.index === currentLayerIdx);

            if(currentLayer && ball.position.y <= currentLayer.position.y + 0.8 && ballVel > 0) {
                ballVel = -jumpForce; // Yukarı sekme
            }
        }

        ball.position.y -= ballVel;

        // Kamera Sabit (İstenilen şart)
        
        // Kazanma Kontrolü
        if(layers.length === 0) winLevel();
    }

    renderer.render(scene, camera);
}

function checkCollision() {
    const ballBottom = ball.position.y;
    
    for(let i=0; i<layers.length; i++) {
        const l = layers[i];
        if(Math.abs(ballBottom - l.position.y) < 0.5) {
            if(l.userData.fatal) {
                die();
                return;
            }
            explodeLayer(l);
            state.score += 5;
            document.getElementById('cur-score').innerText = state.score;
        }
    }
}

function explodeLayer(layer) {
    // Katmanı tek parça animasyonla düşür (Videodaki gibi hızlı ve tatmin edici)
    layer.userData.vel = new THREE.Vector3((Math.random()-0.5)*0.5, -0.2, (Math.random()-0.5)*0.5);
    fragments.push(layer);
    
    const idx = layers.indexOf(layer);
    if(idx > -1) layers.splice(idx, 1);
}

function startGame() {
    document.getElementById('game-start-ui').style.display = 'none';
    gameActive = true;
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
    state.score = 0;
    document.getElementById('cur-score').innerText = 0;
    gameActive = false;
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

// KONTROLLER (Sadece oyun alanını etkiler)
const canvasCont = document.getElementById('canvas-container');
canvasCont.addEventListener('mousedown', () => { if(gameActive) isDown = true; });
window.addEventListener('mouseup', () => isDown = false);
canvasCont.addEventListener('touchstart', (e) => { if(gameActive) isDown = true; e.preventDefault(); }, {passive: false});
window.addEventListener('touchend', () => isDown = false);
