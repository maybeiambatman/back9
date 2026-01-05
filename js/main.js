import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTerrain, updateWater } from './terrain.js';
import { createElement, ELEMENT_TYPES } from './elements.js';
import { PlacementSystem } from './placement.js';
import { ScoringSystem } from './scoring.js';
import { AudioSystem } from './audio.js';
import { updateUI, showUnlockNotification } from './ui.js';
import { saveGame, loadGame } from './storage.js';

// Game state
const state = {
  score: 0,
  placements: [],
  unlockedPacks: [1],
  selectedElement: null,
  soundEnabled: true
};

// Unlock thresholds
const UNLOCK_THRESHOLDS = [
  { points: 500, pack: 2, name: 'Hazards' },
  { points: 1200, pack: 3, name: 'Nature' },
  { points: 2500, pack: 4, name: 'Structures' }
];

// Three.js setup
const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(20, 15, 20);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true // For screenshots
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
scene.add(directionalLight);

const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x7ec850, 0.3);
scene.add(hemisphereLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2.2;
controls.target.set(0, 0, 0);

// Create terrain
const { terrain, water } = createTerrain(scene);

// Systems
const audio = new AudioSystem();
const scoring = new ScoringSystem();
const placement = new PlacementSystem(scene, camera, terrain, state, scoring, audio);

// Load saved game
const savedData = loadGame();
if (savedData) {
  state.score = savedData.score || 0;
  state.unlockedPacks = savedData.unlockedPacks || [1];

  // Restore placements
  if (savedData.placements) {
    savedData.placements.forEach(p => {
      const element = createElement(p.type, new THREE.Vector3(p.x, p.y, p.z));
      if (element) {
        scene.add(element);
        state.placements.push({
          type: p.type,
          mesh: element,
          position: new THREE.Vector3(p.x, p.y, p.z)
        });
      }
    });
    scoring.recalculateScore(state.placements);
  }
}

// Update unlocked packs in UI
function updateUnlockedPacks() {
  state.unlockedPacks.forEach(packNum => {
    const packSection = document.querySelector(`.pack-section[data-pack="${packNum}"]`);
    if (packSection) {
      packSection.querySelectorAll('.element-btn').forEach(btn => {
        btn.classList.remove('locked');
        const lockOverlay = btn.querySelector('.lock-overlay');
        if (lockOverlay) lockOverlay.remove();
      });
    }
  });
}
updateUnlockedPacks();

// Check for new unlocks
function checkUnlocks() {
  let newUnlock = null;

  UNLOCK_THRESHOLDS.forEach(threshold => {
    if (state.score >= threshold.points && !state.unlockedPacks.includes(threshold.pack)) {
      state.unlockedPacks.push(threshold.pack);
      newUnlock = threshold;
    }
  });

  if (newUnlock) {
    showUnlockNotification(newUnlock.name);
    audio.playUnlock();
    updateUnlockedPacks();
    saveGame(state);
  }
}

// Element selection
document.querySelectorAll('.element-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('locked')) {
      audio.playError();
      return;
    }

    // Deselect if already selected
    if (btn.classList.contains('selected')) {
      btn.classList.remove('selected');
      state.selectedElement = null;
      placement.clearPreview();
      return;
    }

    // Select new element
    document.querySelectorAll('.element-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.selectedElement = btn.dataset.element;
    audio.playTick();
  });
});

// Control buttons
document.getElementById('btn-sound').addEventListener('click', () => {
  state.soundEnabled = !state.soundEnabled;
  audio.setEnabled(state.soundEnabled);
  document.getElementById('btn-sound').textContent = state.soundEnabled ? '🔊' : '🔇';
  document.getElementById('btn-sound').classList.toggle('muted', !state.soundEnabled);
});

document.getElementById('btn-screenshot').addEventListener('click', () => {
  // Hide UI
  document.querySelectorAll('.ui-panel, .element-tray, .instructions').forEach(el => {
    el.style.display = 'none';
  });
  document.getElementById('watermark').classList.remove('hidden');

  // Render and capture
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL('image/png');

  // Download
  const link = document.createElement('a');
  link.download = 'links-course.png';
  link.href = dataURL;
  link.click();

  // Show UI again
  document.querySelectorAll('.ui-panel, .element-tray, .instructions').forEach(el => {
    el.style.display = '';
  });
  document.getElementById('watermark').classList.add('hidden');
});

document.getElementById('btn-clear').addEventListener('click', () => {
  if (state.placements.length === 0) return;

  if (confirm('Clear all placed elements?')) {
    state.placements.forEach(p => {
      scene.remove(p.mesh);
    });
    state.placements = [];
    state.score = 0;
    updateUI(state, UNLOCK_THRESHOLDS);
    saveGame(state);
    audio.playRemove();
  }
});

// Right-click to cancel
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (state.selectedElement) {
    document.querySelectorAll('.element-btn').forEach(b => b.classList.remove('selected'));
    state.selectedElement = null;
    placement.clearPreview();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.element-btn').forEach(b => b.classList.remove('selected'));
    state.selectedElement = null;
    placement.clearPreview();
  }
});

// Handle placement
placement.onPlace = (elementType, position) => {
  const element = createElement(elementType, position);
  if (element) {
    scene.add(element);
    state.placements.push({
      type: elementType,
      mesh: element,
      position: position.clone()
    });

    // Recalculate score
    const newScore = scoring.calculateScore(state.placements);
    const pointsGained = newScore - state.score;
    state.score = newScore;

    updateUI(state, UNLOCK_THRESHOLDS);
    checkUnlocks();
    saveGame(state);

    if (pointsGained >= 0) {
      audio.playPlace();
    } else {
      audio.playPenalty();
    }
  }
};

placement.onRemove = (placementIndex) => {
  const removed = state.placements[placementIndex];
  scene.remove(removed.mesh);
  state.placements.splice(placementIndex, 1);

  // Recalculate score
  state.score = scoring.calculateScore(state.placements);

  updateUI(state, UNLOCK_THRESHOLDS);
  saveGame(state);
  audio.playRemove();
};

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initial UI update
updateUI(state, UNLOCK_THRESHOLDS);

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();

  // Update water animation
  if (water) {
    updateWater(water, time);
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);
}

animate();

// Start ambient audio after user interaction
document.addEventListener('click', () => {
  audio.startAmbient();
}, { once: true });
