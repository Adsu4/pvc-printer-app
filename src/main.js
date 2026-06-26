// DOM Elements
const imageUpload = document.getElementById('image-upload');
const uploadLabel = document.getElementById('upload-label');
const uiCardImage = document.getElementById('ui-card-image');
const printCardImage = document.getElementById('print-card-image');
const uiPlaceholder = document.getElementById('ui-placeholder');
const placeholderMsg = document.getElementById('placeholder-msg');

const uiCardSlot = document.getElementById('ui-card-slot');
const printCanvas = document.getElementById('print-canvas');
const printCardSlot = document.getElementById('print-card-slot');
const canvasWrapper = document.querySelector('.canvas-wrapper');
const dynamicPrintStyle = document.getElementById('dynamic-print-style');

const tabFront = document.getElementById('tab-front');
const tabBack = document.getElementById('tab-back');

const printModal = document.getElementById('print-modal');
const btnCancelPrint = document.getElementById('btn-cancel-print');
const btnConfirmPrint = document.getElementById('btn-confirm-print');

// Controls
const inputCardW = document.getElementById('card-w');
const inputCardH = document.getElementById('card-h');
const toggleAutoFlipBack = document.getElementById('auto-flip-back');

const sliderBrightness = document.getElementById('brightness');
const sliderContrast = document.getElementById('contrast');
const sliderSaturation = document.getElementById('saturation');
const valBrightness = document.getElementById('val-brightness');
const valContrast = document.getElementById('val-contrast');
const valSaturation = document.getElementById('val-saturation');

const btnRotate = document.getElementById('btn-rotate');
const btnRotate180 = document.getElementById('btn-rotate-180');
const btnPrintFront = document.getElementById('btn-print-front');
const btnPrintBack = document.getElementById('btn-print-back');

// State
let state = {
  cardW: 54.0,
  cardH: 86.0,
  autoFlipBack: true,
  currentSide: 'front', // 'front' | 'back'
  pendingPrintSide: null,
  sides: {
    front: { src: null, brightness: 100, contrast: 100, saturation: 100, rotation: 0 },
    back: { src: null, brightness: 100, contrast: 100, saturation: 100, rotation: 0 }
  }
};

// Initialize
function init() {
  updateLayout();
  syncUIFromState();
  attachEventListeners();
  window.addEventListener('resize', scalePreview);
}

function attachEventListeners() {
  // Tabs
  tabFront.addEventListener('click', () => switchSide('front'));
  tabBack.addEventListener('click', () => switchSide('back'));

  // Image Upload
  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      state.sides[state.currentSide].src = url;
      state.sides[state.currentSide].rotation = 0; 
      syncUIFromState();
    }
  });

  // Layout Inputs
  [inputCardW, inputCardH].forEach(input => {
    input.addEventListener('input', () => {
      state.cardW = parseFloat(inputCardW.value) || 54;
      state.cardH = parseFloat(inputCardH.value) || 86;
      updateLayout();
    });
  });

  toggleAutoFlipBack.addEventListener('change', (e) => {
    state.autoFlipBack = e.target.checked;
  });

  // Image Sliders
  sliderBrightness.addEventListener('input', (e) => {
    state.sides[state.currentSide].brightness = e.target.value;
    syncUIFromState();
  });

  sliderContrast.addEventListener('input', (e) => {
    state.sides[state.currentSide].contrast = e.target.value;
    syncUIFromState();
  });

  sliderSaturation.addEventListener('input', (e) => {
    state.sides[state.currentSide].saturation = e.target.value;
    syncUIFromState();
  });

  // Rotation Buttons
  btnRotate.addEventListener('click', () => {
    const side = state.sides[state.currentSide];
    side.rotation = (side.rotation + 90) % 360;
    syncUIFromState();
  });

  btnRotate180.addEventListener('click', () => {
    const side = state.sides[state.currentSide];
    side.rotation = (side.rotation + 180) % 360;
    syncUIFromState();
  });

  // Print Buttons -> Trigger Modal First
  btnPrintFront.addEventListener('click', () => {
    switchSide('front');
    showPrintModal('front');
  });

  btnPrintBack.addEventListener('click', () => {
    switchSide('back');
    showPrintModal('back');
  });

  // Modal Actions
  btnCancelPrint.addEventListener('click', () => {
    printModal.style.display = 'none';
    state.pendingPrintSide = null;
  });

  btnConfirmPrint.addEventListener('click', () => {
    printModal.style.display = 'none';
    executePrint(state.pendingPrintSide);
  });
}

