import * as THREE from 'three';

const authCard = document.querySelector('.auth-card');
const tabs = document.querySelector('.auth-tabs');
const form = document.querySelector('#auth-form');
const message = document.querySelector('.form-message');
const successOverlay = document.querySelector('#success-overlay');
const successText = document.querySelector('#success-text');
let mode = 'login';

/* ─── Password Strength ─── */
const passwordInput = document.querySelector('#password');
const strengthBar = document.querySelector('#password-strength');
const strengthFill = document.querySelector('#strength-fill');
const strengthLabel = document.querySelector('#strength-label');

function calcStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const strengthMap = [
  { label: '', color: 'transparent', width: '0%' },
  { label: 'Weak', color: '#ef8e78', width: '25%' },
  { label: 'Fair', color: '#e5a84d', width: '50%' },
  { label: 'Good', color: '#82c9e0', width: '75%' },
  { label: 'Strong', color: '#82d5ad', width: '100%' },
];

passwordInput.addEventListener('input', () => {
  if (mode !== 'signup') return;
  const pw = passwordInput.value;
  if (pw.length === 0) {
    strengthBar.classList.remove('visible');
    return;
  }
  strengthBar.classList.add('visible');
  const level = calcStrength(pw);
  const info = strengthMap[level];
  strengthFill.style.width = info.width;
  strengthFill.style.background = info.color;
  strengthLabel.textContent = info.label;
  strengthLabel.style.color = info.color;
});

/* ─── Mode Switching ─── */
function setMode(nextMode) {
  mode = nextMode;
  const isSignup = mode === 'signup';
  authCard.classList.toggle('is-signup', isSignup);
  tabs.classList.toggle('signup', isSignup);

  // Staggered field animations
  const signupFields = document.querySelectorAll('.signup-only');
  signupFields.forEach((el, i) => {
    if (isSignup) {
      el.style.display = el.classList.contains('check-row') ? 'flex' : 'block';
      el.style.animationDelay = `${i * 0.06}s`;
    } else {
      el.style.display = 'none';
    }
  });

  document.querySelectorAll('.auth-tab').forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  document.querySelector('#auth-title').textContent = isSignup ? 'Create your account' : 'Log in to Haulage';
  document.querySelector('#auth-subtitle').textContent = isSignup ? 'The whole network starts with one account.' : 'Your network is ready when you are.';
  document.querySelector('#switch-copy').textContent = isSignup ? 'Already have an account?' : 'New to Haulage?';
  document.querySelector('#switch-mode').innerHTML = isSignup ? 'Log in instead <span>&rarr;</span>' : 'Create an account <span>&rarr;</span>';
  message.textContent = '';
  message.classList.remove('success');
  clearErrors();

  // Reset strength meter
  strengthBar.classList.remove('visible');
  strengthFill.style.width = '0%';
  strengthLabel.textContent = '';
}

document.querySelectorAll('.auth-tab').forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
document.querySelector('#switch-mode').addEventListener('click', () => setMode(mode === 'login' ? 'signup' : 'login'));
document.querySelector('.password-toggle').addEventListener('click', (event) => {
  const password = document.querySelector('#password');
  const visible = password.type === 'text';
  password.type = visible ? 'password' : 'text';
  event.currentTarget.textContent = visible ? 'Show' : 'Hide';
  event.currentTarget.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
});

document.querySelector('.forgot-link').addEventListener('click', (event) => {
  event.preventDefault();
  message.textContent = 'Password reset instructions will be sent to your work email.';
  message.classList.add('success');
});

function clearErrors() {
  document.querySelectorAll('.field-group').forEach((field) => {
    field.classList.remove('invalid');
    const errorEl = field.querySelector('.field-error');
    if (errorEl) errorEl.textContent = '';
  });
}

function fieldError(input, text) {
  const group = input.closest('.field-group');
  group.classList.add('invalid');
  // Shake animation on error
  group.style.animation = 'none';
  group.offsetHeight; // reflow
  group.style.animation = 'field-shake .4s ease';
  const errorEl = group.querySelector('.field-error');
  if (errorEl) errorEl.textContent = text;
}

