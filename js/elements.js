import * as THREE from 'three';
import { COLORS } from './terrain.js';

export const ELEMENT_TYPES = {
  tee: { name: 'Tee Box', basePoints: 10, pack: 1, connectable: false },
  fairway: { name: 'Fairway', basePoints: 5, pack: 1, connectable: true },
  green: { name: 'Green', basePoints: 15, pack: 1, connectable: false },
  cartpath: { name: 'Cart Path', basePoints: 5, pack: 1, connectable: true },
  bunker: { name: 'Bunker', basePoints: 10, pack: 2, connectable: false },
  pond: { name: 'Pond', basePoints: 20, pack: 2, connectable: false },
  tree: { name: 'Tree', basePoints: 8, pack: 3, connectable: false },
  treecluster: { name: 'Tree Cluster', basePoints: 20, pack: 3, connectable: false },
  flowers: { name: 'Flowers', basePoints: 5, pack: 3, connectable: false },
  boulder: { name: 'Boulder', basePoints: 8, pack: 3, connectable: false },
  clubhouse: { name: 'Clubhouse', basePoints: 40, pack: 4, connectable: false },
  bridge: { name: 'Bridge', basePoints: 25, pack: 4, connectable: false },
  bench: { name: 'Bench', basePoints: 10, pack: 4, connectable: false }
};

const GRID_SIZE = 0.5;
const CONNECTION_DISTANCE = GRID_SIZE * 1.5;

export function createElement(type, position, neighbors = { north: false, south: false, east: false, west: false }) {
  let element;

  switch (type) {
    case 'tee':
      element = createTeeBox();
      break;
    case 'fairway':
      element = createFairway(neighbors);
      break;
    case 'green':
      element = createGreen();
      break;
    case 'cartpath':
      element = createPath(neighbors);
      break;
    case 'bunker':
      element = createBunker();
      break;
    case 'pond':
      element = createPond();
      break;
    case 'tree':
      element = createTree();
      break;
    case 'treecluster':
      element = createTreeCluster();
      break;
    case 'flowers':
      element = createFlowers();
      break;
    case 'boulder':
      element = createBoulder();
      break;
    case 'clubhouse':
      element = createClubhouse();
      break;
    case 'bridge':
      element = createBridge();
      break;
    case 'bench':
      element = createBench();
      break;
    default:
      return null;
  }

  element.position.copy(position);
  element.position.y = 0.01; // Slightly above terrain
  element.userData.elementType = type;
  element.userData.isPlaceable = true;
  element.userData.neighbors = neighbors;

  return element;
}

export function findNeighbors(x, z, placements, matchType) {
  const neighbors = { north: false, south: false, east: false, west: false };

  for (const p of placements) {
    if (matchType && p.type !== matchType) continue;

    const dx = p.position.x - x;
    const dz = p.position.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < CONNECTION_DISTANCE && dist > 0.1) {
      if (Math.abs(dz) > Math.abs(dx)) {
        if (dz < 0) neighbors.north = true;
        else neighbors.south = true;
      } else {
        if (dx > 0) neighbors.east = true;
        else neighbors.west = true;
      }
    }
  }

  return neighbors;
}

export function updateConnectedNeighbors(scene, placements, newPlacement) {
  const type = newPlacement.type;
  if (!ELEMENT_TYPES[type]?.connectable) return;

  const x = newPlacement.position.x;
  const z = newPlacement.position.z;

  for (const p of placements) {
    if (p === newPlacement) continue;
    if (p.type !== type) continue;

    const dx = p.position.x - x;
    const dz = p.position.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < CONNECTION_DISTANCE) {
      const newNeighbors = findNeighbors(p.position.x, p.position.z, placements, type);
      scene.remove(p.mesh);
      const newMesh = createElement(type, p.position, newNeighbors);
      scene.add(newMesh);
      p.mesh = newMesh;
      p.mesh.userData.neighbors = newNeighbors;
    }
  }

  const newNeighbors = findNeighbors(x, z, placements, type);
  scene.remove(newPlacement.mesh);
  const updatedMesh = createElement(type, newPlacement.position, newNeighbors);
  scene.add(updatedMesh);
  newPlacement.mesh = updatedMesh;
}

// Clean flat circle helper
function createCircle(radius, color) {
  const geom = new THREE.CircleGeometry(radius, 32);
  geom.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  return new THREE.Mesh(geom, mat);
}

// Clean rectangle helper
function createRect(width, height, color) {
  const geom = new THREE.PlaneGeometry(width, height);
  geom.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  return new THREE.Mesh(geom, mat);
}

