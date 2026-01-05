import * as THREE from 'three';

// Mini Metro inspired color palette - rich, modern, minimalist
export const COLORS = {
  // Terrain
  grass: 0x8fbc8f,        // Soft sage green

  // Course elements
  fairway: 0x98d982,      // Fresh green
  green: 0x32cd32,        // Vibrant lime green
  tee: 0x66cdaa,          // Medium aquamarine

  // Hazards
  bunker: 0xf4d03f,       // Golden sand
  water: 0x5dade2,        // Clear blue

  // Paths
  cartPath: 0xe8e8e8,     // Light gray

  // Nature
  treeFoliage: 0x27ae60,  // Emerald green
  treeTrunk: 0x8b5a2b,    // Brown
  flowers: 0xe74c3c,      // Vibrant red
  rock: 0x95a5a6,         // Cool gray

  // Structures
  clubhouseWalls: 0xecf0f1, // Off white
  clubhouseRoof: 0xe74c3c,  // Red accent
  wood: 0xd35400,           // Orange-brown

  // UI accents
  flagPole: 0xffffff,
  flag: 0xe74c3c
};

const TERRAIN_SIZE = 24;

export function createTerrain(scene) {
  // Simple flat plane - clean minimalist look
  const geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshBasicMaterial({
    color: COLORS.grass,
    side: THREE.DoubleSide
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.position.y = 0;
  terrain.name = 'terrain';
  scene.add(terrain);

  // Add subtle grid lines for visual reference
  const gridHelper = new THREE.GridHelper(TERRAIN_SIZE, 24, 0x7aa87a, 0x7aa87a);
  gridHelper.position.y = 0.01;
  gridHelper.material.opacity = 0.3;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  // Add border/edge
  const borderGeom = new THREE.RingGeometry(TERRAIN_SIZE / 2 - 0.1, TERRAIN_SIZE / 2 + 0.1, 4);
  borderGeom.rotateX(-Math.PI / 2);
  borderGeom.rotateY(Math.PI / 4);
  const borderMat = new THREE.MeshBasicMaterial({
    color: 0x6b8e6b,
    side: THREE.DoubleSide
  });
  const border = new THREE.Mesh(borderGeom, borderMat);
  border.position.y = 0.02;
  scene.add(border);

  return terrain;
}

export function getTerrainHeight(terrain, x, z) {
  // Flat terrain - always return 0
  return 0;
}

export function getTerrainNormal(terrain, x, z) {
  return new THREE.Vector3(0, 1, 0);
}

// No water animation needed for minimalist style
export function updateWater() {}
