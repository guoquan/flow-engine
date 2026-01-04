import './style.css';
import { FlowEngine } from './core/FlowEngine';
import type { AgentResponse } from './types';

// Inject Layout
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="canvas-container">
    <div style="position: absolute; top: 10px; left: 10px; pointer-events: none; opacity: 0.6;">
      <h1>Flow Engine v0.2</h1>
      <div id="loading-status">Initializing...</div>
    </div>
  </div>
  
  <div id="sidebar">
    <div class="panel">
      <h2>Dashboard</h2>
      <div class="control-group">
        <label><input type="checkbox" id="check-debug"> Debug Mode</label>
        <label><input type="checkbox" id="check-rotate"> Auto Rotate</label>
        <div class="status-indicator">Brain State: <span id="brain-state">IDLE</span></div>
      </div>
    </div>

    <div class="panel" style="display: flex; flex-direction: column; gap: 8px;">
      <h2>Chat</h2>
      <div id="chat-log"></div>
      <div style="display: flex; gap: 4px;">
        <input type="text" id="chat-input" placeholder="Talk to avatar..." />
        <button id="chat-send">Send</button>
      </div>
    </div>

    <div class="panel" style="flex: 1; display: flex; flex-direction: column;">
      <h2>Protocol Tester</h2>
      <p style="font-size: 0.8rem; color: #aaa; margin-bottom: 4px;">Send raw JSON (Unified Action Protocol):</p>
      <textarea id="json-input">{
  "text": "Checking systems.",
  "state": "THINKING",
  "actions": [
    { "type": "animation", "name": "wave", "delay": 1000 }
  ]
}</textarea>
      <div id="json-error"></div>
      <button id="json-send" style="margin-top: 8px;">Process JSON</button>
    </div>
  </div>
`;

// Init Engine
const init = async () => {
  const statusEl = document.getElementById('loading-status')!;
  const engine = new FlowEngine('canvas-container');

  try {
    const baseUrl = import.meta.env.BASE_URL.endsWith('/') 
      ? import.meta.env.BASE_URL 
      : `${import.meta.env.BASE_URL}/`;
      
    await engine.loadAvatar(`${baseUrl}assets/avatars/expressive/config.json`);
    await engine.loadStage(`${baseUrl}assets/stages/default/config.json`);
    statusEl.textContent = 'Ready';
  } catch (e) {
    statusEl.textContent = 'Error loading assets';
    console.error(e);
  }

  // --- UI Logic ---

  // 1. Dashboard
  document.getElementById('check-debug')?.addEventListener('change', (e) => {
    engine.setDebug((e.target as HTMLInputElement).checked);
  });
  document.getElementById('check-rotate')?.addEventListener('change', (e) => {
    engine.isAutoRotate = (e.target as HTMLInputElement).checked;
  });

  // 2. Chat System
  const chatLog = document.getElementById('chat-log')!;
  const chatInput = document.getElementById('chat-input') as HTMLInputElement;
  
  const addLog = (text: string, type: 'user' | 'agent') => {
    const msg = document.createElement('div');
    msg.className = `msg ${type}`;
    msg.textContent = text;
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
  };

  const handleUserMessage = async () => {
    const text = chatInput.value.trim();
    if (!text) return;
    
    addLog(text, 'user');
    chatInput.value = '';

    // Mock Agent Logic
    engine.think(1000); // Simulate processing
    
    setTimeout(() => {
      let response: AgentResponse = { text: "I heard you." };

      if (text.match(/hello|hi/i)) {
        response = {
          text: "Hello there! I am Flow Engine.",
          state: 'TALKING',
          actions: [{ type: 'animation', name: 'wave' }]
        };
      } else if (text.match(/dance/i)) {
        response = {
          text: "Look at this move!",
          state: 'EMOTIONAL',
          actions: [{ type: 'animation', name: 'dance' }]
        };
      } else if (text.match(/look/i)) {
        response = {
          text: "I am tracking your cursor now.",
          state: 'LISTENING'
        };
      }

      addLog(response.text || "...", 'agent');
      engine.processAgentResponse(response);
    }, 800);
  };

  document.getElementById('chat-send')?.addEventListener('click', handleUserMessage);
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleUserMessage(); });

  // 3. Protocol Tester
  const jsonInput = document.getElementById('json-input') as HTMLTextAreaElement;
  const jsonError = document.getElementById('json-error')!;

  document.getElementById('json-send')?.addEventListener('click', () => {
    try {
      jsonError.style.display = 'none';
      const data = JSON.parse(jsonInput.value);
      engine.processAgentResponse(data);
      addLog(`[JSON] Executed`, 'agent');
    } catch (e) {
      jsonError.textContent = (e as Error).message;
      jsonError.style.display = 'block';
    }
  });

  // 4. Polling for Brain State (Temporary until FlowEngine exposes event)
  setInterval(() => {
    const stateEl = document.getElementById('brain-state');
    if (stateEl) {
      // @ts-ignore: Accessing private brain for visualization
      stateEl.textContent = engine.brain.getState(); 
    }
  }, 200);
};

init();
