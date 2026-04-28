import { Viewer } from 'https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core@5.14.1/+esm';

const biomeInventory = [
  ['mushroom', 'Medium Mushroom Island', '$7m', 'Sold'],
  ['mushroom', 'Medium Mushroom Island', '$8m', 'Available'],
  ['mushroom', 'Large Mushroom Island', '$19m', 'Available'],
  ['mushroom', 'Super Large Mushroom Island', '$23m', 'Available'],
  ['mushroom', 'Smallest Mushroom Island', '$12m', 'Available'],
  ['mushroom', 'Mushroom Behind Spawn', '$25m', 'Available'],
  ['hybrid', 'Biome Blend Isle', '$4m', 'Available'],
  ['badlands', 'Crimson Heart Badlands', '$3m', 'Sold'],
  ['mountain', 'Icewraith Hollow', '$4m', 'Available'],
  ['mountain', 'Frostbound Crown', '$4m', 'Sold'],
  ['mushroom', 'Small Mushroom Island', '$2.5m', 'Sold'],
  ['mushroom', 'Medium Mushroom Island', '$7.9m', 'Sold'],
  ['cherry', 'Large Natural Cherry Grove', '$9.5m', 'Sold'],
  ['mangroove', 'Large Natural Mangrove Grove', '$3.4m', 'Available'],
  ['pale', 'Large Mother Pale Biome', '$4.8m', 'Sold'],
  ['pale', 'Circular Hollow Pale Biome', '$8.6m', 'Sold'],
  ['mangroove', 'Largest Mangrove Near Border', '$2m', 'Available'],
  ['hybrid', 'Cool Donut Island', '$4m', 'Sold'],
  ['jungle', 'Isolated Lonely Jungle', '$4m', 'Sold'],
  ['hybrid', 'Mirror Mounds Islands', '$5m', 'Available'],
  ['hybrid', 'Secluded Geode Desert', '$?m', 'Available'],
];

const biomeDescriptions = [
  'A calm natural layout with strong build space and a clean approach line from every side.',
  'This biome opens with balanced terrain that feels rare, usable, and visually satisfying in one glance.',
  'A strong choice for players who want natural structure, clean borders, and room for ambitious projects.',
  'Its terrain shape feels premium from the first flyover, with a layout that supports both beauty and scale.',
  'This listing offers a naturally impressive footprint suited for both showcase builds and long-term claims.',
  'A rare generation pattern gives this biome a polished look without needing heavy terraforming first.',
  'Its natural placement makes it ideal for players who want something memorable without forced decoration.',
];

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

function renderInventoryCards() {
  const inventoryGrid = document.getElementById('inventory-grid');
  if (!inventoryGrid) {
    return;
  }

  inventoryGrid.innerHTML = biomeInventory.map(([label, name, price, status], index) => {
    const description = biomeDescriptions[index % biomeDescriptions.length];
    const isAvailable = status === 'Available';
    const statusClass = isAvailable ? 'availability-live' : 'availability-hold';
    const cardClass = isAvailable ? 'is-available' : 'is-sold';

    return `
      <article class="card inventory-card ${cardClass}">
        <div class="inventory-visual-wrap">
          <img class="inventory-visual" src="./assets/visual-soon.png" alt="Visuals will be added soon placeholder">
          <span class="inventory-visual-label">Visual soon</span>
        </div>
        <div class="card-copy">
          <div class="card-copy-top">
            <p class="card-label">${label}</p>
            <h3>${name}</h3>
          </div>
          <p class="card-description">${description}</p>
          <div class="price-row">
            <span class="price-pill">${price}</span>
          </div>
          <div class="status-row">
            <span class="availability-pill ${statusClass}">${status}</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

const modal = document.getElementById('panorama-modal');
const modalHost = document.getElementById('psv-modal-host');
const modalButtons = modal.querySelectorAll('[data-modal-action]');
const modalCloseButtons = modal.querySelectorAll('[data-close-modal]');
let modalViewer = null;
let activeSourceViewer = null;
let activeModalViewport = null;

function syncModalFromSource() {
  if (!modalViewer || !activeSourceViewer) {
    return;
  }

  const position = activeSourceViewer.getPosition();
  modalViewer.rotate({ yaw: position.yaw, pitch: position.pitch });
  modalViewer.zoom(activeSourceViewer.getZoomLevel());
}

function openModal(viewer, viewport) {
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

function createPanoramaViewer(entry) {
  const viewport = entry.querySelector('.panorama-viewport');
  const host = entry.querySelector('.psv-host');
  const expandButton = entry.querySelector('.expand-button');
  const controlButtons = entry.querySelectorAll('.viewer-controls-inside button');

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

  viewer.addEventListener('ready', () => {
    viewer.rotate({ yaw: 0, pitch: 0 });
    resizeViewer(viewer, viewport);
  }, { once: true });

  controlButtons.forEach((button) => {
    button.addEventListener('click', () => {
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

  expandButton.addEventListener('click', () => {
    expandButton.setAttribute('aria-expanded', 'true');
    openModal(viewer, viewport);
  });

  window.addEventListener('resize', () => {
    resizeViewer(viewer, viewport);
    if (!modal.hidden && modalViewer && viewport === activeModalViewport) {
      modalViewer.resize({
        width: `${modalHost.clientWidth}px`,
        height: `${modalHost.clientHeight}px`,
      });
    }
  });
}

renderInventoryCards();

document.querySelectorAll('.panorama-entry').forEach((entry) => {
  createPanoramaViewer(entry);
});
