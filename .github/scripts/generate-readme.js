module.exports = async ({ github, context, core }) => {
  const fs = require('fs');
  const path = require('path');
  
  const screenshotDir = 'test-results/screenshots';
  const prNumber = context.issue.number;
  const sha = process.env.COMMIT_SHA;
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const commentId = process.env.COMMENT_ID;
  
  if (!fs.existsSync(screenshotDir)) {
    console.log("Screenshot directory not found, skipping README generation.");
    return;
  }
  
  const files = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png'));
  
  let md = `# Visual E2E Report\n\n`;
  if (prNumber) {
    md += `**PR:** [#${prNumber}](https://github.com/${owner}/${repo}/pull/${prNumber})\n\n`;
  }
  if (commentId && prNumber) {
    md += `**Comment:** [View Report](https://github.com/${owner}/${repo}/pull/${prNumber}#issuecomment-${commentId})\n\n`;
  }
  md += `**Commit:** [`${sha.substring(0,7)}`](https://github.com/${owner}/${repo}/commit/${sha})\n\n`;
  md += `**Generated:** ${new Date().toUTCString()}\n\n`;
  
  md += `## Gallery\n\n`;
  
  if (files.length === 0) {
    md += "_No screenshots captured._\n";
  } else {
    files.sort();
    for (const file of files) {
      const caption = file.replace(/[-_]/g, ' ').replace(/\.png$/i, '');
      md += `### ${caption}\n\n`;
      md += `![${caption}](./${file})\n\n`; 
    }
  }
  
  fs.writeFileSync(path.join(screenshotDir, 'README.md'), md);
  console.log("README.md generated in screenshot directory.");
};
