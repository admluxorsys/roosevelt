const fs = require('fs');
const path = require('path');

const targetDirs = [
    'src/app/nucleo/[entityId]/cmo/crm',
    'src/app/nucleo/[entityId]/coo/kamban',
    'src/app/nucleo/[entityId]/cto/automation/chatbots',
    'src/app/nucleo/[entityId]/cto/integrations'
];

function walkSync(dir, filelist = []) {
    if (!fs.existsSync(dir)) return filelist;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else {
            if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
                filelist.push(filepath);
            }
        }
    }
    return filelist;
}

let allFiles = [];
targetDirs.forEach(dir => {
    allFiles = allFiles.concat(walkSync(dir));
});

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // 1. Inject useAuth import if not present and if there's a React component/hook
    if (content.includes('export default function') || content.includes('export const use')) {
        if (!content.includes('import { useAuth }')) {
            content = content.replace(/(import .*?;[\r\n]+)(?!import)/, `$1import { useAuth } from '@/contexts/AuthContext';\n`);
            changed = true;
        }

        // 2. Inject getTenantPath inside the component/hook
        // This is a bit tricky with regex, we try to find the main function body
        const funcRegex = /(export default function [^\(]+\([^\)]*\)\s*{|export const use[^\=]+\s*=\s*\([^\)]*\)\s*=>\s*{)/;
        if (funcRegex.test(content) && !content.includes('getTenantPath')) {
            content = content.replace(funcRegex, `$1\n    const { currentUser, activeEntity } = useAuth();\n    const getTenantPath = () => {\n        if (!currentUser?.uid || !activeEntity) return '';\n        return \`users/\${currentUser.uid}/entities/\${activeEntity}\`;\n    };\n`);
            changed = true;
        }
    }

    // 3. Replace collections
    const collectionsToReplace = ['contacts', 'kanban-groups', 'kamban-groups', 'chatbots'];
    collectionsToReplace.forEach(col => {
        // collection(db, 'contacts') -> collection(db, `${getTenantPath()}/contacts`)
        const regex1 = new RegExp(`collection\\(db,\\s*['"]${col}['"]\\)`, 'g');
        if (regex1.test(content)) {
            content = content.replace(regex1, `collection(db, \`\${getTenantPath()}/${col}\`)`);
            changed = true;
        }

        // collection(db, 'contacts', -> collection(db, `${getTenantPath()}/contacts`,
        const regex2 = new RegExp(`collection\\(db,\\s*['"]${col}['"],`, 'g');
        if (regex2.test(content)) {
            content = content.replace(regex2, `collection(db, \`\${getTenantPath()}/${col}\`,`);
            changed = true;
        }

        // doc(db, 'contacts', -> doc(db, `${getTenantPath()}/contacts`,
        const regex3 = new RegExp(`doc\\(db,\\s*['"]${col}['"],`, 'g');
        if (regex3.test(content)) {
            content = content.replace(regex3, `doc(db, \`\${getTenantPath()}/${col}\`,`);
            changed = true;
        }

        // `kamban-groups/${groupId}/cards` -> `${getTenantPath()}/kamban-groups/${groupId}/cards`
        // Handle literal string template replacements
        const regex4 = new RegExp(`\`${col}/`, 'g');
        if (regex4.test(content)) {
            content = content.replace(regex4, `\`\${getTenantPath()}/${col}/`);
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Refactored: ${file}`);
    }
});

console.log("Refactoring front-end step 1 complete.");
