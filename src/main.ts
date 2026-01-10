import './style.css';
import { FlowEngine } from './core/FlowEngine';
import type { AgentResponse } from './types';
import { createLayout } from './ui';

// Inject Layout
createLayout(document.getElementById('app')!);

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
    const sidebarToggleBtn = document.getElementById('btn-toggle-sidebar');
    if (sidebarToggleBtn) {
      const toggleSidebar = () => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
          sidebar.classList.toggle('collapsed');
          const isCollapsed = sidebar.classList.contains('collapsed');
          sidebarToggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
        }
      };

      sidebarToggleBtn.addEventListener('click', toggleSidebar);
      // Keyboard activation on Enter/Space when the toggle has focus
      sidebarToggleBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleSidebar();
        }
      });

      // Global keyboard shortcut: Ctrl+B / Cmd+B to toggle the sidebar
      document.addEventListener('keydown', (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && (event.key === 'b' || event.key === 'B')) {
          event.preventDefault();
          toggleSidebar();
        }
      });
    }

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

    // 5. Protocol Tester & Panels
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

    document.getElementById('header-protocol')?.addEventListener('click', () => {
      document.getElementById('panel-protocol')?.classList.toggle('collapsed');
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
    let reconnectDelay = 1000;
    const MAX_RECONNECT_DELAY = 30000;
    let mcpWs: WebSocket | null = null;
    let stableConnectionTimeout: number | null = null;

    const connectMcpBridge = () => {
      const statusEl = document.getElementById('mcp-status')!;
      
      // Build WebSocket URL based on current location (avoids hardcoded localhost)
      const getMcpWebSocketUrl = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const hostname = window.location.hostname || 'localhost';
        const urlParams = new URLSearchParams(window.location.search);
        const port = urlParams.get('wsPort') || '3001';
        return `${protocol}//${hostname}:${port}`;
      };

      const url = getMcpWebSocketUrl();
      console.log(`[MCP-Bridge] Connecting to ${url}...`);
      
      mcpWs = new WebSocket(url);
      
      mcpWs.onopen = () => {
        console.log('[MCP-Bridge] Connected');
        statusEl.textContent = 'Connected';
        statusEl.style.background = '#2e7d32'; // Green
        
        // Reset delay only after connection has been stable for 5s
        stableConnectionTimeout = window.setTimeout(() => {
          reconnectDelay = 1000;
        }, 5000);
      };

      mcpWs.onclose = () => {
        console.log(`[MCP-Bridge] Disconnected. Retrying in ${reconnectDelay}ms...`);
        statusEl.textContent = 'Disconnected';
        statusEl.style.background = '#c62828'; // Red
        
        if (stableConnectionTimeout) {
          clearTimeout(stableConnectionTimeout);
          stableConnectionTimeout = null;
        }

        setTimeout(connectMcpBridge, reconnectDelay);
        // Exponential backoff
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
        mcpWs = null;
      };

      mcpWs.onerror = (err) => {
        console.error('[MCP-Bridge] Error:', err);
        if (mcpWs) mcpWs.close();
      };

      mcpWs.onmessage = (event) => {
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
          // Close the WebSocket on parse/processing errors to avoid inconsistent state
          if (mcpWs) mcpWs.close();
        }
      };
    };

    // Start connection
    connectMcpBridge();

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      if (mcpWs) {
        mcpWs.close();
        mcpWs = null;
      }
    });

  } catch (e) {
    statusEl.textContent = 'Error loading assets. Check console.';
    console.error('Engine Init Failed:', e);
  }
};

init();
