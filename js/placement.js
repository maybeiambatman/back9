import * as THREE from 'three';
import { createPreviewElement, ELEMENT_TYPES } from './elements.js';
import { getTerrainHeight } from './terrain.js';

export class PlacementSystem {
  constructor(scene, camera, terrain, state, scoring, audio) {
    this.scene = scene;
    this.camera = camera;
    this.terrain = terrain;
    this.state = state;
    this.scoring = scoring;
    this.audio = audio;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.preview = null;
    this.previewType = null;

    // Drag building state
    this.isDragging = false;
    this.lastPlacedPosition = null;

    this.onPlace = null;
    this.onRemove = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const canvas = document.getElementById('canvas');

    canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
  }

  handleMouseMove(event) {
    // Update mouse coordinates
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (!this.state.selectedElement) {
      this.clearPreview();
      this.hidePointPreview();
      return;
    }

    // Create preview if needed
    if (this.previewType !== this.state.selectedElement) {
      this.clearPreview();
      this.preview = createPreviewElement(this.state.selectedElement);
      if (this.preview) {
        this.scene.add(this.preview);
        this.previewType = this.state.selectedElement;
      }
    }

    // Raycast to terrain
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.terrain);

    if (intersects.length > 0 && this.preview) {
      const point = intersects[0].point;

      // Snap to grid
      const snappedX = Math.round(point.x * 2) / 2;
      const snappedZ = Math.round(point.z * 2) / 2;
      const height = getTerrainHeight(this.terrain, snappedX, snappedZ);

      this.preview.position.set(snappedX, height, snappedZ);
      this.preview.visible = true;

      // Check validity and show point preview
      const validity = this.checkValidity(snappedX, snappedZ);
      this.updatePreviewColor(validity.valid);
      this.showPointPreview(event.clientX, event.clientY, validity.points, validity.valid);

      // If dragging, try to place
      if (this.isDragging && validity.valid) {
        const posKey = `${snappedX},${snappedZ}`;
        if (this.lastPlacedPosition !== posKey) {
          this.placeElement(snappedX, snappedZ, height);
          this.lastPlacedPosition = posKey;
        }
      }
    } else if (this.preview) {
      this.preview.visible = false;
      this.hidePointPreview();
    }
  }

  handleMouseDown(event) {
    // Only left click
    if (event.button !== 0) return;

    // Check if clicking on UI
    if (event.target.closest('.ui-panel, .element-tray, .icon-btn, .element-btn')) {
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // First, check if clicking on an existing element to remove it
    const placedMeshes = this.state.placements.map(p => p.mesh);
    const elementIntersects = this.raycaster.intersectObjects(placedMeshes, true);

    if (elementIntersects.length > 0 && !this.state.selectedElement) {
      // Find which placement this belongs to
      let targetMesh = elementIntersects[0].object;
      while (targetMesh.parent && !targetMesh.userData.isPlaceable) {
        targetMesh = targetMesh.parent;
      }

      const placementIndex = this.state.placements.findIndex(p => p.mesh === targetMesh);
      if (placementIndex !== -1 && this.onRemove) {
        this.onRemove(placementIndex);
      }
      return;
    }

    // Start drag building if element is selected
    if (this.state.selectedElement) {
      this.isDragging = true;
      this.lastPlacedPosition = null;

      // Try to place at current position
      const terrainIntersects = this.raycaster.intersectObject(this.terrain);
      if (terrainIntersects.length > 0) {
        const point = terrainIntersects[0].point;
        const snappedX = Math.round(point.x * 2) / 2;
        const snappedZ = Math.round(point.z * 2) / 2;
        const height = getTerrainHeight(this.terrain, snappedX, snappedZ);

        const validity = this.checkValidity(snappedX, snappedZ);
        if (validity.valid) {
          this.placeElement(snappedX, snappedZ, height);
          this.lastPlacedPosition = `${snappedX},${snappedZ}`;
        } else {
          this.audio.playError();
        }
      }
    }
  }

  handleMouseUp(event) {
    if (event.button === 0) {
      this.isDragging = false;
      this.lastPlacedPosition = null;
    }
  }

  placeElement(x, z, height) {
    const position = new THREE.Vector3(x, height, z);

    if (this.onPlace) {
      this.onPlace(this.state.selectedElement, position);
    }
    // Note: Selection stays active - no clearing here!
  }

  checkValidity(x, z) {
    const type = this.state.selectedElement;
    if (!type) return { valid: false, points: 0 };

    const basePoints = ELEMENT_TYPES[type]?.basePoints || 0;
    let bonusPoints = 0;
    let valid = true;

    // Check for overlapping elements
    const minDistance = this.getMinDistance(type);
    for (const placement of this.state.placements) {
      const dist = Math.sqrt(
        Math.pow(placement.position.x - x, 2) +
        Math.pow(placement.position.z - z, 2)
      );

      if (dist < minDistance) {
        // Special case: some elements can be close
        if (!this.canBeAdjacent(type, placement.type)) {
          valid = false;
          break;
        }
      }

      // Prevent exact overlap
      if (dist < 0.1) {
        valid = false;
        break;
      }
    }

    // Check bounds
    if (Math.abs(x) > 14 || Math.abs(z) > 14) {
      valid = false;
    }

    // Calculate bonus points
    if (valid) {
      bonusPoints = this.scoring.calculateBonusForPlacement(
        type,
        new THREE.Vector3(x, 0, z),
        this.state.placements
      );
    }

    return {
      valid,
      points: valid ? basePoints + bonusPoints : 0
    };
  }

  getMinDistance(type) {
    switch (type) {
      case 'green':
      case 'tee':
        return 1.5;
      case 'fairway':
      case 'cartpath':
        return 0.3; // Allow closer placement for continuous paths
      case 'bunker':
      case 'pond':
        return 1.0;
      case 'tree':
        return 0.8;
      case 'treecluster':
        return 2.0;
      case 'clubhouse':
        return 3.0;
      case 'bridge':
        return 2.0;
      default:
        return 0.5;
    }
  }

  canBeAdjacent(type1, type2) {
    // Some elements can be placed close together
    const adjacentPairs = [
      ['fairway', 'fairway'],
      ['cartpath', 'cartpath'],
      ['fairway', 'tee'],
      ['fairway', 'green'],
      ['flowers', 'flowers'],
      ['tree', 'tree'],
      ['fairway', 'cartpath']
    ];

    return adjacentPairs.some(pair =>
      (pair[0] === type1 && pair[1] === type2) ||
      (pair[0] === type2 && pair[1] === type1)
    );
  }

  updatePreviewColor(valid) {
    if (!this.preview) return;

    const color = valid ? 0x00ff00 : 0xff0000;

    this.preview.traverse((child) => {
      if (child.isMesh) {
        child.material.emissive = new THREE.Color(color);
        child.material.emissiveIntensity = 0.3;
      }
    });
  }

  showPointPreview(clientX, clientY, points, valid) {
    const preview = document.getElementById('point-preview');
    preview.textContent = points >= 0 ? `+${points}` : points.toString();
    preview.className = `point-preview ${valid ? 'positive' : 'negative'}`;
    preview.style.left = `${clientX + 20}px`;
    preview.style.top = `${clientY - 20}px`;
    preview.classList.remove('hidden');
  }

  hidePointPreview() {
    document.getElementById('point-preview').classList.add('hidden');
  }

  clearPreview() {
    if (this.preview) {
      this.scene.remove(this.preview);
      this.preview = null;
      this.previewType = null;
    }
    this.hidePointPreview();
  }
}
