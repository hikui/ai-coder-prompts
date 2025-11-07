#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Parse frontmatter from markdown
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: {}, content: content };
  }
  
  const [, frontmatterStr, bodyContent] = match;
  const frontmatter = {};
  
  // Parse YAML-like frontmatter (simple key: value pairs)
  const lines = frontmatterStr.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  }
  
  return { frontmatter, content: bodyContent.trim() };
}

// Convert to Claude Code format (.md with YAML frontmatter)
function toClaudeCodeFormat(filename, description, content) {
  let output = '---\n';
  if (description) {
    output += `description: ${description}\n`;
  }
  output += '---\n\n';
  output += content;
  return output;
}

// Convert to Gemini CLI format (.toml)
function toGeminiFormat(filename, description, content) {
  let output = '';
  if (description) {
    output += `description = "${description.replace(/"/g, '\\"')}"\n\n`;
  }
  output += 'prompt = """\n';
  output += content;
  output += '\n"""\n';
  return output;
}

// Convert to GitHub Copilot format (.prompt.md)
function toGithubCopilotFormat(filename, description, content) {
  let output = '---\n';
  output += 'mode: agent\n';
  if (description) {
    output += `description: ${description}\n`;
  }
  output += '---\n\n';
  output += content;
  return output;
}

// Convert to Cursor commands format (plain .md files)
function toCursorFormat(filename, description, content) {
  // Cursor commands are just plain markdown files
  // Optionally include description as a comment at the top
  let output = '';
  if (description) {
    output += `<!-- ${description} -->\n\n`;
  }
  output += content;
  return output;
}

// Get all .md files from directory recursively
function getMarkdownFiles(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath, baseDir));
    } else if (stat.isFile() && item.endsWith('.md')) {
      const relativePath = path.relative(baseDir, fullPath);
      files.push({ fullPath, relativePath });
    }
  }
  
  return files;
}

// Create output directory structure
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Process files for a specific target
function processFiles(sourceDir, targetConfig) {
  console.log(`\n${colors.cyan}Processing files for ${targetConfig.name}...${colors.reset}`);
  
  const files = getMarkdownFiles(sourceDir);
  let processedCount = 0;
  
  for (const { fullPath, relativePath } of files) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const { frontmatter, content: bodyContent } = parseFrontmatter(content);
    const description = frontmatter.description || '';
    
    // Get the relative path without extension
    const relativePathNoExt = relativePath.replace(/\.md$/, '');
    const pathParts = relativePathNoExt.split(path.sep);
    const filename = pathParts[pathParts.length - 1];
    
    // Generate output based on target format
    let outputContent;
    let outputPath;
    let outputExt;
    
    switch (targetConfig.format) {
      case 'claude-code':
        outputContent = toClaudeCodeFormat(filename, description, bodyContent);
        outputExt = '.md';
        outputPath = path.join(targetConfig.outputDir, relativePathNoExt + outputExt);
        break;
        
      case 'gemini':
        outputContent = toGeminiFormat(filename, description, bodyContent);
        outputExt = '.toml';
        outputPath = path.join(targetConfig.outputDir, relativePathNoExt + outputExt);
        break;
        
      case 'github-copilot':
        outputContent = toGithubCopilotFormat(filename, description, bodyContent);
        outputExt = '.prompt.md';
        outputPath = path.join(targetConfig.outputDir, relativePathNoExt + outputExt);
        break;
        
      case 'cursor':
        outputContent = toCursorFormat(filename, description, bodyContent);
        outputExt = '.md';
        outputPath = path.join(targetConfig.outputDir, relativePathNoExt + outputExt);
        break;
        
      default:
        console.log(`${colors.red}Unknown format: ${targetConfig.format}${colors.reset}`);
        continue;
    }
    
    // Ensure output directory exists
    ensureDir(path.dirname(outputPath));
    
    // Write the file
    fs.writeFileSync(outputPath, outputContent, 'utf-8');
    processedCount++;
    
    console.log(`  ${colors.green}✓${colors.reset} ${relativePath} → ${path.relative(process.cwd(), outputPath)}`);
  }
  
  console.log(`${colors.green}Processed ${processedCount} file(s) for ${targetConfig.name}${colors.reset}`);
  return processedCount;
}

