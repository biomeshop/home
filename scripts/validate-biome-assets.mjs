import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { biomeInfos, mainBiomeShopPanorama } from '../biomeinfos.js';
import { buildGalleryManifest } from './gallery-manifest.mjs';

const rootDir = process.cwd();
const galleryManifest = buildGalleryManifest(rootDir);
const errors = [];

function assetExists(relativePath) {
  return existsSync(resolve(rootDir, relativePath));
}

function validatePanoramaRecord(label, imageKey, pano) {
  if (!imageKey) {
    errors.push(`${label}: missing imageKey.`);
    return;
  }

  if (!assetExists(`assets/${imageKey}`)) {
    errors.push(`${label}: missing panorama asset assets/${imageKey}.`);
  }

  if (pano) {
    const keys = ['fullWidth', 'fullHeight', 'croppedWidth', 'croppedHeight', 'croppedX', 'croppedY'];
    for (const key of keys) {
      if (typeof pano[key] !== 'number' || Number.isNaN(pano[key])) {
        errors.push(`${label}: pano.${key} is missing or invalid.`);
      }
    }
  }
}

validatePanoramaRecord('mainBiomeShopPanorama', mainBiomeShopPanorama.imageKey, mainBiomeShopPanorama.pano);

for (const biome of biomeInfos) {
  const label = `Biome ${biome.id} (${biome.name})`;

  if (!biome.id) {
    errors.push(`${label}: missing id.`);
    continue;
  }

  if (!Array.isArray(biome.types) || biome.types.length === 0) {
    errors.push(`${label}: types must be a non-empty array.`);
  }

  if (!biome.name) {
    errors.push(`${label}: missing name.`);
  }

  if (!biome.status) {
    errors.push(`${label}: missing status.`);
  }

  if (biome.imageKey && biome.imageKey !== 'visual-soon.png') {
    validatePanoramaRecord(label, biome.imageKey, biome.pano);
  }

  const galleryFolder = resolve(rootDir, 'assets', 'biomeimages', biome.id);
  const galleryFiles = galleryManifest[biome.id] ?? [];

  if (!existsSync(galleryFolder) && galleryFiles.length > 0) {
    errors.push(`${label}: gallery manifest exists but gallery folder is missing.`);
  }

  for (const filename of galleryFiles) {
    const relativePath = `assets/biomeimages/${biome.id}/${filename}`;
    if (!assetExists(relativePath)) {
      errors.push(`${label}: missing gallery asset ${relativePath}.`);
    }
  }
}

if (errors.length > 0) {
  console.error('Biome asset validation failed.');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Validated ${biomeInfos.length} biomes successfully.`);
