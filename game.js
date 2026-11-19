import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('canvas');
const crosshair = document.getElementById('crosshair');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const scoreEl = document.getElementById('score');
const hitsEl = document.getElementById('hits');
const arrowsLeftEl = document.getElementById('arrowsLeft');
const highscoreListEl = document.getElementById('highscoreList');
const shotInfo = document.getElementById('shotInfo');
const shotValue = document.getElementById('shotValue');
const endScreen = document.getElementById('endScreen');
const restartButton = document.getElementById('restartButton');
const finalScoreEl = document.getElementById('finalScore');
const finalHitsEl = document.getElementById('finalHits');
const movingTargetCheckbox = document.getElementById('movingTargetCheckbox');
const endMovingTargetCheckbox = document.getElementById('endMovingTargetCheckbox');

const HIGHSCORE_KEY = 'skjutapil2_highscores_v1';
const HIGHSCORE_LIMIT = 5;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7f9a86);
scene.fog = new THREE.Fog(0x7f9a86, 30, 95);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.8, 8);
camera.lookAt(0, 1.8, -35);

const baseCameraPos = new THREE.Vector3(0, 1.8, 8);
const zoomCameraPos = new THREE.Vector3(0, 1.9, 1.8);
const baseLookAt = new THREE.Vector3(0, 1.8, -35);
const zoomLookAt = new THREE.Vector3(0, 1.8, -35);
const cameraLookAtCurrent = baseLookAt.clone();
const baseFov = 65;
const zoomFov = 42;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const hemi = new THREE.HemisphereLight(0xdce5d9, 0x2f382d, 1.05);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff4dc, 1.2);
sun.position.set(8, 15, 6);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 240),
  new THREE.MeshStandardMaterial({ color: 0x4f6044, roughness: 0.95, metalness: 0.02 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
scene.add(ground);

const treeMat = new THREE.MeshStandardMaterial({ color: 0x2a3a30, roughness: 0.98 });
for (let i = 0; i < 90; i += 1) {
  const tree = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.2, 7), treeMat);
  const side = i % 2 === 0 ? -1 : 1;
  tree.position.set((12 + Math.random() * 18) * side, 1.35, -14 - Math.random() * 70);
  scene.add(tree);
}

const targetGroup = new THREE.Group();
targetGroup.position.set(0, 1.8, -35);
scene.add(targetGroup);

const stand = new THREE.Mesh(
  new THREE.CylinderGeometry(0.14, 0.14, 3.4, 10),
  new THREE.MeshStandardMaterial({ color: 0x5a4a34, roughness: 0.92 })
);
stand.position.y = -1.55;
targetGroup.add(stand);

const shadowPlate = new THREE.Mesh(
  new THREE.CircleGeometry(2.48, 40),
  new THREE.MeshStandardMaterial({ color: 0x30291f, roughness: 1, side: THREE.DoubleSide })
);
shadowPlate.position.z = -0.06;
targetGroup.add(shadowPlate);

const ringRadii = [2.4, 2.0, 1.52, 1.08, 0.58, 0.25];
const ringColors = [0xece8d7, 0xc93f34, 0x20272a, 0xece8d7, 0xd5a73a, 0xc93f34];
for (let i = 0; i < ringRadii.length; i += 1) {
  const ring = new THREE.Mesh(
    new THREE.CircleGeometry(ringRadii[i], 64),
    new THREE.MeshStandardMaterial({ color: ringColors[i], roughness: 0.7, metalness: 0.05 })
  );
  ring.position.z = i * 0.004;
  targetGroup.add(ring);
}

const bowGroup = new THREE.Group();
bowGroup.position.set(0, 1.55, 4.65);
scene.add(bowGroup);

const bowCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 1.08, 0),
  new THREE.Vector3(0.48, 0.55, 0),
  new THREE.Vector3(0.62, 0, 0),
  new THREE.Vector3(0.48, -0.55, 0),
  new THREE.Vector3(0, -1.08, 0)
]);

const bowMesh = new THREE.Mesh(
  new THREE.TubeGeometry(bowCurve, 42, 0.06, 14, false),
  new THREE.MeshStandardMaterial({ color: 0x5b321a, roughness: 0.82 })
);
bowGroup.add(bowMesh);

const stringGeom = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 1.08, 0),
  new THREE.Vector3(0, 0, -0.1),
  new THREE.Vector3(0, -1.08, 0)
]);
const stringLine = new THREE.Line(stringGeom, new THREE.LineBasicMaterial({ color: 0xdacda2 }));
bowGroup.add(stringLine);

const handMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.19, 18, 18),
  new THREE.MeshStandardMaterial({ color: 0x8b5b3d, roughness: 0.85 })
);
bowGroup.add(handMesh);

const armMesh = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.17, 1.35, 7, 14),
  new THREE.MeshStandardMaterial({ color: 0x2c332d, roughness: 0.95 })
);
armMesh.rotation.z = Math.PI * 0.5;
armMesh.position.set(-0.8, -0.62, -0.03);
bowGroup.add(armMesh);

