import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  biomeInfos,
  biomeTypeOptions,
  mainBiomeShopPanorama,
} from '../biomeinfos.js';
import { buildGalleryManifest } from './gallery-manifest.mjs';
import './validate-biome-assets.mjs';

const SITE_BASE_URL = 'https://biomeshop.github.io/home/';
const biomeOutputPath = resolve(process.cwd(), 'data', 'biome.json');
const biomeVersionOutputPath = resolve(process.cwd(), 'data', 'biome-version.json');

function stableStringify(value) {
  return JSON.stringify(value, null, 2);
}

function hashValue(value) {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

function toAssetUrl(path) {
  return new URL(path, SITE_BASE_URL).toString();
}

function buildBiomeRecord(item, galleryManifest) {
  const galleryFiles = Array.isArray(galleryManifest[item.id]) ? galleryManifest[item.id] : [];
  const previewPath = item.imageKey ? `assets/${item.imageKey}` : null;
  const galleryFolder = `assets/biomeimages/${item.id}/`;

  const coreRecord = {
    id: item.id,
    types: item.types ?? [],
    name: item.name,
    priceLabel: item.priceLabel,
    priceValue: item.priceValue,
    status: item.status,
    description: item.description,
    imageKey: item.imageKey ?? null,
    featured: Boolean(item.featured),
    pano: item.pano ?? null,
    previewImage: previewPath,
    previewImageUrl: previewPath ? toAssetUrl(previewPath) : null,
    panoramaImage: previewPath,
    panoramaImageUrl: previewPath ? toAssetUrl(previewPath) : null,
    galleryFolder,
    galleryFolderUrl: toAssetUrl(galleryFolder),
    galleryImages: galleryFiles.map((filename) => ({
      filename,
      path: `${galleryFolder}${filename}`,
      url: toAssetUrl(`${galleryFolder}${filename}`),
    })),
  };

  return {
    ...coreRecord,
    revision: hashValue(coreRecord).slice(0, 16),
  };
}

export function buildBiomeData() {
  const galleryManifest = buildGalleryManifest();
  const biomes = biomeInfos.map((item) => buildBiomeRecord(item, galleryManifest));

  const payload = {
    schemaVersion: 1,
    sourceOfTruth: 'biomeinfos.js',
    siteBaseUrl: SITE_BASE_URL,
    biomeTypeOptions,
    mainBiomeShopPanorama: {
      ...mainBiomeShopPanorama,
      imagePath: `assets/${mainBiomeShopPanorama.imageKey}`,
      imageUrl: toAssetUrl(`assets/${mainBiomeShopPanorama.imageKey}`),
    },
    biomes,
  };

  const contentHash = hashValue(payload);
  const versionPayload = {
    schemaVersion: 1,
    sourceOfTruth: 'biomeinfos.js',
    siteBaseUrl: SITE_BASE_URL,
    contentHash,
    biomeCount: biomes.length,
    biomes: biomes.map(({ id, revision, status, featured }) => ({
      id,
      revision,
      status,
      featured,
    })),
  };

  return { payload, versionPayload };
}

export function writeBiomeData() {
  const { payload, versionPayload } = buildBiomeData();

  mkdirSync(dirname(biomeOutputPath), { recursive: true });
  writeFileSync(biomeOutputPath, `${stableStringify(payload)}\n`, 'utf8');
  writeFileSync(biomeVersionOutputPath, `${stableStringify(versionPayload)}\n`, 'utf8');

  return {
    biomeOutputPath,
    biomeVersionOutputPath,
    contentHash: versionPayload.contentHash,
  };
}

const { biomeOutputPath: biomePath, biomeVersionOutputPath: versionPath, contentHash } = writeBiomeData();
console.log(`Generated ${biomePath}`);
console.log(`Generated ${versionPath}`);
console.log(`Content hash ${contentHash}`);
