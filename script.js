/**
 * FLASHY STACK 3D - PROFESYONEL OYUN SİSTEMİ
 */

const tg = window.Telegram.WebApp;
tg.expand();

// --- GLOBAL STATE ---
let AppState = {
    balance: parseInt(localStorage.getItem('f_bal')) || 0,
    currentLevel: 1,
    score: 0,
    friends: JSON.parse(localStorage.getItem('f_friends')) || [],
    completedTasks: JSON.parse(localStorage.getItem('f_tasks')) || [],
    isMuted: false
};

const BOT_USERNAME = "FlashyGameBot"; // Botunuzun gerçek kullanıcı adını buraya yazın
const INVITE_LINK = `https://t.me/${BOT_USERNAME}?start=${tg.initDataUnsafe.user?.id || 0}`;

// --- BAŞLATMA ---
window.onload = () => {
    initUI();
    updateGlobalBalance();
    renderTasks();
    renderFriends();
};

function initUI() {
    const user = tg.initDataUnsafe.user;
    if(user) {
        document.getElementById('user-name').innerText = user.first_name;
        if(user.photo_url) document.getElementById('user-photo').src = user.photo_url;
    }
}

// --- BAKİYE YÖNETİMİ ---
function updateGlobalBalance(amount = 0) {
    if(amount !== 0) {
        AppState.balance += amount;
        localStorage.setItem('f_bal', AppState.balance);
    }
    const val = AppState.balance.toLocaleString();
    document.getElementById('global-balance').innerText = val;
    document.getElementById('wallet-balance').innerText = val;
}

// --- 3D OYUN MOTORU (Game Object) ---
const Game = {
    scene: null, camera: null, renderer: null,
    ball: null, blocks: [],
    isActive: false, isDown: false,
    gravity: 0.15, jumpForce: 0.25, ballV: 0,
    lastTime: performance.now(),

    init() {
        const container = document.getElementById('game-canvas-container');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / (window.innerHeight - 160), 0.1, 1000);
        this.camera.position.set(0, 15, 25);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight - 160);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 7);
        this.scene.add(light, new THREE.AmbientLight(0xffffff, 0.4));

        this.createLevel();
        this.loop();
    },

    createLevel() {
        // Blokları ve topu oluştur (Fizik düzeltecek yapı)
        this.blocks.forEach(b => this.scene.remove(b));
        this.blocks = [];

        // Merkezi direk
        const poleGeo = new THREE.CylinderGeometry(2, 2, 120, 32);
        const poleMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = -50;
        this.scene.add(pole);

        // Top
        const ballGeo = new THREE.SphereGeometry(0.7, 32, 32);
        const ballMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
        this.ball = new THREE.Mesh(ballGeo, ballMat);
        this.ball.position.set(0, 10, 4.5);
        this.scene.add(this.ball);

        // Katmanlar
        const layerCount = 40 + (AppState.currentLevel * 5);
        for(let i=0; i<layerCount; i++) {
            const group = new THREE.Group();
            group.position.y = 8 - (i * 2.8);
            const isEnemy = Math.random() < 0.2;
            
            for(let j=0; j<8; j++) {
                const geo = new THREE.TorusGeometry(4.5, 0.7, 12, 24, (Math.PI*2/8)*0.9);
                const color = (isEnemy && (j===0 || j===4)) ? 0x222222 : new THREE.Color().setHSL(i/layerCount, 0.8, 0.5);
                const mat = new THREE.MeshPhongMaterial({ color });
                const part = new THREE.Mesh(geo, mat);
                part.rotation.z = Math.PI/2;
                part.rotation.x = j * (Math.PI*2/8);
                part.userData = { fatal: (isEnemy && (j===0 || j===4)) };
                group.add(part);
            }
            group.rotation.y = Math.random() * Math.PI;
            this.scene.add(group);
            this.blocks.push(group);
        }
    },

    loop() {
        requestAnimationFrame((t) => this.loop(t));
        const dt = (performance.now() - this.lastTime) / 16;
        this.lastTime = performance.now();

        if(this.isActive && this.ball) {
            this.blocks.forEach(b => b.rotation.y += 0.03 * dt);
            
            // Fizik ve Yerçekimi
            if(this.isDown) {
                this.ballV = -0.6 * dt; // Kontrollü hızlı iniş
                this.checkCollision();
            } else {
                this.ballV += this.gravity * 0.1 * dt; // Yumuşak yerçekimi
                
                // Zıplama Kontrolü (Sadece blok üstünde)
                const currentIdx = Math.floor((10 - this.ball.position.y) / 2.8);
                if(this.ball.position.y <= 10 && currentIdx < this.blocks.length) {
                    this.ball.position.y = 10;
                    this.ballV = -this.jumpForce * dt;
                }
            }
            this.ball.position.y -= this.ballV;

            // Kamera Takibi
            this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.ball.position.y + 8, 0.1);
            this.camera.lookAt(0, this.ball.position.y - 2, 0);

            // Level Sonu
            if(this.ball.position.y < -this.blocks.length * 2.8) this.win();
        }
        this.renderer.render(this.scene, this.camera);
    },

    checkCollision() {
        const idx = Math.floor((10 - this.ball.position.y) / 2.8);
        if(idx >= 0 && idx < this.blocks.length) {
            const block = this.blocks[idx];
            // Siyah blok kontrolü
            if(this.isDown && block.children[0].userData.fatal) {
                this.die();
                return;
            }
            this.scene.remove(block);
            AppState.score += 10;
            document.getElementById('live-score').innerText = AppState.score;
        }
    },

    start() {
        document.getElementById('start-screen').style.display = 'none';
        this.isActive = true;
    },

    die() {
        this.isActive = false;
        const reward = Math.floor(AppState.score / 5);
        updateGlobalBalance(reward);
        document.getElementById('reward-val').innerText = reward;
        document.getElementById('over-screen').style.display = 'flex';
    },

    win() {
        this.isActive = false;
        AppState.currentLevel++;
        updateGlobalBalance(100); // Level bonus
        tg.HapticFeedback.notificationOccurred('success');
        this.reset();
    },

    reset() {
        AppState.score = 0;
        document.getElementById('live-score').innerText = 0;
        document.getElementById('live-level').innerText = AppState.currentLevel;
        document.getElementById('over-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
        this.createLevel();
        this.camera.position.set(0, 15, 25);
    }
};

