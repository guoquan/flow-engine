const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = 'test-results/screenshots';
const OUTPUT_FILE = path.join(SCREENSHOTS_DIR, 'README.md');

const descriptions = {
  'initial-state.png': 'The initial state of the application after engine load.',
  'debug-mode.png': 'Application with Debug Mode enabled (showing interaction plane and target).',
  'debug-lookat.png': 'Avatar performing LookAt in Debug Mode (visualizing the target ray).',
  
  // MCP Actions
  'mcp-action-say.png': 'Avatar performing the "Say" animation triggered via MCP.',
  'mcp-action-think.png': 'Avatar performing the "Think" animation triggered via MCP.',
  'mcp-action-wave.png': 'Avatar performing the "Wave" animation triggered via MCP.',
  'mcp-action-bow.png': 'Avatar performing the "Bow" animation triggered via MCP.',
  'mcp-action-dance.png': 'Avatar performing the "Dance" animation triggered via MCP.',
  'mcp-action-walk.png': 'Avatar performing the "Walk" animation triggered via MCP.',
  'mcp-action-death.png': 'Avatar performing the "Death" animation triggered via MCP.',
  'mcp-interaction-lookat.png': 'Avatar looking at a specific target triggered via MCP interaction.',
  
  // UI Actions
  'ui-action-say.png': 'Avatar performing the "Say" animation triggered via Dashboard UI.',
  'ui-action-think.png': 'Avatar performing the "Think" animation triggered via Dashboard UI.',
  'ui-action-wave.png': 'Avatar performing the "Wave" animation triggered via Dashboard UI.',
  'ui-action-bow.png': 'Avatar performing the "Bow" animation triggered via Dashboard UI.',
  'ui-action-dance.png': 'Avatar performing the "Dance" animation triggered via Dashboard UI.',
  'ui-action-walk.png': 'Avatar performing the "Walk" animation triggered via Protocol Tester.',
  'ui-action-death.png': 'Avatar performing the "Death" animation triggered via Protocol Tester.',
  'ui-interaction-lookat.png': 'Avatar performing LookAt interaction triggered by Mouse Click.',
  
  // Camera
  'camera-rotate.png': 'Camera rotation via Mouse Drag.',
  'camera-zoom.png': 'Camera zoom via Mouse Wheel.',
  'camera-pan.png': 'Camera panning via Right-Click Drag.',
};

async function generate() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    console.log('Screenshots directory not found. Skipping README generation.');
    return;
  }

  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
  
  let markdown = '# 📸 Visual E2E Test Screenshots\n\n';
  markdown += 'This directory contains screenshots captured during automated E2E tests.\n\n';

  // Helper to render a group
  const renderGroup = (title, fileList) => {
    if (fileList.length === 0) return '';
    let md = `<details open><summary><strong>${title}</strong></summary>\n\n`;
    md += '| Screenshot | Description |\n';
    md += '| :--- | :--- |\n';
    fileList.sort().forEach(file => {
      const desc = descriptions[file] || 'No description available.';
      md += `| ![${file}](${file}) | **${file}**<br>${desc} |\n`;
    });
    md += '\n</details>\n\n';
    return md;
  };

  const keyVisuals = files.filter(f => f === 'initial-state.png');
  const debugVisuals = files.filter(f => f.startsWith('debug-'));
  const mcpActions = files.filter(f => f.startsWith('mcp-'));
  const uiActions = files.filter(f => f.startsWith('ui-'));
  const cameraActions = files.filter(f => f.startsWith('camera-'));
  
  const others = files.filter(f => 
    !keyVisuals.includes(f) && 
    !debugVisuals.includes(f) && 
    !mcpActions.includes(f) && 
    !uiActions.includes(f) &&
    !cameraActions.includes(f)
  );

  markdown += renderGroup('Key Visuals', keyVisuals);
  markdown += renderGroup('Debug & Diagnostics', debugVisuals);
  markdown += renderGroup('Camera & Interaction', cameraActions);
  markdown += renderGroup('MCP Actions & States', mcpActions);
  markdown += renderGroup('UI Actions & States', uiActions);
  
  if (others.length > 0) {
      markdown += renderGroup('Other Screenshots', others);
  }

  fs.writeFileSync(OUTPUT_FILE, markdown);
  console.log(`Successfully generated ${OUTPUT_FILE}`);
}

module.exports = async ({ github, context, core } = {}) => {
  await generate();
};

if (require.main === module) {
  generate();
}