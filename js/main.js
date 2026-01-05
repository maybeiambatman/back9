import * as THREE from 'three';
import { createTerrain } from './terrain.js';
import { createElement, ELEMENT_TYPES, findNeighbors, updateConnectedNeighbors } from './elements.js';
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
scene.background = new THREE.Color(0xf5f0e6); // Warm off-white like Mini Metro

// Orthographic camera for clean top-down view
const frustumSize = 20;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  frustumSize * aspect / -2,
  frustumSize * aspect / 2,
  frustumSize / 2,
  frustumSize / -2,
  0.1,
  1000
);
camera.position.set(0, 50, 0);
camera.lookAt(0, 0, 0);

// Current zoom level
let currentZoom = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Simple flat lighting - no shadows needed for minimalist style
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Create terrain
let terrain;
try {
  terrain = createTerrain(scene);
  console.log('Terrain created successfully');
} catch (err) {
  console.error('Failed to create terrain:', err);
}

// Systems
const audio = new AudioSystem();
const scoring = new ScoringSystem();
const placement = new PlacementSystem(scene, camera, terrain, state, scoring, audio);

// Load saved game
const savedData = loadGame();
if (savedData) {
  state.score = savedData.score || 0;
  state.unlockedPacks = savedData.unlockedPacks || [1];

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

    if (btn.classList.contains('selected')) {
      btn.classList.remove('selected');
      state.selectedElement = null;
      placement.clearPreview();
      return;
    }

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
  document.querySelectorAll('.ui-panel, .element-tray, .instructions').forEach(el => {
    el.style.display = 'none';
  });
  document.getElementById('watermark').classList.remove('hidden');

  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL('image/png');

  const link = document.createElement('a');
  link.download = 'links-course.png';
  link.href = dataURL;
  link.click();

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

// Track keys for rotation
const keysPressed = { q: false, e: false };
let cameraAngle = 0;

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (key === 'escape') {
    document.querySelectorAll('.element-btn').forEach(b => b.classList.remove('selected'));
    state.selectedElement = null;
    placement.clearPreview();
  }

  if (key === 'q') keysPressed.q = true;
  if (key === 'e') keysPressed.e = true;
});

document.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'q') keysPressed.q = false;
  if (key === 'e') keysPressed.e = false;
});

// Update camera for orthographic rotation
function updateCamera() {
  const radius = 50;
  camera.position.x = Math.sin(cameraAngle) * radius * 0.3;
  camera.position.z = Math.cos(cameraAngle) * radius * 0.3;
  camera.position.y = radius;
  camera.lookAt(0, 0, 0);
}

// Zoom with scroll
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomSpeed = 0.1;
  currentZoom += e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
  currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom));

  const newSize = frustumSize / currentZoom;
  camera.left = newSize * aspect / -2;
  camera.right = newSize * aspect / 2;
  camera.top = newSize / 2;
  camera.bottom = newSize / -2;
  camera.updateProjectionMatrix();
}, { passive: false });

// Pan with right mouse drag
let isPanning = false;
let panStart = new THREE.Vector2();
let targetOffset = new THREE.Vector3();

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 2) {
    isPanning = true;
    panStart.set(e.clientX, e.clientY);
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isPanning) {
    const deltaX = (e.clientX - panStart.x) * 0.05 / currentZoom;
    const deltaY = (e.clientY - panStart.y) * 0.05 / currentZoom;

    targetOffset.x -= deltaX;
    targetOffset.z -= deltaY;

    // Clamp panning
    targetOffset.x = Math.max(-10, Math.min(10, targetOffset.x));
    targetOffset.z = Math.max(-10, Math.min(10, targetOffset.z));

    panStart.set(e.clientX, e.clientY);
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (e.button === 2) isPanning = false;
});

// Handle placement
placement.onPlace = (elementType, position) => {
  const neighbors = findNeighbors(position.x, position.z, state.placements, elementType);
  const element = createElement(elementType, position, neighbors);

  if (element) {
    scene.add(element);
    const newPlacement = {
      type: elementType,
      mesh: element,
      position: position.clone()
    };
    state.placements.push(newPlacement);

    updateConnectedNeighbors(scene, state.placements, newPlacement);

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

  state.score = scoring.calculateScore(state.placements);

  updateUI(state, UNLOCK_THRESHOLDS);
  saveGame(state);
  audio.playRemove();
};

// Resize handler
window.addEventListener('resize', () => {
  const newAspect = window.innerWidth / window.innerHeight;
  const size = frustumSize / currentZoom;
  camera.left = size * newAspect / -2;
  camera.right = size * newAspect / 2;
  camera.top = size / 2;
  camera.bottom = size / -2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initial UI update
updateUI(state, UNLOCK_THRESHOLDS);

// Animation loop
const ROTATION_SPEED = 0.02;

function animate() {
  requestAnimationFrame(animate);

  // Handle Q/E camera rotation
  if (keysPressed.q) cameraAngle -= ROTATION_SPEED;
  if (keysPressed.e) cameraAngle += ROTATION_SPEED;

  // Apply pan offset
  camera.position.x = Math.sin(cameraAngle) * 15 + targetOffset.x;
  camera.position.z = Math.cos(cameraAngle) * 15 + targetOffset.z;
  camera.position.y = 50;
  camera.lookAt(targetOffset.x, 0, targetOffset.z);

  renderer.render(scene, camera);
}

animate();

// Start ambient audio after user interaction
document.addEventListener('click', () => {
  audio.startAmbient();
}, { once: true });