// --- GÖREV SİSTEMİ ---
const TASKS = [
    { id: 'tg_join', title: 'Kanalı Takip Et', reward: 100, link: 'https://t.me/AirdropNoktasiDuyuru' },
    { id: 'inv_1', title: '1 Arkadaş Davet Et', reward: 60, req: 1 },
    { id: 'inv_5', title: '5 Arkadaş Davet Et', reward: 300, req: 5 },
    { id: 'inv_10', title: '10 Arkadaş Davet Et', reward: 600, req: 10 }
];

function renderTasks() {
    const container = document.getElementById('tasks-container');
    container.innerHTML = '';
    TASKS.forEach(t => {
        const isDone = AppState.completedTasks.includes(t.id);
        const div = document.createElement('div');
        div.className = 'task-item';
        div.innerHTML = `
            <div class="info-group">
                <div style="background:#222; padding:10px; border-radius:12px;"><i class="fas fa-star" style="color:var(--accent)"></i></div>
                <div><b>${t.title}</b><br><small style="color:var(--accent)">+${t.reward} FLASHY</small></div>
            </div>
            <button class="btn-action" ${isDone ? 'disabled' : ''} onclick="doTask('${t.id}')">
                ${isDone ? 'Tamamlandı' : 'Git'}
            </button>
        `;
        container.appendChild(div);
    });
}

function doTask(id) {
    const task = TASKS.find(t => t.id === id);
    if(task.link) {
        tg.openTelegramLink(task.link);
        // Basit kontrol: Gidip geldiğinde ödül hazır
        setTimeout(() => {
            completeTask(id, task.reward);
        }, 2000);
    } else if(task.req) {
        if(AppState.friends.length >= task.req) {
            completeTask(id, task.reward);
        } else {
            tg.showAlert(`Henüz yeterli arkadaşın yok! (${AppState.friends.length}/${task.req})`);
        }
    }
}

function completeTask(id, reward) {
    if(!AppState.completedTasks.includes(id)) {
        AppState.completedTasks.push(id);
        localStorage.setItem('f_tasks', JSON.stringify(AppState.completedTasks));
        updateGlobalBalance(reward);
        renderTasks();
        tg.showAlert(`Tebrikler! ${reward} FLASHY kazandın.`);
    }
}

// --- REFERANS SİSTEMİ ---
function renderFriends() {
    document.getElementById('friend-count').innerText = AppState.friends.length;
    const list = document.getElementById('friends-list');
    list.innerHTML = AppState.friends.length === 0 ? '<p style="text-align:center; color:var(--gray)">Henüz kimseyi davet etmedin.</p>' : '';
    
    AppState.friends.forEach(f => {
        const div = document.createElement('div');
        div.className = 'friend-item';
        div.innerHTML = `
            <div class="info-group">
                <img src="${f.photo || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" style="width:40px; border-radius:50%">
                <div><b>${f.name}</b><br><small style="color:var(--gray)">ID: ${f.id}</small></div>
            </div>
            <div style="color:var(--accent); font-weight:bold;">+30</div>
        `;
        list.appendChild(div);
    });
}

function copyInviteLink() {
    navigator.clipboard.writeText(INVITE_LINK);
    tg.showScanQrPopup({ text: "Link Kopyalandı!" });
    setTimeout(() => tg.closeScanQrPopup(), 1000);
}

function shareInviteLink() {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(INVITE_LINK)}&text=${encodeURIComponent("Efsane 3D Stack Ball oyna, Flashy kazan!")}`;
    tg.openTelegramLink(shareUrl);
}

// --- SAYFA YÖNETİMİ ---
function switchPage(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById('page-' + pageId).classList.add('active-page');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    
    if(pageId === 'game') {
        if(!Game.renderer) Game.init();
    } else {
        Game.isActive = false;
    }
}

// Dokunmatik Eventler
window.addEventListener('mousedown', () => Game.isDown = true);
window.addEventListener('mouseup', () => Game.isDown = false);
window.addEventListener('touchstart', (e) => { Game.isDown = true; e.preventDefault(); }, {passive:false});
window.addEventListener('touchend', () => Game.isDown = false);
