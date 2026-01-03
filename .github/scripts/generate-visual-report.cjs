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
  const deployOutcome = process.env.DEPLOY_OUTCOME;
  const isDeploySuccess = deployOutcome === 'success';

  const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/visual-reports/${prNumber}/${sha}`;
  const treeUrl = `https://github.com/${owner}/${repo}/tree/visual-reports/${prNumber}/${sha}`;
  
  console.log(`Generating report for PR #${prNumber}, Commit: ${shortSha}, Deploy Outcome: ${deployOutcome}`);
  
  let commentBody = `## 📸 Visual E2E Report (Commit: ${shortSha})

`;

  if (!isDeploySuccess) {
    commentBody += `> ⚠️ **Notice:** Automated screenshot upload to the visual-reports branch failed (likely due to branch protection). \n`;
    commentBody += `> Please check the **Download Artifacts** link below to view the full report locally.\n\n`;
  }
  
  const formatCaption = (filename) => {
    return filename.replace(/[-_]/g, ' ').replace(/\.png$/i, '').replace(/\b\w/g, c => c.toUpperCase());
  };

  try {
    if (fs.existsSync(screenshotDir)) {
      const files = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png'));
      
      if (files.length === 0) {
        commentBody += 'No screenshots captured.';
      } else {
        commentBody += `**Summary:** ${files.length} screenshots captured.

`;
        
        let links = [];
        if (isDeploySuccess) {
          links.push(`📂 [Browse all images in branch](${treeUrl})`);
        }
        links.push(`📦 [Download Artifacts](${process.env.GITHUB_SERVER_URL}/${owner}/${repo}/actions/runs/${context.runId})`);
        
        commentBody += links.join(' | ') + '\n\n';
        
        commentBody += `### Key Visuals
`;
        
        const keyScreenshots = ['initial-state.png', 'debug-mode.png'];
        const displayed = [];
        const hidden = [];

        for (const file of files) {
          const isKey = keyScreenshots.some(k => file.includes(k));
          
          if (isKey) {
            if (isDeploySuccess) {
              const fullSizeUrl = `${baseUrl}/${file}`;
              commentBody += `#### ${formatCaption(file)}
`;
              commentBody += `![${formatCaption(file)}](${fullSizeUrl})

`;
            } else {
              commentBody += `#### ${formatCaption(file)}
`;
              commentBody += `*(Image available in Artifacts)*

`;
            }
            displayed.push(file);
          } else {
            hidden.push(file);
          }
        }

        if (hidden.length > 0) {
          commentBody += `<details>
<summary><strong>See ${hidden.length} more screenshots...</strong></summary>

`;
          
          if (isDeploySuccess) {
            commentBody += `These files are available in the [visual-reports branch](${treeUrl}) and GitHub Artifacts.

`;
            commentBody += `| Screenshot | Status |
|---|---|
`;
            for (const file of hidden) {
               const fullSizeUrl = `${baseUrl}/${file}`;
               commentBody += `| [${file}](${fullSizeUrl}) | ✅ Online |
`;
            }
          } else {
            commentBody += `These files are available in the GitHub Artifacts zip file.

`;
            commentBody += `| Screenshot | Status |
|---|---|
`;
            for (const file of hidden) {
               commentBody += `| ${file} | 📦 In Artifacts |
`;
            }
          }
          commentBody += `
</details>
`;
        }
      }
    } else {
      commentBody += '⚠️ Screenshot directory not found. Tests might have failed before capture.';
    }
  } catch (error) {
    console.error(error);
    commentBody += `
Error generating report: ${error.message}`;
  }
  
  const response = await github.rest.issues.createComment({
    issue_number: prNumber,
    owner: owner,
    repo: repo,
    body: commentBody
  });
  core.setOutput('comment_id', response.data.id);
};
