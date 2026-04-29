import { Viewer } from 'https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core@5.14.1/+esm';
import { biomeInfos, biomeTypeOptions } from './biomeinfos.js';

const sharedPlaceholderKey = 'visual-soon.png';
const HYDRATE_MARGIN = '420px 0px';
const RETAIN_MARGIN = '1200px 0px';

const inventoryState = {
  biome: 'all',
  status: 'all',
  price: 'default',
};

const statusOptions = [
  ['all', 'All status'],
  ['available', 'Available'],
  ['sold', 'Sold'],
];

const priceOptions = [
  ['default', 'Default order'],
  ['low-high', 'Price: low to high'],
  ['high-low', 'Price: high to low'],
];

const modal = document.getElementById('panorama-modal');
const modalHost = document.getElementById('psv-modal-host');
const modalButtons = modal.querySelectorAll('[data-modal-action]');
const modalCloseButtons = modal.querySelectorAll('[data-close-modal]');

let modalViewer = null;
let activeSourceViewer = null;
let activeModalViewport = null;
let hydrationObserver = null;
let retentionObserver = null;
let revealObserver = null;

const viewerRegistry = new Map();

function getAssetPath(imageKey) {
  return `./assets/${imageKey}`;
}

function getGalleryPath(item) {
  return `./${item.id}/images/`;
}

function hasInteractivePanorama(item) {
  return Boolean(item.pano && item.imageKey && item.imageKey !== sharedPlaceholderKey);
}

function getBiomeTypes(item) {
  if (Array.isArray(item.types) && item.types.length > 0) {
    return item.types;
  }
  if (typeof item.type === 'string' && item.type.trim()) {
    return [item.type.trim()];
  }
  return ['uncategorized'];
}

function getStatusClass(status) {
  return status === 'Available' ? 'availability-live' : 'availability-hold';
}

function getCardClass(status) {
  return status === 'Available' ? 'is-available' : 'is-sold';
}

function sortInventoryByPrice(items, direction) {
  return [...items].sort((left, right) => {
    if (left.priceValue == null && right.priceValue == null) {
      return 0;
    }
    if (left.priceValue == null) {
      return 1;
    }
    if (right.priceValue == null) {
      return -1;
    }
    return direction === 'low-high'
      ? left.priceValue - right.priceValue
      : right.priceValue - left.priceValue;
  });
}

function getVisibleInventory() {
  let visibleItems = [...biomeInfos];

  if (inventoryState.biome !== 'all') {
    visibleItems = visibleItems.filter((item) => getBiomeTypes(item).includes(inventoryState.biome));
  }

  if (inventoryState.status !== 'all') {
    const targetStatus = inventoryState.status === 'available' ? 'Available' : 'Sold';
    visibleItems = visibleItems.filter((item) => item.status === targetStatus);
  }

  if (inventoryState.price !== 'default') {
    visibleItems = sortInventoryByPrice(visibleItems, inventoryState.price);
  }

  return visibleItems;
}

function getFeaturedBiome() {
  return biomeInfos.find((item) => item.featured) ?? biomeInfos[0];
}

function renderFilterOptions(select, options, selectedValue) {
  select.innerHTML = options.map(([value, label]) => `
    <option value="${value}" ${value === selectedValue ? 'selected' : ''}>${label}</option>
  `).join('');
}

function renderInventoryControls() {
  const biomeSelect = document.getElementById('sort-biome');
  const statusSelect = document.getElementById('sort-status');
  const priceSelect = document.getElementById('sort-price');

  if (!biomeSelect || !statusSelect || !priceSelect) {
    return;
  }

  renderFilterOptions(biomeSelect, biomeTypeOptions, inventoryState.biome);
  renderFilterOptions(statusSelect, statusOptions, inventoryState.status);
  renderFilterOptions(priceSelect, priceOptions, inventoryState.price);
}

function renderTypeChips(item, extraClass = '') {
  return `
    <div class="card-type-list ${extraClass}">
      ${getBiomeTypes(item).map((type) => `<span class="card-label card-type-chip">${type}</span>`).join('')}
    </div>
  `;
}

