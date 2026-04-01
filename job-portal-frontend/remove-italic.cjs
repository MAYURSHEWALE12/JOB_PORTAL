const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('C:/Users/mvshe/Desktop/Job portal project/job-portal-frontend/src/components');
let updatedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace the exact word "italic" inside className strings
    content = content.replace(/className=(["'])(.*?)\bitalic\b(.*?)(\1)/g, function(match, quote, p1, p2, quote2) {
        let newClasses = (p1 + p2).replace(/\s+/g, ' ').trim();
        return `className=${quote}${newClasses}${quote}`;
    });

    // Run a loop because there might be multiple 'className's on a single line
    let newContent = content.replace(/className=(["'])(.*?)\bitalic\b(.*?)(\1)/g, function(match, quote, p1, p2) {
        let newClasses = (p1 + p2).replace(/\s+/g, ' ').trim();
        return `className=${quote}${newClasses}${quote}`;
    });
    while (newContent !== content) {
        content = newContent;
        newContent = content.replace(/className=(["'])(.*?)\bitalic\b(.*?)(\1)/g, function(match, quote, p1, p2) {
            let newClasses = (p1 + p2).replace(/\s+/g, ' ').trim();
            return `className=${quote}${newClasses}${quote}`;
        });
    }

    // Handle inline style fontStyle: 'italic'
    content = content.replace(/,\s*fontStyle:\s*['"]italic['"]/g, '');
    content = content.replace(/fontStyle:\s*['"]italic['"],\s*/g, '');
    content = content.replace(/fontStyle:\s*['"]italic['"]/g, '');

    if (content !== original) {
        fs.writeFileSync(file, content);
        updatedCount++;
        console.log('Updated', path.basename(file));
    }
});

console.log(`Done. Updated ${updatedCount} files.`);
