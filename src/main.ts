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
    <!-- Panel 1: Dashboard -->
    <div class="panel">
      <h2>Dashboard</h2>
      <div class="control-group">
        <label><input type="checkbox" id="check-debug"> Debug Mode</label>
        <label><input type="checkbox" id="check-rotate"> Auto Rotate</label>
        <div class="status-indicator">Brain State: <span id="brain-state" class="badge">IDLE</span></div>
        <div class="status-indicator">MCP Bridge: <span id="mcp-status" class="badge" style="background: #444;">Disconnected</span></div>
      </div>
    </div>

    <!-- Panel 2: Quick Actions -->
    <div class="panel">
      <h2>Quick Actions</h2>
      <div class="action-grid">
        <button data-action="wave">👋 Wave</button>
        <button data-action="bow">🙇 Bow</button>
        <button data-action="dance">💃 Dance</button>
        <button data-action="idle">🧘 Idle</button>
      </div>
      <div class="control-group" style="margin-top: 10px;">
        <button id="btn-say-hello">🗣️ Say "Hello"</button>
        <button id="btn-think">💭 Think "..."</button>
      </div>
    </div>

    <!-- Panel 3: Asset Loader -->
    <div class="panel">
      <h2>Asset Loader</h2>
      <div class="control-group">
        <label class="label-small">Avatar Config URL</label>
        <div class="input-row">
          <input type="text" id="input-avatar-url" value="assets/avatars/expressive/config.json" />
          <button id="btn-load-avatar" class="icon-btn">↻</button>
        </div>
        
        <label class="label-small">Stage Config URL</label>
        <div class="input-row">
          <input type="text" id="input-stage-url" value="assets/stages/default/config.json" />
          <button id="btn-load-stage" class="icon-btn">↻</button>
        </div>
      </div>
    </div>

    <!-- Panel 4: Chat -->
    <div class="panel" style="display: flex; flex-direction: column; gap: 8px;">
      <h2>Chat</h2>
      <div id="chat-log"></div>
      <div style="display: flex; gap: 4px;">
        <input type="text" id="chat-input" placeholder="Talk to avatar..." />
        <button id="chat-send">Send</button>
      </div>
    </div>

    <!-- Panel 5: Protocol Tester -->
    <div class="panel collapsed" id="panel-protocol">
      <h2 style="cursor: pointer;" onclick="document.getElementById('panel-protocol').classList.toggle('collapsed')">
        Protocol Tester <span style="float: right; font-size: 0.8em">▼</span>
      </h2>
      <div class="panel-content">
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
  </div>
