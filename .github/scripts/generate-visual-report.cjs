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
        
        const keyScreenshots = ['initial-state.png', 'debug-mode.png'];
        const displayed = [];
        const hidden = [];

        for (const file of files) {
          const isKey = keyScreenshots.some(k => file.includes(k));
          
          if (isKey) {
            const fullSizeUrl = `${baseUrl}/${file}`;
            commentBody += `#### ${formatCaption(file)}\n`;
            commentBody += `![${formatCaption(file)}](${fullSizeUrl})\n\n`;
            displayed.push(file);
          } else {
            hidden.push(file);
          }
        }

        if (hidden.length > 0) {
          commentBody += `<details>\n<summary><strong>See ${hidden.length} more screenshots...</strong></summary>\n\n`;
          commentBody += `These files are available in the [visual-reports branch](${treeUrl}) and GitHub Artifacts.\n\n`;
          commentBody += `| Screenshot | Status |\n|---|---|
`;
          for (const file of hidden) {
             const fullSizeUrl = `${baseUrl}/${file}`;
             commentBody += `| [${file}](${fullSizeUrl}) | 📦 In Artifacts |\n`;
          }
          commentBody += `\n</details>\n`;
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