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
  rock: 0x808080
};

// Terrain size
const TERRAIN_SIZE = 30;
const TERRAIN_SEGMENTS = 64;

export function createTerrain(scene) {
  // Create terrain geometry with vertex displacement
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

    // Gentle rolling hills using multiple sine waves
    let height = 0;
    height += Math.sin(x * 0.3) * Math.cos(z * 0.3) * 1.5;
    height += Math.sin(x * 0.15 + 1) * Math.cos(z * 0.2) * 0.8;
    height += Math.sin(x * 0.5) * Math.sin(z * 0.4) * 0.3;

    vertices[i + 1] = height;
  }

  geometry.computeVertexNormals();

  // Color vertices based on height
  const colors = [];
  const baseColor = new THREE.Color(COLORS.grass);
  const darkColor = new THREE.Color(COLORS.rough);
  const lightColor = new THREE.Color(0x8fd860);

  for (let i = 0; i < vertices.length; i += 3) {
    const height = vertices[i + 1];
    const normalizedHeight = (height + 2) / 4; // Normalize to 0-1 range

    const color = new THREE.Color();
    if (normalizedHeight < 0.4) {
      color.lerpColors(darkColor, baseColor, normalizedHeight / 0.4);
    } else {
      color.lerpColors(baseColor, lightColor, (normalizedHeight - 0.4) / 0.6);
    }

    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  // Create material
  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
    side: THREE.DoubleSide
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  terrain.name = 'terrain';
  scene.add(terrain);

  // Create water plane (below terrain for visual depth)
  const waterGeometry = new THREE.PlaneGeometry(TERRAIN_SIZE * 1.5, TERRAIN_SIZE * 1.5, 32, 32);
  waterGeometry.rotateX(-Math.PI / 2);

  const waterMaterial = new THREE.MeshLambertMaterial({
    color: COLORS.water,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });

  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.position.y = -2;
  water.name = 'water';
  scene.add(water);

  return { terrain, water };
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
  // Create a raycaster pointing down
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
