import { Viewer } from 'https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core@5.14.1/+esm';

function readPanoData(viewport) {
  const fullWidth = Number(viewport.dataset.fullWidth);
  const fullHeight = Number(viewport.dataset.fullHeight);
  const croppedWidth = Number(viewport.dataset.croppedWidth);
  const croppedHeight = Number(viewport.dataset.croppedHeight);
  const croppedX = Number(viewport.dataset.croppedX);
  const croppedY = Number(viewport.dataset.croppedY);

  return {
    fullWidth,
    fullHeight,
    croppedWidth,
    croppedHeight,
    croppedX,
    croppedY,
  };
}

function resizeViewer(viewer, viewport) {
  viewer.resize({
    width: `${viewport.clientWidth}px`,
    height: `${viewport.clientHeight}px`,
  });
}

function createPanoramaViewer(entry) {
  const viewport = entry.querySelector('.panorama-viewport');
  const host = entry.querySelector('.psv-host');
  const expandButton = entry.querySelector('.expand-button');
  const controlButtons = entry.querySelectorAll('.viewer-controls button');

  const viewer = new Viewer({
    container: host,
    panorama: viewport.dataset.panoramaSrc,
    panoData: readPanoData(viewport),
    defaultYaw: '0deg',
    defaultPitch: '0deg',
    defaultZoomLvl: 35,
    mousemove: true,
    mousewheel: true,
    moveInertia: false,
    moveSpeed: 0.85,
    zoomSpeed: 0.8,
    navbar: false,
    touchmoveTwoFingers: false,
    keyboard: false,
    fisheye: false,
    sphereCorrection: {
      pan: '0deg',
      tilt: '0deg',
      roll: '0deg',
    },
  });

  viewer.addEventListener('ready', () => {
    viewer.rotate({ yaw: 0, pitch: 0 });
    resizeViewer(viewer, viewport);
  }, { once: true });

  controlButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;

      if (action === 'zoom-in') {
        viewer.zoom(Math.min(100, viewer.getZoomLevel() + 12));
      }

      if (action === 'zoom-out') {
        viewer.zoom(Math.max(0, viewer.getZoomLevel() - 12));
      }

      if (action === 'reset') {
        viewer.rotate({ yaw: 0, pitch: 0 });
        viewer.zoom(35);
      }
    });
  });

  expandButton.addEventListener('click', () => {
    const expanded = entry.classList.toggle('expanded');
    expandButton.textContent = expanded ? 'Collapse View' : 'Expand View';
    expandButton.setAttribute('aria-expanded', String(expanded));

    window.setTimeout(() => {
      resizeViewer(viewer, viewport);
      entry.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 180);
  });

  window.addEventListener('resize', () => resizeViewer(viewer, viewport));
}

document.querySelectorAll('.panorama-entry').forEach((entry) => {
  createPanoramaViewer(entry);
});
