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

// Grid size for connections (should match placement snap)
const GRID_SIZE = 0.5;
const CONNECTION_DISTANCE = GRID_SIZE * 1.5;

export function createElement(type, position, neighbors = { north: false, south: false, east: false, west: false }) {
  let element;

  switch (type) {
    case 'tee':
      element = createTeeBox();
      break;
    case 'fairway':
      element = createConnectableFairway(neighbors);
      break;
    case 'green':
      element = createGreen();
      break;
    case 'cartpath':
      element = createConnectablePath(neighbors);
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
  element.userData.elementType = type;
  element.userData.isPlaceable = true;
  element.userData.neighbors = neighbors;

  return element;
}

// Find neighbors for a given position in the placements array
export function findNeighbors(x, z, placements, matchType) {
  const neighbors = { north: false, south: false, east: false, west: false };

  for (const p of placements) {
    if (matchType && p.type !== matchType) continue;

    const dx = p.position.x - x;
    const dz = p.position.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < CONNECTION_DISTANCE && dist > 0.1) {
      // Determine direction
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

// Update all connected neighbors after placing a new tile
export function updateConnectedNeighbors(scene, placements, newPlacement) {
  const type = newPlacement.type;
  if (!ELEMENT_TYPES[type]?.connectable) return;

  const x = newPlacement.position.x;
  const z = newPlacement.position.z;

  // Find and update all neighbors of the same type
  for (const p of placements) {
    if (p === newPlacement) continue;
    if (p.type !== type) continue;

    const dx = p.position.x - x;
    const dz = p.position.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < CONNECTION_DISTANCE) {
      // This is a neighbor - update it
      const newNeighbors = findNeighbors(p.position.x, p.position.z, placements, type);

      // Remove old mesh and create new one with updated connections
      scene.remove(p.mesh);
      const newMesh = createElement(type, p.position, newNeighbors);
      scene.add(newMesh);
      p.mesh = newMesh;
      p.mesh.userData.neighbors = newNeighbors;
    }
  }

  // Also update the new placement itself with its neighbors
  const newNeighbors = findNeighbors(x, z, placements, type);
  scene.remove(newPlacement.mesh);
  const updatedMesh = createElement(type, newPlacement.position, newNeighbors);
  scene.add(updatedMesh);
  newPlacement.mesh = updatedMesh;
}

// Create connectable fairway that extends toward neighbors
function createConnectableFairway(neighbors) {
  const group = new THREE.Group();
  const fairwayMat = new THREE.MeshLambertMaterial({ color: COLORS.fairway });

  // Base circle
  const baseGeom = new THREE.CircleGeometry(0.6, 16);
  baseGeom.rotateX(-Math.PI / 2);
  const base = new THREE.Mesh(baseGeom, fairwayMat);
  base.position.y = 0.03;
  base.receiveShadow = true;
  group.add(base);

  // Add connection arms toward neighbors
  const armLength = 0.5;
  const armWidth = 0.8;

  if (neighbors.north) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(armWidth, 0.05, armLength),
      fairwayMat
    );
    arm.position.set(0, 0.03, -armLength / 2 - 0.3);
    arm.receiveShadow = true;
    group.add(arm);
  }

  if (neighbors.south) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(armWidth, 0.05, armLength),
      fairwayMat
    );
    arm.position.set(0, 0.03, armLength / 2 + 0.3);
    arm.receiveShadow = true;
    group.add(arm);
  }

  if (neighbors.east) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(armLength, 0.05, armWidth),
      fairwayMat
    );
    arm.position.set(armLength / 2 + 0.3, 0.03, 0);
    arm.receiveShadow = true;
    group.add(arm);
  }

  if (neighbors.west) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(armLength, 0.05, armWidth),
      fairwayMat
    );
    arm.position.set(-armLength / 2 - 0.3, 0.03, 0);
    arm.receiveShadow = true;
    group.add(arm);
  }

  return group;
}