function renderGalleryLink(item) {
  return `
    <a class="gallery-link" href="${getGalleryPath(item)}" aria-label="Open ${item.name} image gallery">
      <span class="gallery-link-icon" aria-hidden="true"></span>
    </a>
  `;
}

function renderStaticVisual(item, extraClass = '', { eager = false } = {}) {
  const loading = eager ? 'eager' : 'lazy';
  const fetchpriority = eager ? 'high' : 'auto';

  return `
    <div class="inventory-visual-wrap ${extraClass}">
      <img
        class="inventory-visual"
        src="${getAssetPath(item.imageKey)}"
        alt="${item.name} visual"
        loading="${loading}"
        decoding="async"
        fetchpriority="${fetchpriority}"
      >
      <span class="inventory-visual-label">Visual soon</span>
    </div>
  `;
}

function renderPanoramaMarkup(item, viewportClass = '', { eagerPreview = false } = {}) {
  const loading = eagerPreview ? 'eager' : 'lazy';
  const fetchpriority = eagerPreview ? 'high' : 'auto';

  return `
    <div class="panorama-card">
      <div class="viewer-header">
        <div>
          <p class="viewer-title">360 Biome Preview</p>
        </div>
      </div>
      <div class="panorama-frame">
        <div
          class="panorama-viewport ${viewportClass}"
          tabindex="0"
          role="region"
          aria-label="${item.name} 360 panorama viewer"
          data-biome-id="${item.id}"
          data-panorama-src="${getAssetPath(item.imageKey)}"
          data-full-width="${item.pano.fullWidth}"
          data-full-height="${item.pano.fullHeight}"
          data-cropped-width="${item.pano.croppedWidth}"
          data-cropped-height="${item.pano.croppedHeight}"
          data-cropped-x="${item.pano.croppedX}"
          data-cropped-y="${item.pano.croppedY}"
        >
          <img
            class="panorama-preview"
            src="${getAssetPath(item.imageKey)}"
            alt="${item.name} panorama preview"
            loading="${loading}"
            decoding="async"
            fetchpriority="${fetchpriority}"
          >
          <div class="psv-host" aria-hidden="true"></div>
          <div class="viewer-badge">360</div>
          <div class="viewer-overlay viewer-overlay-hidden" aria-hidden="true"></div>
          <button class="expand-button expand-button-inside" type="button" aria-expanded="false">
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

function renderFeaturedBiome() {
  const featuredGrid = document.getElementById('featured-grid');
  if (!featuredGrid) {
    return;
  }

  const featuredItem = getFeaturedBiome();
  const statusClass = getStatusClass(featuredItem.status);
  const cardClass = getCardClass(featuredItem.status);
  const visualMarkup = hasInteractivePanorama(featuredItem)
    ? renderPanoramaMarkup(featuredItem, '', { eagerPreview: true })
    : renderStaticVisual(featuredItem, 'featured-visual', { eager: true });

  featuredGrid.innerHTML = `
    <article class="card featured-card reveal-card ${hasInteractivePanorama(featuredItem) ? 'panorama-entry' : ''} ${cardClass}" data-biome-id="${featuredItem.id}">
      <div class="card-copy">
        <div class="card-copy-top">
          <p class="card-label">Featured biome</p>
          <h3>${featuredItem.name}</h3>
          ${renderTypeChips(featuredItem, 'card-type-list-featured')}
        </div>
        <p class="card-description">${featuredItem.description}</p>
        <div class="price-row">
          <span class="price-pill">${featuredItem.priceLabel}</span>
        </div>
        <div class="card-actions-row">
          <span class="availability-pill ${statusClass}">${featuredItem.status}</span>
          ${renderGalleryLink(featuredItem)}
        </div>
      </div>
      ${visualMarkup}
    </article>
  `;
}

function renderInventoryCards() {
  const inventoryGrid = document.getElementById('inventory-grid');
  if (!inventoryGrid) {
    return;
  }

  const visibleInventory = getVisibleInventory();

  inventoryGrid.innerHTML = visibleInventory.map((item) => {
    const statusClass = getStatusClass(item.status);
    const cardClass = getCardClass(item.status);
    const visualMarkup = hasInteractivePanorama(item)
      ? renderPanoramaMarkup(item, 'panorama-viewport-compact')
      : renderStaticVisual(item);

    return `
      <article class="card inventory-card reveal-card ${hasInteractivePanorama(item) ? 'panorama-entry' : ''} ${cardClass}" data-biome-id="${item.id}">
        ${visualMarkup}
        <div class="card-copy">
          <div class="card-copy-top">
            ${renderTypeChips(item)}
            <h3>${item.name}</h3>
          </div>
          <p class="card-description">${item.description}</p>
          <div class="price-row">
            <span class="price-pill">${item.priceLabel}</span>
          </div>
          <div class="card-actions-row">
            <span class="availability-pill ${statusClass}">${item.status}</span>
            ${renderGalleryLink(item)}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function bindInventoryControls() {
  const controls = document.querySelector('.inventory-sort');
  if (!controls) {
    return;
  }

  controls.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    if (target.id === 'sort-biome') {
      inventoryState.biome = target.value;
    }
    if (target.id === 'sort-status') {
      inventoryState.status = target.value;
    }
    if (target.id === 'sort-price') {
      inventoryState.price = target.value;
    }

    renderInventoryCards();
    connectCardObservers();
  });

  controls.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.closest('[data-reset-sort]')) {
      inventoryState.biome = 'all';
      inventoryState.status = 'all';
      inventoryState.price = 'default';
      renderInventoryControls();
      renderInventoryCards();
      connectCardObservers();
    }
  });
}

