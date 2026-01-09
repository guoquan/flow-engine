const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = 'test-results/screenshots';
const OUTPUT_FILE = path.join(SCREENSHOTS_DIR, 'README.md');

const descriptions = {
  'initial-state.png': 'The initial state of the application after engine load.',
  'debug-mode.png': 'Application with Debug Mode enabled (showing interaction plane and target).',
  'mcp-action-wave.png': 'Avatar performing the "Wave" animation triggered via MCP.',
  'mcp-action-bow.png': 'Avatar performing the "Bow" animation triggered via MCP.',
  'mcp-action-dance.png': 'Avatar performing the "Dance" animation triggered via MCP.',
  'ui-action-wave.png': 'Avatar performing the "Wave" animation triggered via Dashboard UI.',
  'ui-action-bow.png': 'Avatar performing the "Bow" animation triggered via Dashboard UI.',
  'ui-action-dance.png': 'Avatar performing the "Dance" animation triggered via Dashboard UI.',
};

function generate() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    console.log('Screenshots directory not found. Skipping README generation.');
    return;
  }

  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
  
  let markdown = '# 📸 Visual E2E Test Screenshots\n\n';
  markdown += 'This directory contains screenshots captured during automated E2E tests.\n\n';
  markdown += '| Screenshot | Description |\n';
  markdown += '| :--- | :--- |\n';

  files.sort().forEach(file => {
    const desc = descriptions[file] || 'No description available.';
    markdown += `| ![${file}](${file}) | **${file}**<br>${desc} |
`;
  });

  fs.writeFileSync(OUTPUT_FILE, markdown);
  console.log(`Successfully generated ${OUTPUT_FILE}`);
}

generate();