const loadedArrow = buildArrowMesh();
bowGroup.add(loadedArrow);

const targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 35);
const raycaster = new THREE.Raycaster();
const mouseNdc = new THREE.Vector2(0, 0);
const aimPoint = new THREE.Vector3(0, 1.8, -35);

let started = false;
let aiming = false;
let drawStart = 0;
let power = 0;
let score = 0;
let hits = 0;
let arrowsLeft = 5;
let arrows = [];
let impactMarkers = [];
let zoomProgress = 0;
let gameEnded = false;
let targetMotionTime = 0;
const targetMotionCenter = new THREE.Vector3(0, 1.8, -35);
let birdsEnabled = false;
let birdMotionTime = 0;

const birds = [];

function createBird(index) {
  const bird = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x4b5a68, roughness: 0.8 })
  );
  body.scale.set(1.25, 0.75, 0.8);
  bird.add(body);

  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0x71808c,
    roughness: 0.75,
    side: THREE.DoubleSide
  });

  const leftWing = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 3), wingMaterial);
  leftWing.position.set(-0.38, 0.08, 0);
  leftWing.rotation.z = Math.PI * 0.62;

  const rightWing = leftWing.clone();
  rightWing.position.x = 0.38;
  rightWing.rotation.z = -Math.PI * 0.62;

  bird.add(leftWing, rightWing);
  bird.scale.setScalar(2);
  bird.userData = { index, leftWing, rightWing, active: false, cooldown: 0, falling: false, fallSpeed: 0, respawnIn: 0 };
  scene.add(bird);
  birds.push(bird);
}

for (let i = 0; i < 5; i += 1) createBird(i);

function buildArrowMesh() {
  const group = new THREE.Group();

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 1.25, 12),
    new THREE.MeshStandardMaterial({ color: 0xe8da9b, roughness: 0.45, metalness: 0.05, emissive: 0x2a2208, emissiveIntensity: 0.35 })
  );
  shaft.rotation.z = Math.PI * 0.5;
  group.add(shaft);

  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.065, 0.26, 10),
    new THREE.MeshStandardMaterial({ color: 0xf3f7ff, metalness: 0.75, roughness: 0.22, emissive: 0x0f1218, emissiveIntensity: 0.2 })
  );
  tip.rotation.z = -Math.PI * 0.5;
  tip.position.x = 0.72;
  group.add(tip);

  const featherMat = new THREE.MeshStandardMaterial({ color: 0xff5b57, roughness: 0.35, metalness: 0.05, emissive: 0x2a0504, emissiveIntensity: 0.35, side: THREE.DoubleSide });
  const feather1 = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.16), featherMat);
  feather1.position.set(-0.56, 0.09, 0);
  const feather2 = feather1.clone();
  feather2.rotation.x = Math.PI * 0.5;
  const feather3 = feather1.clone();
  feather3.rotation.x = -Math.PI * 0.5;
  feather3.position.y = -0.09;
  group.add(feather1, feather2, feather3);

  group.scale.setScalar(1.35);

  return group;
}

function updateBowVisuals() {
  bowGroup.visible = arrowsLeft > 0;
  if (!bowGroup.visible) return;

  setBowOpacity(aiming ? 0.22 : 0.9);

  const pull = aiming ? THREE.MathUtils.lerp(0.04, 0.58, power / 100) : 0.04;
  const points = [
    new THREE.Vector3(0, 1.08, 0),
    new THREE.Vector3(-pull, 0, 0),
    new THREE.Vector3(0, -1.08, 0)
  ];
  stringLine.geometry.setFromPoints(points);

  // Modellens pil är byggd längs +X. lookAt riktar -Z mot mål,
  // därför vrider vi 90° så att bågen/pilen verkligen pekar mot tavlan.
  bowGroup.lookAt(aimPoint);
  bowGroup.rotateY(-Math.PI / 2);

  handMesh.position.set(-pull, 0, 0);
  loadedArrow.position.set(0.56 - pull, 0, 0);
}

function updateAimFromMouse(clientX, clientY) {
  mouseNdc.x = (clientX / window.innerWidth) * 2 - 1;
  mouseNdc.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouseNdc, camera);
  const hitPoint = new THREE.Vector3();
  raycaster.ray.intersectPlane(targetPlane, hitPoint);

  hitPoint.x = THREE.MathUtils.clamp(hitPoint.x, -12.0, 12.0);
  hitPoint.y = THREE.MathUtils.clamp(hitPoint.y, -1.0, 8.5);
  hitPoint.z = -35;
  aimPoint.copy(hitPoint);
}

