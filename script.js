/**
 * 3D SQUARE STACK ENGINE - Sadece Oyun Sekmesi Güncellendi
 */

const tg = window.Telegram.WebApp;
tg.expand();

// GLOBAL STATE
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
let ballVel = 0, gravity = 0.008, jumpForce = 0.18;
let currentLvlHeight = 0;

// INIT
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

function showToast(text) {
    const t = document.getElementById('toast');
    t.innerText = text;
    t.style.top = "20px";
    setTimeout(() => t.style.top = "-100px", 3000);
}

// ---------------- OYUN GÜNCELLEMELERİ ----------------

function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    
    // Hareketli Gradient Arka Plan Simülasyonu
    scene.background = new THREE.Color(0x1a1a2e);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 18, 28);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const direct = new THREE.DirectionalLight(0xffffff, 0.8);
    direct.position.set(10, 20, 10);
    scene.add(ambient, direct);

    createLevel();
    animate();
}

function createLevel() {
    // Eski katmanları temizle
    layers.forEach(l => scene.remove(l));
    layers = [];
    
    // Arka plan rengini levele göre değiştir
    const hue = (state.lvl * 0.13) % 1;
    scene.background = new THREE.Color().setHSL(hue, 0.3, 0.1);

    // Merkezi direk (Kare Kesitli)
    if(!pole) {
        pole = new THREE.Mesh(new THREE.BoxGeometry(3.5, 300, 3.5), new THREE.MeshPhongMaterial({color: 0x111111}));
        pole.position.y = -100;
        scene.add(pole);
    }

    // Top
    if(!ball) {
        ball = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 32), new THREE.MeshPhongMaterial({color: 0xffffff, emissive: 0x333333}));
        ball.position.set(0, 10, 4.8);
        scene.add(ball);
    } else {
        ball.position.set(0, 10, 4.8);
        ballVel = 0;
    }

    // Katman Oluşturma (Kare Platformlar)
    const count = 25 + Math.floor(Math.random() * 20) + (state.lvl * 2);
    currentLvlHeight = count;
    
    for(let i=0; i<count; i++) {
        const layerGroup = new THREE.Group();
        layerGroup.position.y = 8 - (i * 3.5);
        
        const isEnemyLayer = Math.random() < 0.2 && i > 3; // İlk katmanlar siyah olmasın
        const layerColor = new THREE.Color().setHSL((i/count + hue) % 1, 0.7, 0.5);

        // 4 Parçadan oluşan kare platform
        for(let j=0; j<4; j++) {
            const isSiyah = isEnemyLayer && Math.random() < 0.4;
            const mat = new THREE.MeshPhongMaterial({ color: isSiyah ? 0x111111 : layerColor });
            
            const piece = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.8, 4.5), mat);
            
            // Kare dizilimi için pozisyonlama
            const offset = 4.6;
            if(j === 0) piece.position.set(offset, 0, 0);
            if(j === 1) piece.position.set(-offset, 0, 0);
            if(j === 2) piece.position.set(0, 0, offset);
            if(j === 3) piece.position.set(0, 0, -offset);
            
            piece.userData = { fatal: isSiyah, originalPos: piece.position.clone() };
            layerGroup.add(piece);
        }
        layerGroup.rotation.y = Math.random() * Math.PI;
        scene.add(layerGroup);
        layers.push(layerGroup);
    }
}

function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = (now - state.lastTime) / 16.67;
    state.lastTime = now;

    if(sectionActive) {
        // Parça animasyonları (Kırılma efekti)
        for (let i = fragments.length - 1; i >= 0; i--) {
            const f = fragments[i];
            f.position.add(f.userData.velocity);
            f.userData.velocity.y -= 0.01 * dt;
            f.rotation.x += 0.1;
            f.scale.multiplyScalar(0.96);
            if(f.scale.x < 0.1) {
                scene.remove(f);
                fragments.splice(i, 1);
            }
        }

        if(gameActive) {
            // Yavaş kule dönüşü
            layers.forEach(l => l.rotation.y += 0.015 * dt);
            pole.rotation.y += 0.015 * dt;

            // Kontroller ve Fizik
            if(isDown) {
                // Aşağı iniş (Yukarı gitme asla yok)
                ballVel = -0.6 * dt; 
                checkCollision();
            } else {
                // Stabil sekme
                ballVel += gravity * dt;
                const idx = Math.floor((10 - ball.position.y) / 3.5);
                if(ball.position.y <= 10 && idx < layers.length && ballVel > 0) {
                    ballVel = -jumpForce;
                    ball.position.y = 10; // Yerden kopmama garantisi
                }
            }
            ball.position.y -= ballVel;

            // Kamera Takibi
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, ball.position.y + 12, 0.1);
            camera.lookAt(0, ball.position.y - 4, 0);

            // Level Bitişi
            if(ball.position.y < 8 - (currentLvlHeight * 3.5)) winLevel();
        }
    }
    renderer.render(scene, camera);
}