// Interactive prompt
async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Main function
async function main() {
  console.log(`${colors.bright}${colors.blue}AI Prompt Sync Tool${colors.reset}`);
  console.log(`${'='.repeat(50)}\n`);
  
  // Get source directory
  const sourceDir = await prompt(`${colors.yellow}Enter source prompts directory${colors.reset} (default: ./prompts): `);
  const promptsDir = sourceDir || './prompts';
  
  if (!fs.existsSync(promptsDir)) {
    console.log(`${colors.red}Error: Directory '${promptsDir}' does not exist.${colors.reset}`);
    process.exit(1);
  }
  
  // Show available AI tools
  console.log(`\n${colors.bright}Available AI tools:${colors.reset}`);
  console.log(`  1. Claude Code`);
  console.log(`  2. Gemini CLI`);
  console.log(`  3. GitHub Copilot`);
  console.log(`  4. Cursor`);
  console.log(`  5. All of the above`);
  
  const selection = await prompt(`\n${colors.yellow}Select target(s)${colors.reset} (comma-separated numbers or 5 for all): `);
  const selections = selection.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  
  if (selections.length === 0) {
    console.log(`${colors.red}No valid selection made.${colors.reset}`);
    process.exit(1);
  }
  
  // Get base output directory
  const baseOutputDir = await prompt(`\n${colors.yellow}Enter base output directory${colors.reset} (default: ./output): `);
  const outputDir = baseOutputDir || './output';
  
  // Map selections to target configurations
  const targetConfigs = [];
  
  if (selections.includes(5) || selections.includes(1)) {
    targetConfigs.push({
      name: 'Claude Code',
      format: 'claude-code',
      outputDir: path.join(outputDir, 'claude-code', 'commands')
    });
  }
  
  if (selections.includes(5) || selections.includes(2)) {
    targetConfigs.push({
      name: 'Gemini CLI',
      format: 'gemini',
      outputDir: path.join(outputDir, 'gemini', 'commands')
    });
  }
  
  if (selections.includes(5) || selections.includes(3)) {
    targetConfigs.push({
      name: 'GitHub Copilot',
      format: 'github-copilot',
      outputDir: path.join(outputDir, 'github-copilot', 'prompts')
    });
  }
  
  if (selections.includes(5) || selections.includes(4)) {
    targetConfigs.push({
      name: 'Cursor',
      format: 'cursor',
      outputDir: path.join(outputDir, 'cursor', 'commands')
    });
  }
  
  // Process files for each target
  console.log(`\n${colors.bright}Starting conversion...${colors.reset}`);
  let totalProcessed = 0;
  
  for (const config of targetConfigs) {
    totalProcessed += processFiles(promptsDir, config);
  }
  
  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`${colors.bright}${colors.green}✓ Conversion complete!${colors.reset}`);
  console.log(`Total files processed: ${totalProcessed}`);
  console.log(`Output directory: ${path.resolve(outputDir)}`);
  
  // Show installation instructions
  if (targetConfigs.length > 0) {
    console.log(`\n${colors.bright}Installation instructions:${colors.reset}`);
    
    for (const config of targetConfigs) {
      console.log(`\n${colors.cyan}${config.name}:${colors.reset}`);
      
      switch (config.format) {
        case 'claude-code':
          console.log(`  Project: Copy files to ${colors.yellow}.claude/commands/${colors.reset}`);
          console.log(`  User: Copy files to ${colors.yellow}~/.claude/commands/${colors.reset}`);
          break;
          
        case 'gemini':
          console.log(`  Project: Copy files to ${colors.yellow}.gemini/commands/${colors.reset}`);
          console.log(`  User: Copy files to ${colors.yellow}~/.gemini/commands/${colors.reset}`);
          break;
          
        case 'github-copilot':
          console.log(`  Copy files to ${colors.yellow}.github/prompts/${colors.reset}`);
          console.log(`  Use with ${colors.yellow}#prompt:${colors.reset} in Copilot Chat`);
          break;
          
        case 'cursor':
          console.log(`  Project: Copy files to ${colors.yellow}.cursor/commands/${colors.reset}`);
          console.log(`  User: Copy files to ${colors.yellow}~/.cursor/commands/${colors.reset}`);
          console.log(`  Usage: Type ${colors.yellow}/${colors.reset} in Cursor Agent chat to see all commands`);
          break;
      }
    }
  }
  
  console.log(`\n${colors.bright}Happy coding with AI! 🚀${colors.reset}\n`);
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = {
  parseFrontmatter,
  toClaudeCodeFormat,
  toGeminiFormat,
  toGithubCopilotFormat,
  toCursorFormat,
  processFiles
};