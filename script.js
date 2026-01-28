// TELEGRAM AYARLARI
const tg = window.Telegram.WebApp;
tg.expand();

// GLOBAL DEĞİŞKENLER
let balance = parseInt(localStorage.getItem('f_bal')) || 0;
let currentLevel = 1;
let score = 0;
let isMuted = false;
let ownedSkins = JSON.parse(localStorage.getItem('f_owned')) || [0xffffff];
let activeSkin = parseInt(localStorage.getItem('f_active_skin')) || 0xffffff;

const SKINS = [
    { color: 0xffffff, price: 0 },
    { color: 0xff4400, price: 500 },
    { color: 0x00ff00, price: 1000 },
    { color: 0xfcd535, price: 2500 }
];

// THREE.JS DEĞİŞKENLERİ
let scene, camera, renderer, ball, blocks = [];
let isDown = false, isDead = false, levelComplete = false;
let ballVelocity = 0;

// BAŞLATMA
window.onload = () => {
    document.getElementById('top-balance-val').innerText = balance;
    init3D();
    renderShop();
};

function init3D() {
    const container = document.getElementById('three-canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / (window.innerHeight - 140), 0.1, 1000);
    camera.position.set(0, 15, 25);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight - 140);
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    createBall();
    createLevel();
    animate();
}

function createBall() {
    if(ball) scene.remove(ball);
    const geo = new THREE.SphereGeometry(0.7, 32, 32);
    const mat = new THREE.MeshPhongMaterial({ color: activeSkin });
    ball = new THREE.Mesh(geo, mat);
    ball.position.set(0, 10, 4.5);
    scene.add(ball);
}

function createLevel() {
    blocks.forEach(b => scene.remove(b));
    blocks = [];
    const count = 30 + (currentLevel * 2);
    for (let i = 0; i < count; i++) {
        const group = new THREE.Group();
        group.position.y = 8 - (i * 2.5);
        const isEnemyLayer = Math.random() < 0.2;
        
        for (let j = 0; j < 8; j++) {
            const isEnemy = isEnemyLayer && (j === 0 || j === 4);
            const geo = new THREE.TorusGeometry(4.5, 0.6, 16, 32, (Math.PI*2)/8 * 0.9);
            const mat = new THREE.MeshPhongMaterial({ color: isEnemy ? 0x111111 : new THREE.Color().setHSL(i/count, 0.7, 0.5) });
            const part = new THREE.Mesh(geo, mat);
            part.rotation.z = Math.PI/2;
            part.rotation.x = j * (Math.PI*2)/8;
            part.userData = { isEnemy };
            group.add(part);
        }
        scene.add(group);
        blocks.push(group);
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (!isDead && !levelComplete && ball) {
        blocks.forEach(b => b.rotation.y += 0.03);
        if (isDown) {
            ballVelocity = -0.5;
            checkCollision();
        } else {
            ballVelocity = Math.sin(Date.now() * 0.01) * 0.2;
        }
        ball.position.y += ballVelocity;
        if(ball.position.y < -blocks.length * 2.5) nextLevel();

        camera.position.y = ball.position.y + 5;
        camera.lookAt(0, ball.position.y - 2, 0);
    }
    renderer.render(scene, camera);
}

function checkCollision() {
    const idx = Math.floor((10 - ball.position.y) / 2.5);
    if (idx >= 0 && idx < blocks.length) {
        const b = blocks[idx];
        // Basit düşman kontrolü
        if (isDown && b.children[0].userData.isEnemy) { die(); return; }
        scene.remove(b);
        score += 10;
        document.getElementById('game-score').innerText = score;
    }
}

function die() {
    isDead = true;
    const reward = Math.floor(score / 10);
    balance += reward;
    localStorage.setItem('f_bal', balance);
    document.getElementById('reward-amt').innerText = reward;
    document.getElementById('top-balance-val').innerText = balance;
    showScreen('screen-over');
}

function nextLevel() {
    levelComplete = true;
    currentLevel++;
    setTimeout(() => {
        levelComplete = false;
        createLevel();
        ball.position.y = 10;
        document.getElementById('game-lvl').innerText = currentLevel;
    }, 500);
}

// UI KONTROLLERİ
function startGame() { showScreen(''); isDead = false; score = 0; }
function resetGame() { location.reload(); }
function showScreen(id) {
    document.querySelectorAll('.game-screen').forEach(s => s.classList.add('hidden'));
    if(id) document.getElementById(id).classList.remove('hidden');
}

function openShop() { showScreen('screen-shop'); }
function closeShop() { showScreen('screen-main'); }

function renderShop() {
    const list = document.getElementById('skin-list');
    list.innerHTML = '';
    SKINS.forEach(s => {
        const owned = ownedSkins.includes(s.color);
        const btn = document.createElement('div');
        btn.style.cssText = `width:50px; height:50px; background:#${s.color.toString(16).padStart(6,'0')}; border-radius:50%; border:3px solid ${activeSkin === s.color ? '#fcd535' : '#444'}`;
        btn.onclick = () => {
            if(owned) {
                activeSkin = s.color;
                localStorage.setItem('f_active_skin', s.color);
                createBall();
            } else if(balance >= s.price) {
                balance -= s.price;
                ownedSkins.push(s.color);
                localStorage.setItem('f_bal', balance);
                localStorage.setItem('f_owned', JSON.stringify(ownedSkins));
                renderShop();
                document.getElementById('top-balance-val').innerText = balance;
            }
            renderShop();
        };
        list.appendChild(btn);
    });
}

// DOKUNMATİK KONTROLLER
const canvas = document.getElementById('three-canvas-container');
canvas.addEventListener('touchstart', (e) => { isDown = true; e.preventDefault(); }, {passive:false});
canvas.addEventListener('touchend', () => isDown = false);
canvas.addEventListener('mousedown', () => isDown = true);
canvas.addEventListener('mouseup', () => isDown = false);