// Rounded rectangle helper
function createRoundedRect(width, height, radius, color) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  const geom = new THREE.ShapeGeometry(shape);
  geom.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  return new THREE.Mesh(geom, mat);
}

function createTeeBox() {
  const group = new THREE.Group();

  // Rounded rectangle tee
  const tee = createRoundedRect(1.2, 0.8, 0.15, COLORS.tee);
  tee.position.y = 0.01;
  group.add(tee);

  // Two small marker dots
  const marker1 = createCircle(0.08, 0xffffff);
  marker1.position.set(-0.35, 0.02, 0);
  group.add(marker1);

  const marker2 = createCircle(0.08, 0xffffff);
  marker2.position.set(0.35, 0.02, 0);
  group.add(marker2);

  return group;
}

function createFairway(neighbors) {
  const group = new THREE.Group();

  // Base circle
  const base = createCircle(0.4, COLORS.fairway);
  base.position.y = 0.01;
  group.add(base);

  // Connection arms
  const armLength = 0.35;
  const armWidth = 0.5;

  if (neighbors.north) {
    const arm = createRect(armWidth, armLength, COLORS.fairway);
    arm.position.set(0, 0.01, -armLength / 2 - 0.2);
    group.add(arm);
  }
  if (neighbors.south) {
    const arm = createRect(armWidth, armLength, COLORS.fairway);
    arm.position.set(0, 0.01, armLength / 2 + 0.2);
    group.add(arm);
  }
  if (neighbors.east) {
    const arm = createRect(armLength, armWidth, COLORS.fairway);
    arm.position.set(armLength / 2 + 0.2, 0.01, 0);
    group.add(arm);
  }
  if (neighbors.west) {
    const arm = createRect(armLength, armWidth, COLORS.fairway);
    arm.position.set(-armLength / 2 - 0.2, 0.01, 0);
    group.add(arm);
  }

  return group;
}

function createGreen() {
  const group = new THREE.Group();

  // Main green circle
  const green = createCircle(1.2, COLORS.green);
  green.position.y = 0.01;
  group.add(green);

  // Flag pole (thin line)
  const poleGeom = new THREE.CylinderGeometry(0.02, 0.02, 1, 8);
  const poleMat = new THREE.MeshBasicMaterial({ color: COLORS.flagPole });
  const pole = new THREE.Mesh(poleGeom, poleMat);
  pole.position.y = 0.5;
  group.add(pole);

  // Flag (small triangle)
  const flagShape = new THREE.Shape();
  flagShape.moveTo(0, 0);
  flagShape.lineTo(0.3, 0.1);
  flagShape.lineTo(0, 0.2);
  flagShape.closePath();

  const flagGeom = new THREE.ShapeGeometry(flagShape);
  const flagMat = new THREE.MeshBasicMaterial({ color: COLORS.flag, side: THREE.DoubleSide });
  const flag = new THREE.Mesh(flagGeom, flagMat);
  flag.position.set(0, 0.85, 0);
  flag.rotation.y = -Math.PI / 2;
  group.add(flag);

  // Hole (small dark circle)
  const hole = createCircle(0.06, 0x333333);
  hole.position.y = 0.02;
  group.add(hole);

  return group;
}

function createPath(neighbors) {
  const group = new THREE.Group();

  // Base circle
  const base = createCircle(0.25, COLORS.cartPath);
  base.position.y = 0.01;
  group.add(base);

  const armLength = 0.35;
  const armWidth = 0.35;

  if (neighbors.north) {
    const arm = createRect(armWidth, armLength, COLORS.cartPath);
    arm.position.set(0, 0.01, -armLength / 2 - 0.1);
    group.add(arm);
  }
  if (neighbors.south) {
    const arm = createRect(armWidth, armLength, COLORS.cartPath);
    arm.position.set(0, 0.01, armLength / 2 + 0.1);
    group.add(arm);
  }
  if (neighbors.east) {
    const arm = createRect(armLength, armWidth, COLORS.cartPath);
    arm.position.set(armLength / 2 + 0.1, 0.01, 0);
    group.add(arm);
  }
  if (neighbors.west) {
    const arm = createRect(armLength, armWidth, COLORS.cartPath);
    arm.position.set(-armLength / 2 - 0.1, 0.01, 0);
    group.add(arm);
  }

  return group;
}

function createBunker() {
  const group = new THREE.Group();

  // Simple golden circle
  const bunker = createCircle(0.8, COLORS.bunker);
  bunker.position.y = 0.01;
  group.add(bunker);

  return group;
}

