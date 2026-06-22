import sharp from 'sharp';
import fs from 'fs';

async function convert() {
  try {
    const svgBuffer = fs.readFileSync('public/logo.svg');
    
    console.log('Converting public/logo.svg to high-res transparent public/logo.png...');
    // Render SVG to 512x512 PNG with true transparency
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile('public/logo.png');
      
    console.log('Converting public/logo.svg to transparent public/favicon.png...');
    // Render SVG to 128x128 PNG for favicon
    await sharp(svgBuffer)
      .resize(128, 128)
      .png()
      .toFile('public/favicon.png');

    console.log('SVG conversion completed successfully!');
  } catch (error) {
    console.error('Error during SVG conversion:', error);
    process.exit(1);
  }
}

convert();
