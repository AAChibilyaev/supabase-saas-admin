/**
 * Simple icon generator for PWA
 * Creates SVG icons that can be converted to PNG
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, '../public');

// Create a simple SVG icon
const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <g transform="translate(${size/2}, ${size/2})">
    <!-- Database icon -->
    <ellipse cx="0" cy="${-size/6}" rx="${size/4}" ry="${size/12}" fill="#3ECF8E" stroke="#ffffff" stroke-width="2"/>
    <rect x="${-size/4}" y="${-size/6}" width="${size/2}" height="${size/3}" fill="#3ECF8E"/>
    <ellipse cx="0" cy="${size/6}" rx="${size/4}" ry="${size/12}" fill="#3ECF8E" stroke="#ffffff" stroke-width="2"/>
    <!-- Admin star -->
    <polygon points="${-size/12},${size/4} ${size/12},${size/4} ${size/24},${size/3.5} ${size/8},${size/2.5} 0,${size/3} ${-size/8},${size/2.5} ${-size/24},${size/3.5}"
             fill="#ffffff" stroke="#3ECF8E" stroke-width="1"/>
  </g>
</svg>`;

// Generate SVG files
sizes.forEach(size => {
  const svg = createSVG(size);
  fs.writeFileSync(path.join(publicDir, `icon-${size}.svg`), svg);
  console.log(`Generated icon-${size}.svg`);
});

// Generate maskable icons (with safe zone padding)
const createMaskableSVG = (size) => {
  const safeZone = size * 0.8; // 80% safe zone
  const offset = (size - safeZone) / 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <g transform="translate(${size/2}, ${size/2})">
    <!-- Database icon (scaled for safe zone) -->
    <ellipse cx="0" cy="${-(safeZone/6)}" rx="${safeZone/4}" ry="${safeZone/12}" fill="#3ECF8E" stroke="#ffffff" stroke-width="2"/>
    <rect x="${-(safeZone/4)}" y="${-(safeZone/6)}" width="${safeZone/2}" height="${safeZone/3}" fill="#3ECF8E"/>
    <ellipse cx="0" cy="${safeZone/6}" rx="${safeZone/4}" ry="${safeZone/12}" fill="#3ECF8E" stroke="#ffffff" stroke-width="2"/>
    <!-- Admin star -->
    <polygon points="${-(safeZone/12)},${safeZone/4} ${safeZone/12},${safeZone/4} ${safeZone/24},${safeZone/3.5} ${safeZone/8},${safeZone/2.5} 0,${safeZone/3} ${-(safeZone/8)},${safeZone/2.5} ${-(safeZone/24)},${safeZone/3.5}"
             fill="#ffffff" stroke="#3ECF8E" stroke-width="1"/>
  </g>
</svg>`;
};

[192, 512].forEach(size => {
  const svg = createMaskableSVG(size);
  fs.writeFileSync(path.join(publicDir, `icon-maskable-${size}.svg`), svg);
  console.log(`Generated icon-maskable-${size}.svg`);
});

console.log('\nIcons generated successfully!');
console.log('Note: For production, convert SVG icons to PNG using an image converter.');
console.log('You can use ImageMagick: convert icon-192.svg icon-192.png');