function showPrintModal(side) {
  state.pendingPrintSide = side;
  printModal.style.display = 'flex';
}

function executePrint(side) {
  if (side === 'front') {
    setTimeout(() => window.print(), 100);
  } else if (side === 'back') {
    const originalRotation = state.sides.back.rotation;
    if (state.autoFlipBack) {
      state.sides.back.rotation = (originalRotation + 180) % 360;
      updateImageStyles();
    }
    setTimeout(() => {
      window.print();
      // Restore rotation
      if (state.autoFlipBack) {
        state.sides.back.rotation = originalRotation;
        updateImageStyles();
      }
    }, 100);
  }
}

function switchSide(side) {
  state.currentSide = side;
  
  if (side === 'front') {
    tabFront.classList.add('active');
    tabBack.classList.remove('active');
    uploadLabel.textContent = 'Browse Front Image';
    placeholderMsg.textContent = 'Upload Front Image';
  } else {
    tabBack.classList.add('active');
    tabFront.classList.remove('active');
    uploadLabel.textContent = 'Browse Back Image';
    placeholderMsg.textContent = 'Upload Back Image';
  }

  syncUIFromState();
}

function syncUIFromState() {
  const current = state.sides[state.currentSide];
  
  sliderBrightness.value = current.brightness;
  valBrightness.textContent = `${current.brightness}%`;
  
  sliderContrast.value = current.contrast;
  valContrast.textContent = `${current.contrast}%`;

  sliderSaturation.value = current.saturation;
  valSaturation.textContent = `${current.saturation}%`;

  if (current.src) {
    uiCardImage.src = current.src;
    printCardImage.src = current.src;
    uiCardImage.style.display = 'block';
    printCardImage.style.display = 'block';
    uiPlaceholder.style.display = 'none';
  } else {
    uiCardImage.style.display = 'none';
    printCardImage.style.display = 'none';
    uiPlaceholder.style.display = 'flex';
  }

  updateImageStyles();
}

function updateLayout() {
  const cssCardW = `${state.cardW}mm`;
  const cssCardH = `${state.cardH}mm`;

  // The actual print page is just the size of the card
  dynamicPrintStyle.textContent = `
    @media print {
      @page { size: ${cssCardW} ${cssCardH}; margin: 0; }
      #print-canvas, .print-card-slot { width: ${cssCardW} !important; height: ${cssCardH} !important; }
    }
  `;

  [uiCardSlot, printCardSlot].forEach(slot => {
    slot.style.width = cssCardW;
    slot.style.height = cssCardH;
  });

  scalePreview();
}

function updateImageStyles() {
  const current = state.sides[state.currentSide];
  const filter = `brightness(${current.brightness}%) contrast(${current.contrast}%) saturate(${current.saturation}%)`;
  const transform = `translate(-50%, -50%) rotate(${current.rotation}deg)`;

  [uiCardImage, printCardImage].forEach(img => {
    img.style.filter = filter;
    img.style.transform = transform;
    
    if (current.rotation === 90 || current.rotation === 270) {
       img.style.width = `${state.cardH}mm`;
       img.style.height = `${state.cardW}mm`;
    } else {
       img.style.width = `100%`;
       img.style.height = `100%`;
    }
  });
}

function scalePreview() {
  if (!canvasWrapper.parentElement) return;
  const wrapperWidth = canvasWrapper.parentElement.clientWidth - 40; 
  const wrapperHeight = canvasWrapper.parentElement.clientHeight - 40;
  
  // 3.78 pixels per mm is standard 96 DPI screen approximation
  const pxW = state.cardW * 3.78; 
  const pxH = state.cardH * 3.78;
  const scaleX = wrapperWidth / pxW;
  const scaleY = wrapperHeight / pxH;
  
  let scale = Math.min(scaleX, scaleY, 2.5); // Allow more scaling up since it's just a card
  uiCardSlot.style.transform = `scale(${scale})`;
}

document.addEventListener('DOMContentLoaded', init);
