import sharp from 'sharp';
import fs from 'fs';

async function convert() {
  const svgBuffer = fs.readFileSync('./public/icon.svg');
  
  // Generating standard iOS Home Screen Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('./public/apple-touch-icon.png');
    
  // Generating Standard PWA small icon (192x192)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('./public/icon-192.png');
    
  // Generating Standard PWA large icon (512x512)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('./public/icon-512.png');

  console.log('PNG files generated successfully!');
}

convert().catch(console.error);
