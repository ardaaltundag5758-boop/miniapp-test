/**
 * 3D STACK BALL ENGINE - VIDEO BIREBIR GAME FIX
 */

const tg = window.Telegram.WebApp;
tg.expand();

let state = {
    bal: parseInt(localStorage.getItem('f_bal')) || 0,
    lvl: 1,
    score: 0,
    friends: JSON.parse(localStorage.getItem('f_friends')) || [],
    tasks: JSON.parse(localStorage.getItem('f_done_tasks')) || []
};

let scene, camera, renderer, ball, pole;
let layers = [], fragments = [];

let isDown = false;
let gameActive = false;
let sectionActive = true;

// fizik (videoya yakin)
let velocity = 0;
const gravity = 0.015;
const bounceForce = 0.35;
const crushForce = 0.9;
const gap = 2.4;
const startY = 10;

const palettes = [
    ['#ff9a9e', '#fad0c4'],
    ['#a18cd1', '#fbc2eb'],
    ['#84fab0', '#8fd3f4'],
    ['#fccb90', '#d57eeb']
];

window.onload = () => {
    init3D();
};

function init3D() {
    const cont = document.getElementById('canvas-container');

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        45,
        cont.clientWidth / cont.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 14, 18);
    camera.lookAt(0, 4, 0);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(cont.clientWidth, cont.clientHeight);
    cont.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 10, 5);
    scene.add(dir);

    pole = new THREE.Mesh(
        new THREE.CylinderGeometry(1.7, 1.7, 200, 32),
        new THREE.MeshPhongMaterial({ color: 0xffffff })
    );
    scene.add(pole);

    ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 32, 32),
        new THREE.MeshPhongMaterial({ color: 0xffffff })
    );
    scene.add(ball);

    buildLevel();
    animate();
}

function buildLevel() {
    layers.forEach(l => scene.remove(l));
    layers = [];

    const bg = palettes[(state.lvl - 1) % palettes.length];
    document.getElementById('page-game').style.background =
        `linear-gradient(to bottom, ${bg[0]}, ${bg[1]})`;

    ball.position.set(0, startY, 2.8);
    velocity = 0;

    const total = 28 + state.lvl * 2;

    for (let i = 0; i < total; i++) {
        const fatal = i > 4 && Math.random() < 0.22 && i < total - 2;
        const block = new THREE.Mesh(
            new THREE.BoxGeometry(7, 0.6, 7),
            new THREE.MeshPhongMaterial({
                color: fatal ? 0x000000 : new THREE.Color(bg[1])
            })
        );
        block.position.y = startY - i * gap;
        block.userData.fatal = fatal;
        scene.add(block);
        layers.push(block);
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (!sectionActive) return;

    // parçalar
    fragments.forEach((f, i) => {
        f.position.add(f.userData.vel);
        f.userData.vel.y -= 0.05;
        f.rotation.x += 0.1;
        f.rotation.z += 0.1;
        if (f.position.y < -30) {
            scene.remove(f);
            fragments.splice(i, 1);
        }
    });

    if (gameActive) {
        if (isDown) {
            velocity = crushForce;
        } else {
            velocity -= gravity;
        }

        ball.position.y -= velocity;

        layers.forEach((l, i) => {
            if (
                Math.abs(ball.position.y - l.position.y) < 0.6 &&
                velocity > 0
            ) {
                if (l.userData.fatal) {
                    gameOver();
                } else {
                    breakLayer(l, i);
                    velocity = -bounceForce;
                }
            }
        });

        if (!layers.length) levelWin();
    }

    renderer.render(scene, camera);
}

function breakLayer(layer, index) {
    scene.remove(layer);
    layers.splice(index, 1);

    const frag = layer.clone();
    frag.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        -0.6,
        (Math.random() - 0.5) * 0.5
    );
    fragments.push(frag);
    scene.add(frag);
}

function startGame() {
    document.getElementById('game-start-ui').style.display = 'none';
    gameActive = true;
}

function gameOver() {
    gameActive = false;
    isDown = false;
    document.getElementById('game-over').style.display = 'flex';
}

function levelWin() {
    gameActive = false;
    spawnConfetti();
    setTimeout(() => {
        state.lvl++;
        buildLevel();
        document.getElementById('game-start-ui').style.display = 'flex';
    }, 1800);
}

function spawnConfetti() {
    for (let i = 0; i < 25; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.background = ['#ff0', '#0ff', '#f0f'][Math.floor(Math.random() * 3)];
        document.getElementById('page-game').appendChild(c);
        c.animate(
            [{ transform: 'translateY(0)' }, { transform: 'translateY(100vh)' }],
            { duration: 2000 }
        ).onfinish = () => c.remove();
    }
}

// input sadece canvas
const canvas = document.getElementById('canvas-container');
canvas.addEventListener('pointerdown', () => gameActive && (isDown = true));
window.addEventListener('pointerup', () => (isDown = false));
