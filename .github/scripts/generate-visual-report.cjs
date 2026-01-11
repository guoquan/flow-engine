module.exports = async ({ github, context, core }) => {
  const fs = require('fs');
  const path = require('path');
  
  if (!context.issue.number) return;

  const screenshotDir = 'test-results/screenshots';
  const prNumber = context.issue.number;
  const sha = process.env.COMMIT_SHA;
  const shortSha = sha.substring(0, 7);
  const repo = context.repo.repo;
  const owner = context.repo.owner;
  const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/visual-reports/${prNumber}/${sha}`;
  const treeUrl = `https://github.com/${owner}/${repo}/tree/visual-reports/${prNumber}/${sha}`;
  
  console.log(`Generating report for PR #${prNumber}, Commit: ${shortSha}`);
  
  let commentBody = `## 📸 Visual E2E Report (Commit: ${shortSha})\n\n`;
  
  const formatCaption = (filename) => {
    return filename.replace(/[-_]/g, ' ').replace(/\.png$/i, '').replace(/\b\w/g, c => c.toUpperCase());
  };

  try {
    if (fs.existsSync(screenshotDir)) {
      const files = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png'));
      
      if (files.length === 0) {
        commentBody += 'No screenshots captured.';
      } else {
        commentBody += `**Summary:** ${files.length} screenshots captured.\n\n`;
        commentBody += `📂 [Browse all images in branch](${treeUrl}) | 📦 [Download Artifacts](${process.env.GITHUB_SERVER_URL}/${owner}/${repo}/actions/runs/${context.runId})\n\n`;
        
        commentBody += `### Key Visuals\n`;
        
        const keyVisuals = files.filter(f => f === 'initial-state.png');
        const debugVisuals = files.filter(f => f === 'debug-mode.png');
        const mcpActions = files.filter(f => f.startsWith('mcp-'));
        const uiActions = files.filter(f => f.startsWith('ui-'));
        const others = files.filter(f => !keyVisuals.includes(f) && !debugVisuals.includes(f) && !mcpActions.includes(f) && !uiActions.includes(f));

        for (const file of keyVisuals) {
          const fullSizeUrl = `${baseUrl}/${file}`;
          commentBody += `#### ${formatCaption(file)}\n`;
          commentBody += `![${formatCaption(file)}](${fullSizeUrl})\n\n`;
        }

        const renderDetails = (summary, groupFiles) => {
            if (groupFiles.length === 0) return '';
            let html = `<details>\n<summary><strong>${summary} (${groupFiles.length})</strong></summary>\n\n`;
            html += `| Screenshot | Name |\n|---|---|\n`;
            for (const file of groupFiles) {
                const fullSizeUrl = `${baseUrl}/${file}`;
                html += `| ![${file}](${fullSizeUrl}) | ${formatCaption(file)} |\n`;
            }
            html += `\n</details>\n\n`;
            return html;
        };

        commentBody += renderDetails('Debug Mode', debugVisuals);
        commentBody += renderDetails('MCP Actions & States', mcpActions);
        commentBody += renderDetails('UI Actions & States', uiActions);
        if (others.length > 0) {
            commentBody += renderDetails('Other Screenshots', others);
        }
      }
    } else {
      commentBody += '⚠️ Screenshot directory not found. Tests might have failed before capture.';
    }
  } catch (error) {
    console.error(error);
    commentBody += `\nError generating report: ${error.message}`;
  }
  
  console.log('Report Body Length:', commentBody.length);

  // Always create a new comment as requested
  console.log('Creating new comment');
  const response = await github.rest.issues.createComment({
    issue_number: prNumber,
    owner: owner,
    repo: repo,
    body: commentBody
  });
  core.setOutput('comment_id', response.data.id);
};