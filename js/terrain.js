import * as THREE from 'three';

// Color palette
export const COLORS = {
  grass: 0x7ec850,
  fairway: 0x9ed670,
  green: 0x50c878,
  rough: 0x5a8f3d,
  bunker: 0xe8d4a8,
  water: 0x4a90b8,
  treeFoliage: 0x3d8c40,
  treeTrunk: 0x8b5a2b,
  clubhouseWalls: 0xf5f5f5,
  clubhouseRoof: 0x8b4513,
  cartPath: 0xd2b48c,
  flagPole: 0xffffff,
  flag: 0xff4444,
  rock: 0x808080,
  wheat: 0xdaa520,
  dirt: 0x8b7355,
  sheep: 0xf5f5f0,
  cow: 0x8b4513
};

// Terrain size - low poly for hex-tile vibe
const TERRAIN_SIZE = 30;
const TERRAIN_SEGMENTS = 16; // Much lower for chunky low-poly look

// Seeded random for consistent terrain
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function createTerrain(scene) {
  // Create low-poly terrain geometry
  const geometry = new THREE.PlaneGeometry(
    TERRAIN_SIZE,
    TERRAIN_SIZE,
    TERRAIN_SEGMENTS,
    TERRAIN_SEGMENTS
  );
  geometry.rotateX(-Math.PI / 2);

  // Displace vertices for gentle rolling hills
  const vertices = geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];

    // Gentler, chunkier hills for low-poly look
    let height = 0;
    height += Math.sin(x * 0.2) * Math.cos(z * 0.2) * 1.2;
    height += Math.sin(x * 0.1 + 1) * Math.cos(z * 0.15) * 0.6;

    vertices[i + 1] = height;
  }

  geometry.computeVertexNormals();

  // Color vertices based on height with some variation
  const colors = [];
  const baseColor = new THREE.Color(COLORS.grass);
  const darkColor = new THREE.Color(COLORS.rough);
  const lightColor = new THREE.Color(0x8fd860);

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];
    const height = vertices[i + 1];
    const normalizedHeight = (height + 2) / 4;

    const color = new THREE.Color();
    if (normalizedHeight < 0.4) {
      color.lerpColors(darkColor, baseColor, normalizedHeight / 0.4);
    } else {
      color.lerpColors(baseColor, lightColor, (normalizedHeight - 0.4) / 0.6);
    }

    // Add slight random variation
    const variation = seededRandom(x * 100 + z) * 0.1 - 0.05;
    color.r = Math.max(0, Math.min(1, color.r + variation));
    color.g = Math.max(0, Math.min(1, color.g + variation));

    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  // Flat shading for that low-poly hex look
  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    flatShading: true
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  terrain.name = 'terrain';
  scene.add(terrain);

  // Create water plane
  const waterGeometry = new THREE.PlaneGeometry(TERRAIN_SIZE * 1.5, TERRAIN_SIZE * 1.5, 8, 8);
  waterGeometry.rotateX(-Math.PI / 2);

  const waterMaterial = new THREE.MeshLambertMaterial({
    color: COLORS.water,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    flatShading: true
  });

  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.position.y = -2;
  water.name = 'water';
  scene.add(water);

  // Add decorative elements to make terrain feel lived-in
  const decorations = new THREE.Group();
  decorations.name = 'decorations';

  // Add scattered flowers
  addScatteredFlowers(decorations, terrain);

  // Add farmland patches
  addFarmlandPatches(decorations, terrain);

  // Add animals (sheep and cows)
  addAnimals(decorations, terrain);

  // Add small rocks
  addRocks(decorations, terrain);

  // Add small trees/bushes
  addBushes(decorations, terrain);

  scene.add(decorations);

  return { terrain, water, decorations };
}

function addScatteredFlowers(group, terrain) {
  const flowerColors = [0xff69b4, 0xffff00, 0xff6347, 0xffffff, 0x9370db, 0x87ceeb];

  for (let i = 0; i < 60; i++) {
    const x = (seededRandom(i * 7) - 0.5) * 26;
    const z = (seededRandom(i * 13) - 0.5) * 26;
    const y = getHeightAt(terrain, x, z);

    // Skip if too low (in water area)
    if (y < -0.5) continue;

    const flowerGroup = new THREE.Group();

    // Create small cluster of flowers
    const numFlowers = 3 + Math.floor(seededRandom(i * 17) * 4);
    for (let j = 0; j < numFlowers; j++) {
      const fx = (seededRandom(i * 100 + j) - 0.5) * 0.4;
      const fz = (seededRandom(i * 100 + j + 50) - 0.5) * 0.4;

      // Stem
      const stemGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 4);
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
      const stem = new THREE.Mesh(stemGeom, stemMat);
      stem.position.set(fx, 0.08, fz);

      // Flower head
      const flowerGeom = new THREE.SphereGeometry(0.05, 6, 6);
      const color = flowerColors[Math.floor(seededRandom(i * 200 + j) * flowerColors.length)];
      const flowerMat = new THREE.MeshLambertMaterial({ color });
      const flower = new THREE.Mesh(flowerGeom, flowerMat);
      flower.position.set(fx, 0.18, fz);

      flowerGroup.add(stem);
      flowerGroup.add(flower);
    }

    flowerGroup.position.set(x, y, z);
    group.add(flowerGroup);
  }
}

