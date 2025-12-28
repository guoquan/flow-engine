import './style.css';
import { FlowEngine } from './core/FlowEngine';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="canvas-container"></div>
  <div id="ui-overlay">
    <h1>Flow (服喽)</h1>
    <p>Status: <span id="status">Initializing...</span></p>
    <div id="controls" style="margin-top: 10px; pointer-events: auto;">
      <label>
        <input type="checkbox" id="auto-rotate" /> Auto Rotate Camera
      </label>
    </div>
  </div>
  
  <div id="ai-response"></div>

  <div id="chat-container">
    <input type="text" id="user-input" placeholder="Say hello..." />
    <button id="send-btn">Send</button>
  </div>
`;

// Initialize Engine
const init = async () => {
  try {
    const statusEl = document.getElementById('status')!;
    const engine = new FlowEngine('canvas-container');
    
    statusEl.textContent = 'Loading Avatar...';
    
    // Load the default avatar config
    await engine.loadAvatar('/assets/avatars/default/config.json');
    
    statusEl.textContent = 'Ready (Idle)';

    // Controls Logic
    const autoRotateCheck = document.getElementById('auto-rotate') as HTMLInputElement;
    autoRotateCheck.addEventListener('change', (e) => {
      engine.isAutoRotate = (e.target as HTMLInputElement).checked;
    });

    // Chat Interaction Logic
    const inputEl = document.getElementById('user-input') as HTMLInputElement;
    const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
    const responseEl = document.getElementById('ai-response')!;

    const sendMessage = async () => {
      const text = inputEl.value.trim();
      if (!text) return;

      // UI State
      inputEl.value = '';
      inputEl.disabled = true;
      sendBtn.disabled = true;
      statusEl.textContent = 'Thinking...';

      try {
        // Use relative path since API is now served by Vite middleware
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        
        const data = await res.json();
        
        // Handle Response
        statusEl.textContent = `Action: ${data.command.action}`;
        responseEl.textContent = data.text;
        responseEl.classList.add('visible');

        console.log('[Flow] AI Command:', data.command);
        
        // Pass command to engine
        engine.playAction(data.command.action, data.command.duration); 

        // Hide text after a while
        setTimeout(() => {
          responseEl.classList.remove('visible');
          statusEl.textContent = 'Ready (Idle)';
        }, 3000);

      } catch (err) {
        console.error('API Error:', err);
        statusEl.textContent = 'Brain Disconnected';
      } finally {
        inputEl.disabled = false;
        sendBtn.disabled = false;
        inputEl.focus();
      }
    };

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

  } catch (err) {
    console.error(err);
    document.getElementById('status')!.textContent = 'Error!';
  }
};

init();
