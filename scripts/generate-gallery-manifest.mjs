import { writeGalleryManifest } from './gallery-manifest.mjs';

const { outputPath } = writeGalleryManifest();
console.log(`Generated ${outputPath}`);