function addFarmlandPatches(group, terrain) {
  // Add a few wheat/crop field patches
  const patchPositions = [
    { x: -8, z: -8 },
    { x: 10, z: 6 },
    { x: -6, z: 10 },
    { x: 8, z: -10 }
  ];

  patchPositions.forEach((pos, idx) => {
    const y = getHeightAt(terrain, pos.x, pos.z);
    if (y < -0.3) return; // Skip low areas

    const patch = new THREE.Group();

    // Field base (darker dirt)
    const fieldGeom = new THREE.CircleGeometry(1.5, 6);
    fieldGeom.rotateX(-Math.PI / 2);
    const fieldMat = new THREE.MeshLambertMaterial({ color: COLORS.dirt });
    const field = new THREE.Mesh(fieldGeom, fieldMat);
    field.position.y = 0.02;
    patch.add(field);

    // Wheat stalks
    const numStalks = 20 + Math.floor(seededRandom(idx * 31) * 15);
    for (let i = 0; i < numStalks; i++) {
      const angle = seededRandom(idx * 100 + i) * Math.PI * 2;
      const radius = seededRandom(idx * 100 + i + 50) * 1.2;
      const sx = Math.cos(angle) * radius;
      const sz = Math.sin(angle) * radius;

      const stalkGeom = new THREE.CylinderGeometry(0.02, 0.03, 0.4, 4);
      const stalkMat = new THREE.MeshLambertMaterial({ color: COLORS.wheat });
      const stalk = new THREE.Mesh(stalkGeom, stalkMat);
      stalk.position.set(sx, 0.22, sz);

      // Slight random tilt
      stalk.rotation.x = (seededRandom(idx * 200 + i) - 0.5) * 0.3;
      stalk.rotation.z = (seededRandom(idx * 200 + i + 100) - 0.5) * 0.3;

      patch.add(stalk);
    }

    patch.position.set(pos.x, y, pos.z);
    group.add(patch);
  });
}

function addAnimals(group, terrain) {
  // Add sheep
  const sheepPositions = [
    { x: -10, z: 5 },
    { x: -9, z: 6 },
    { x: -11, z: 5.5 },
    { x: 6, z: -8 },
    { x: 7, z: -7 },
    { x: 5, z: -9 }
  ];

  sheepPositions.forEach((pos, idx) => {
    const y = getHeightAt(terrain, pos.x, pos.z);
    if (y < -0.3) return;

    const sheep = createSheep();
    sheep.position.set(pos.x, y, pos.z);
    sheep.rotation.y = seededRandom(idx * 41) * Math.PI * 2;
    group.add(sheep);
  });

  // Add cows
  const cowPositions = [
    { x: 8, z: 10 },
    { x: 9, z: 11 },
    { x: -12, z: -6 }
  ];

  cowPositions.forEach((pos, idx) => {
    const y = getHeightAt(terrain, pos.x, pos.z);
    if (y < -0.3) return;

    const cow = createCow();
    cow.position.set(pos.x, y, pos.z);
    cow.rotation.y = seededRandom(idx * 53) * Math.PI * 2;
    group.add(cow);
  });
}

function createSheep() {
  const sheep = new THREE.Group();

  // Body (fluffy ellipsoid)
  const bodyGeom = new THREE.SphereGeometry(0.25, 6, 6);
  bodyGeom.scale(1.2, 0.9, 1);
  const bodyMat = new THREE.MeshLambertMaterial({ color: COLORS.sheep });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.y = 0.25;
  body.castShadow = true;
  sheep.add(body);

  // Head
  const headGeom = new THREE.SphereGeometry(0.12, 6, 6);
  const headMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.set(0.25, 0.3, 0);
  head.castShadow = true;
  sheep.add(head);

  // Legs (simple cylinders)
  const legGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 4);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

  const legPositions = [
    [0.12, 0.1, 0.1],
    [0.12, 0.1, -0.1],
    [-0.12, 0.1, 0.1],
    [-0.12, 0.1, -0.1]
  ];

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(...pos);
    sheep.add(leg);
  });

  sheep.scale.setScalar(0.6);
  return sheep;
}

