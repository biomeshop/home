import { Viewer } from 'https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core@5.14.1/+esm';
import { biomeInfos } from './biomeinfos.js';

const galleryManifestUrl = '../assets/biome-gallery-manifest.json';
const sharedPlaceholderKey = 'visual-soon.png';
const modal = document.getElementById('gallery-modal');
const modalImage = document.getElementById('gallery-modal-image');
const modalCloseButtons = document.querySelectorAll('[data-close-gallery]');
const modalPrev = document.querySelector('[data-gallery-nav="prev"]');
const modalNext = document.querySelector('[data-gallery-nav="next"]');
const galleryGrid = document.getElementById('gallery-grid');
const galleryTitle = document.getElementById('gallery-title');
const galleryPrice = document.getElementById('gallery-price');
const galleryDescription = document.getElementById('gallery-description');
const galleryMeta = document.getElementById('gallery-meta');
const backLink = document.getElementById('gallery-back-link');
const galleryShell = document.querySelector('.gallery-shell');
const panoramaSection = document.getElementById('gallery-panorama');
const panoramaModal = document.getElementById('gallery-panorama-modal');
const panoramaModalHost = document.getElementById('gallery-panorama-modal-host');
const panoramaModalButtons = panoramaModal.querySelectorAll('[data-modal-action]');
const panoramaCloseButtons = document.querySelectorAll('[data-close-panorama]');

let activeImages = [];
let activeIndex = 0;
let pointerStartX = null;
let galleryManifest = {};
let inlinePanoramaViewer = null;
let panoramaModalViewer = null;
let inlinePanoramaViewport = null;

function getBiomeTypes(item) {
  if (Array.isArray(item.types) && item.types.length > 0) {
    return item.types;
  }
  if (typeof item.type === 'string' && item.type.trim()) {
    return [item.type.trim()];
  }
  return ['uncategorized'];
}

function resolveBiomeId() {
  const url = new URL(window.location.href);
  return url.searchParams.get('id');
}

function hasInteractivePanorama(item) {
  return Boolean(item?.pano && item.imageKey && item.imageKey !== sharedPlaceholderKey);
}

function getGalleryAssetPath(id, filename) {
  return `../assets/biomeimages/${id}/${filename}`;
}

function getPanoramaAssetPath(imageKey) {
  return `../assets/${imageKey}`;
}

