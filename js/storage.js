// Local Storage System for Links

const STORAGE_KEY = 'links-golf-save';

export function saveGame(state) {
  try {
    const saveData = {
      score: state.score,
      unlockedPacks: state.unlockedPacks,
      placements: state.placements.map(p => ({
        type: p.type,
        x: p.position.x,
        y: p.position.y,
        z: p.position.z
      })),
      timestamp: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    return true;
  } catch (e) {
    console.warn('Failed to save game:', e);
    return false;
  }
}

export function loadGame() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load game:', e);
  }
  return null;
}

export function clearSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.warn('Failed to clear save:', e);
    return false;
  }
}

export function hasSave() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