function validate() {
  clearErrors();
  let valid = true;
  const email = document.querySelector('#email');
  const password = document.querySelector('#password');
  if (mode === 'signup') {
    ['#full-name', '#company'].forEach((selector) => {
      const input = document.querySelector(selector);
      if (!input.value.trim()) { fieldError(input, 'This field is required.'); valid = false; }
    });
  }
  if (!email.value.trim() || !/^\S+@\S+\.\S+$/.test(email.value)) { fieldError(email, 'Enter a valid work email.'); valid = false; }
  if (password.value.length < 8) { fieldError(password, 'Use at least 8 characters.'); valid = false; }
  if (mode === 'signup') {
    const confirm = document.querySelector('#confirm-password');
    if (confirm.value !== password.value || !confirm.value) { fieldError(confirm, 'Passwords do not match.'); valid = false; }
    if (!document.querySelector('[name="terms"]').checked) { message.textContent = 'Please accept the terms to continue.'; valid = false; }
  }
  return valid;
}

/* ─── Success Animation + Redirect ─── */
function showSuccess(text) {
  successText.textContent = text;
  successOverlay.classList.add('active');
  successOverlay.setAttribute('aria-hidden', 'false');
  // Redirect to dashboard page after the animation plays
  setTimeout(() => {
    window.location.href = '/dashboard.html';
  }, 2200);
}

