/**
 * STACK BALL PRO ENGINE - VİDEO REFERANSLI (YUKARI GİTME YOK, TAM KIRILMA VAR)
 */

const tg = window.Telegram.WebApp;
tg.expand();

let state = {
    bal: parseInt(localStorage.getItem('f_bal')) || 0,
    lvl: 1,
    score: 0,
    lastTime: performance.now()
};

let scene, camera, renderer, ball, layers = [], fragments = [];
let isDown = false, gameActive = false, sectionActive = true;

// VİDEO FİZİĞİ AYARLARI
let ballY = 15;
let ballVel = 0;
const jumpPower = 0.15; // Sadece blok üstünde sekme
const gravity = 0.008;
const downSpeed = 0.4;  // Basılı tutunca iniş hızı
const layerStep = 3.0;  // Katmanlar arası mesafe

const palettes = [
    { bg: "#FF3E4D", plate: "#2ecc71", black: "#222222" },
    { bg: "#00d2ff", plate: "#ff9f43", black: "#222222" },
    { bg: "#6D214F", plate: "#f8c291", black: "#222222" }
];

window.onload = () => {
    init3D();
    updateUI();
};

function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 18, 25);
    camera.lookAt(0, 5, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(5, 15, 10);
    scene.add(ambient, sun);

    createLevel();
    animate();
}

function createLevel() {
    layers.forEach(l => scene.remove(l));
    layers = [];
    
    const p = palettes[(state.lvl - 1) % palettes.length];
    document.getElementById('page-game').style.background = `radial-gradient(circle, ${p.bg}, #000)`;

    // Beyaz Direk
    const poleGeom = new THREE.CylinderGeometry(2, 2, 1000, 32);
    const poleMat = new THREE.MeshPhongMaterial({color: 0xdddddd});
    const pole = new THREE.Mesh(poleGeom, poleMat);
    scene.add(pole);

    // Top
    if(!ball) {
        ball = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), new THREE.MeshPhongMaterial({color: 0xffffff}));
        scene.add(ball);
    }
    ballY = 15;
    ballVel = 0;

    // Videodaki Kare Katmanlar
    const count = 40;
    for(let i=0; i<count; i++) {
        const isBlack = i > 5 && Math.random() < 0.2 && i < count - 2;
        const mat = new THREE.MeshPhongMaterial({ color: isBlack ? p.black : p.plate });
        
        // Tam dolu kare blok
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(9, 0.8, 9), mat);
        mesh.position.y = 15 - (i * layerStep);
        mesh.rotation.y = i * 0.15; // Hafif spiral
        mesh.userData = { fatal: isBlack, active: true };
        
        scene.add(mesh);
        layers.push(mesh);
    }
}

function animate() {
    requestAnimationFrame(animate);
    if(!sectionActive) return;

    // PARÇALANMA EFİKTİ (Daha gerçekçi aşağı düşüş)
    for (let i = fragments.length - 1; i >= 0; i--) {
        const f = fragments[i];
        f.position.y -= 0.3;
        f.position.x += f.userData.vx;
        f.rotation.x += 0.2;
        f.scale.multiplyScalar(0.95);
        if(f.scale.x < 0.1) {
            scene.remove(f);
            fragments.splice(i, 1);
        }
    }

    if(gameActive) {
        if(isDown) {
            // ASLA YUKARI GİTME: Basılıyken sadece aşağı hızlanır
            ballVel = -downSpeed;
            checkCollision();
        } else {
            // SEKMELİ DURUM: Top blok üzerindeyse zıplar, boşluktaysa düşer
            ballVel += gravity;
            const targetLayer = layers.find(l => l.userData.active && Math.abs(ball.position.y - (l.position.y + 1)) < 0.3);
            
            if(targetLayer && ballVel > 0) {
                ballVel = -jumpPower; // Blok üstünde sekme
            }
        }

        ballY -= ballVel;
        ball.position.y = ballY;

        // Kamera Takibi
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, ball.position.y + 12, 0.1);
        camera.lookAt(0, ball.position.y - 5, 0);

        if(layers.filter(l => l.userData.active).length === 0) winLevel();
    }

    renderer.render(scene, camera);
}

function checkCollision() {
    for(let i=0; i<layers.length; i++) {
        const l = layers[i];
        if(l.userData.active && Math.abs(ball.position.y - l.position.y) < 1.0) {
            if(l.userData.fatal) return die();
            
            // BLOK KIRILMA (Hızlı ve Tatmin Edici)
            l.userData.active = false;
            explodeLayer(l);
            state.score += 10;
            document.getElementById('cur-score').innerText = state.score;
        }
    }
}

function explodeLayer(layer) {
    // Katmanı sahneden kaldırmak yerine parçalanma efekti veriyoruz
    const frag = layer.clone();
    frag.userData = { vx: (Math.random() - 0.5) * 0.5 };
    scene.remove(layer);
    scene.add(frag);
    fragments.push(frag);
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
    state.lvl++;
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

function updateUI() {
    document.getElementById('cur-lvl').innerText = state.lvl;
    document.getElementById('global-bal').innerText = state.bal;
}

// Navigasyon ve Kontroller (Sadece oyun alanında çalışır)
const canvasArea = document.getElementById('canvas-container');
canvasArea.addEventListener('mousedown', () => isDown = true);
window.addEventListener('mouseup', () => isDown = false);
canvasArea.addEventListener('touchstart', (e) => { isDown = true; e.preventDefault(); }, {passive: false});
window.addEventListener('touchend', () => isDown = false);

function nav(id, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if(el) el.classList.add('active');
    sectionActive = (id === 'game');
}
