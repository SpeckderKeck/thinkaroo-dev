function createLandingOverlay({ onStart } = {}) {
  const overlay = document.createElement('section');
  overlay.className = 'landing-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Thinkaroo Startbildschirm');

  overlay.innerHTML = `
    <picture class="landing-overlay__media" aria-hidden="true">
      <source media="(max-width: 768px)" srcset="landigphone.png" />
      <img src="landingpc.png" alt="Thinkaroo Landing Page" />
    </picture>
    <div class="landing-overlay__actions">
      <button type="button" class="landing-overlay__start-button">Spiel starten</button>
    </div>
  `;

  const startButton = overlay.querySelector('.landing-overlay__start-button');

  const closeOverlay = () => {
    overlay.remove();
    document.body.classList.remove('landing-open');
    document.body.style.overflow = 'auto';
    document.dispatchEvent(new CustomEvent('landing:start'));
    if (typeof onStart === 'function') {
      onStart();
    }
  };

  startButton?.addEventListener('click', closeOverlay, { once: true });

  return {
    mount(parent = document.body) {
      parent.append(overlay);
      document.body.classList.add('landing-open');
      document.body.style.overflow = 'hidden';
    },
  };
}

const showLanding = true;

if (showLanding) {
  const landingOverlay = createLandingOverlay();
  landingOverlay.mount();
}
