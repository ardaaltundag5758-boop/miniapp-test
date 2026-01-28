/**
 * 3D STACK ENGINE & MINI APP LOGIC
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

// CONFIG
const BOT_NAME = "FlashyGameBot";
const REF_LINK = `https://t.me/${BOT_NAME}?start=${tg.initDataUnsafe.user?.id || '123'}`;

// 3D VARIABLES
let scene, camera, renderer, ball, pole, layers = [];
let isDown = false, gameRunning = true;
let ballVel = 0, gravity = 0.015, jump = 0.22;

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

// 3D CORE
function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 15, 25);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7);
    scene.add(light, new THREE.AmbientLight(0xffffff, 0.4));

    createLevel();
    animate();
}

function createLevel() {
    layers.forEach(l => scene.remove(l));
    layers = [];

    // Pole
    if(!pole) {
        pole = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 200, 32), new THREE.MeshPhongMaterial({color: 0x151515}));
        pole.position.y = -80;
        scene.add(pole);
    }

    // Ball
    if(!ball) {
        ball = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), new THREE.MeshPhongMaterial({color: 0xffffff}));
        ball.position.set(0, 10, 4.5);
        scene.add(ball);
    } else {
        ball.position.set(0, 10, 4.5);
        ballVel = 0;
    }

    const count = 30 + (state.lvl * 5);
    for(let i=0; i<count; i++) {
        const group = new THREE.Group();
        group.position.y = 8 - (i * 2.8);
        const isEnemyLayer = Math.random() < 0.15;

        for(let j=0; j<8; j++) {
            const isSiyah = isEnemyLayer && (j === 0 || j === 4);
            const mat = new THREE.MeshPhongMaterial({
                color: isSiyah ? 0x222222 : new THREE.Color().setHSL(i/count, 0.7, 0.5)
            });
            const part = new THREE.Mesh(new THREE.TorusGeometry(4, 0.6, 16, 32, (Math.PI*2/8)*0.9), mat);
            part.rotation.z = Math.PI/2;
            part.rotation.x = j * (Math.PI*2/8);
            part.userData = { fatal: isSiyah };
            group.add(part);
        }
        group.rotation.y = Math.random() * Math.PI;
        scene.add(group);
        layers.push(group);
    }
}

function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = (now - state.lastTime) / 16.67;
    state.lastTime = now;

    if(gameRunning) {
        // Rotate
        layers.forEach(l => l.rotation.y += 0.02 * dt);
        pole.rotation.y += 0.02 * dt;

        // Physics
        if(isDown) {
            ballVel = -0.5 * dt;
            checkCollision();
        } else {
            ballVel += gravity * dt;
            const idx = Math.floor((10 - ball.position.y) / 2.8);
            if(ball.position.y <= 10 && idx < layers.length && ballVel > 0) {
                ballVel = -jump;
                ball.position.y = 10;
            }
        }
        ball.position.y -= ballVel;

        // Camera
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, ball.position.y + 8, 0.1);
        camera.lookAt(0, ball.position.y - 2, 0);

        if(ball.position.y < -layers.length * 2.8) nextLvl();
    }
    renderer.render(scene, camera);
}

function checkCollision() {
    const idx = Math.floor((10 - ball.position.y) / 2.8);
    if(idx >= 0 && idx < layers.length) {
        const l = layers[idx];
        if(l.children[0].userData.fatal) return die();
        scene.remove(l);
        state.score += 5;
        document.getElementById('cur-score').innerText = state.score;
    }
}

function die() {
    gameRunning = false;
    const reward = Math.floor(state.score / 2);
    addBal(reward, false);
    document.getElementById('pop-reward').innerText = "+" + reward;
    document.getElementById('game-over').style.display = "flex";
}

function nextLvl() {
    state.lvl++;
    addBal(50, false);
    showToast("Level Tamamlandı! +50");
    state.score = 0;
    document.getElementById('cur-score').innerText = 0;
    updateUI();
    createLevel();
}

function resetGame() {
    document.getElementById('game-over').style.display = "none";
    state.score = 0;
    document.getElementById('cur-score').innerText = 0;
    gameRunning = true;
    createLevel();
}

// BALANCE
function addBal(amt, toast = true) {
    state.bal += amt;
    localStorage.setItem('f_bal', state.bal);
    updateUI();
    if(toast) showToast(`+${amt} bakiyeye eklendi`);
}

// TASKS & FRIENDS
const TASK_DATA = [
    { id: 1, txt: "Kanalı Takip Et", reward: 100, link: "https://t.me/AirdropNoktasiDuyuru" },
    { id: 2, txt: "1 Arkadaş Davet Et", reward: 60, req: 1 },
    { id: 3, txt: "5 Arkadaş Davet Et", reward: 300, req: 5 },
    { id: 4, txt: "10 Arkadaş Davet Et", reward: 600, req: 10 }
];

function renderTasks() {
    const cont = document.getElementById('tasks-list');
    cont.innerHTML = '';
    TASK_DATA.forEach(t => {
        const done = state.tasks.includes(t.id);
        const canClaim = t.req ? (state.friends.length >= t.req) : true;
        
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div><b>${t.txt}</b><br><small style="color:var(--accent)">+${t.reward} Flashy</small></div>
            ${done ? '<span style="color:var(--gray)">Tamamlandı</span>' : 
              (canClaim ? `<button class="btn btn-accent" onclick="claimTask(${t.id}, ${t.reward})">Talep Et</button>` : 
              `<button class="btn btn-gray" onclick="${t.req ? "nav('friends')" : `goTask('${t.link}')`}">Git</button>`)}
        `;
        cont.appendChild(item);
    });
}

function goTask(link) {
    tg.openTelegramLink(link);
    renderTasks(); // Re-render to show claim button for link tasks
}

function claimTask(id, reward) {
    state.tasks.push(id);
    localStorage.setItem('f_done_tasks', JSON.stringify(state.tasks));
    addBal(reward);
    renderTasks();
}

function renderFriends() {
    const cont = document.getElementById('friends-list');
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

// NAVIGATION
function nav(id, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if(el) el.classList.add('active');
    
    gameRunning = (id === 'game');
}

// EVENTS
window.addEventListener('mousedown', () => isDown = true);
window.addEventListener('mouseup', () => isDown = false);
window.addEventListener('touchstart', (e) => { isDown = true; e.preventDefault(); }, {passive: false});
window.addEventListener('touchend', () => isDown = false);
