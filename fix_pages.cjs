const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');
const viewsDir = path.join(srcDir, 'views');

if (fs.existsSync(pagesDir)) {
  fs.renameSync(pagesDir, viewsDir);
  console.log('Renamed src/pages to src/views');
}

function replaceInFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFiles(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('@/pages/') || content.includes('../pages/') || content.includes('./pages/')) {
        content = content.replace(/@\/pages\//g, '@/views/');
        content = content.replace(/\.\.\/pages\//g, '../views/');
        content = content.replace(/\.\/pages\//g, './views/');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated imports in ${fullPath}`);
      }
    }
  }
}

replaceInFiles(srcDir);
console.log('Done replacing imports');
