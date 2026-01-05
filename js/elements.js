import * as THREE from 'three';
import { COLORS } from './terrain.js';

export const ELEMENT_TYPES = {
  tee: { name: 'Tee Box', basePoints: 10, pack: 1 },
  fairway: { name: 'Fairway', basePoints: 5, pack: 1 },
  green: { name: 'Green', basePoints: 15, pack: 1 },
  cartpath: { name: 'Cart Path', basePoints: 5, pack: 1 },
  bunker: { name: 'Bunker', basePoints: 10, pack: 2 },
  pond: { name: 'Pond', basePoints: 20, pack: 2 },
  tree: { name: 'Tree', basePoints: 8, pack: 3 },
  treecluster: { name: 'Tree Cluster', basePoints: 20, pack: 3 },
  flowers: { name: 'Flowers', basePoints: 5, pack: 3 },
  boulder: { name: 'Boulder', basePoints: 8, pack: 3 },
  clubhouse: { name: 'Clubhouse', basePoints: 40, pack: 4 },
  bridge: { name: 'Bridge', basePoints: 25, pack: 4 },
  bench: { name: 'Bench', basePoints: 10, pack: 4 }
};

export function createElement(type, position) {
  let element;

  switch (type) {
    case 'tee':
      element = createTeeBox();
      break;
    case 'fairway':
      element = createFairway();
      break;
    case 'green':
      element = createGreen();
      break;
    case 'cartpath':
      element = createCartPath();
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

  return element;
}

function createTeeBox() {
  const group = new THREE.Group();

  // Tee surface
  const teeGeom = new THREE.BoxGeometry(2, 0.1, 1);
  const teeMat = new THREE.MeshLambertMaterial({ color: COLORS.fairway });
  const tee = new THREE.Mesh(teeGeom, teeMat);
  tee.position.y = 0.05;
  tee.castShadow = true;
  tee.receiveShadow = true;
  group.add(tee);

  // Tee markers
  const markerGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
  const markerMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

  const marker1 = new THREE.Mesh(markerGeom, markerMat);
  marker1.position.set(-0.7, 0.15, 0);
  marker1.castShadow = true;
  group.add(marker1);

  const marker2 = new THREE.Mesh(markerGeom, markerMat);
  marker2.position.set(0.7, 0.15, 0);
  marker2.castShadow = true;
  group.add(marker2);

  return group;
}

function createFairway() {
  const group = new THREE.Group();

  const fairwayGeom = new THREE.BoxGeometry(3, 0.05, 2);
  const fairwayMat = new THREE.MeshLambertMaterial({ color: COLORS.fairway });
  const fairway = new THREE.Mesh(fairwayGeom, fairwayMat);
  fairway.position.y = 0.03;
  fairway.receiveShadow = true;
  group.add(fairway);

  return group;
}

function createGreen() {
  const group = new THREE.Group();

  // Green surface
  const greenGeom = new THREE.CircleGeometry(2.5, 32);
  greenGeom.rotateX(-Math.PI / 2);
  const greenMat = new THREE.MeshLambertMaterial({ color: COLORS.green });
  const green = new THREE.Mesh(greenGeom, greenMat);
  green.position.y = 0.05;
  green.receiveShadow = true;
  group.add(green);

  // Flag pole
  const poleGeom = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8);
  const poleMat = new THREE.MeshLambertMaterial({ color: COLORS.flagPole });
  const pole = new THREE.Mesh(poleGeom, poleMat);
  pole.position.set(0, 0.75, 0);
  pole.castShadow = true;
  group.add(pole);

  // Flag
  const flagGeom = new THREE.PlaneGeometry(0.5, 0.3);
  const flagMat = new THREE.MeshLambertMaterial({
    color: COLORS.flag,
    side: THREE.DoubleSide
  });
  const flag = new THREE.Mesh(flagGeom, flagMat);
  flag.position.set(0.25, 1.35, 0);
  flag.castShadow = true;
  group.add(flag);

  // Hole
  const holeGeom = new THREE.CircleGeometry(0.1, 16);
  holeGeom.rotateX(-Math.PI / 2);
  const holeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const hole = new THREE.Mesh(holeGeom, holeMat);
  hole.position.y = 0.06;
  group.add(hole);

  return group;
}

