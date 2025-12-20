const fs = require('fs');
const path = require('path');
const buildFile = path.join('node_modules', 'react-scripts', 'scripts', 'build.js');

try {
  let content = fs.readFileSync(buildFile, 'utf8');
  if (!content.includes('JSON.parse =')) {
    const patch = `
const _op = JSON.parse;
JSON.parse = function(s, r) {
  try {
    return _op(s, r);
  } catch (e) {
    console.error("JSON_ERROR_START");
    console.error(e.message);
    const stack = e.stack;
    console.error("FULL_STACK:\n" + stack);
    console.error("STRING: '" + s + "'");
    console.error("STRING_LEN: " + (s ? s.length : 0));
    console.error("JSON_ERROR_END");
    throw e;
  }
};
`;
    fs.writeFileSync(buildFile, patch + content);
    console.log('SUCCESS: Patched ' + buildFile);
  } else {
    console.log('ALREADY_PATCHED');
  }
} catch (e) {
  console.error('FAILED: ' + e.message);
  process.exit(1);
}