// Create connectable cart path
function createConnectablePath(neighbors) {
  const group = new THREE.Group();
  const pathMat = new THREE.MeshLambertMaterial({ color: COLORS.cartPath });

  // Base circle (smaller than fairway)
  const baseGeom = new THREE.CircleGeometry(0.3, 12);
  baseGeom.rotateX(-Math.PI / 2);
  const base = new THREE.Mesh(baseGeom, pathMat);
  base.position.y = 0.04;
  base.receiveShadow = true;
  group.add(base);

  // Add connection arms toward neighbors
  const armLength = 0.5;
  const armWidth = 0.4;

  if (neighbors.north) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(armWidth, 0.05, armLength),
      pathMat
    );
    arm.position.set(0, 0.04, -armLength / 2 - 0.1);
    arm.receiveShadow = true;
    group.add(arm);
  }

  if (neighbors.south) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(armWidth, 0.05, armLength),
      pathMat
    );
    arm.position.set(0, 0.04, armLength / 2 + 0.1);
    arm.receiveShadow = true;
    group.add(arm);
  }

  if (neighbors.east) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(armLength, 0.05, armWidth),
      pathMat
    );
    arm.position.set(armLength / 2 + 0.1, 0.04, 0);
    arm.receiveShadow = true;
    group.add(arm);
  }

  if (neighbors.west) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(armLength, 0.05, armWidth),
      pathMat
    );
    arm.position.set(-armLength / 2 - 0.1, 0.04, 0);
    arm.receiveShadow = true;
    group.add(arm);
  }

  return group;
}

function createTeeBox() {
  const group = new THREE.Group();

  // Tee surface
  const teeGeom = new THREE.BoxGeometry(1.5, 0.1, 1);
  const teeMat = new THREE.MeshLambertMaterial({ color: COLORS.fairway });
  const tee = new THREE.Mesh(teeGeom, teeMat);
  tee.position.y = 0.05;
  tee.castShadow = true;
  tee.receiveShadow = true;
  group.add(tee);

  // Tee markers
  const markerGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8);
  const markerMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

  const marker1 = new THREE.Mesh(markerGeom, markerMat);
  marker1.position.set(-0.5, 0.15, 0);
  marker1.castShadow = true;
  group.add(marker1);

  const marker2 = new THREE.Mesh(markerGeom, markerMat);
  marker2.position.set(0.5, 0.15, 0);
  marker2.castShadow = true;
  group.add(marker2);

  return group;
}

function createGreen() {
  const group = new THREE.Group();

  // Green surface
  const greenGeom = new THREE.CircleGeometry(1.8, 32);
  greenGeom.rotateX(-Math.PI / 2);
  const greenMat = new THREE.MeshLambertMaterial({ color: COLORS.green });
  const green = new THREE.Mesh(greenGeom, greenMat);
  green.position.y = 0.05;
  green.receiveShadow = true;
  group.add(green);

  // Flag pole
  const poleGeom = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
  const poleMat = new THREE.MeshLambertMaterial({ color: COLORS.flagPole });
  const pole = new THREE.Mesh(poleGeom, poleMat);
  pole.position.set(0, 0.6, 0);
  pole.castShadow = true;
  group.add(pole);

  // Flag
  const flagGeom = new THREE.PlaneGeometry(0.4, 0.25);
  const flagMat = new THREE.MeshLambertMaterial({
    color: COLORS.flag,
    side: THREE.DoubleSide
  });
  const flag = new THREE.Mesh(flagGeom, flagMat);
  flag.position.set(0.2, 1.05, 0);
  flag.castShadow = true;
  group.add(flag);

  // Hole
  const holeGeom = new THREE.CircleGeometry(0.08, 16);
  holeGeom.rotateX(-Math.PI / 2);
  const holeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const hole = new THREE.Mesh(holeGeom, holeMat);
  hole.position.y = 0.06;
  group.add(hole);

  return group;
}

function createBunker() {
  const group = new THREE.Group();

  // Depression
  const bunkerGeom = new THREE.CircleGeometry(1.2, 24);
  bunkerGeom.rotateX(-Math.PI / 2);
  const bunkerMat = new THREE.MeshLambertMaterial({ color: COLORS.bunker });
  const bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
  bunker.position.y = -0.1;
  bunker.receiveShadow = true;
  group.add(bunker);

  // Rim
  const rimGeom = new THREE.RingGeometry(1.1, 1.3, 24);
  rimGeom.rotateX(-Math.PI / 2);
  const rimMat = new THREE.MeshLambertMaterial({ color: COLORS.rough });
  const rim = new THREE.Mesh(rimGeom, rimMat);
  rim.position.y = 0.02;
  group.add(rim);

  return group;
}