function readPanoData(viewport) {
  return {
    fullWidth: Number(viewport.dataset.fullWidth),
    fullHeight: Number(viewport.dataset.fullHeight),
    croppedWidth: Number(viewport.dataset.croppedWidth),
    croppedHeight: Number(viewport.dataset.croppedHeight),
    croppedX: Number(viewport.dataset.croppedX),
    croppedY: Number(viewport.dataset.croppedY),
  };
}

function resizeViewer(viewer, viewport) {
  viewer.resize({
    width: `${viewport.clientWidth}px`,
    height: `${viewport.clientHeight}px`,
  });
}

function syncModalFromSource() {
  if (!modalViewer || !activeSourceViewer) {
    return;
  }

  const position = activeSourceViewer.getPosition();
  modalViewer.rotate({ yaw: position.yaw, pitch: position.pitch });
  modalViewer.zoom(activeSourceViewer.getZoomLevel());
}

async function openModal(viewer, viewport) {
  activeSourceViewer = viewer;
  activeModalViewport = viewport;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';

  if (!modalViewer) {
    modalViewer = new Viewer({
      container: modalHost,
      panorama: viewport.dataset.panoramaSrc,
      panoData: readPanoData(viewport),
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

    modalButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.modalAction;
        if (action === 'zoom-in') {
          modalViewer.zoom(Math.min(100, modalViewer.getZoomLevel() + 9));
        }
        if (action === 'zoom-out') {
          modalViewer.zoom(Math.max(0, modalViewer.getZoomLevel() - 9));
        }
        if (action === 'reset') {
          modalViewer.rotate({ yaw: 0, pitch: 0 });
          modalViewer.zoom(32);
        }
      });
    });
  } else {
    modalViewer.setPanorama(viewport.dataset.panoramaSrc, {
      panoData: readPanoData(viewport),
      zoom: activeSourceViewer.getZoomLevel(),
      position: activeSourceViewer.getPosition(),
    });
  }

  requestAnimationFrame(() => {
    modalViewer.resize({
      width: `${modalHost.clientWidth}px`,
      height: `${modalHost.clientHeight}px`,
    });
    syncModalFromSource();
  });
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
  activeSourceViewer = null;
  activeModalViewport = null;
}

modalCloseButtons.forEach((button) => {
  button.addEventListener('click', closeModal);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.hidden) {
    closeModal();
  }
});

