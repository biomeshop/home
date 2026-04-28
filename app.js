import { Viewer } from 'https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core@5.14.1/+esm';

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

document.querySelectorAll('.panorama-entry').forEach((entry) => {
  createPanoramaViewer(entry);
});