function checkCollision() {
    const idx = Math.floor((10 - ball.position.y) / 3.5);
    if(idx >= 0 && idx < layers.length) {
        const layer = layers[idx];
        
        // Topun açısına göre hangi parçaya çarptığını bul (Basitleştirilmiş çarpışma)
        let hitFatal = false;
        layer.children.forEach(piece => {
            if(piece.userData.fatal) hitFatal = true;
        });

        if(hitFatal) return die();

        // Katmanı Kır
        explodeLayer(layer);
        state.score += 10;
        document.getElementById('cur-score').innerText = state.score;
    }
}

function explodeLayer(layer) {
    const pieces = [...layer.children];
    pieces.forEach(p => {
        const worldPos = new THREE.Vector3();
        p.getWorldPosition(worldPos);
        
        const frag = p.clone();
        frag.position.copy(worldPos);
        frag.scale.set(0.5, 0.5, 0.5);
        frag.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.4,
            Math.random() * 0.2,
            (Math.random() - 0.5) * 0.4
        );
        scene.add(frag);
        fragments.push(frag);
    });
    scene.remove(layer);
    // Diziden de çıkar ki tekrar çarpışmasın
    const lIdx = layers.indexOf(layer);
    if(lIdx > -1) layers.splice(lIdx, 1);
}

function startGame() {
    document.getElementById('game-start-ui').style.display = 'none';
    gameActive = true;
}

function die() {
    gameActive = false;
    const reward = Math.floor(state.score / 2);
    addBal(reward, false);
    document.getElementById('pop-reward').innerText = "+" + reward;
    document.getElementById('game-over').style.display = "flex";
}

function winLevel() {
    gameActive = false;
    state.lvl++;
    addBal(100, false);
    showToast("Level Tamamlandı! +100");
    // Konfeti simülasyonu yerine hızlı renk değişimi ve reset
    setTimeout(() => {
        resetGame();
    }, 1000);
}

function resetGame() {
    document.getElementById('game-over').style.display = "none";
    document.getElementById('game-start-ui').style.display = "flex";
    state.score = 0;
    document.getElementById('cur-score').innerText = 0;
    updateUI();
    gameActive = false;
    createLevel();
}

// ---------------- DEĞİŞTİRİLMEYEN KISIMLAR ----------------

function addBal(amt, toast = true) {
    state.bal += amt;
    localStorage.setItem('f_bal', state.bal);
    updateUI();
    if(toast) showToast(`+${amt} bakiyeye eklendi`);
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
        { id: 3, txt: "5 Arkadaş Davet Et", reward: 300, req: 5 },
        { id: 4, txt: "10 Arkadaş Davet Et", reward: 600, req: 10 }
    ];
    TASK_DATA.forEach(t => {
        const done = state.tasks.includes(t.id);
        const canClaim = t.req ? (state.friends.length >= t.req) : true;
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div><b>${t.txt}</b><br><small style="color:var(--accent)">+${t.reward} Flashy</small></div>
            ${done ? '<span style="color:var(--gray)">Tamamlandı</span>' : 
              (canClaim ? `<button class="btn btn-accent" onclick="claimTask(${t.id}, ${t.reward})">Talep Et</button>` : 
              `<button class="btn btn-gray" onclick="${t.req ? "nav('friends')" : `tg.openTelegramLink('${t.link}')`}">Git</button>`)}
        `;
        cont.appendChild(item);
    });
}

function renderFriends() {
    const cont = document.getElementById('friends-list');
    if(!cont) return;
    document.getElementById('friend-count').innerText = `Dostların (${state.friends.length})`;
    cont.innerHTML = state.friends.length ? '' : '<p style="text-align:center; color:var(--gray); margin-top:20px;">Henüz kimse yok.</p>';
    state.friends.forEach(f => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="${f.pic}" style="width:35px; border-radius:50%">
                <div><b>${f.name}</b><br><small style="color:var(--gray)">ID: ${f.id}</small></div>
            </div>
            <div style="color:var(--accent)">+30</div>
        `;
        cont.appendChild(item);
    });
}

function copyRef() {
    const el = document.createElement('textarea');
    el.value = REF_LINK;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    tg.showAlert("Link kopyalandı!");
}

function shareRef() {
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(REF_LINK)}&text=Flashy oyna, beraber kazanalım!`);
}

function nav(id, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if(el) el.classList.add('active');
    
    // Oyun sadece oyun sekmesindeyken render edilsin/çalışsın
    sectionActive = (id === 'game');
}

// EVENTS - Propagation Engelleme (Navigasyon Tıklamaları İçin)
window.addEventListener('mousedown', (e) => { if(gameActive && sectionActive) isDown = true; });
window.addEventListener('mouseup', () => isDown = false);
window.addEventListener('touchstart', (e) => { 
    if(gameActive && sectionActive && e.target.closest('#canvas-container')) {
        isDown = true;
    }
}, {passive: false});
window.addEventListener('touchend', () => isDown = false);