function destroyViewerForViewport(viewport) {
  const existing = viewerRegistry.get(viewport);
  if (!existing) {
    return;
  }

  if (activeModalViewport === viewport && !modal.hidden) {
    return;
  }

  existing.viewer.destroy();
  viewerRegistry.delete(viewport);

  const entry = viewport.closest('.panorama-entry');
  if (entry) {
    entry.classList.remove('is-pano-ready', 'is-hydrated');
  }
}

function cleanupDetachedViewers() {
  viewerRegistry.forEach((_, viewport) => {
    if (!document.body.contains(viewport)) {
      destroyViewerForViewport(viewport);
    }
  });
}

function bindPanoramaControls(entry, viewport) {
  if (entry.dataset.controlsBound === 'true') {
    return;
  }

  const expandButton = entry.querySelector('.expand-button');
  const controlButtons = entry.querySelectorAll('.viewer-controls-inside button');

  if (expandButton) {
    expandButton.addEventListener('click', async () => {
      expandButton.setAttribute('aria-expanded', 'true');
      const viewer = await ensurePanoramaViewer(entry, { force: true });
      if (viewer) {
        await openModal(viewer, viewport);
      }
    });
  }

  controlButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const viewer = await ensurePanoramaViewer(entry, { force: true });
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

  entry.dataset.controlsBound = 'true';
}

function createPanoramaViewer(entry) {
  const viewport = entry.querySelector('.panorama-viewport');
  const host = entry.querySelector('.psv-host');

  if (!viewport || !host) {
    return null;
  }

  const existing = viewerRegistry.get(viewport);
  if (existing) {
    return existing.ready;
  }

  const viewer = new Viewer({
    container: host,
    panorama: viewport.dataset.panoramaSrc,
    panoData: readPanoData(viewport),
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

  const ready = new Promise((resolve) => {
    viewer.addEventListener('ready', () => {
      viewer.rotate({ yaw: 0, pitch: 0 });
      resizeViewer(viewer, viewport);
      entry.classList.add('is-pano-ready', 'is-hydrated');
      resolve(viewer);
    }, { once: true });
  });

  viewerRegistry.set(viewport, { viewer, ready });
  return ready;
}

async function ensurePanoramaViewer(entry, { force = false } = {}) {
  const viewport = entry.querySelector('.panorama-viewport');
  if (!viewport) {
    return null;
  }

  const existing = viewerRegistry.get(viewport);
  if (existing) {
    return existing.ready;
  }

  if (!force && !entry.classList.contains('panorama-entry')) {
    return null;
  }

  return createPanoramaViewer(entry);
}

function disconnectObservers() {
  hydrationObserver?.disconnect();
  retentionObserver?.disconnect();
  revealObserver?.disconnect();
}

function connectCardObservers() {
  cleanupDetachedViewers();
  disconnectObservers();

  hydrationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const card = entry.target;
      void ensurePanoramaViewer(card);
    });
  }, {
    rootMargin: HYDRATE_MARGIN,
    threshold: 0.01,
  });

  retentionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        return;
      }

      const card = entry.target;
      const viewport = card.querySelector('.panorama-viewport');
      if (viewport) {
        destroyViewerForViewport(viewport);
      }
    });
  }, {
    rootMargin: RETAIN_MARGIN,
    threshold: 0,
  });

  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.08,
  });

  document.querySelectorAll('.panorama-entry').forEach((entry) => {
    bindPanoramaControls(entry, entry.querySelector('.panorama-viewport'));
    hydrationObserver.observe(entry);
    retentionObserver.observe(entry);
  });

  document.querySelectorAll('.reveal-card').forEach((entry) => {
    revealObserver.observe(entry);
  });
}

window.addEventListener('resize', () => {
  viewerRegistry.forEach(({ viewer }, viewport) => {
    resizeViewer(viewer, viewport);
  });

  if (!modal.hidden && modalViewer && activeModalViewport) {
    modalViewer.resize({
      width: `${modalHost.clientWidth}px`,
      height: `${modalHost.clientHeight}px`,
    });
  }
});

renderFeaturedBiome();
renderInventoryControls();
renderInventoryCards();
bindInventoryControls();
connectCardObservers();