function createCartPath() {
  const group = new THREE.Group();

  const pathGeom = new THREE.BoxGeometry(2, 0.05, 0.6);
  const pathMat = new THREE.MeshLambertMaterial({ color: COLORS.cartPath });
  const path = new THREE.Mesh(pathGeom, pathMat);
  path.position.y = 0.03;
  path.receiveShadow = true;
  group.add(path);

  return group;
}

function createBunker() {
  const group = new THREE.Group();

  // Depression
  const bunkerGeom = new THREE.CircleGeometry(1.5, 24);
  bunkerGeom.rotateX(-Math.PI / 2);
  const bunkerMat = new THREE.MeshLambertMaterial({ color: COLORS.bunker });
  const bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
  bunker.position.y = -0.15;
  bunker.receiveShadow = true;
  group.add(bunker);

  // Rim
  const rimGeom = new THREE.RingGeometry(1.4, 1.6, 24);
  rimGeom.rotateX(-Math.PI / 2);
  const rimMat = new THREE.MeshLambertMaterial({ color: COLORS.rough });
  const rim = new THREE.Mesh(rimGeom, rimMat);
  rim.position.y = 0.02;
  group.add(rim);

  return group;
}

function createPond() {
  const group = new THREE.Group();

  const pondGeom = new THREE.CircleGeometry(2, 32);
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
  const edgeGeom = new THREE.RingGeometry(1.9, 2.2, 32);
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
  const trunkGeom = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8);
  const trunkMat = new THREE.MeshLambertMaterial({ color: COLORS.treeTrunk });
  const trunk = new THREE.Mesh(trunkGeom, trunkMat);
  trunk.position.y = 0.4;
  trunk.castShadow = true;
  group.add(trunk);

  // Foliage
  const foliageGeom = new THREE.ConeGeometry(0.8, 2, 8);
  const foliageMat = new THREE.MeshLambertMaterial({ color: COLORS.treeFoliage });
  const foliage = new THREE.Mesh(foliageGeom, foliageMat);
  foliage.position.y = 1.8;
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
    const radius = 0.5 + Math.random() * 1;
    tree.position.x = Math.cos(angle) * radius;
    tree.position.z = Math.sin(angle) * radius;
    tree.scale.setScalar(0.7 + Math.random() * 0.5);
    group.add(tree);
  }

  return group;
}

function createFlowers() {
  const group = new THREE.Group();

  const flowerColors = [0xff69b4, 0xffff00, 0xff6347, 0xffffff, 0x9370db];
  const numFlowers = 8 + Math.floor(Math.random() * 5);

  for (let i = 0; i < numFlowers; i++) {
    // Stem
    const stemGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 4);
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const stem = new THREE.Mesh(stemGeom, stemMat);

    // Flower head
    const flowerGeom = new THREE.SphereGeometry(0.08, 8, 8);
    const flowerMat = new THREE.MeshLambertMaterial({
      color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
    });
    const flower = new THREE.Mesh(flowerGeom, flowerMat);
    flower.position.y = 0.12;

    const flowerGroup = new THREE.Group();
    flowerGroup.add(stem);
    flowerGroup.add(flower);

    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.8;
    flowerGroup.position.x = Math.cos(angle) * radius;
    flowerGroup.position.z = Math.sin(angle) * radius;
    flowerGroup.position.y = 0.1;

    group.add(flowerGroup);
  }

  return group;
}

function createBoulder() {
  const group = new THREE.Group();

  const boulderGeom = new THREE.DodecahedronGeometry(0.6, 0);
  const boulderMat = new THREE.MeshLambertMaterial({ color: COLORS.rock });
  const boulder = new THREE.Mesh(boulderGeom, boulderMat);
  boulder.position.y = 0.3;
  boulder.rotation.x = Math.random() * Math.PI;
  boulder.rotation.y = Math.random() * Math.PI;
  boulder.castShadow = true;
  group.add(boulder);

  // Random scale
  const scale = 0.7 + Math.random() * 0.6;
  group.scale.setScalar(scale);

  return group;
}

