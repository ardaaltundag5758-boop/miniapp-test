/**
 * STACK BALL 3D ENGINE - RE-ENGINEERED FROM VIDEO
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

// 3D DEĞİŞKENLERİ
let scene, camera, renderer, ball, pole, layers = [], fragments = [];
let isDown = false, gameActive = false, sectionActive = true;
let ballVel = 0;
const gravity = 0.006;
const jumpForce = 0.15;
const crushSpeed = 0.3;
const layerGap = 2.5;

// Renk Paletleri (Her Level Değişir)
const palettes = [
    { bg: 0xff4757, plate: 0x2ed573, black: 0x222222 },
    { bg: 0x54a0ff, plate: 0xff9f43, black: 0x222222 },
    { bg: 0x8e44ad, plate: 0xf1c40f, black: 0x222222 },
    { bg: 0x16a085, plate: 0xe74c3c, black: 0x222222 }
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
    if (user && document.getElementById('u-name')) {
        document.getElementById('u-name').innerText = user.first_name;
        if (user.photo_url) document.getElementById('u-pic').src = user.photo_url;
    }
}

function updateUI() {
    document.getElementById('global-bal').innerText = state.bal.toLocaleString();
    document.getElementById('wallet-bal').innerText = state.bal.toLocaleString();
    document.getElementById('cur-lvl').innerText = state.lvl;
}

// ---------------- OYUN MOTORU (VİDEO BİREBİR) ----------------

function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 15, 25);
    camera.lookAt(0, 5, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6), light);

    createLevel();
    animate();
}

function createLevel() {
    layers.forEach(l => scene.remove(l));
    layers = [];

    const p = palettes[(state.lvl - 1) % palettes.length];
    scene.background = new THREE.Color(p.bg);

    // Merkez Direk
    if(!pole) {
        pole = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 500, 32), new THREE.MeshPhongMaterial({color: 0xeeeeee}));
        scene.add(pole);
    }

    // Top
    if(!ball) {
        ball = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), new THREE.MeshPhongMaterial({color: 0xffffff}));
        scene.add(ball);
    }
    ball.position.set(0, 10, 3.5);
    ballVel = 0;

    // Spiral Kare Platformlar
    const count = 35 + (state.lvl * 2);
    for(let i=0; i<count; i++) {
        const isBlack = i > 5 && Math.random() < 0.2 && i < count - 3;
        const group = new THREE.Group();
        group.position.y = 10 - (i * layerGap);
        
        // Kare blok
        const mat = new THREE.MeshPhongMaterial({ color: isBlack ? p.black : p.plate });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(8, 0.8, 8), mat);
        
        group.add(mesh);
        group.userData = { fatal: isBlack, index: i };
        group.rotation.y = i * 0.2; // Spiral dizilim
        
        scene.add(group);
        layers.push(group);
    }
}

function animate() {
    requestAnimationFrame(animate);
    if(!sectionActive) return;

    // Kırılma Efekti
    for (let i = fragments.length - 1; i >= 0; i--) {
        const f = fragments[i];
        f.position.add(f.userData.vel);
        f.userData.vel.y -= 0.01;
        f.rotation.x += 0.1;
        if(f.position.y < -20) {
            scene.remove(f);
            fragments.splice(i, 1);
        }
    }

    if(gameActive) {
        if(isDown) {
            ballVel = -crushSpeed;
            checkCollision();
        } else {
            ballVel += gravity;
            const idx = Math.floor((10 - ball.position.y) / layerGap);
            const currentLayer = layers.find(l => l.userData.index === idx);
            if(currentLayer && ball.position.y <= currentLayer.position.y + 1 && ballVel > 0) {
                ballVel = -jumpForce;
            }
        }
        ball.position.y -= ballVel;
        
        // Kamera takibi (Yumuşak)
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, ball.position.y + 10, 0.1);
        camera.lookAt(0, ball.position.y - 2, 0);

        if(layers.length === 0) winLevel();
    }
    renderer.render(scene, camera);
}

function checkCollision() {
    for(let i=0; i<layers.length; i++) {
        const l = layers[i];
        if(Math.abs(ball.position.y - l.position.y) < 0.8) {
            if(l.userData.fatal) return die();
            explodeLayer(l);
            state.score += 10;
            document.getElementById('cur-score').innerText = state.score;
        }
    }
}

function explodeLayer(layer) {
    layer.userData.vel = new THREE.Vector3((Math.random()-0.5), -0.2, (Math.random()-0.5));
    fragments.push(layer);
    layers.splice(layers.indexOf(layer), 1);
}

function startGame() {
    document.getElementById('game-start-ui').style.display = 'none';
    gameActive = true;
}

function die() {
    gameActive = false;
    isDown = false;
    document.getElementById('pop-reward').innerText = "+" + Math.floor(state.score/10);
    state.bal += Math.floor(state.score/10);
    localStorage.setItem('f_bal', state.bal);
    updateUI();
    document.getElementById('game-over').style.display = "flex";
}

function winLevel() {
    gameActive = false;
    state.lvl++;
    state.bal += 100;
    localStorage.setItem('f_bal', state.bal);
    updateUI();
    resetGame();
}

function resetGame() {
    document.getElementById('game-over').style.display = "none";
    document.getElementById('game-start-ui').style.display = "flex";
    state.score = 0;
    document.getElementById('cur-score').innerText = 0;
    createLevel();
}

// ---------------- DOKUNULMAYAN DİĞER SEKMELER ----------------

function nav(id, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if(el) el.classList.add('active');
    sectionActive = (id === 'game');
}

function renderTasks() { /* Mevcut kodunuzu buraya ekleyebilirsiniz */ }
function renderFriends() { /* Mevcut kodunuzu buraya ekleyebilirsiniz */ }

const container = document.getElementById('canvas-container');
container.addEventListener('mousedown', () => isDown = true);
window.addEventListener('mouseup', () => isDown = false);
container.addEventListener('touchstart', (e) => { isDown = true; e.preventDefault(); }, {passive: false});
window.addEventListener('touchend', () => isDown = false);
