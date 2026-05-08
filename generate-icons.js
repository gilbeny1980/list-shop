// Run with: node generate-icons.js
// Requires: npm install sharp
const sharp = require('sharp');
const fs = require('fs');

const svgContent = fs.readFileSync('./public/icon.svg');

async function generate() {
  await sharp(svgContent).resize(192, 192).png().toFile('./public/icon-192.png');
  await sharp(svgContent).resize(512, 512).png().toFile('./public/icon-512.png');
  await sharp(svgContent).resize(180, 180).png().toFile('./public/apple-touch-icon.png');
  console.log('Icons generated!');
}

generate();