function createClubhouse() {
  const group = new THREE.Group();

  // Main building
  const mainGeom = new THREE.BoxGeometry(4, 2, 3);
  const mainMat = new THREE.MeshLambertMaterial({ color: COLORS.clubhouseWalls });
  const main = new THREE.Mesh(mainGeom, mainMat);
  main.position.y = 1;
  main.castShadow = true;
  main.receiveShadow = true;
  group.add(main);

  // Roof
  const roofGeom = new THREE.ConeGeometry(3, 1.5, 4);
  const roofMat = new THREE.MeshLambertMaterial({ color: COLORS.clubhouseRoof });
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.y = 2.75;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // Door
  const doorGeom = new THREE.BoxGeometry(0.8, 1.5, 0.1);
  const doorMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
  const door = new THREE.Mesh(doorGeom, doorMat);
  door.position.set(0, 0.75, 1.55);
  group.add(door);

  // Windows
  const windowGeom = new THREE.BoxGeometry(0.5, 0.5, 0.1);
  const windowMat = new THREE.MeshLambertMaterial({ color: 0x87ceeb });

  const window1 = new THREE.Mesh(windowGeom, windowMat);
  window1.position.set(-1.2, 1.2, 1.55);
  group.add(window1);

  const window2 = new THREE.Mesh(windowGeom, windowMat);
  window2.position.set(1.2, 1.2, 1.55);
  group.add(window2);

  return group;
}

function createBridge() {
  const group = new THREE.Group();

  // Deck
  const deckGeom = new THREE.BoxGeometry(3, 0.2, 1.2);
  const deckMat = new THREE.MeshLambertMaterial({ color: COLORS.treeTrunk });
  const deck = new THREE.Mesh(deckGeom, deckMat);
  deck.position.y = 0.5;
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  // Posts
  const postGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
  const postMat = new THREE.MeshLambertMaterial({ color: COLORS.treeTrunk });

  const positions = [
    [-1.3, 0.1, 0.5],
    [-1.3, 0.1, -0.5],
    [1.3, 0.1, 0.5],
    [1.3, 0.1, -0.5]
  ];

  positions.forEach(pos => {
    const post = new THREE.Mesh(postGeom, postMat);
    post.position.set(...pos);
    post.castShadow = true;
    group.add(post);
  });

  // Railings
  const railGeom = new THREE.BoxGeometry(3, 0.1, 0.1);

  const rail1 = new THREE.Mesh(railGeom, deckMat);
  rail1.position.set(0, 0.9, 0.55);
  group.add(rail1);

  const rail2 = new THREE.Mesh(railGeom, deckMat);
  rail2.position.set(0, 0.9, -0.55);
  group.add(rail2);

  return group;
}

function createBench() {
  const group = new THREE.Group();

  const woodMat = new THREE.MeshLambertMaterial({ color: COLORS.treeTrunk });

  // Seat
  const seatGeom = new THREE.BoxGeometry(1.2, 0.08, 0.4);
  const seat = new THREE.Mesh(seatGeom, woodMat);
  seat.position.y = 0.4;
  seat.castShadow = true;
  group.add(seat);

  // Back
  const backGeom = new THREE.BoxGeometry(1.2, 0.5, 0.08);
  const back = new THREE.Mesh(backGeom, woodMat);
  back.position.set(0, 0.65, -0.16);
  back.castShadow = true;
  group.add(back);

  // Legs
  const legGeom = new THREE.BoxGeometry(0.08, 0.4, 0.35);

  const leg1 = new THREE.Mesh(legGeom, woodMat);
  leg1.position.set(-0.5, 0.2, 0);
  group.add(leg1);

  const leg2 = new THREE.Mesh(legGeom, woodMat);
  leg2.position.set(0.5, 0.2, 0);
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
