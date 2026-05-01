import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultRootDir = resolve(__dirname, '..');
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function isSupportedImage(filename) {
  const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return imageExtensions.has(extension);
}

export function buildGalleryManifest(rootDir = defaultRootDir) {
  const biomeImagesDir = join(rootDir, 'assets', 'biomeimages');
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

export function writeGalleryManifest(rootDir = defaultRootDir) {
  const outputPath = join(rootDir, 'assets', 'biome-gallery-manifest.json');
  const manifest = buildGalleryManifest(rootDir);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return { manifest, outputPath };
}
