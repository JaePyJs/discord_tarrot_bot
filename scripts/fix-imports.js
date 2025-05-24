const fs = require('fs');
const path = require('path');

// Function to recursively find all .js files in a directory
function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findJSFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix import paths in a file
function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix relative imports that need to be updated
  const fixes = [
    { from: "require('../utils/", to: "require('../../utils/" },
    { from: "require('../database/", to: "require('../../database/" },
    { from: "require('../data/", to: "require('../../data/" },
    { from: "require('../locales/", to: "require('../../locales/" }
  ];
  
  fixes.forEach(fix => {
    if (content.includes(fix.from)) {
      content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed imports in: ${filePath}`);
  }
}

// Main execution
console.log('🔧 Fixing import paths in command files...');

const commandsDir = path.join(__dirname, '..', 'src', 'commands');
const jsFiles = findJSFiles(commandsDir);

jsFiles.forEach(fixImports);

console.log(`✅ Processed ${jsFiles.length} files`);
console.log('🎉 Import path fixes complete!');
