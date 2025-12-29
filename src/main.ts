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
    
    // Load the real GLB avatar (handle base path for GH Pages)
    const baseUrl = import.meta.env.BASE_URL.endsWith('/') 
      ? import.meta.env.BASE_URL 
      : `${import.meta.env.BASE_URL}/`;
      
    await engine.loadAvatar(`${baseUrl}assets/avatars/expressive/config.json`);
    await engine.loadStage(`${baseUrl}assets/stages/default/config.json`);
    
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
      const text = inputEl.value.trim().toLowerCase();
      if (!text) return;

      // UI State
      inputEl.value = '';
      statusEl.textContent = 'Thinking...';

      // --- Local Brain Logic (No fetch needed) ---
      let replyText = "我听到了。";
      let action = "idle";

      if (text.includes("你好") || text.includes("hello")) {
        replyText = "你好呀！很高兴见到你。";
        action = "wave";
      } else if (text.includes("跳舞") || text.includes("dance")) {
        replyText = "好的，给你表演一段！";
        action = "dance";
      } else if (text.includes("再见") || text.includes("bye")) {
        replyText = "下次再聊，拜拜！";
        action = "bow";
      } else if (text.includes("死") || text.includes("death") || text.includes("die")) {
        replyText = "系统故障...重启中...";
        action = "death";
      }

      // Handle Response
      statusEl.textContent = `Action: ${action}`;
      responseEl.textContent = replyText;
      responseEl.classList.add('visible');

      console.log('[Flow] Local Brain Decision:', { action, replyText });
      
      engine.playAction(action); 

      // Hide text after a while
      setTimeout(() => {
        responseEl.classList.remove('visible');
        statusEl.textContent = 'Ready (Idle)';
      }, 3000);
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