function createPond() {
  const group = new THREE.Group();

  const pondGeom = new THREE.CircleGeometry(1.5, 32);
  pondGeom.rotateX(-Math.PI / 2);
  const pondMat = new THREE.MeshLambertMaterial({
    color: COLORS.water,
    transparent: true,
    opacity: 0.9
  });
  const pond = new THREE.Mesh(pondGeom, pondMat);
  pond.position.y = -0.1;
  group.add(pond);

  // Edge grass
  const edgeGeom = new THREE.RingGeometry(1.4, 1.6, 32);
  edgeGeom.rotateX(-Math.PI / 2);
  const edgeMat = new THREE.MeshLambertMaterial({ color: COLORS.rough });
  const edge = new THREE.Mesh(edgeGeom, edgeMat);
  edge.position.y = 0.01;
  group.add(edge);

  return group;
}

function createTree() {
  const group = new THREE.Group();

  // Trunk
  const trunkGeom = new THREE.CylinderGeometry(0.12, 0.15, 0.6, 8);
  const trunkMat = new THREE.MeshLambertMaterial({ color: COLORS.treeTrunk });
  const trunk = new THREE.Mesh(trunkGeom, trunkMat);
  trunk.position.y = 0.3;
  trunk.castShadow = true;
  group.add(trunk);

  // Foliage
  const foliageGeom = new THREE.ConeGeometry(0.6, 1.5, 8);
  const foliageMat = new THREE.MeshLambertMaterial({ color: COLORS.treeFoliage });
  const foliage = new THREE.Mesh(foliageGeom, foliageMat);
  foliage.position.y = 1.3;
  foliage.castShadow = true;
  group.add(foliage);

  // Random scale variation
  const scale = 0.8 + Math.random() * 0.4;
  group.scale.setScalar(scale);

  return group;
}

function createTreeCluster() {
  const group = new THREE.Group();

  const numTrees = 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < numTrees; i++) {
    const tree = createTree();
    const angle = (i / numTrees) * Math.PI * 2 + Math.random() * 0.5;
    const radius = 0.4 + Math.random() * 0.8;
    tree.position.x = Math.cos(angle) * radius;
    tree.position.z = Math.sin(angle) * radius;
    tree.scale.setScalar(0.6 + Math.random() * 0.4);
    group.add(tree);
  }

  return group;
}

function createFlowers() {
  const group = new THREE.Group();

  const flowerColors = [0xff69b4, 0xffff00, 0xff6347, 0xffffff, 0x9370db];
  const numFlowers = 6 + Math.floor(Math.random() * 4);

  for (let i = 0; i < numFlowers; i++) {
    // Stem
    const stemGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 4);
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const stem = new THREE.Mesh(stemGeom, stemMat);

    // Flower head
    const flowerGeom = new THREE.SphereGeometry(0.06, 8, 8);
    const flowerMat = new THREE.MeshLambertMaterial({
      color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
    });
    const flower = new THREE.Mesh(flowerGeom, flowerMat);
    flower.position.y = 0.1;

    const flowerGroup = new THREE.Group();
    flowerGroup.add(stem);
    flowerGroup.add(flower);

    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.5;
    flowerGroup.position.x = Math.cos(angle) * radius;
    flowerGroup.position.z = Math.sin(angle) * radius;
    flowerGroup.position.y = 0.08;

    group.add(flowerGroup);
  }

  return group;
}

function createBoulder() {
  const group = new THREE.Group();

  const boulderGeom = new THREE.DodecahedronGeometry(0.4, 0);
  const boulderMat = new THREE.MeshLambertMaterial({ color: COLORS.rock });
  const boulder = new THREE.Mesh(boulderGeom, boulderMat);
  boulder.position.y = 0.25;
  boulder.rotation.x = Math.random() * Math.PI;
  boulder.rotation.y = Math.random() * Math.PI;
  boulder.castShadow = true;
  group.add(boulder);

  // Random scale
  const scale = 0.8 + Math.random() * 0.5;
  group.scale.setScalar(scale);

  return group;
}

