import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('canvas');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const endScreen = document.getElementById('endScreen');
const restartButton = document.getElementById('restartButton');
const finalScore = document.getElementById('finalScore');
const finalHits = document.getElementById('finalHits');
const scoreEl = document.getElementById('score');
const hitsEl = document.getElementById('hits');
const arrowsEl = document.getElementById('arrowsLeft');
const shotInfo = document.getElementById('shotInfo');
const shotValue = document.getElementById('shotValue');
const crosshair = document.getElementById('crosshair');
const movingCheckbox = document.getElementById('movingTargetCheckbox');
const endMovingCheckbox = document.getElementById('endMovingTargetCheckbox');
const highscoreList = document.getElementById('highscoreList');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7f9a86);
scene.fog = new THREE.Fog(0x7f9a86, 30, 95);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 1.8, 8);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

scene.add(new THREE.HemisphereLight(0xdce5d9, 0x30402f, 1.2));
const sun = new THREE.DirectionalLight(0xfff4dc, 1.1);
sun.position.set(8, 15, 6);
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ color: 0x4f6044 }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

for (let i = 0; i < 65; i++) {
  const tree = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.2, 7), new THREE.MeshStandardMaterial({ color: 0x2a3a30 }));
  const side = i % 2 ? 1 : -1;
  tree.position.set(side * (12 + Math.random() * 18), 1.35, -14 - Math.random() * 65);
  scene.add(tree);
}

const target = new THREE.Group();
target.position.set(0, 1.8, -35);
scene.add(target);

const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.4, 10), new THREE.MeshStandardMaterial({ color: 0x5a4a34 }));
stand.position.y = -1.55;
target.add(stand);

const colors = [0xece8d7, 0xc93f34, 0x20272a, 0xece8d7, 0xd5a73a, 0xc93f34];
const radii = [2.4, 2.0, 1.52, 1.08, 0.58, 0.25];
for (let i = 0; i < radii.length; i++) {
  const ring = new THREE.Mesh(new THREE.CircleGeometry(radii[i], 64), new THREE.MeshStandardMaterial({ color: colors[i], side: THREE.DoubleSide }));
  ring.position.z = i * 0.004;
  target.add(ring);
}

const bow = new THREE.Group();
bow.position.set(0, 1.55, 4.65);
scene.add(bow);

const bowCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 1.08, 0), new THREE.Vector3(0.48, 0.55, 0),
  new THREE.Vector3(0.62, 0, 0), new THREE.Vector3(0.48, -0.55, 0),
  new THREE.Vector3(0, -1.08, 0)
]);
bow.add(new THREE.Mesh(new THREE.TubeGeometry(bowCurve, 40, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0x5b321a })));

const stringLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xdacda2 }));
bow.add(stringLine);

const hand = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 16), new THREE.MeshStandardMaterial({ color: 0x8b5b3d }));
bow.add(hand);

const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 1.35, 7, 12), new THREE.MeshStandardMaterial({ color: 0x2c332d }));
arm.rotation.z = Math.PI / 2;
arm.position.set(-0.8, -0.62, -0.03);
bow.add(arm);

function makeArrow() {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.25, 12), new THREE.MeshStandardMaterial({ color: 0xe8da9b }));
  shaft.rotation.z = Math.PI / 2;
  group.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.26, 10), new THREE.MeshStandardMaterial({ color: 0xf3f7ff, metalness: 0.7 }));
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = 0.72;
  group.add(tip);
  const feather = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.16), new THREE.MeshStandardMaterial({ color: 0xff5b57, side: THREE.DoubleSide }));
  feather.position.set(-0.56, 0.09, 0);
  group.add(feather);
  group.scale.setScalar(1.35);
  return group;
}

const loadedArrow = makeArrow();
bow.add(loadedArrow);

const birds = [];
function makeBird(index) {
  const bird = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshStandardMaterial({ color: 0x4b5a68 }));
  body.scale.set(1.25, 0.75, 0.8);
  bird.add(body);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x71808c, side: THREE.DoubleSide });
  const left = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 3), wingMat);
  const right = left.clone();
  left.position.x = -0.38;
  right.position.x = 0.38;
  left.rotation.z = Math.PI * 0.62;
  right.rotation.z = -Math.PI * 0.62;
  bird.add(left, right);
  bird.scale.setScalar(2);
  bird.userData = { left, right, falling: false, fallSpeed: 0, respawn: 0 };
  scene.add(bird);
  birds.push(bird);
}
for (let i = 0; i < 5; i++) makeBird(i);