function createCow() {
  const cow = new THREE.Group();

  // Body
  const bodyGeom = new THREE.BoxGeometry(0.5, 0.35, 0.3);
  const bodyMat = new THREE.MeshLambertMaterial({ color: COLORS.cow });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.y = 0.35;
  body.castShadow = true;
  cow.add(body);

  // Spots (white patches)
  const spotGeom = new THREE.SphereGeometry(0.08, 6, 6);
  const spotMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const spot1 = new THREE.Mesh(spotGeom, spotMat);
  spot1.position.set(0.1, 0.4, 0.14);
  spot1.scale.set(1, 0.5, 1);
  cow.add(spot1);

  const spot2 = new THREE.Mesh(spotGeom, spotMat);
  spot2.position.set(-0.1, 0.35, -0.14);
  spot2.scale.set(0.8, 0.4, 0.8);
  cow.add(spot2);

  // Head
  const headGeom = new THREE.BoxGeometry(0.15, 0.2, 0.2);
  const head = new THREE.Mesh(headGeom, bodyMat);
  head.position.set(0.32, 0.4, 0);
  head.castShadow = true;
  cow.add(head);

  // Legs
  const legGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 4);
  const legMat = new THREE.MeshLambertMaterial({ color: COLORS.cow });

  const legPositions = [
    [0.15, 0.12, 0.1],
    [0.15, 0.12, -0.1],
    [-0.15, 0.12, 0.1],
    [-0.15, 0.12, -0.1]
  ];

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(...pos);
    cow.add(leg);
  });

  cow.scale.setScalar(0.7);
  return cow;
}

function addRocks(group, terrain) {
  for (let i = 0; i < 15; i++) {
    const x = (seededRandom(i * 23) - 0.5) * 26;
    const z = (seededRandom(i * 29) - 0.5) * 26;
    const y = getHeightAt(terrain, x, z);

    if (y < -0.3) continue;

    const rockGeom = new THREE.DodecahedronGeometry(0.15 + seededRandom(i * 37) * 0.15, 0);
    const rockMat = new THREE.MeshLambertMaterial({ color: COLORS.rock });
    const rock = new THREE.Mesh(rockGeom, rockMat);

    rock.position.set(x, y + 0.1, z);
    rock.rotation.set(
      seededRandom(i * 41) * Math.PI,
      seededRandom(i * 43) * Math.PI,
      seededRandom(i * 47) * Math.PI
    );
    rock.castShadow = true;

    group.add(rock);
  }
}

function addBushes(group, terrain) {
  for (let i = 0; i < 20; i++) {
    const x = (seededRandom(i * 61) - 0.5) * 26;
    const z = (seededRandom(i * 67) - 0.5) * 26;
    const y = getHeightAt(terrain, x, z);

    if (y < -0.3) continue;

    const bush = new THREE.Group();

    // Multiple spheres for bushy look
    const numBlobs = 2 + Math.floor(seededRandom(i * 71) * 3);
    for (let j = 0; j < numBlobs; j++) {
      const blobGeom = new THREE.SphereGeometry(0.2 + seededRandom(i * 100 + j) * 0.15, 6, 6);
      const blobMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(COLORS.treeFoliage).offsetHSL(0, 0, (seededRandom(i * 100 + j) - 0.5) * 0.1)
      });
      const blob = new THREE.Mesh(blobGeom, blobMat);

      blob.position.set(
        (seededRandom(i * 100 + j + 10) - 0.5) * 0.3,
        0.15 + seededRandom(i * 100 + j + 20) * 0.1,
        (seededRandom(i * 100 + j + 30) - 0.5) * 0.3
      );
      blob.castShadow = true;

      bush.add(blob);
    }

    bush.position.set(x, y, z);
    bush.scale.setScalar(0.6 + seededRandom(i * 73) * 0.4);
    group.add(bush);
  }
}

// Helper to get terrain height at a point
function getHeightAt(terrain, x, z) {
  const raycaster = new THREE.Raycaster();
  raycaster.set(
    new THREE.Vector3(x, 10, z),
    new THREE.Vector3(0, -1, 0)
  );

  const intersects = raycaster.intersectObject(terrain);
  if (intersects.length > 0) {
    return intersects[0].point.y;
  }
  return 0;
}

export function updateWater(water, time) {
  const vertices = water.geometry.attributes.position.array;

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];
    vertices[i + 1] = Math.sin(time * 0.5 + x * 0.3 + z * 0.3) * 0.1;
  }

  water.geometry.attributes.position.needsUpdate = true;
}

export function getTerrainHeight(terrain, x, z) {
  const raycaster = new THREE.Raycaster();
  raycaster.set(
    new THREE.Vector3(x, 10, z),
    new THREE.Vector3(0, -1, 0)
  );

  const intersects = raycaster.intersectObject(terrain);
  if (intersects.length > 0) {
    return intersects[0].point.y;
  }

  return 0;
}

export function getTerrainNormal(terrain, x, z) {
  const raycaster = new THREE.Raycaster();
  raycaster.set(
    new THREE.Vector3(x, 10, z),
    new THREE.Vector3(0, -1, 0)
  );

  const intersects = raycaster.intersectObject(terrain);
  if (intersects.length > 0) {
    return intersects[0].face.normal;
  }

  return new THREE.Vector3(0, 1, 0);
}
