import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { resolve } from 'path';

const FEATURES_DIR = resolve('public/images/features');
const CROP_BOTTOM = 120; // Altura de la barra de navegación aprox

async function cropImages() {
  try {
    const files = await readdir(FEATURES_DIR);
    const pngFiles = files.filter(f => f.endsWith('.png'));

    for (const file of pngFiles) {
      const filePath = resolve(FEATURES_DIR, file);
      
      // Obtener metadata de la imagen
      const metadata = await sharp(filePath).metadata();
      const height = metadata.height;
      const width = metadata.width;
      
      console.log(`📐 ${file}: ${width}x${height}px`);
      
      // Recortar: remover los últimos CROP_BOTTOM píxeles de abajo
      const newHeight = Math.max(height - CROP_BOTTOM, 100);
      
      await sharp(filePath)
        .extract({
          left: 0,
          top: 0,
          width: width,
          height: newHeight,
        })
        .toFile(filePath);
      
      console.log(`✂️  Recortada a ${width}x${newHeight}px\n`);
    }
    
    console.log('✅ Todas las imágenes han sido recortadas');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cropImages();