function spawnArrow() {
  const mesh = buildArrowMesh();
  scene.add(mesh);

  const releasePoint = new THREE.Vector3();
  loadedArrow.getWorldPosition(releasePoint);
  const dir = new THREE.Vector3().subVectors(aimPoint, releasePoint).normalize();

  const velocity = 36 + power * 0.42;
  arrows.push({
    mesh,
    pos: releasePoint.clone(),
    vel: dir.multiplyScalar(velocity),
    stuck: false
  });
}

function scoreForDistance(distance) {
  if (distance <= ringRadii[5]) return 60;
  if (distance <= ringRadii[4]) return 50;
  if (distance <= ringRadii[3]) return 40;
  if (distance <= ringRadii[2]) return 30;
  if (distance <= ringRadii[1]) return 20;
  if (distance <= ringRadii[0]) return 10;
  return 0;
}

function loadHighscores() {
  try {
    const raw = localStorage.getItem(HIGHSCORE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => Number.isFinite(item.score) && Number.isFinite(item.hits));
  } catch {
    return [];
  }
}

function saveHighscore(finalScore, finalHits) {
  const highscores = loadHighscores();
  highscores.push({ score: finalScore, hits: finalHits, date: new Date().toISOString() });
  highscores.sort((a, b) => b.score - a.score || b.hits - a.hits);
  const trimmed = highscores.slice(0, HIGHSCORE_LIMIT);
  localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

function renderHighscores(list = loadHighscores()) {
  highscoreListEl.innerHTML = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.textContent = 'Ingen highscore ännu';
    highscoreListEl.appendChild(li);
    return;
  }

  list.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.score} p (${item.hits} träffar)`;
    highscoreListEl.appendChild(li);
  });
}

function addImpactMarker(position, isHit) {
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.14, 0.28, 24),
    new THREE.MeshBasicMaterial({
      color: isHit ? 0x86ff67 : 0xff5a42,
      transparent: false,
      side: THREE.DoubleSide,
      depthTest: false
    })
  );

  marker.renderOrder = 20;
  marker.position.copy(position);
  marker.position.z = -34.86;
  scene.add(marker);

  impactMarkers.push({ mesh: marker, life: 999999, maxLife: 999999 });
}

function updateImpactMarkers(dt) {
  impactMarkers = impactMarkers.filter((item) => {
    item.life -= dt;

    if (item.life <= 0) {
      scene.remove(item.mesh);
      item.mesh.geometry.dispose();
      item.mesh.material.dispose();
      return false;
    }
    return true;
  });
}

function updateCameraZoom(dt) {
  const zoomTarget = arrowsLeft <= 0 ? 1 : 0;
  const smoothing = Math.min(1, dt * 3.5);
  zoomProgress = THREE.MathUtils.lerp(zoomProgress, zoomTarget, smoothing);

  camera.position.lerpVectors(baseCameraPos, zoomCameraPos, zoomProgress);
  cameraLookAtCurrent.lerpVectors(baseLookAt, zoomLookAt, zoomProgress);
  camera.lookAt(cameraLookAtCurrent);
  camera.fov = THREE.MathUtils.lerp(baseFov, zoomFov, zoomProgress);
  camera.updateProjectionMatrix();
}

function updateArrows(dt) {
  const gravity = new THREE.Vector3(0, -12, 0);

  arrows = arrows.filter((arrow) => {
    if (arrow.stuck) return true;

    arrow.vel.addScaledVector(gravity, dt);
    arrow.pos.addScaledVector(arrow.vel, dt);

    if (arrow.vel.lengthSq() > 0.0001) {
      const look = new THREE.Vector3().copy(arrow.pos).add(arrow.vel);
      arrow.mesh.position.copy(arrow.pos);
      arrow.mesh.lookAt(look);
      arrow.mesh.rotateY(Math.PI * 0.5);

      if (birdsEnabled) {
        for (const bird of birds) {
          if (!bird.visible) continue;
          if (bird.position.distanceTo(arrow.pos) < 0.85) {
            bird.userData.falling = true;
            bird.userData.fallSpeed = 0;
            bird.userData.respawnIn = 0;
            bird.visible = true;
            addImpactMarker(arrow.pos, true);
            score += 100;
            hits += 1;
            scoreEl.textContent = String(score);
            hitsEl.textContent = String(hits);
            scene.remove(arrow.mesh);
            return false;
          }
        }
      }
    }

    if (arrow.pos.z <= -35) {
      const dx = arrow.pos.x - targetGroup.position.x;
      const dy = arrow.pos.y - targetGroup.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const hit = distance <= ringRadii[0];

      addImpactMarker(arrow.pos, hit);

      if (hit) {
        const normal = new THREE.Vector3(0, 0, 1);
        arrow.stuck = true;
        arrow.pos.z = -34.92;
        arrow.mesh.position.copy(arrow.pos);
        arrow.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), normal);

        const points = scoreForDistance(distance);
        score += points;
        hits += 1;
        scoreEl.textContent = String(score);
        hitsEl.textContent = String(hits);
        return true;
      }

      scene.remove(arrow.mesh);
      return false;
    }

    if (arrow.pos.y < -3 || arrow.pos.length() > 180) {
      scene.remove(arrow.mesh);
      return false;
    }

    return true;
  });

  if (arrowsLeft <= 0 && !aiming && !gameEnded) {
    const arrowStillFlying = arrows.some((arrow) => !arrow.stuck);
    if (!arrowStillFlying) {
      gameEnded = true;
      const savedScores = saveHighscore(score, hits);
      renderHighscores(savedScores);
      finalScoreEl.textContent = `${score} poäng`;
      finalHitsEl.textContent = `${hits} träffar`;
      endScreen.classList.remove('hidden');
      document.body.classList.add('menu');
    }
  }
}

function updateMovingTarget(dt) {
  targetGroup.position.copy(targetMotionCenter);
  targetGroup.visible = !birdsEnabled;

  if (!started || gameEnded) {
    birds.forEach((bird) => { bird.visible = false; });
    return;
  }

  birdMotionTime += dt;

  birds.forEach((bird, index) => {
    if (bird.userData.cooldown > 0) {
      bird.userData.cooldown -= dt;
      bird.visible = false;
      return;
    }

    if (bird.userData.falling) {
      bird.userData.fallSpeed += 4.5 * dt;
      bird.position.y -= bird.userData.fallSpeed * dt;
      bird.rotation.z += 5.5 * dt;

      if (bird.position.y <= -0.1) {
        bird.position.y = -0.1;
        bird.userData.falling = false;
        bird.userData.respawnIn = 4;
        bird.visible = false;
      }
      return;
    }

    if (bird.userData.respawnIn > 0) {
      bird.userData.respawnIn -= dt;
      bird.visible = false;
      return;
    }

    bird.visible = birdsEnabled;
    if (!birdsEnabled) return;

    bird.rotation.z = 0;
    const lane = index % 2 === 0 ? 1 : -1;
    const speed = 0.9 + index * 0.12;
    const distance = birdMotionTime * speed + index * 7;

    let x = ((distance % 24) - 12) * lane;
    if (lane < 0) x = -x;

    bird.position.set(
      x,
      4.3 + (index % 3) * 1.15 + Math.sin(birdMotionTime * 0.8 + index) * 0.22,
      -26 - index * 0.6
    );
    bird.rotation.y = lane > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;

    const wingPhase = Math.sin(birdMotionTime * 3.5 + index);
    bird.userData.leftWing.rotation.z = Math.PI * 0.62 + wingPhase * 0.32;
    bird.userData.rightWing.rotation.z = -Math.PI * 0.62 - wingPhase * 0.32;
  });
}

let lastTime = performance.now();
function animate(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  if (aiming) {
    power = Math.min(100, (now - drawStart) / 14);
    shotValue.textContent = String(Math.round(power));
  }

  updateBowVisuals();
  updateMovingTarget(dt);
  updateArrows(dt);
  updateImpactMarkers(dt);
  updateCameraZoom(dt);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('mousemove', (e) => {
  crosshair.style.left = `${e.clientX}px`;
  crosshair.style.top = `${e.clientY}px`;
  crosshair.style.opacity = started ? '1' : '0';
  updateAimFromMouse(e.clientX, e.clientY);
});

window.addEventListener('mousedown', (e) => {
  if (!started || e.button !== 0 || aiming || arrowsLeft <= 0) return;
  aiming = true;
  drawStart = performance.now();
  shotInfo.classList.add('visible');
});

window.addEventListener('mouseup', (e) => {
  if (!started || e.button !== 0 || !aiming || arrowsLeft <= 0) return;
  aiming = false;
  shotInfo.classList.remove('visible');
  spawnArrow();
  arrowsLeft -= 1;
  arrowsLeftEl.textContent = String(arrowsLeft);

  power = 0;
  shotValue.textContent = '0';
});

restartButton.addEventListener('click', () => {
  birdsEnabled = endMovingTargetCheckbox.checked;
  aiming = false;
  power = 0;
  score = 0;
  hits = 0;
  arrowsLeft = 5;
  zoomProgress = 0;
  gameEnded = false;
  targetMotionTime = 0;
  targetGroup.position.copy(targetMotionCenter);

  arrows.forEach((arrow) => scene.remove(arrow.mesh));
  arrows = [];
  impactMarkers.forEach((item) => scene.remove(item.mesh));
  impactMarkers = [];

  scoreEl.textContent = '0';
  hitsEl.textContent = '0';
  arrowsLeftEl.textContent = '5';
  shotValue.textContent = '0';

  camera.position.copy(baseCameraPos);
  cameraLookAtCurrent.copy(baseLookAt);
  camera.lookAt(cameraLookAtCurrent);
  camera.fov = baseFov;
  camera.updateProjectionMatrix();

  bowGroup.visible = true;
  endScreen.classList.add('hidden');
  started = true;
  document.body.classList.remove('menu');
  startScreen.classList.add('hidden');

  targetMotionTime = 0;
  birdMotionTime = 0;
  birds.forEach((bird) => {
    bird.visible = birdsEnabled;
    bird.userData.cooldown = 0;
    bird.userData.falling = false;
    bird.userData.fallSpeed = 0;
    bird.userData.respawnIn = 0;
    bird.rotation.z = 0;
  });
});

document.body.classList.add('menu');

startButton.addEventListener('click', () => {
  birdsEnabled = movingTargetCheckbox.checked;
  targetMotionTime = 0;
  birdMotionTime = 0;
  targetGroup.position.copy(targetMotionCenter);
  started = true;
  document.body.classList.remove('menu');
  startScreen.classList.add('hidden');
});

movingTargetCheckbox.addEventListener('change', (e) => {
  birdsEnabled = e.target.checked;
  endMovingTargetCheckbox.checked = birdsEnabled;
});

endMovingTargetCheckbox.checked = birdsEnabled;

arrowsLeftEl.textContent = String(arrowsLeft);
renderHighscores();
updateBowVisuals();
requestAnimationFrame(animate);

function setBowOpacity(opacity) {
  bowGroup.traverse((object) => {
    if (!object.material) return;

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.transparent = opacity < 1;
      material.opacity = opacity;
      material.depthWrite = opacity > 0.7;
    });
  });
}

function updateFallingBirds(dt) {
  birds.forEach((bird) => {
    if (!bird.visible || !bird.userData.falling) return;

    bird.userData.fallSpeed += dt * 9.8;
    bird.position.y -= bird.userData.fallSpeed * dt;

    if (bird.position.y < 0) {
      bird.visible = false;
      bird.userData.cooldown = 4;
    }
  });
}

function updateBirdRespawn(dt) {
  birds.forEach((bird) => {
    if (bird.visible || bird.userData.cooldown <= 0) return;

    bird.userData.cooldown -= dt;
    if (bird.userData.cooldown <= 0) {
      bird.visible = true;
      bird.userData.falling = false;
      bird.position.set(0, 4, -30 - Math.random() * 10);
    }
  });
}

function updateBirds(dt) {
  updateFallingBirds(dt);
  updateBirdRespawn(dt);
}

function update(dt) {
  updateBowVisuals();
  updateMovingTarget(dt);
  updateArrows(dt);
  updateImpactMarkers(dt);
  updateCameraZoom(dt);
  updateBirds(dt);
}

function animate(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  if (aiming) {
    power = Math.min(100, (now - drawStart) / 14);
    shotValue.textContent = String(Math.round(power));
  }

  update(dt);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('mousemove', (e) => {
  crosshair.style.left = `${e.clientX}px`;
  crosshair.style.top = `${e.clientY}px`;
  crosshair.style.opacity = started ? '1' : '0';
  updateAimFromMouse(e.clientX, e.clientY);
});

window.addEventListener('mousedown', (e) => {
  if (!started || e.button !== 0 || aiming || arrowsLeft <= 0) return;
  aiming = true;
  drawStart = performance.now();
  shotInfo.classList.add('visible');
});

window.addEventListener('mouseup', (e) => {
  if (!started || e.button !== 0 || !aiming || arrowsLeft <= 0) return;
  aiming = false;
  shotInfo.classList.remove('visible');
  spawnArrow();
  arrowsLeft -= 1;
  arrowsLeftEl.textContent = String(arrowsLeft);

  power = 0;
  shotValue.textContent = '0';
});

restartButton.addEventListener('click', () => {
  birdsEnabled = endMovingTargetCheckbox.checked;
  aiming = false;
  power = 0;
  score = 0;
  hits = 0;
  arrowsLeft = 5;
  zoomProgress = 0;
  gameEnded = false;
  targetMotionTime = 0;
  targetGroup.position.copy(targetMotionCenter);

  arrows.forEach((arrow) => scene.remove(arrow.mesh));
  arrows = [];
  impactMarkers.forEach((item) => scene.remove(item.mesh));
  impactMarkers = [];

  scoreEl.textContent = '0';
  hitsEl.textContent = '0';
  arrowsLeftEl.textContent = '5';
  shotValue.textContent = '0';

  camera.position.copy(baseCameraPos);
  cameraLookAtCurrent.copy(baseLookAt);
  camera.lookAt(cameraLookAtCurrent);
  camera.fov = baseFov;
  camera.updateProjectionMatrix();

  bowGroup.visible = true;
  endScreen.classList.add('hidden');
  started = true;
  document.body.classList.remove('menu');
  startScreen.classList.add('hidden');

  targetMotionTime = 0;
  birdMotionTime = 0;
  birds.forEach((bird) => {
    bird.visible = birdsEnabled;
    bird.userData.cooldown = 0;
    bird.userData.falling = false;
    bird.userData.fallSpeed = 0;
    bird.userData.respawnIn = 0;
    bird.rotation.z = 0;
  });
});

document.body.classList.add('menu');

startButton.addEventListener('click', () => {
  birdsEnabled = movingTargetCheckbox.checked;
  targetMotionTime = 0;
  birdMotionTime = 0;
  targetGroup.position.copy(targetMotionCenter);
  started = true;
  document.body.classList.remove('menu');
  startScreen.classList.add('hidden');
});

movingTargetCheckbox.addEventListener('change', (e) => {
  birdsEnabled = e.target.checked;
  endMovingTargetCheckbox.checked = birdsEnabled;
});

endMovingTargetCheckbox.checked = birdsEnabled;

arrowsLeftEl.textContent = String(arrowsLeft);
renderHighscores();
updateBowVisuals();
requestAnimationFrame(animate);

function setBowOpacity(opacity) {
  bowGroup.traverse((object) => {
    if (!object.material) return;

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.transparent = opacity < 1;
      material.opacity = opacity;
      material.depthWrite = opacity > 0.7;
    });
  });
}

function updateFallingBirds(dt) {
  birds.forEach((bird) => {
    if (!bird.visible || !bird.userData.falling) return;

    bird.userData.fallSpeed += dt * 9.8;
    bird.position.y -= bird.userData.fallSpeed * dt;

    if (bird.position.y < 0) {
      bird.visible = false;
      bird.userData.cooldown = 4;
    }
  });
}

function updateBirdRespawn(dt) {
  birds.forEach((bird) => {
    if (bird.visible || bird.userData.cooldown <= 0) return;

    bird.userData.cooldown -= dt;
    if (bird.userData.cooldown <= 0) {
      bird.visible = true;
      bird.userData.falling = false;
      bird.position.set(0, 4, -30 - Math.random() * 10);
    }
  });
}

function updateBirds(dt) {
  updateFallingBirds(dt);
  updateBirdRespawn(dt);
}

function update(dt) {
  updateBowVisuals();
  updateMovingTarget(dt);
  updateArrows(dt);
  updateImpactMarkers(dt);
  updateCameraZoom(dt);
  updateBirds(dt);
}

function animate(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  if (aiming) {
    power = Math.min(100, (now - drawStart) / 14);
    shotValue.textContent = String(Math.round(power));
  }

  update(dt);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('mousemove', (e) => {
  crosshair.style.left = `${e.clientX}px`;
  crosshair.style.top = `${e.clientY}px`;
  crosshair.style.opacity = started ? '1' : '0';
  updateAimFromMouse(e.clientX, e.clientY);
});

window.addEventListener('mousedown', (e) => {
  if (!started || e.button !== 0 || aiming || arrowsLeft <= 0) return;
  aiming = true;
  drawStart = performance.now();
  shotInfo.classList.add('visible');
});

window.addEventListener('mouseup', (e) => {
  if (!started || e.button !== 0 || !aiming || arrowsLeft <= 0) return;
  aiming = false;
  shotInfo.classList.remove('visible');
  spawnArrow();
  arrowsLeft -= 1;
  arrowsLeftEl.textContent = String(arrowsLeft);

  power = 0;
  shotValue.textContent = '0';
});

restartButton.addEventListener('click', () => {
  birdsEnabled = endMovingTargetCheckbox.checked;
  aiming = false;
  power = 0;
  score = 0;
  hits = 0;
  arrowsLeft = 5;
  zoomProgress = 0;
  gameEnded = false;
  targetMotionTime = 0;
  targetGroup.position.copy(targetMotionCenter);

  arrows.forEach((arrow) => scene.remove(arrow.mesh));
  arrows = [];
  impactMarkers.forEach((item) => scene.remove(item.mesh));
  impactMarkers = [];

  scoreEl.textContent = '0';
  hitsEl.textContent = '0';
  arrowsLeftEl.textContent = '5';
  shotValue.textContent = '0';

  camera.position.copy(baseCameraPos);
  cameraLookAtCurrent.copy(baseLookAt);
  camera.lookAt(cameraLookAtCurrent);
  camera.fov = baseFov;
  camera.updateProjectionMatrix();

  bowGroup.visible = true;
  endScreen.classList.add('hidden');
  started = true;
  document.body.classList.remove('menu');
  startScreen.classList.add('hidden');

  targetMotionTime = 0;
  birdMotionTime = 0;
  birds.forEach((bird) => {
    bird.visible = birdsEnabled;
    bird.userData.cooldown = 0;
    bird.userData.falling = false;
    bird.userData.fallSpeed = 0;
    bird.userData.respawnIn = 0;
    bird.rotation.z = 0;
  });
});

document.body.classList.add('menu');

startButton.addEventListener('click', () => {
  birdsEnabled = movingTargetCheckbox.checked;
  targetMotionTime = 0;
  birdMotionTime = 0;
  targetGroup.position.copy(targetMotionCenter);
  started = true;
  document.body.classList.remove('menu');
  startScreen.classList.add('hidden');
});

movingTargetCheckbox.addEventListener('change', (e) => {
  birdsEnabled = e.target.checked;
  endMovingTargetCheckbox.checked = birdsEnabled;
});

endMovingTargetCheckbox.checked = birdsEnabled;

arrowsLeftEl.textContent = String(arrowsLeft);
renderHighscores();
updateBowVisuals();
requestAnimationFrame(animate);

function setBowOpacity(opacity) {
  bowGroup.traverse((object) => {
    if (!object.material) return;

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.transparent = opacity < 1;
      material.opacity = opacity;
      material.depthWrite = opacity > 0.7;
    });
  });
}

function updateFallingBirds(dt) {
  birds.forEach((bird) => {
    if (!bird.visible || !bird.userData.falling) return;

    bird.userData.fallSpeed += dt * 9.8;
    bird.position.y -= bird.userData.fallSpeed * dt;

    if (bird.position.y < 0) {
      bird.visible = false;
      bird.userData.cooldown = 4;
    }
  });
}

function updateBirdRespawn(dt) {
  birds.forEach((bird) => {
    if (bird.visible || bird.userData.cooldown <= 0) return;

    bird.userData.cooldown -= dt;
    if (bird.userData.cooldown <= 0) {
      bird.visible = true;
      bird.userData.falling = false;
      bird.position.set(0, 4, -30 - Math.random() * 10);
    }
  });
}

function updateBirds(dt) {
  updateFallingBirds(dt);
  updateBirdRespawn(dt);
}

function update(dt) {
  updateBowVisuals();
  updateMovingTarget(dt);
  updateArrows(dt);
  updateImpactMarkers(dt);
  updateCameraZoom(dt);
  updateBirds(dt);
}

function animate(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  if (aiming) {
    power = Math.min(100, (now - drawStart) / 14);
    shotValue.textContent = String(Math.round(power));
  }

  update(dt);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('mousemove', (e) => {
  crosshair.style.left = `${e.clientX}px`;
  crosshair.style.top = `${e.clientY}px`;
  crosshair.style.opacity = started ? '1' : '0';
  updateAimFromMouse(e.clientX, e.clientY);
});

window.addEventListener('mousedown', (e) => {
  if (!started || e.button !== 0 || aiming || arrowsLeft <= 0) return;
  aiming = true;
  drawStart = performance.now();
  shotInfo.classList.add('visible');
});

window.addEventListener('mouseup', (e) => {
  if (!started || e.button !== 0 || !aiming || arrowsLeft <= 0) return;
  aiming = false;
  shotInfo.classList.remove('visible');
  spawnArrow();
  arrowsLeft -= 1;
  arrowsLeftEl.textContent = String(arrowsLeft);

  power = 0;
  shotValue.textContent = '0';
});

restartButton.addEventListener('click', () => {
  birdsEnabled = endMovingTargetCheckbox.checked;
  aiming = false;
  power = 0;
  score = 0;
  hits = 0;
  arrowsLeft = 5;
  zoomProgress = 0;
  gameEnded = false;
  targetMotionTime = 0;
  targetGroup.position.copy(targetMotionCenter);

  arrows.forEach((arrow) => scene.remove(arrow.mesh));
  arrows = [];
  impactMarkers.forEach((item) => scene.remove(item.mesh));
  impactMarkers = [];

  scoreEl.textContent = '0';
  hitsEl.textContent = '0';
  arrowsLeftEl.textContent = '5';
  shotValue.textContent = '0';

  camera.position.copy(baseCameraPos);
  cameraLookAtCurrent.copy(baseLookAt);
  camera.lookAt(cameraLookAtCurrent);
  camera.fov = baseFov;
  camera.updateProjectionMatrix();

  bowGroup.visible = true;
  endScreen.classList.add('hidden');
  started = true;
  document.body.classList.remove('menu');
  startScreen.classList.add('hidden');

  targetMotionTime = 0;
  birdMotionTime = 0;
  birds.forEach((bird) => {
    bird.visible = birdsEnabled;
    bird.userData.cooldown = 0;
    bird.userData.falling = false;
    bird.userData.fallSpeed = 0;
    bird.userData.respawnIn = 0;
    bird.rotation.z = 0;
  });
});

document.body.classList.add('menu');

startButton.addEventListener('click', () => {
  birdsEnabled = movingTargetCheckbox.checked;
  targetMotionTime = 0;
  birdMotionTime = 0;
  targetGroup.position.copy(targetMotionCenter);
  started = true;
  document.body.classList.remove('menu');
  startScreen.classList.add('hidden');
});

movingTargetCheckbox.addEventListener('change', (e) => {
  birdsEnabled = e.target.checked;
  endMovingTargetCheckbox.checked = birdsEnabled;
});

endMovingTargetCheckbox.checked = birdsEnabled;

arrowsLeftEl.textContent = String(arrowsLeft);
renderHighscores();
updateBowVisuals();
requestAnimationFrame(animate);

function setBowOpacity(opacity) {
  bowGroup.traverse((object) => {
    if (!object.material) return;

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.transparent = opacity < 1;
      material.opacity = opacity;
      material.depthWrite = opacity > 0.7;
    });
  });
}

function updateFallingBirds(dt) {
  birds.forEach((bird) => {
    if (!bird.visible || !bird.userData.falling) return;

    bird.userData.fallSpeed += dt * 9.8;
    bird.position.y -= bird.userData.fallSpeed * dt;

    if (bird.position.y < 0) {
      bird.visible = false;
      bird.userData.cooldown = 4;
    }
  });
}

function updateBirdRespawn(dt) {
  birds.forEach((bird) => {
    if (bird.visible || bird.userData.cooldown <= 0) return;

    bird.userData.cooldown -= dt;
    if (bird.userData.cooldown <= 0) {
      bird.visible = true;
      bird.userData.falling = false;
      bird.position.set(0, 4, -30 - Math.random() * 10);
    }
  });
}

function updateBirds(dt) {
  updateFallingBirds(dt);
  updateBirdRespawn(dt);
}

function update(dt) {
  updateBowVisuals();
  updateMovingTarget(dt);
  updateArrows(dt);
  updateImpactMarkers(dt);
  updateCameraZoom(dt);
  updateBirds(dt);
}

function animate(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  if (aiming) {
    power = Math.min(100, (now - drawStart) / 14);
    shotValue.textContent = String(Math.round(power));
  }

  update(dt);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('mousemove', (e) => {
  crosshair.style.left = `${e.clientX}px`;
  crosshair.style.top = `${e.clientY}px`;
  crosshair.style.opacity = started ? '1' : '0';
  updateAimFromMouse(e.clientX, e.clientY);
});

window.addEventListener('mousedown', (e) => {
  if (!started || e.button !== 0 || aiming || arrowsLeft <= 0) return;
  aiming = true;
  drawStart = performance.now();
  shotInfo.classList.add('visible');
});

window.addEventListener('mouseup', (e) => {
  if (!started || e.button !== 0 || !aiming || arrowsLeft <= 0) return;
  aiming = false;
  shotInfo.classList.remove('visible');
  spawnArrow();
  arrowsLeft -= 1;
  arrowsLeftEl.textContent = String(arrowsLeft);

  power = 0;
  shotValue.textContent = '0';
});

restartButton.addEventListener('click', () => {
  birdsEnabled = endMovingTargetCheckbox.checked;
  aiming = false;
  power = 0;
  score = 0;
  hits = 0;
  arrowsLeft = 5;
  zoomProgress = 0;
  gameEnded = false;
  targetMotionTime = 0;
  targetGroup.position.copy(targetMotionCenter);

  arrows.forEach((arrow) => scene.remove(arrow.mesh));
  arrows = [];
  impactMarkers.forEach((item) => scene.remove(item.mesh));
  impactMarkers = [];

  scoreEl.textContent = '0';
  hitsEl.textContent = '0';
  arrowsLeftEl.textContent = '5';
  shotValue.textContent = '0';

  camera.position.copy(baseCameraPos);
  cameraLookAtCurrent.copy(baseLookAt);
  camera.lookAt(cameraLookAtCurrent);
  camera.fov = baseFov;
  camera.updateProjectionMatrix();

  bowGroup.visible = true;
  endScreen.classList.add('hidden');
  started = true;
  document.body.classList.remove('menu');
  startScreen.classList.add('hidden');

  targetMotionTime = 0;
  birdMotionTime = 0;
  birds.forEach((bird) => {
    bird.visible = birdsEnabled;
    bird.userData.cooldown = 0;
    bird.userData.falling = false;
    bird.userData.fallSpeed = 0;
    bird.userData.respawnIn = 0;
    bird.rotation.z = 0;
  });
});

document.body.classList.add('menu');

startButton.addEventListener('click', () => {
  birdsEnabled = movingTargetCheckbox.checked;
  targetMotionTime = 0;
  birdMotionTime = 0;
  targetGroup.position.copy(targetMotionCenter);
  started = true;
  document.body.classList.remove('menu');
  startScreen.classList.add('hidden');
});

movingTargetCheckbox.addEventListener('change', (e) => {
  birdsEnabled = e.target.checked;
  endMovingTargetCheckbox.checked = birdsEnabled;
});

endMovingTargetCheckbox.checked = birdsEnabled;

arrowsLeftEl.textContent = String(arrowsLeft);
renderHighscores();
updateBowVisuals();
requestAnimationFrame(animate);

function setBowOpacity(opacity) {
  bowGroup.traverse((object) => {
    if (!object.material) return;

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.transparent = opacity < 1;
      material.opacity = opacity;
      material.depthWrite = opacity > 0.7;
    });
  });
}
