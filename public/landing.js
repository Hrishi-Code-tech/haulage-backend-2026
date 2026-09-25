import * as THREE from 'three';

/* ─── Glassmorphism Navbar on Scroll ─── */
const siteNav = document.querySelector('#site-nav');
let lastScroll = 0;
const handleNavScroll = () => {
  const scrollY = window.scrollY;
  if (scrollY > 60) {
    siteNav.classList.add('scrolled');
  } else {
    siteNav.classList.remove('scrolled');
  }
  lastScroll = scrollY;
};
window.addEventListener('scroll', handleNavScroll, { passive: true });

/* ─── Scroll Reveal (IntersectionObserver) ─── */
const revealElements = document.querySelectorAll('[data-reveal]');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
revealElements.forEach((el) => revealObserver.observe(el));

/* ─── Counter Animation on Signal Strip ─── */
function animateCounters() {
  const counters = document.querySelectorAll('.signal-number[data-count]');
  counters.forEach((counter) => {
    const target = parseFloat(counter.dataset.count);
    const suffix = counter.dataset.suffix || '';
    const isDecimal = String(target).includes('.');
    const duration = 2000;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      if (isDecimal) {
        counter.textContent = current.toFixed(1) + suffix;
      } else {
        counter.textContent = String(Math.round(current)).padStart(String(Math.round(target)).length, '0') + suffix;
      }

      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

const signalStrip = document.querySelector('.signal-strip');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCounters();
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });
if (signalStrip) counterObserver.observe(signalStrip);

/* ─── Parallax-Like Grid Depth ─── */
const heroGrid = document.querySelector('.hero-grid');
if (heroGrid) {
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 12;
    const y = (e.clientY / window.innerHeight - 0.5) * 12;
    heroGrid.style.transform = `translate(${x}px, ${y}px)`;
  }, { passive: true });
}

/* ─── Three.js Truck Scene ─── */
const container = document.querySelector('#landing-scene');
const motionButton = document.querySelector('#landing-motion');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x172634, 10, 30);
const camera = new THREE.PerspectiveCamera(31, container.clientWidth / container.clientHeight, .1, 100);
camera.position.set(6.4, 3.4, 9.5);
const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd5e9ef, 0x17202b, 2));
const keyLight = new THREE.DirectionalLight(0xffbd78, 4);
keyLight.position.set(-5, 8, 6);
keyLight.castShadow = true;
scene.add(keyLight);

const road = new THREE.Mesh(new THREE.PlaneGeometry(28, 34), new THREE.MeshStandardMaterial({color: 0x202a31, roughness: .95}));
road.rotation.x = -Math.PI / 2;
road.position.y = -.25;
road.receiveShadow = true;
scene.add(road);
const edgeMaterial = new THREE.MeshBasicMaterial({color: 0xe9a052});
[-3.2, 3.2].forEach((x) => { const edge = new THREE.Mesh(new THREE.PlaneGeometry(.1, 34), edgeMaterial); edge.rotation.x = -Math.PI / 2; edge.position.set(x, -.2, 0); scene.add(edge); });
const marks = [];
for (let i = 0; i < 12; i += 1) { const mark = new THREE.Mesh(new THREE.PlaneGeometry(.16, 1.6), new THREE.MeshBasicMaterial({color: 0xc9a773})); mark.rotation.x = -Math.PI / 2; mark.position.set(0, -.19, -14 + i * 2.7); scene.add(mark); marks.push(mark); }

