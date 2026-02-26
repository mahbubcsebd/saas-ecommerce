const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'seed_log.txt');

fs.readFile(filePath, 'utf16le', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    const lines = data.split('\n');
    console.log(lines.slice(-50).join('\n'));
});
