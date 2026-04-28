// Patch react-dev-utils checkRequiredFiles to use fs.constants.F_OK
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', 'react-dev-utils', 'checkRequiredFiles.js');

if (!fs.existsSync(target)) {
  // nothing to do
  process.exit(0);
}

let content = fs.readFileSync(target, 'utf8');
if (content.includes('fs.F_OK')) {
  content = content.replace(/fs\.F_OK/g, 'fs.constants.F_OK');
  fs.writeFileSync(target, content, 'utf8');
  console.log('Patched react-dev-utils checkRequiredFiles.js');
} else {
  console.log('No patch needed for react-dev-utils');
}
