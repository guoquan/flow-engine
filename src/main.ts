import './style.css';
import { FlowEngine } from './core/FlowEngine';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="canvas-container"></div>
  <div id="ui-overlay">
    <h1>Flow (服喽)</h1>
    <p>Status: <span id="status">Initializing...</span></p>
  </div>
`;

// Basic styles for the demo
const style = document.createElement('style');
style.textContent = `
  body { margin: 0; overflow: hidden; background: #1a1a1a; font-family: sans-serif; color: white; }
  #canvas-container { width: 100vw; height: 100vh; }
  #ui-overlay { position: absolute; top: 20px; left: 20px; pointer-events: none; }
  h1 { margin: 0; font-size: 2rem; background: linear-gradient(to right, #00d2ff, #3a7bd5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
`;
document.head.appendChild(style);

// Initialize Engine
const init = async () => {
  try {
    const statusEl = document.getElementById('status')!;
    const engine = new FlowEngine('canvas-container');
    
    statusEl.textContent = 'Loading Avatar...';
    
    // Load the default avatar config
    // Note: Since we don't have a real 'model.glb' yet, the loader will use the fallback robot.
    await engine.loadAvatar('/assets/avatars/default/config.json');
    
    statusEl.textContent = 'Ready (Running)';
  } catch (err) {
    console.error(err);
    document.getElementById('status')!.textContent = 'Error!';
  }
};

init();
