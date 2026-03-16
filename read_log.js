const fs = require('fs');
const content = fs.readFileSync('serveo_clean.log', 'utf8');
console.log(content.replace(/\r/g, '\n[CR]\n'));
