const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
    if (!fs.existsSync(dir)) return filelist;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else {
            if (filepath.endsWith('.ts') || filepath.endsWith('.tsx') || filepath.endsWith('.json') || filepath.endsWith('.js')) {
                filelist.push(filepath);
            }
        }
    }
    return filelist;
}

const srcDir = 'src';
const allFiles = walkSync(srcDir);

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace brand/owner names
    if (content.includes('uDreamms')) {
        content = content.replace(/uDreamms/g, 'Roosevelt');
        changed = true;
    }
    if (content.includes('udreamms')) {
        content = content.replace(/udreamms/g, 'roosevelt');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Cleaned brand in: ${file}`);
    }
});

console.log("Brand cleanup complete.");
