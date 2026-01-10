const TITLE_OVERLAY_OPACITY = '0.6';

export function createLayout(app: HTMLElement) {
  // 1. Canvas Container
  const canvasContainer = document.createElement('div');
  canvasContainer.id = 'canvas-container';
  
  const titleOverlay = document.createElement('div');
  Object.assign(titleOverlay.style, {
    position: 'absolute',
    top: '10px',
    left: '10px',
    pointerEvents: 'none',
    opacity: TITLE_OVERLAY_OPACITY
  });
  
  const h1 = document.createElement('h1');
  h1.textContent = 'Flow Engine v0.2';
  
  const statusDiv = document.createElement('div');
  statusDiv.id = 'loading-status';
  statusDiv.textContent = 'Initializing...';
  
  titleOverlay.appendChild(h1);
  titleOverlay.appendChild(statusDiv);
  canvasContainer.appendChild(titleOverlay);
  
  // 2. Sidebar
  const sidebar = document.createElement('div');
  sidebar.id = 'sidebar';
  
  // Sidebar Header
  const sidebarHeader = document.createElement('div');
  sidebarHeader.className = 'sidebar-header';
  
  const h2Controls = document.createElement('h2');
  h2Controls.textContent = 'Controls';
  
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'btn-toggle-sidebar';
  toggleBtn.className = 'sidebar-toggle';
  toggleBtn.setAttribute('aria-label', 'Toggle sidebar');
  toggleBtn.title = 'Toggle sidebar';
  toggleBtn.setAttribute('aria-expanded', 'true');
  toggleBtn.textContent = '☰';
  
  sidebarHeader.appendChild(h2Controls);
  sidebarHeader.appendChild(toggleBtn);
  sidebar.appendChild(sidebarHeader);
  
  // Helper to create panel
  const createPanel = (title: string, idPrefix?: string) => {
    const panel = document.createElement('div');
    panel.className = 'panel';
    if (idPrefix) panel.id = `panel-${idPrefix}`;
    
    const h3 = document.createElement('h3');
    h3.textContent = title;
    if (idPrefix) h3.id = `header-${idPrefix}`;
    panel.appendChild(h3);
    return { panel, h3 };
  };

  // Panel 1: Dashboard
  const { panel: p1 } = createPanel('Dashboard');
  const p1Controls = document.createElement('div');
  p1Controls.className = 'control-group';
  
  const createCheckbox = (id: string, labelText: string) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    label.appendChild(input);
    label.appendChild(document.createTextNode(` ${labelText}`));
    return label;
  };
  
  p1Controls.appendChild(createCheckbox('check-debug', 'Debug Mode'));
  p1Controls.appendChild(createCheckbox('check-rotate', 'Auto Rotate'));
  
  const createIndicator = (label: string, id: string, defaultText: string, defaultClass: string = 'badge') => {
    const div = document.createElement('div');
    div.className = 'status-indicator';
    // Use nodes for safety
    div.textContent = `${label}: `;
    const span = document.createElement('span');
    span.id = id;
    span.className = defaultClass;
    span.textContent = defaultText;
    if (id === 'mcp-status') span.style.background = '#444';
    div.appendChild(span);
    return div;
  };
  
  p1Controls.appendChild(createIndicator('Brain State', 'brain-state', 'IDLE'));
  p1Controls.appendChild(createIndicator('MCP Bridge', 'mcp-status', 'Disconnected'));
  p1.appendChild(p1Controls);
  sidebar.appendChild(p1);

  // Panel 2: Quick Actions
  const { panel: p2 } = createPanel('Quick Actions');
  const actionGrid = document.createElement('div');
  actionGrid.className = 'action-grid';
  
  const createActionBtn = (action: string, label: string) => {
    const btn = document.createElement('button');
    btn.dataset.action = action;
    btn.textContent = label;
    return btn;
  };
  
  actionGrid.appendChild(createActionBtn('wave', '👋 Wave'));
  actionGrid.appendChild(createActionBtn('bow', '🙇 Bow'));
  actionGrid.appendChild(createActionBtn('dance', '💃 Dance'));
  actionGrid.appendChild(createActionBtn('idle', '🧘 Idle'));
  p2.appendChild(actionGrid);
  
  const p2Controls = document.createElement('div');
  p2Controls.className = 'control-group';
  p2Controls.style.marginTop = '10px';
  
  const btnSay = document.createElement('button');
  btnSay.id = 'btn-say-hello';
  btnSay.textContent = '🗣️ Say "Hello"';
  
  const btnThink = document.createElement('button');
  btnThink.id = 'btn-think';
  btnThink.textContent = '💭 Think "..."';
  
  p2Controls.appendChild(btnSay);
  p2Controls.appendChild(btnThink);
  p2.appendChild(p2Controls);
  sidebar.appendChild(p2);

  // Panel 3: Asset Loader
  const { panel: p3 } = createPanel('Asset Loader');
  const p3Controls = document.createElement('div');
  p3Controls.className = 'control-group';
  
  const createAssetInput = (labelStr: string, inputId: string, defaultVal: string, btnId: string) => {
    const wrapper = document.createElement('div');
    const label = document.createElement('label');
    label.className = 'label-small';
    label.textContent = labelStr;
    
    const row = document.createElement('div');
    row.className = 'input-row';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = inputId;
    input.value = defaultVal;
    
    const btn = document.createElement('button');
    btn.id = btnId;
    btn.className = 'icon-btn';
    btn.textContent = '↻';
    
    row.appendChild(input);
    row.appendChild(btn);
    
    wrapper.appendChild(label);
    wrapper.appendChild(row);
    return wrapper;
  };
  
  p3Controls.appendChild(createAssetInput('Avatar Config URL', 'input-avatar-url', 'assets/avatars/expressive/config.json', 'btn-load-avatar'));
  p3Controls.appendChild(createAssetInput('Stage Config URL', 'input-stage-url', 'assets/stages/default/config.json', 'btn-load-stage'));
  p3.appendChild(p3Controls);
  sidebar.appendChild(p3);

  // Panel 4: Chat
  const { panel: p4 } = createPanel('Chat');
  Object.assign(p4.style, { display: 'flex', flexDirection: 'column', gap: '8px' });
  
  const chatLog = document.createElement('div');
  chatLog.id = 'chat-log';
  
  const chatControls = document.createElement('div');
  Object.assign(chatControls.style, { display: 'flex', gap: '4px' });
  
  const chatInput = document.createElement('input');
  chatInput.type = 'text';
  chatInput.id = 'chat-input';
  chatInput.placeholder = 'Talk to avatar...';
  
  const chatSend = document.createElement('button');
  chatSend.id = 'chat-send';
  chatSend.textContent = 'Send';
  
  chatControls.appendChild(chatInput);
  chatControls.appendChild(chatSend);
  p4.appendChild(chatLog);
  p4.appendChild(chatControls);
  sidebar.appendChild(p4);

  // Panel 5: Protocol Tester
  const { panel: p5, h3: h3Proto } = createPanel('Protocol Tester', 'protocol');
  p5.classList.add('collapsed'); // Default collapsed
  
  h3Proto.style.cursor = 'pointer';
  // Arrow span
  const arrow = document.createElement('span');
  Object.assign(arrow.style, { float: 'right', fontSize: '0.8em' });
  arrow.textContent = '▼';
  h3Proto.appendChild(arrow);
  
  const panelContent = document.createElement('div');
  panelContent.className = 'panel-content';
  
  const pDesc = document.createElement('p');
  Object.assign(pDesc.style, { fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' });
  pDesc.textContent = 'Send raw JSON (Unified Action Protocol):';
  
  const jsonInput = document.createElement('textarea');
  jsonInput.id = 'json-input';
  jsonInput.value = JSON.stringify({
    text: "Checking systems.",
    state: "THINKING",
    actions: [
      { type: "animation", name: "wave", delay: 1000 }
    ]
  }, null, 2);
  
  const jsonError = document.createElement('div');
  jsonError.id = 'json-error';
  
  const jsonSend = document.createElement('button');
  jsonSend.id = 'json-send';
  jsonSend.style.marginTop = '8px';
  jsonSend.textContent = 'Process JSON';
  
  panelContent.appendChild(pDesc);
  panelContent.appendChild(jsonInput);
  panelContent.appendChild(jsonError);
  panelContent.appendChild(jsonSend);
  p5.appendChild(panelContent);
  sidebar.appendChild(p5);

  // Append everything
  app.appendChild(canvasContainer);
  app.appendChild(sidebar);
}
