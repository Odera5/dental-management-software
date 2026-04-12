const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    content = content.replace(/localStorage\.getItem\((['"]user['"])\)/g, '(localStorage.getItem($1) || sessionStorage.getItem($1))');
    content = content.replace(/localStorage\.getItem\((['"]accessToken['"])\)/g, '(localStorage.getItem($1) || sessionStorage.getItem($1))');
    content = content.replace(/localStorage\.getItem\((['"]refreshToken['"])\)/g, '(localStorage.getItem($1) || sessionStorage.getItem($1))');
    
    content = content.replace(/localStorage\.removeItem\((['"]user['"])\)/g, '(localStorage.removeItem($1), sessionStorage.removeItem($1))');
    content = content.replace(/localStorage\.removeItem\((['"]accessToken['"])\)/g, '(localStorage.removeItem($1), sessionStorage.removeItem($1))');
    content = content.replace(/localStorage\.removeItem\((['"]refreshToken['"])\)/g, '(localStorage.removeItem($1), sessionStorage.removeItem($1))');

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Updated', filePath);
    }
  }
});
