import { Viewer } from 'https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core@5.14.1/+esm';
import { biomeInfos } from './biomeinfos.js';

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
const panoramaCloseButtons = document.querySelectorAll('[data-close-panorama]');

let activeImages = [];
let activeIndex = 0;
let pointerStartX = null;
let panoramaModalViewer = null;

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
  return Boolean(item.pano && item.imageKey && item.imageKey !== 'visual-soon.png');
}

function getGalleryAssetPath(id, filename) {
  return `../assets/biomeimages/${id}/${filename}`;
}

function getPanoramaAssetPath(filename) {
  return `../assets/${filename}`;
}

function readPanoData(item) {
  return {
    fullWidth: Number(item.pano.fullWidth),
    fullHeight: Number(item.pano.fullHeight),
    croppedWidth: Number(item.pano.croppedWidth),
    croppedHeight: Number(item.pano.croppedHeight),
    croppedX: Number(item.pano.croppedX),
    croppedY: Number(item.pano.croppedY),
  };
}

function openImageModal(index) {
  activeIndex = index;
  modalImage.src = activeImages[activeIndex].src;
  modalImage.alt = activeImages[activeIndex].alt;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeImageModal() {
  modal.hidden = true;
  if (panoramaModal.hidden) {
    document.body.style.overflow = '';
  }
}

function stepImageModal(direction) {
  if (!activeImages.length) {
    return;
  }
  activeIndex = (activeIndex + direction + activeImages.length) % activeImages.length;
  modalImage.src = activeImages[activeIndex].src;
  modalImage.alt = activeImages[activeIndex].alt;
}

function openPanoramaModal(biome) {
  if (!hasInteractivePanorama(biome)) {
    return;
  }

  panoramaModal.hidden = false;
  document.body.style.overflow = 'hidden';

  const config = {
    container: panoramaModalHost,
    panorama: getPanoramaAssetPath(biome.imageKey),
    panoData: readPanoData(biome),
    defaultYaw: '0deg',
    defaultPitch: '0deg',
    defaultZoomLvl: 24,
    minFov: 32,
    maxFov: 82,
    mousemove: true,
    mousewheel: true,
    moveInertia: true,
    moveSpeed: 0.55,
    zoomSpeed: 0.45,
    navbar: false,
    touchmoveTwoFingers: false,
    keyboard: false,
    fisheye: false,
    sphereCorrection: { pan: '0deg', tilt: '0deg', roll: '0deg' },
  };

  if (!panoramaModalViewer) {
    panoramaModalViewer = new Viewer(config);
  } else {
    panoramaModalViewer.setPanorama(config.panorama, {
      panoData: config.panoData,
    });
    panoramaModalViewer.setOption('defaultZoomLvl', config.defaultZoomLvl);
    panoramaModalViewer.setOption('minFov', config.minFov);
    panoramaModalViewer.setOption('maxFov', config.maxFov);
  }
}

function closePanoramaModal() {
  panoramaModal.hidden = true;
  if (modal.hidden) {
    document.body.style.overflow = '';
  }
}

function renderPanoramaPreview(biome) {
  if (!hasInteractivePanorama(biome)) {
    panoramaSection.hidden = true;
    panoramaSection.innerHTML = '';
    return;
  }

  panoramaSection.hidden = false;
  panoramaSection.innerHTML = `
    <div class="gallery-panorama-frame">
      <img
        class="gallery-panorama-preview"
        src="${getPanoramaAssetPath(biome.imageKey)}"
        alt="${biome.name} panorama preview"
        loading="eager"
        decoding="async"
      >
      <button class="gallery-panorama-expand" type="button" id="gallery-panorama-expand">Expand</button>
    </div>
  `;

  const expand = document.getElementById('gallery-panorama-expand');
  expand?.addEventListener('click', () => openPanoramaModal(biome));
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

  activeImages = biome.galleryImages.map((filename, index) => ({
    src: getGalleryAssetPath(biome.id, filename),
    alt: `${biome.name} gallery image ${index + 1}`,
  }));

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

  renderPanoramaPreview(biome);
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

const biomeId = resolveBiomeId();
const currentBiome = biomeInfos.find((item) => item.id === biomeId);

if (currentBiome) {
  renderGallery(currentBiome);
} else {
  galleryTitle.textContent = 'Biome not found';
  galleryDescription.textContent = 'This biome gallery does not exist yet.';
  galleryPrice.textContent = '';
  panoramaSection.hidden = true;
}
