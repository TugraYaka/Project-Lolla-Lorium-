/**
 * Hasteria.js - Main Menu Logic
 */

const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const packagesDir = path.join(__dirname, '..', 'packages');
    const engineGrid = document.querySelector('.engine-grid');
    engineGrid.innerHTML = ''; // Temizle

    if (fs.existsSync(packagesDir)) {
        const folders = fs.readdirSync(packagesDir);
        for (const folder of folders) {
            const manifestPath = path.join(packagesDir, folder, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
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
                    ipcRenderer.send('open-package', path.join(packagesDir, folder, manifest.entry), manifest.width, manifest.height);
                });
                
                engineGrid.appendChild(card);
            }
        }
    }
});
