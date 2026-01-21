import './style.css';
import { MainScene } from './core/scenes/MainScene';
import { LocalizationService } from './services/LocalizationService';

const canvas = document.getElementById('app') as HTMLCanvasElement;
const startButton = document.getElementById('start-ar-button');
const landingPage = document.getElementById('landing-page');
const tagline = document.querySelector('.tagline') as HTMLParagraphElement;

const localization = LocalizationService.getInstance();
let mainScene: MainScene | null = null;
let lastFrameTime = performance.now();

function updateLandingPageLanguage() {
  const translations = localization.getTranslations();
  if (startButton) {
    startButton.textContent = translations.menu.startAR;
  }
  if (tagline) {
    tagline.textContent = translations.menu.tagline;
  }
}

function animate() {
  if (mainScene) {
    // Calculate real delta time in seconds
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;

    mainScene.update(deltaTime);
    mainScene.renderer.render(mainScene.scene, mainScene.camera);
  }
}

// Initialize
mainScene = new MainScene(canvas, animate);
lastFrameTime = performance.now();
updateLandingPageLanguage();

// Listen for language changes
localization.onLanguageChange(() => {
  updateLandingPageLanguage();
});

startButton?.addEventListener('click', async () => {
  if (!mainScene) return;

  const translations = localization.getTranslations();

  try {
    if (!navigator.xr) {
      alert(translations.errors.xrNotSupported);
      return;
    }

    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    if (!supported) {
      alert(translations.errors.arNotSupported);
      return;
    }

    const session = await navigator.xr.requestSession('immersive-ar', {
      optionalFeatures: ['hit-test', 'local-floor', 'bounded-floor']
    });

    if (session) {
      await mainScene.renderer.xr.setSession(session);

      if (landingPage) {
        landingPage.style.display = 'none';
      }

      if (canvas) {
        canvas.style.display = 'block';
      }

      session.addEventListener('end', () => {
        if (landingPage) {
          landingPage.style.display = 'flex';
        }
        if (canvas) {
          canvas.style.display = 'none';
        }
      });
    }
  } catch (error) {
    console.error('Error starting AR session:', error);
    alert('Errore nell\'avvio AR: ' + (error as Error).message);
  }
});