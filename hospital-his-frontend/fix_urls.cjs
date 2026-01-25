const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace API URLs
    let newContent = content
        .replace(/'http:\/\/localhost:5001\/api\/v1/g, "'/api/v1") // straightforward replace
        .replace(/"http:\/\/localhost:5001\/api\/v1/g, '"/api/v1')
        .replace(/`http:\/\/localhost:5001\/api\/v1/g, '`/api/v1')

        // Replace Socket URLs
        .replace(/'http:\/\/localhost:5001'/g, "''")
        .replace(/"http:\/\/localhost:5001"/g, '""')

        // Replace Image/File URLs
        .replace(/`http:\/\/localhost:5001\//g, '`/'); // e.g. `http://localhost:5001/${image}` -> `/${image}`

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            replaceInFile(fullPath);
        }
    }
}

console.log("Starting URL Fix...");
processDir(path.join(__dirname, 'src'));
console.log("Done!");