async function loadGalleryManifest() {
  const response = await fetch(galleryManifestUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to load gallery manifest: ${response.status}`);
  }

  const manifest = await response.json();
  return typeof manifest === 'object' && manifest ? manifest : {};
}

function getGalleryFilenames(biome) {
  const images = galleryManifest[biome.id];
  return Array.isArray(images) ? images : [];
}

function readPanoData(source) {
  if (source instanceof HTMLElement) {
    return {
      fullWidth: Number(source.dataset.fullWidth),
      fullHeight: Number(source.dataset.fullHeight),
      croppedWidth: Number(source.dataset.croppedWidth),
      croppedHeight: Number(source.dataset.croppedHeight),
      croppedX: Number(source.dataset.croppedX),
      croppedY: Number(source.dataset.croppedY),
    };
  }

  return {
    fullWidth: Number(source.pano.fullWidth),
    fullHeight: Number(source.pano.fullHeight),
    croppedWidth: Number(source.pano.croppedWidth),
    croppedHeight: Number(source.pano.croppedHeight),
    croppedX: Number(source.pano.croppedX),
    croppedY: Number(source.pano.croppedY),
  };
}

function syncBodyScrollLock() {
  document.body.style.overflow = (!modal.hidden || !panoramaModal.hidden) ? 'hidden' : '';
}

function resizeViewer(viewer, viewport) {
  viewer.resize({
    width: `${viewport.clientWidth}px`,
    height: `${viewport.clientHeight}px`,
  });
}

function openImageModal(index) {
  activeIndex = index;
  modalImage.src = activeImages[activeIndex].src;
  modalImage.alt = activeImages[activeIndex].alt;
  modal.hidden = false;
  syncBodyScrollLock();
}

function closeImageModal() {
  modal.hidden = true;
  syncBodyScrollLock();
}

function stepImageModal(direction) {
  if (!activeImages.length) {
    return;
  }
  activeIndex = (activeIndex + direction + activeImages.length) % activeImages.length;
  modalImage.src = activeImages[activeIndex].src;
  modalImage.alt = activeImages[activeIndex].alt;
}

async function ensureInlinePanoramaViewer() {
  if (!inlinePanoramaViewport) {
    return null;
  }

  if (inlinePanoramaViewer) {
    return inlinePanoramaViewer;
  }

  const host = inlinePanoramaViewport.querySelector('.psv-host');
  if (!host) {
    return null;
  }

  inlinePanoramaViewer = new Viewer({
    container: host,
    panorama: inlinePanoramaViewport.dataset.panoramaSrc,
    panoData: readPanoData(inlinePanoramaViewport),
    defaultYaw: '0deg',
    defaultPitch: '0deg',
    defaultZoomLvl: 32,
    mousemove: true,
    mousewheel: true,
    moveInertia: true,
    moveSpeed: 0.62,
    zoomSpeed: 0.55,
    navbar: false,
    touchmoveTwoFingers: false,
    keyboard: false,
    fisheye: false,
    sphereCorrection: { pan: '0deg', tilt: '0deg', roll: '0deg' },
  });

  await new Promise((resolve) => {
    inlinePanoramaViewer.addEventListener('ready', () => {
      inlinePanoramaViewer.rotate({ yaw: 0, pitch: 0 });
      resizeViewer(inlinePanoramaViewer, inlinePanoramaViewport);
      panoramaSection.classList.add('is-pano-ready');
      resolve();
    }, { once: true });
  });

  return inlinePanoramaViewer;
}

async function openPanoramaModal() {
  const viewer = await ensureInlinePanoramaViewer();
  if (!viewer || !inlinePanoramaViewport) {
    return;
  }

  panoramaModal.hidden = false;
  syncBodyScrollLock();

  if (!panoramaModalViewer) {
    panoramaModalViewer = new Viewer({
      container: panoramaModalHost,
      panorama: inlinePanoramaViewport.dataset.panoramaSrc,
      panoData: readPanoData(inlinePanoramaViewport),
      defaultYaw: '0deg',
      defaultPitch: '0deg',
      defaultZoomLvl: 32,
      mousemove: true,
      mousewheel: true,
      moveInertia: true,
      moveSpeed: 0.55,
      zoomSpeed: 0.5,
      navbar: false,
      touchmoveTwoFingers: false,
      keyboard: false,
      fisheye: false,
      sphereCorrection: { pan: '0deg', tilt: '0deg', roll: '0deg' },
    });
  } else {
    panoramaModalViewer.setPanorama(inlinePanoramaViewport.dataset.panoramaSrc, {
      panoData: readPanoData(inlinePanoramaViewport),
    });
  }

  requestAnimationFrame(() => {
    panoramaModalViewer.resize({
      width: `${panoramaModalHost.clientWidth}px`,
      height: `${panoramaModalHost.clientHeight}px`,
    });
    panoramaModalViewer.rotate({ yaw: 0, pitch: 0 });
    panoramaModalViewer.zoom(32);
  });
}

function closePanoramaModal() {
  panoramaModal.hidden = true;
  syncBodyScrollLock();
}

function renderPanoramaMarkup(biome) {
  return `
    <div class="gallery-panorama-card">
      <div class="viewer-header">
        <div>
          <p class="viewer-title">360 Biome Preview</p>
        </div>
      </div>
      <div class="gallery-panorama-frame">
        <div
          class="panorama-viewport gallery-panorama-viewport"
          tabindex="0"
          role="region"
          aria-label="${biome.name} 360 panorama viewer"
          data-biome-id="${biome.id}"
          data-panorama-src="${getPanoramaAssetPath(biome.imageKey)}"
          data-full-width="${biome.pano.fullWidth}"
          data-full-height="${biome.pano.fullHeight}"
          data-cropped-width="${biome.pano.croppedWidth}"
          data-cropped-height="${biome.pano.croppedHeight}"
          data-cropped-x="${biome.pano.croppedX}"
          data-cropped-y="${biome.pano.croppedY}"
        >
          <img
            class="panorama-preview"
            src="${getPanoramaAssetPath(biome.imageKey)}"
            alt="${biome.name} panorama preview"
            loading="eager"
            decoding="async"
            fetchpriority="high"
          >
          <div class="psv-host" aria-hidden="true"></div>
          <div class="viewer-badge">360</div>
          <div class="viewer-overlay viewer-overlay-hidden" aria-hidden="true"></div>
          <button class="expand-button expand-button-inside" type="button" id="gallery-panorama-expand" aria-expanded="false">
            Expand
          </button>
          <div class="viewer-controls viewer-controls-inside" aria-label="Panorama controls">
            <button type="button" data-action="zoom-in">+</button>
            <button type="button" data-action="zoom-out">-</button>
            <button type="button" data-action="reset">Reset</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindPanoramaControls() {
  const viewport = panoramaSection.querySelector('.gallery-panorama-viewport');
  const expandButton = panoramaSection.querySelector('#gallery-panorama-expand');
  const controlButtons = panoramaSection.querySelectorAll('.viewer-controls-inside button');

  inlinePanoramaViewport = viewport;
  if (!inlinePanoramaViewport) {
    return;
  }

  expandButton?.addEventListener('click', async () => {
    expandButton.setAttribute('aria-expanded', 'true');
    await openPanoramaModal();
  });

  controlButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const viewer = await ensureInlinePanoramaViewer();
      if (!viewer) {
        return;
      }

      const action = button.dataset.action;
      if (action === 'zoom-in') {
        viewer.zoom(Math.min(100, viewer.getZoomLevel() + 9));
      }
      if (action === 'zoom-out') {
        viewer.zoom(Math.max(0, viewer.getZoomLevel() - 9));
      }
      if (action === 'reset') {
        viewer.rotate({ yaw: 0, pitch: 0 });
        viewer.zoom(32);
      }
    });
  });

  void ensureInlinePanoramaViewer();
}

