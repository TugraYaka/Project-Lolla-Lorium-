/**
 * Hasteria.js - Main Menu Logic
 */

const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const packagesDir = path.join(__dirname, '..', 'packages');
    const nodeModulesDir = path.join(__dirname, '..', 'node_modules', '@TugraYaka');
    const engineGrid = document.querySelector('.engine-grid');
    engineGrid.innerHTML = ''; // Temizle

    function scanDirectory(dir) {
        if (!fs.existsSync(dir)) return;
        
        const folders = fs.readdirSync(dir);
        for (const folder of folders) {
            const pkgPath = path.join(dir, folder);
            const manifestPath = path.join(pkgPath, 'manifest.json');
            
            if (fs.existsSync(manifestPath)) {
                try {
                    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                    
                    const card = document.createElement('div');
                    card.className = 'engine-card';
                    card.innerHTML = `
                        <div class="card-icon">${manifest.icon || '📦'}</div>
                        <div>
                            <div class="card-title">${manifest.displayName || manifest.name}</div>
                            <div class="card-subtitle">${manifest.description || ''}</div>
                        </div>
                    `;
                    
                    card.addEventListener('click', () => {
                        console.log(`Opening ${manifest.name}...`);
                        ipcRenderer.send('open-package', path.join(pkgPath, manifest.entry), manifest.width, manifest.height);
                    });
                    
                    engineGrid.appendChild(card);
                } catch (e) {
                    console.error(`Error loading package from ${folder}:`, e);
                }
            }
        }
    }

    // Hem manuel yüklenenleri hem de npm ile gelenleri tara
    scanDirectory(packagesDir);
    scanDirectory(nodeModulesDir);
});
