// UI System for Links

export function updateUI(state, unlockThresholds) {
  // Update score display
  const scoreElement = document.getElementById('score-value');
  if (scoreElement) {
    scoreElement.textContent = state.score;
  }

  // Update progress bar
  const progressFill = document.getElementById('progress-fill');
  const nextUnlockPoints = document.getElementById('next-unlock-points');
  const nextUnlockName = document.getElementById('next-unlock-name');

  if (progressFill) {
    // Find next unlock threshold
    const nextThreshold = unlockThresholds.find(t => !state.unlockedPacks.includes(t.pack));

    if (nextThreshold) {
      // Calculate progress to next unlock
      const prevThreshold = unlockThresholds
        .filter(t => state.unlockedPacks.includes(t.pack))
        .pop();

      const startPoints = prevThreshold ? prevThreshold.points : 0;
      const endPoints = nextThreshold.points;
      const progress = Math.min(100, ((state.score - startPoints) / (endPoints - startPoints)) * 100);

      progressFill.style.width = `${Math.max(0, progress)}%`;

      if (nextUnlockPoints) {
        nextUnlockPoints.textContent = nextThreshold.points;
      }
      if (nextUnlockName) {
        nextUnlockName.textContent = `Pack ${nextThreshold.pack}: ${nextThreshold.name}`;
      }
    } else {
      // All packs unlocked
      progressFill.style.width = '100%';
      if (nextUnlockPoints) {
        nextUnlockPoints.textContent = '---';
      }
      if (nextUnlockName) {
        nextUnlockName.textContent = 'All packs unlocked!';
      }
    }
  }
}

export function showUnlockNotification(packName) {
  const notification = document.getElementById('unlock-notification');
  const packNameElement = document.getElementById('unlock-pack-name');

  if (notification && packNameElement) {
    packNameElement.textContent = packName;
    notification.classList.remove('hidden');
    notification.classList.add('show');

    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      notification.classList.add('hidden');
    }, 3000);
  }
}

export function showBonusPopup(text, points, position) {
  // Create floating bonus indicator
  const popup = document.createElement('div');
  popup.className = 'bonus-popup';
  popup.textContent = points >= 0 ? `+${points}` : points;
  popup.style.cssText = `
    position: fixed;
    left: ${position.x}px;
    top: ${position.y}px;
    color: ${points >= 0 ? '#4ade80' : '#f87171'};
    font-size: 24px;
    font-weight: bold;
    pointer-events: none;
    animation: floatUp 1s ease-out forwards;
    z-index: 1000;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  `;

  document.body.appendChild(popup);

  // Remove after animation
  setTimeout(() => {
    popup.remove();
  }, 1000);
}

// Add CSS animation for bonus popup
const style = document.createElement('style');
style.textContent = `
  @keyframes floatUp {
    0% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-50px) scale(1.2);
    }
  }
`;
document.head.appendChild(style);