function createPond() {
  const group = new THREE.Group();

  // Blue circle with darker edge ring
  const water = createCircle(1, COLORS.water);
  water.position.y = 0.01;
  group.add(water);

  // Inner highlight
  const highlight = createCircle(0.7, 0x85c1e9);
  highlight.position.y = 0.015;
  group.add(highlight);

  return group;
}

function createTree() {
  const group = new THREE.Group();

  // Simple circle for tree canopy
  const canopy = createCircle(0.5, COLORS.treeFoliage);
  canopy.position.y = 0.01;
  group.add(canopy);

  // Small center dot for trunk indication
  const trunk = createCircle(0.1, 0x1e8449);
  trunk.position.y = 0.015;
  group.add(trunk);

  return group;
}

function createTreeCluster() {
  const group = new THREE.Group();

  // Overlapping circles for cluster effect
  const positions = [
    { x: 0, z: 0, size: 0.6 },
    { x: 0.4, z: 0.3, size: 0.45 },
    { x: -0.35, z: 0.25, size: 0.4 },
    { x: 0.2, z: -0.35, size: 0.5 }
  ];

  positions.forEach((pos, i) => {
    const shade = i % 2 === 0 ? COLORS.treeFoliage : 0x229954;
    const tree = createCircle(pos.size, shade);
    tree.position.set(pos.x, 0.01 + i * 0.002, pos.z);
    group.add(tree);
  });

  return group;
}

function createFlowers() {
  const group = new THREE.Group();

  // Cluster of small colored dots
  const colors = [0xe74c3c, 0xf39c12, 0x9b59b6, 0xe74c3c, 0xf1c40f];
  const positions = [
    { x: 0, z: 0 },
    { x: 0.15, z: 0.1 },
    { x: -0.12, z: 0.12 },
    { x: 0.1, z: -0.15 },
    { x: -0.15, z: -0.08 }
  ];

  positions.forEach((pos, i) => {
    const flower = createCircle(0.08, colors[i]);
    flower.position.set(pos.x, 0.015, pos.z);
    group.add(flower);
  });

  // Green base
  const base = createCircle(0.3, 0x27ae60);
  base.position.y = 0.01;
  group.add(base);

  return group;
}

function createBoulder() {
  const group = new THREE.Group();

  // Simple gray circle
  const rock = createCircle(0.35, COLORS.rock);
  rock.position.y = 0.01;
  group.add(rock);

  // Lighter highlight
  const highlight = createCircle(0.15, 0xbdc3c7);
  highlight.position.set(-0.08, 0.015, -0.05);
  group.add(highlight);

  return group;
}

function createClubhouse() {
  const group = new THREE.Group();

  // Main building rectangle
  const building = createRoundedRect(2, 1.5, 0.2, COLORS.clubhouseWalls);
  building.position.y = 0.01;
  group.add(building);

  // Roof accent stripe
  const roof = createRect(2, 0.3, COLORS.clubhouseRoof);
  roof.position.set(0, 0.015, -0.4);
  group.add(roof);

  // Door
  const door = createRect(0.3, 0.4, COLORS.wood);
  door.position.set(0, 0.02, 0.4);
  group.add(door);

  // Windows
  const window1 = createRect(0.25, 0.25, 0x5dade2);
  window1.position.set(-0.5, 0.02, 0);
  group.add(window1);

  const window2 = createRect(0.25, 0.25, 0x5dade2);
  window2.position.set(0.5, 0.02, 0);
  group.add(window2);

  return group;
}

function createBridge() {
  const group = new THREE.Group();

  // Bridge deck
  const deck = createRoundedRect(1.8, 0.8, 0.1, COLORS.wood);
  deck.position.y = 0.01;
  group.add(deck);

  // Rail lines
  const rail1 = createRect(1.8, 0.08, 0xa04000);
  rail1.position.set(0, 0.015, 0.3);
  group.add(rail1);

  const rail2 = createRect(1.8, 0.08, 0xa04000);
  rail2.position.set(0, 0.015, -0.3);
  group.add(rail2);

  return group;
}

function createBench() {
  const group = new THREE.Group();

  // Seat
  const seat = createRoundedRect(0.8, 0.3, 0.05, COLORS.wood);
  seat.position.y = 0.01;
  group.add(seat);

  // Back
  const back = createRect(0.8, 0.1, 0xa04000);
  back.position.set(0, 0.015, -0.15);
  group.add(back);

  return group;
}

export function createPreviewElement(type) {
  const element = createElement(type, new THREE.Vector3(0, 0, 0));
  if (!element) return null;

  element.traverse((child) => {
    if (child.isMesh) {
      child.material = child.material.clone();
      child.material.transparent = true;
      child.material.opacity = 0.6;
    }
  });

  element.userData.isPreview = true;
  return element;
}
