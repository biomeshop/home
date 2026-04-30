import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const biomeImagesDir = join(rootDir, 'assets', 'biomeimages');
const outputPath = join(rootDir, 'assets', 'biome-gallery-manifest.json');
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function isSupportedImage(filename) {
  const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return imageExtensions.has(extension);
}

function buildManifest() {
  const manifest = {};
  const biomeFolders = readdirSync(biomeImagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));

  for (const folder of biomeFolders) {
    const folderPath = join(biomeImagesDir, folder.name);
    const images = readdirSync(folderPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && isSupportedImage(entry.name))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

    manifest[folder.name] = images;
  }

  return manifest;
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(buildManifest(), null, 2)}\n`, 'utf8');
console.log(`Generated ${outputPath}`);