let started = false, aiming = false, gameEnded = false;
let drawStart = 0, power = 0, score = 0, hits = 0, arrowsLeft = 5;
let finishTimer = null;
let birdsEnabled = false, birdTime = 0, targetTime = 0;
let arrows = [], markers = [];
const aimPoint = new THREE.Vector3(0, 1.8, -35);
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function updateBow() {
  bow.visible = arrowsLeft > 0;
  if (!bow.visible) return;
  bow.traverse(o => { if (o.material) { o.material.transparent = aiming; o.material.opacity = aiming ? 0.22 : 1; } });
  const pull = aiming ? THREE.MathUtils.lerp(0.04, 0.58, power / 100) : 0.04;
  stringLine.geometry.dispose();
  stringLine.geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 1.08, 0), new THREE.Vector3(-pull, 0, 0), new THREE.Vector3(0, -1.08, 0)
  ]);
  bow.lookAt(aimPoint);
  bow.rotateY(-Math.PI / 2);
  hand.position.set(-pull, 0, 0);
  loadedArrow.position.set(0.56 - pull, 0, 0);
}

function updateAim(e) {
  ndc.x = e.clientX / innerWidth * 2 - 1;
  ndc.y = -(e.clientY / innerHeight * 2 - 1);
  raycaster.setFromCamera(ndc, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 35);
  const p = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, p);
  aimPoint.set(THREE.MathUtils.clamp(p.x, -12, 12), THREE.MathUtils.clamp(p.y, -1, 8.5), -35);
}

function shoot() {
  const mesh = makeArrow();
  scene.add(mesh);
  const pos = new THREE.Vector3();
  loadedArrow.getWorldPosition(pos);
  const dir = aimPoint.clone().sub(pos).normalize();
  arrows.push({ mesh, pos: pos.clone(), vel: dir.multiplyScalar(36 + power * 0.42), stuck: false });
}

function addMarker(pos) {
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.14, 0.28, 24), new THREE.MeshBasicMaterial({ color: 0x86ff67, side: THREE.DoubleSide, depthTest: false }));
  marker.position.set(pos.x, pos.y, -34.86);
  scene.add(marker);
  markers.push(marker);
}

function updateBirds(dt) {
  if (!started || gameEnded) { birds.forEach(b => b.visible = false); return; }
  birdTime += dt;
  birds.forEach((bird, i) => {
    if (bird.userData.falling) {
      bird.userData.fallSpeed += 9 * dt;
      bird.position.y -= bird.userData.fallSpeed * dt;
      bird.rotation.z += 5 * dt;
      if (bird.position.y < -0.1) {
        bird.position.y = -0.1;
        bird.userData.falling = false;
        bird.userData.respawn = 4;
        bird.visible = false;
      }
      return;
    }
    if (bird.userData.respawn > 0) {
      bird.userData.respawn -= dt;
      bird.visible = false;
      return;
    }
    bird.visible = birdsEnabled;
    if (!birdsEnabled) return;
    bird.rotation.z = 0;
    const lane = i % 2 ? -1 : 1;
    const x = lane * (((birdTime * (0.9 + i * 0.12) + i * 7) % 24) - 12);
    bird.position.set(x, 4.3 + (i % 3) * 1.15 + Math.sin(birdTime * 0.8 + i) * 0.22, -26 - i * 0.6);
    const flap = Math.sin(birdTime * 3.5 + i) * 0.32;
    bird.userData.left.rotation.z = Math.PI * 0.62 + flap;
    bird.userData.right.rotation.z = -Math.PI * 0.62 - flap;
  });
}

function updateArrows(dt) {
  arrows = arrows.filter(a => {
    if (a.stuck) return true;
    a.vel.y -= 12 * dt;
    a.pos.addScaledVector(a.vel, dt);
    a.mesh.position.copy(a.pos);
    if (a.vel.lengthSq()) {
      const look = a.pos.clone().add(a.vel);
      a.mesh.lookAt(look);
      a.mesh.rotateY(Math.PI / 2);
    }
    if (birdsEnabled) {
      for (const bird of birds) {
        if (!bird.visible) continue;
        if (bird.position.distanceTo(a.pos) < 0.85) {
          bird.userData.falling = true;
          bird.userData.fallSpeed = 0;
          addMarker(a.pos);
          score += 100;
          hits++;
          scoreEl.textContent = score;
          hitsEl.textContent = hits;
          scene.remove(a.mesh);
          return false;
        }
      }
    }
    if (a.pos.z <= -35) {
      const d = Math.hypot(a.pos.x - target.position.x, a.pos.y - target.position.y);
      if (!birdsEnabled && d < 2.4) {
        a.stuck = true;
        a.pos.z = -34.92;
        a.mesh.position.copy(a.pos);
        if (d <= 0.25) score += 60;
        else if (d <= 0.58) score += 50;
        else if (d <= 1.08) score += 40;
        else if (d <= 1.52) score += 30;
        else if (d <= 2) score += 20;
        else score += 10;
        hits++;
        scoreEl.textContent = score;
        hitsEl.textContent = hits;
        addMarker(a.pos);
        return true;
      }
      scene.remove(a.mesh);
      return false;
    }
    if (a.pos.y < -3) { scene.remove(a.mesh); return false; }
    return true;
  });
}