function createClubhouse() {
  const group = new THREE.Group();

  // Main building
  const mainGeom = new THREE.BoxGeometry(3, 1.5, 2.5);
  const mainMat = new THREE.MeshLambertMaterial({ color: COLORS.clubhouseWalls });
  const main = new THREE.Mesh(mainGeom, mainMat);
  main.position.y = 0.75;
  main.castShadow = true;
  main.receiveShadow = true;
  group.add(main);

  // Roof
  const roofGeom = new THREE.ConeGeometry(2.2, 1.2, 4);
  const roofMat = new THREE.MeshLambertMaterial({ color: COLORS.clubhouseRoof });
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.y = 2.1;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // Door
  const doorGeom = new THREE.BoxGeometry(0.6, 1.2, 0.1);
  const doorMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
  const door = new THREE.Mesh(doorGeom, doorMat);
  door.position.set(0, 0.6, 1.3);
  group.add(door);

  // Windows
  const windowGeom = new THREE.BoxGeometry(0.4, 0.4, 0.1);
  const windowMat = new THREE.MeshLambertMaterial({ color: 0x87ceeb });

  const window1 = new THREE.Mesh(windowGeom, windowMat);
  window1.position.set(-0.9, 0.9, 1.3);
  group.add(window1);

  const window2 = new THREE.Mesh(windowGeom, windowMat);
  window2.position.set(0.9, 0.9, 1.3);
  group.add(window2);

  return group;
}

function createBridge() {
  const group = new THREE.Group();

  // Deck
  const deckGeom = new THREE.BoxGeometry(2.5, 0.15, 1);
  const deckMat = new THREE.MeshLambertMaterial({ color: COLORS.treeTrunk });
  const deck = new THREE.Mesh(deckGeom, deckMat);
  deck.position.y = 0.4;
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  // Posts
  const postGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
  const postMat = new THREE.MeshLambertMaterial({ color: COLORS.treeTrunk });

  const positions = [
    [-1, 0.1, 0.4],
    [-1, 0.1, -0.4],
    [1, 0.1, 0.4],
    [1, 0.1, -0.4]
  ];

  positions.forEach(pos => {
    const post = new THREE.Mesh(postGeom, postMat);
    post.position.set(...pos);
    post.castShadow = true;
    group.add(post);
  });

  // Railings
  const railGeom = new THREE.BoxGeometry(2.5, 0.08, 0.08);

  const rail1 = new THREE.Mesh(railGeom, deckMat);
  rail1.position.set(0, 0.7, 0.45);
  group.add(rail1);

  const rail2 = new THREE.Mesh(railGeom, deckMat);
  rail2.position.set(0, 0.7, -0.45);
  group.add(rail2);

  return group;
}

function createBench() {
  const group = new THREE.Group();

  const woodMat = new THREE.MeshLambertMaterial({ color: COLORS.treeTrunk });

  // Seat
  const seatGeom = new THREE.BoxGeometry(0.9, 0.06, 0.3);
  const seat = new THREE.Mesh(seatGeom, woodMat);
  seat.position.y = 0.35;
  seat.castShadow = true;
  group.add(seat);

  // Back
  const backGeom = new THREE.BoxGeometry(0.9, 0.4, 0.06);
  const back = new THREE.Mesh(backGeom, woodMat);
  back.position.set(0, 0.55, -0.12);
  back.castShadow = true;
  group.add(back);

  // Legs
  const legGeom = new THREE.BoxGeometry(0.06, 0.35, 0.28);

  const leg1 = new THREE.Mesh(legGeom, woodMat);
  leg1.position.set(-0.35, 0.18, 0);
  group.add(leg1);

  const leg2 = new THREE.Mesh(legGeom, woodMat);
  leg2.position.set(0.35, 0.18, 0);
  group.add(leg2);

  return group;
}

// Create a preview version (semi-transparent)
export function createPreviewElement(type) {
  const element = createElement(type, new THREE.Vector3(0, 0, 0));
  if (!element) return null;

  // Make all meshes semi-transparent
  element.traverse((child) => {
    if (child.isMesh) {
      child.material = child.material.clone();
      child.material.transparent = true;
      child.material.opacity = 0.5;
    }
  });

  element.userData.isPreview = true;

  return element;
}