`;

// Init Engine
const init = async () => {
  const statusEl = document.getElementById('loading-status')!;
  
  // Expose necessary internal state for dashboard visualization
  interface DebuggableEngine {
    brain: { getState: () => string };
  }
  let engine: FlowEngine;

  try {
    engine = new FlowEngine('canvas-container');
    
    const baseUrl = import.meta.env.BASE_URL.endsWith('/') 
      ? import.meta.env.BASE_URL 
      : `${import.meta.env.BASE_URL}/`;
      
    // Initial Load
    const defaultAvatar = `${baseUrl}assets/avatars/expressive/config.json`;
    const defaultStage = `${baseUrl}assets/stages/default/config.json`;
    
    (document.getElementById('input-avatar-url') as HTMLInputElement).value = defaultAvatar;
    (document.getElementById('input-stage-url') as HTMLInputElement).value = defaultStage;

    await engine.loadAvatar(defaultAvatar);
    await engine.loadStage(defaultStage);
    statusEl.textContent = 'Ready';

    // --- UI Logic ---

    // 1. Dashboard Controls
    document.getElementById('check-debug')?.addEventListener('change', (e) => {
      engine.setDebug((e.target as HTMLInputElement).checked);
    });
    document.getElementById('check-rotate')?.addEventListener('change', (e) => {
      engine.isAutoRotate = (e.target as HTMLInputElement).checked;
    });

    // 2. Quick Actions
    document.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = (btn as HTMLElement).dataset.action!;
        if (action === 'idle') {
          engine.setBehavior({ state: 'IDLE' });
        } else {
          engine.playAction(action);
        }
      });
    });

    document.getElementById('btn-say-hello')?.addEventListener('click', () => {
      engine.say({ text: "Hello! I am Flow Engine.", duration: 3000 });
    });

    document.getElementById('btn-think')?.addEventListener('click', () => {
      engine.think({ text: "Processing complex logic...", duration: 4000 });
    });

    // 3. Asset Loader
    const loadAsset = async (type: 'avatar' | 'stage') => {
      const inputId = type === 'avatar' ? 'input-avatar-url' : 'input-stage-url';
      const input = document.getElementById(inputId) as HTMLInputElement;
      const url = input.value.trim();
      if (!url) return;

      const btn = document.getElementById(`btn-load-${type}`) as HTMLButtonElement;
      const originalText = btn.textContent;
      btn.textContent = '...';
      btn.disabled = true;

      try {
        if (type === 'avatar') await engine.loadAvatar(url);
        else await engine.loadStage(url);
        console.log(`[UI] Loaded ${type}: ${url}`);
      } catch (e) {
        console.error(`[UI] Failed to load ${type}`, e);
        alert(`Failed to load ${type}. Check console.`);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    };

    document.getElementById('btn-load-avatar')?.addEventListener('click', () => loadAsset('avatar'));
    document.getElementById('btn-load-stage')?.addEventListener('click', () => loadAsset('stage'));


    // 4. Chat System
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
      engine.think({ duration: 1000 }); // Simulate processing
      
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

    // 5. Protocol Tester
    const jsonInput = document.getElementById('json-input') as HTMLTextAreaElement;
    const jsonError = document.getElementById('json-error')!;

    document.getElementById('json-send')?.addEventListener('click', () => {
      try {
        jsonError.style.display = 'none';
        const data = JSON.parse(jsonInput.value);
        engine.processAgentResponse(data);
        
        // Echo the text to Chat Log if present in JSON
        if (data.text) {
          addLog(data.text, 'agent');
        } else {
          addLog(`[JSON Action Executed]`, 'agent');
        }
      } catch (e) {
        jsonError.textContent = (e as Error).message;
        jsonError.style.display = 'block';
      }
    });

    // 6. Polling for Brain State
    setInterval(() => {
      const stateEl = document.getElementById('brain-state');
      if (stateEl) {
        const debugEngine = engine as unknown as DebuggableEngine;
        stateEl.textContent = debugEngine.brain.getState();
        
        // Simple visual feedback
        stateEl.className = 'badge ' + debugEngine.brain.getState().toLowerCase();
      }
    }, 200);

    // 7. MCP Bridge (WebSocket Client)
    const connectMcpBridge = () => {
      const statusEl = document.getElementById('mcp-status')!;
      console.log('[MCP-Bridge] Connecting...');
      
      const ws = new WebSocket('ws://localhost:3001');
      
      ws.onopen = () => {
        console.log('[MCP-Bridge] Connected');
        statusEl.textContent = 'Connected';
        statusEl.style.background = '#2e7d32'; // Green
      };

      ws.onclose = () => {
        console.log('[MCP-Bridge] Disconnected. Retrying in 3s...');
        statusEl.textContent = 'Disconnected';
        statusEl.style.background = '#c62828'; // Red
        setTimeout(connectMcpBridge, 3000);
      };

      ws.onerror = (err) => {
        console.error('[MCP-Bridge] Error:', err);
        ws.close();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          console.log('[MCP-Bridge] Received:', data);

          switch (data.type) {
            case 'say':
              engine.say({ text: data.text, duration: data.duration });
              addLog(`[MCP] Say: ${data.text}`, 'agent');
              break;
            case 'think':
              engine.think({ text: data.text, duration: data.duration });
              addLog(`[MCP] Think: ${data.text}`, 'agent');
              break;
            case 'play_action':
              engine.playAction(data.action);
              addLog(`[MCP] Action: ${data.action}`, 'agent');
              break;
            default:
              console.warn('[MCP-Bridge] Unknown message type:', data.type);
          }
        } catch (e) {
          console.error('[MCP-Bridge] Failed to process message:', e);
        }
      };
    };

    // Start connection
    connectMcpBridge();

  } catch (e) {
    statusEl.textContent = 'Error loading assets. Check console.';
    console.error('Engine Init Failed:', e);
  }
};

init();