function finishGame() {
  if (gameEnded) return;

  gameEnded = true;
  const highscores = saveHighscore(score, hits);
  renderHighscores(highscores);
  finalScore.textContent = `${score} poäng`;
  finalHits.textContent = `${hits} träffar`;
  endScreen.classList.remove('hidden');
  document.body.classList.add('menu');
}

let last = performance.now();
function animate(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (aiming) { power = Math.min(100, (now - drawStart) / 14); shotValue.textContent = Math.round(power); }
  updateBow();
  target.visible = !birdsEnabled;
  targetTime += dt;
  if (birdsEnabled) target.position.set(0, 1.8, -35);
  updateBirds(dt);
  updateArrows(dt);
  if (arrowsLeft === 0 && !aiming && !gameEnded && arrows.every(a => a.stuck)) {
    finishGame();
  }
  camera.lookAt(0, 1.8, -35);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
window.addEventListener('mousemove', e => { updateAim(e); crosshair.style.left = e.clientX + 'px'; crosshair.style.top = e.clientY + 'px'; crosshair.style.opacity = started ? 1 : 0; });
window.addEventListener('mousedown', e => { if (started && e.button === 0 && !aiming && arrowsLeft > 0) { aiming = true; drawStart = performance.now(); shotInfo.classList.add('visible'); } });
window.addEventListener('mouseup', e => {
  if (!aiming || e.button !== 0) return;
  aiming = false;
  shotInfo.classList.remove('visible');
  shoot();
  arrowsLeft--;
  arrowsEl.textContent = arrowsLeft;
  power = 0;
  shotValue.textContent = 0;

  if (arrowsLeft === 0) {
    clearTimeout(finishTimer);
    finishTimer = setTimeout(finishGame, 300);
  }
});

startButton.addEventListener('click', () => {
  birdsEnabled = movingCheckbox.checked;
  started = true;
  document.body.classList.remove('menu');
  startScreen.classList.add('hidden');
});

restartButton.addEventListener('click', () => {
  clearTimeout(finishTimer);
  finishTimer = null;
  birdsEnabled = endMovingCheckbox.checked;
  movingCheckbox.checked = birdsEnabled;
  endMovingCheckbox.checked = birdsEnabled;
  score = 0; hits = 0; arrowsLeft = 5; gameEnded = false; aiming = false;
  scoreEl.textContent = 0; hitsEl.textContent = 0; arrowsEl.textContent = 5;
  arrows.forEach(a => scene.remove(a.mesh)); arrows = [];
  markers.forEach(m => scene.remove(m)); markers = [];
  birds.forEach(b => { b.visible = false; b.userData.falling = false; b.userData.respawn = 0; b.rotation.z = 0; });
  camera.position.set(0, 1.8, 8);
  bow.visible = true;
  endScreen.classList.add('hidden');
  started = true;
  document.body.classList.remove('menu');
  crosshair.style.opacity = 1;
});

movingCheckbox.addEventListener('change', e => { birdsEnabled = e.target.checked; endMovingCheckbox.checked = birdsEnabled; });
endMovingCheckbox.addEventListener('change', e => { birdsEnabled = e.target.checked; movingCheckbox.checked = birdsEnabled; });

const HIGHSCORE_KEY = 'skjutapil2_highscores_v1';
const HIGHSCORE_LIMIT = 5;

function loadHighscores() {
  try {
    const raw = localStorage.getItem(HIGHSCORE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(item => item && Number.isFinite(item.score) && Number.isFinite(item.hits))
      .sort((a, b) => b.score - a.score || b.hits - a.hits)
      .slice(0, HIGHSCORE_LIMIT);
  } catch {
    return [];
  }
}

function saveHighscore(finalScore, finalHits) {
  const highscores = loadHighscores();
  highscores.push({
    score: finalScore,
    hits: finalHits,
    date: new Date().toISOString()
  });

  highscores.sort((a, b) => b.score - a.score || b.hits - a.hits);
  const trimmed = highscores.slice(0, HIGHSCORE_LIMIT);

  try {
    localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(trimmed));
  } catch {
    // Spelet fungerar även om webbläsaren inte tillåter lokal lagring.
  }

  return trimmed;
}

function renderHighscores(list = loadHighscores()) {
  highscoreList.innerHTML = '';

  if (!list.length) {
    const li = document.createElement('li');
    li.textContent = 'Ingen highscore ännu';
    highscoreList.appendChild(li);
    return;
  }

  list.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.score} p (${item.hits} träffar)`;
    highscoreList.appendChild(li);
  });
}

document.body.classList.add('menu');
renderHighscores();
renderer.render(scene, camera);
requestAnimationFrame(animate);