function destroyInlinePanoramaViewer() {
  inlinePanoramaViewer?.destroy();
  inlinePanoramaViewer = null;
  inlinePanoramaViewport = null;
  panoramaSection.classList.remove('is-pano-ready');
}

function renderPanorama(biome) {
  if (!hasInteractivePanorama(biome)) {
    destroyInlinePanoramaViewer();
    panoramaSection.hidden = true;
    panoramaSection.innerHTML = '';
    return;
  }

  panoramaSection.hidden = false;
  panoramaSection.innerHTML = renderPanoramaMarkup(biome);
  bindPanoramaControls();
}

function renderGallery(biome) {
  galleryTitle.textContent = biome.name;
  galleryPrice.textContent = biome.priceLabel;
  galleryDescription.textContent = biome.description;
  backLink.href = '../';
  galleryShell.classList.toggle('is-sold', biome.status === 'Sold');

  galleryMeta.innerHTML = getBiomeTypes(biome)
    .map((type) => `<span class="gallery-chip">${type}</span>`)
    .join('');

  const galleryFilenames = getGalleryFilenames(biome);

  activeImages = galleryFilenames.map((filename, index) => ({
    src: getGalleryAssetPath(biome.id, filename),
    alt: `${biome.name} gallery image ${index + 1}`,
  }));

  if (activeImages.length === 0) {
    galleryGrid.innerHTML = `
      <article class="gallery-item">
        <div class="gallery-caption">No gallery images yet for this biome.</div>
      </article>
    `;
  } else {
    galleryGrid.innerHTML = activeImages.map((image, index) => `
      <article class="gallery-item">
        <button type="button" data-image-index="${index}" aria-label="Open image ${index + 1} for ${biome.name}">
          <img
            class="gallery-thumb"
            src="${image.src}"
            alt="${image.alt}"
            loading="lazy"
            decoding="async"
          >
        </button>
        <div class="gallery-caption">Preview ${index + 1}</div>
      </article>
    `).join('');
  }

  renderPanorama(biome);
}

galleryGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-image-index]');
  if (!(button instanceof HTMLElement)) {
    return;
  }

  openImageModal(Number(button.dataset.imageIndex));
});

modalCloseButtons.forEach((button) => {
  button.addEventListener('click', closeImageModal);
});

panoramaCloseButtons.forEach((button) => {
  button.addEventListener('click', closePanoramaModal);
});

panoramaModalButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (!panoramaModalViewer) {
      return;
    }

    const action = button.dataset.modalAction;
    if (action === 'zoom-in') {
      panoramaModalViewer.zoom(Math.min(100, panoramaModalViewer.getZoomLevel() + 9));
    }
    if (action === 'zoom-out') {
      panoramaModalViewer.zoom(Math.max(0, panoramaModalViewer.getZoomLevel() - 9));
    }
    if (action === 'reset') {
      panoramaModalViewer.rotate({ yaw: 0, pitch: 0 });
      panoramaModalViewer.zoom(32);
    }
  });
});

modalPrev?.addEventListener('click', () => stepImageModal(-1));
modalNext?.addEventListener('click', () => stepImageModal(1));

modal.addEventListener('pointerdown', (event) => {
  pointerStartX = event.clientX;
});

modal.addEventListener('pointerup', (event) => {
  if (pointerStartX == null) {
    return;
  }

  const deltaX = event.clientX - pointerStartX;
  if (Math.abs(deltaX) > 40) {
    stepImageModal(deltaX < 0 ? 1 : -1);
  }
  pointerStartX = null;
});

document.addEventListener('keydown', (event) => {
  if (!modal.hidden) {
    if (event.key === 'Escape') {
      closeImageModal();
    }
    if (event.key === 'ArrowLeft') {
      stepImageModal(-1);
    }
    if (event.key === 'ArrowRight') {
      stepImageModal(1);
    }
  }
  if (!panoramaModal.hidden && event.key === 'Escape') {
    closePanoramaModal();
  }
});

window.addEventListener('resize', () => {
  if (inlinePanoramaViewer && inlinePanoramaViewport) {
    resizeViewer(inlinePanoramaViewer, inlinePanoramaViewport);
  }

  if (!panoramaModal.hidden && panoramaModalViewer) {
    panoramaModalViewer.resize({
      width: `${panoramaModalHost.clientWidth}px`,
      height: `${panoramaModalHost.clientHeight}px`,
    });
  }
});

const biomeId = resolveBiomeId();
const currentBiome = biomeInfos.find((item) => item.id === biomeId);

async function initializeGalleryPage() {
  if (!currentBiome) {
    galleryTitle.textContent = 'Biome not found';
    galleryDescription.textContent = 'This biome gallery does not exist yet.';
    galleryPrice.textContent = '';
    return;
  }

  try {
    galleryManifest = await loadGalleryManifest();
  } catch (error) {
    console.error(error);
    galleryManifest = {};
  }

  renderGallery(currentBiome);
}

void initializeGalleryPage();