const truck = new THREE.Group();
truck.position.set(1.05, -.2, -13);
truck.rotation.y = Math.PI / 2;
truck.scale.setScalar(.64);
scene.add(truck);
const orange = new THREE.MeshStandardMaterial({color: 0xe68531, roughness: .52, metalness: .12});
const trailerPaint = new THREE.MeshStandardMaterial({color: 0xcdd2c9, roughness: .5, metalness: .16});
const dark = new THREE.MeshStandardMaterial({color: 0x15212a, roughness: .75});
const glass = new THREE.MeshStandardMaterial({color: 0x27404d, roughness: .16, metalness: .35});
const trailer = new THREE.Mesh(new THREE.BoxGeometry(4.1, 2.3, 2.1), trailerPaint); trailer.position.set(1.25, 1.35, 0); truck.add(trailer);
const cab = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.8, 2.05), orange); cab.position.set(-1.85, 1.1, 0); truck.add(cab);
const nose = new THREE.Mesh(new THREE.BoxGeometry(.62, .58, 2.08), orange); nose.position.set(-2.84, .67, 0); truck.add(nose);
const windshield = new THREE.Mesh(new THREE.BoxGeometry(.05, .67, 1.55), glass); windshield.position.set(-2.66, 1.38, 0); windshield.rotation.z = -.15; truck.add(windshield);
const bumper = new THREE.Mesh(new THREE.BoxGeometry(.16, .23, 2.2), dark); bumper.position.set(-3.16, .34, 0); truck.add(bumper);
const logoMaterial = new THREE.MeshBasicMaterial({color: 0x29363a, transparent: true, opacity: 1});
const logo = new THREE.Group(); logo.position.set(1.2, 1.35, 1.08); truck.add(logo);
for (let i = 0; i < 3; i += 1) { const mark = new THREE.Mesh(new THREE.BoxGeometry(.1, .25 + i * .14, .03), logoMaterial); mark.position.set((i - 1) * .19, i * .03, 0); logo.add(mark); }
const logoBar = new THREE.Mesh(new THREE.BoxGeometry(1.38, .08, .03), logoMaterial); logoBar.position.set(.06, -.3, 0); logo.add(logoBar);
/* ─── Detailed Wheels with Hub + Spokes ─── */
const wheels = [];
const wheelR = 0.4;
const wheelW = 0.24;
const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: .92, metalness: .05 });
const hubMat = new THREE.MeshStandardMaterial({ color: 0x5c6870, roughness: .35, metalness: .65 });
const spokeMat = new THREE.MeshStandardMaterial({ color: 0x3d4a52, roughness: .5, metalness: .4 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0x444f55, roughness: .4, metalness: .5 });

function createWheel() {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.TorusGeometry(wheelR - 0.06, 0.1, 8, 20), tireMat);
  g.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(wheelR - 0.1, wheelR - 0.1, wheelW * 0.6, 20), rimMat);
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, wheelW * 0.7, 12), hubMat);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  for (let s = 0; s < 5; s++) {
    const a = (s / 5) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.05, wheelR - 0.16, 0.04), spokeMat);
    spoke.position.set(Math.cos(a) * (wheelR * 0.38), Math.sin(a) * (wheelR * 0.38), 0);
    spoke.rotation.z = a;
    g.add(spoke);
  }
  for (let t = 0; t < 16; t++) {
    const a = (t / 16) * Math.PI * 2;
    const tread = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.03, wheelW * 0.5), tireMat);
    tread.position.set(Math.cos(a) * wheelR, Math.sin(a) * wheelR, 0);
    tread.rotation.z = a;
    g.add(tread);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

[[-2.15,.35,1.05],[-2.15,.35,-1.05],[1.35,.35,1.05],[1.35,.35,-1.05],[2.25,.35,1.05],[2.25,.35,-1.05]].forEach(([x,y,z]) => {
  const wheel = createWheel();
  wheel.position.set(x, y, z);
  if (z < 0) wheel.rotation.y = Math.PI;
  truck.add(wheel);
  wheels.push(wheel);
});
truck.traverse((object) => { if (object.isMesh) object.castShadow = true; });

let playing = !reducedMotion;
let start = null;
const clock = new THREE.Clock();
function render() {
  const elapsed = clock.getElapsedTime();
  if (playing) {
    if (start === null) start = elapsed;
    const progress = Math.min((elapsed - start) / 4, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    truck.position.z = -13 + eased * 11.7 + (progress >= 1 ? Math.sin(elapsed * .42) * .11 : 0);
    truck.position.y = -.2 + Math.sin(elapsed * 7) * .045 * progress;
    // Roll wheels forward — spokes visually rotate matching truck movement
    wheels.forEach((wheel) => { wheel.rotation.z = -elapsed * 5; });
    marks.forEach((mark, index) => { mark.position.z = ((index * 2.7 + elapsed * 3.1 + 14) % 32) - 16; });
    camera.position.x = 6.4 + Math.sin(elapsed * .23) * .09;
    camera.lookAt(.8, .9, progress < 1 ? truck.position.z : -1.3);
  } else { camera.lookAt(.8, .9, -1.3); }
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
function setPlaying(value) { playing = value; if (value) start = clock.getElapsedTime(); motionButton.textContent = value ? 'Pause' : 'Play route'; motionButton.setAttribute('aria-pressed', String(value)); }
motionButton.addEventListener('click', () => setPlaying(!playing));
window.addEventListener('resize', () => { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); });
render();