/* ─── Form Submit ─── */
form.addEventListener('submit', (event) => {
  event.preventDefault();
  message.classList.remove('success');
  message.textContent = '';
  if (!validate()) return;
  const submit = form.querySelector('.submit-button');
  submit.classList.add('is-loading');
  submit.disabled = true;
  const payload = mode === 'signup'
    ? {name: document.querySelector('#full-name').value.trim(), companyName: document.querySelector('#company').value.trim(), email: document.querySelector('#email').value.trim(), password: document.querySelector('#password').value}
    : {email: document.querySelector('#email').value.trim(), password: document.querySelector('#password').value};
  fetch(`/api/auth/${mode}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)})
    .then(async (response) => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'Authentication failed. Please try again.');
      return body;
    })
    .then((body) => {
      if (body.data?.token) localStorage.setItem('haulage.session', body.data.token);
      if (body.data?.user) localStorage.setItem('haulage.user', JSON.stringify(body.data.user));
      const successMsg = mode === 'signup' ? 'Account created. Redirecting…' : 'Welcome back. Redirecting…';
      showSuccess(successMsg);
    })
    .catch((error) => {
      message.textContent = error.message;
      message.classList.remove('success');
    })
    .finally(() => {
      submit.classList.remove('is-loading');
      submit.disabled = false;
    });
});

/* ─── Inject shake keyframe ─── */
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes field-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }`;
document.head.appendChild(shakeStyle);

/* ═══ THREE.JS TRUCK SCENE ═══ */
function initTruckScene() {
  const container = document.querySelector('#truck-scene');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
  if (!container) return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x182331, 9, 28);
  const camera = new THREE.PerspectiveCamera(34, container.clientWidth / container.clientHeight, .1, 100);
  camera.position.set(6.6, 3.1, 8.8);
  camera.lookAt(0, 1.15, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xd8e8ee, 0x18222b, 2.1));
  const sun = new THREE.DirectionalLight(0xffbf7c, 3.4);
  sun.position.set(-4, 8, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -8;
  scene.add(sun);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0x202a31, roughness: .96 }));
  road.receiveShadow = true;
  road.rotation.x = -Math.PI / 2;
  road.position.y = -.24;
  scene.add(road);
  const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(30, .12), new THREE.MeshBasicMaterial({ color: 0xf0a354 }));
  shoulder.rotation.x = -Math.PI / 2;
  shoulder.position.set(3.35, -.2, 0);
  scene.add(shoulder);
  const leftShoulder = shoulder.clone();
  leftShoulder.position.x = -3.35;
  scene.add(leftShoulder);

  const laneLines = [];
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xd5b071, transparent: true, opacity: .7 });
  for (let i = 0; i < 9; i += 1) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(.16, 1.8), lineMaterial);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, -.19, -8 + i * 2.7);
    scene.add(line);
    laneLines.push(line);
  }

  const truck = new THREE.Group();
  truck.position.set(1.35, -.22, -12);
  truck.scale.setScalar(.61);
  truck.rotation.y = Math.PI / 2;
  scene.add(truck);
  const orange = new THREE.MeshStandardMaterial({ color: 0xe68a31, roughness: .62, metalness: .08 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x17232b, roughness: .8 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xc9d0c8, roughness: .58, metalness: .15 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x29404c, roughness: .2, metalness: .2 });
  const trailer = new THREE.Mesh(new THREE.BoxGeometry(3.9, 2.25, 2.1), silver);
  trailer.position.set(1.25, 1.35, 0);
  truck.add(trailer);
  const trailerEdge = new THREE.Mesh(new THREE.BoxGeometry(.07, 2.35, 2.16), orange);
  trailerEdge.position.set(-.72, 1.35, 0);
  truck.add(trailerEdge);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.75, 2.05), orange);
  cab.position.set(-1.85, 1.08, 0);
  truck.add(cab);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(.55, .55, 2.06), orange);
  hood.position.set(-2.82, .65, 0);
  truck.add(hood);
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(.05, .65, 1.55), glass);
  windshield.position.set(-2.67, 1.35, 0);
  windshield.rotation.z = -.15;
  truck.add(windshield);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(.16, .22, 2.18), dark);
  bumper.position.set(-3.1, .33, 0);
  truck.add(bumper);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(.04, .34, 1.15), new THREE.MeshStandardMaterial({ color: 0x5c6870, metalness: .7, roughness: .28 }));
  grille.position.set(-3.2, .62, 0);
  truck.add(grille);
  const headlightMaterial = new THREE.MeshStandardMaterial({ color: 0xffe4a6, emissive: 0xffa92e, emissiveIntensity: 2.4 });
  [-.67, .67].forEach((z) => {
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(.05, .17, .28), headlightMaterial);
    headlight.position.set(-3.22, .72, z);
    truck.add(headlight);
  });
  const mirrorMaterial = new THREE.MeshStandardMaterial({ color: 0x202c33, metalness: .5, roughness: .3 });
  [-1.18, 1.18].forEach((z) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.42, .08, .08), mirrorMaterial);
    arm.position.set(-2.62, 1.42, z);
    truck.add(arm);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(.12, .25, .25), mirrorMaterial);
    mirror.position.set(-2.82, 1.48, z * 1.03);
    truck.add(mirror);
  });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.35, .12, 2.08), orange);
  roof.position.set(-1.85, 2.02, 0);
  truck.add(roof);
  const logo = new THREE.Group();
  logo.position.set(1.24, 1.35, 1.08);
  const logoMat = new THREE.MeshBasicMaterial({ color: 0x26343a, transparent: true, opacity: 0 });
  for (let i = 0; i < 3; i += 1) {
    const mark = new THREE.Mesh(new THREE.BoxGeometry(.1, .25 + i * .14, .03), logoMat);
    mark.position.set((i - 1) * .19, -.02 + i * .02, 0);
    logo.add(mark);
  }
  const logoText = new THREE.Mesh(new THREE.BoxGeometry(1.4, .08, .03), logoMat);
  logoText.position.set(.06, -.28, 0);
  logo.add(logoText);
  truck.add(logo);

  /* ─── Detailed Wheels with Hub + Spokes for Visible Rolling ─── */
  const wheels = [];
  const wheelR = 0.39;
  const wheelW = 0.24;
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: .92, metalness: .05 });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x5c6870, roughness: .35, metalness: .65 });
  const spokeMat = new THREE.MeshStandardMaterial({ color: 0x3d4a52, roughness: .5, metalness: .4 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x444f55, roughness: .4, metalness: .5 });

  function createWheel() {
    const group = new THREE.Group();
    // Outer tire (torus for realistic tire shape)
    const tire = new THREE.Mesh(new THREE.TorusGeometry(wheelR - 0.06, 0.1, 8, 20), tireMat);
    group.add(tire);
    // Inner rim disc
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(wheelR - 0.1, wheelR - 0.1, wheelW * 0.6, 20), rimMat);
    rim.rotation.x = Math.PI / 2;
    group.add(rim);
    // Hub cap (center)
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, wheelW * 0.7, 12), hubMat);
    hub.rotation.x = Math.PI / 2;
    group.add(hub);
    // 5 spokes radiating from hub — makes rotation visible
    for (let s = 0; s < 5; s++) {
      const angle = (s / 5) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.05, wheelR - 0.16, 0.04), spokeMat);
      spoke.position.set(Math.cos(angle) * (wheelR * 0.38), Math.sin(angle) * (wheelR * 0.38), 0);
      spoke.rotation.z = angle;
      group.add(spoke);
    }
    // Tread marks on tire (small bumps at intervals)
    for (let t = 0; t < 16; t++) {
      const tAngle = (t / 16) * Math.PI * 2;
      const tread = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.03, wheelW * 0.5), tireMat);
      tread.position.set(Math.cos(tAngle) * wheelR, Math.sin(tAngle) * wheelR, 0);
      tread.rotation.z = tAngle;
      group.add(tread);
    }
    group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return group;
  }

  [[-2.15, .35, 1.05],[-2.15, .35, -1.05],[1.35, .35, 1.05],[1.35, .35, -1.05],[2.2, .35, 1.05],[2.2, .35, -1.05]].forEach(([x, y, z]) => {
    const wheel = createWheel();
    wheel.position.set(x, y, z);
    // Flip wheels on far side so spokes face outward
    if (z < 0) wheel.rotation.y = Math.PI;
    truck.add(wheel);
    wheels.push(wheel);
  });
  truck.traverse((object) => {
    if (object.isMesh) object.castShadow = true;
  });

  const clock = new THREE.Clock();
  let start = null;
  let frame;
  let disposed = false;
  let isPlaying = !(reducedMotion || lowEnd);
  if (reducedMotion || lowEnd) {
    truck.position.z = -1.15;
    logoMat.opacity = 1;
    camera.position.x = 5.8;
    camera.lookAt(.85, .9, -1.1);
  }
  const animate = () => {
    if (disposed) return;
    if (!isPlaying) {
      renderer.render(scene, camera);
      return;
    }
    const elapsed = clock.getElapsedTime();
    if (start === null) start = elapsed;
    const intro = Math.min((elapsed - start) / 3.4, 1);
    const eased = 1 - Math.pow(1 - intro, 3);
    truck.position.z = -12 + eased * 10.85;
    truck.position.y = Math.sin(elapsed * 7) * .06 * intro;
    if (intro >= 1) truck.position.z += Math.sin(elapsed * .55) * .12;
    // Roll wheels forward — rotate around Z axis (perpendicular to axle)
    // Negative direction so tread moves backward = truck moves forward
    wheels.forEach((wheel) => { wheel.rotation.z = -elapsed * 5; });
    laneLines.forEach((line, index) => { line.position.z = ((index * 2.7 + elapsed * 3.2 + 8) % 24) - 12; });
    logoMat.opacity = Math.min(Math.max((intro - .58) / .42, 0), 1);
    camera.position.x = 6.6 - eased * .8 + Math.sin(elapsed * .34) * .08;
    camera.lookAt(intro < 1 ? truck.position.x : .85, .9, intro < 1 ? truck.position.z : -1.1);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  };
  const resize = () => { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); };
  const stopWhenHidden = () => { if (document.hidden) cancelAnimationFrame(frame); else animate(); };
  const motionToggle = document.querySelector('#motion-toggle');
  const setMotion = (playing) => {
    isPlaying = playing;
    motionToggle?.setAttribute('aria-pressed', String(playing));
    if (motionToggle) {
      motionToggle.querySelector('.motion-icon').textContent = playing ? '||' : '▶';
      motionToggle.querySelector('span:last-child').textContent = playing ? 'Pause route' : 'Play route';
    }
    if (playing) {
      start = clock.getElapsedTime();
      animate();
    }
  };
  motionToggle?.addEventListener('click', () => setMotion(!isPlaying));
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', stopWhenHidden);
  if (motionToggle) setMotion(isPlaying);
  animate();
}

setMode('login');
initTruckScene();
