import './style.css';
import { MainScene } from './core/scenes/MainScene';

const canvas = document.getElementById('app') as HTMLCanvasElement;
const startButton = document.getElementById('start-ar-button');
const landingPage = document.getElementById('landing-page');

let mainScene: MainScene | null = null;

function animate() {
  if (mainScene) {
    mainScene.update(0.016); // ~60fps
    mainScene.renderer.render(mainScene.scene, mainScene.camera);
  }
}

// initialize MainScene
mainScene = new MainScene(canvas, animate);

// Manage AR session start
startButton?.addEventListener('click', async () => {
  if (!mainScene) return;

  try {
    // Verifica supporto AR
    if (!navigator.xr) {
      alert('WebXR not supported on this browser');
      return;
    }

    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    if (!supported) {
      alert('AR not supported on this device');
      return;
    }

    // Request AR session senza dom-overlay
    const session = await navigator.xr.requestSession('immersive-ar', {
      optionalFeatures: ['hit-test', 'local-floor', 'bounded-floor']
    });

    if (session) {

      await mainScene.renderer.xr.setSession(session);

      // Hide the landing page
      if (landingPage) {
        landingPage.style.display = 'none';
      }

      // Show the canvas
      if (canvas) {
        canvas.style.display = 'block';
      }

      // Show the menu when AR session starts
      session.addEventListener('end', () => {
        // When AR ends, return to the landing page
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