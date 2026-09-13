/**
 * VibeCode Studio - Main Application Logic
 * Integrates bwip-js rendering, options customization, presets, batch engine,
 * optical scannability checker, print sheet layout, export functions, and history.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- APPLICATION STATE ---
  const state = {
    currentSymbology: 'code128',
    payload: 'INV-2026-99481-B',
    scale: 3,
    height: 15,
    rotation: 'N',
    barColor: '#000000',
    bgColor: '#ffffff',
    transparentBg: false,
    includeText: true,
    textPos: 'bottom',
    textSize: 10,
    padding: 10,
    guardBars: false,
    history: JSON.parse(localStorage.getItem('vibecode_history') || '[]'),
    batchItems: []
  };

  // --- DOM ELEMENT REFERENCES ---
  const categoryFilter = document.getElementById('categoryFilter');
  const barcodeTypeSelect = document.getElementById('barcodeTypeSelect');
  const barcodeInput = document.getElementById('barcodeInput');
  const charCount = document.getElementById('charCount');
  const validationStatus = document.getElementById('validationStatus');
  const sampleDataBtn = document.getElementById('sampleDataBtn');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');

  // Sliders & Controls
  const scaleInput = document.getElementById('scaleInput');
  const scaleValue = document.getElementById('scaleValue');
  const heightInput = document.getElementById('heightInput');
  const heightValue = document.getElementById('heightValue');
  const rotationGroup = document.getElementById('rotationGroup');
  const barColorInput = document.getElementById('barColorInput');
  const barColorHex = document.getElementById('barColorHex');
  const bgColorInput = document.getElementById('bgColorInput');
  const bgColorHex = document.getElementById('bgColorHex');
  const transparentBgCheck = document.getElementById('transparentBgCheck');
  const includeTextCheck = document.getElementById('includeTextCheck');
  const textPosSelect = document.getElementById('textPosSelect');
  const textSizeInput = document.getElementById('textSizeInput');
  const textSizeValue = document.getElementById('textSizeValue');
  const paddingInput = document.getElementById('paddingInput');
  const paddingValue = document.getElementById('paddingValue');
  const guardBarsCheck = document.getElementById('guardBarsCheck');

  // Viewport Elements
  const activeSymbologyName = document.getElementById('activeSymbologyName');
  const activeCategoryBadge = document.getElementById('activeCategoryBadge');
  const scannabilityStatus = document.getElementById('scannabilityStatus');
  const scannabilityText = document.getElementById('scannabilityText');
  const barcodeCanvas = document.getElementById('barcodeCanvas');
  const renderErrorAlert = document.getElementById('renderErrorAlert');
  const errorText = document.getElementById('errorText');

  // Action Buttons
  const downloadPngBtn = document.getElementById('downloadPngBtn');
  const downloadSvgBtn = document.getElementById('downloadSvgBtn');
  const copyClipboardBtn = document.getElementById('copyClipboardBtn');
  const copySvgBtn = document.getElementById('copySvgBtn');
  const saveHistoryBtn = document.getElementById('saveHistoryBtn');
  const openInPrintBtn = document.getElementById('openInPrintBtn');

  // Guide Elements
  const guideTitle = document.getElementById('guideTitle');
  const guideDescription = document.getElementById('guideDescription');
  const guideRules = document.getElementById('guideRules');

  // Tab Elements
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const historyCountBadge = document.getElementById('historyCountBadge');

  // --- INITIALIZATION ---
  initCategories();
  initSymbologySelect();
  bindEvents();
  updateHistoryBadge();
  initDLBuilder();
  renderBarcode();

  // --- POPULATE CATEGORIES & SYMBOLOGIES ---
  function initCategories() {
    const categories = getBarcodeCategories();
    categoryFilter.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  function initSymbologySelect(catFilter = 'all') {
    const filtered = catFilter === 'all' 
      ? BARCODE_TYPES 
      : BARCODE_TYPES.filter(b => b.category === catFilter);

    barcodeTypeSelect.innerHTML = filtered.map(b => 
      `<option value="${b.id}" ${b.id === state.currentSymbology ? 'selected' : ''}>${b.name}</option>`
    ).join('');

    // Also populate batch dropdown
    const batchSelect = document.getElementById('batchSymbologySelect');
    if (batchSelect) {
      batchSelect.innerHTML = BARCODE_TYPES.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    }
  }

  // --- CORE RENDER FUNCTION ---
  function renderBarcode() {
    const typeMeta = getBarcodeTypeById(state.currentSymbology);

    // Update Header Badge & Guide Info
    activeSymbologyName.textContent = typeMeta.name;
    activeCategoryBadge.textContent = typeMeta.category.toUpperCase();
    guideTitle.textContent = `About ${typeMeta.name}`;
    guideDescription.textContent = typeMeta.desc;
    guideRules.textContent = typeMeta.rules;

    // Validate Input Payload length
    const inputVal = barcodeInput.value.trim();
    state.payload = inputVal || typeMeta.sample;
    charCount.textContent = `Length: ${state.payload.length}`;

    // Prepare bwip-js options
    const options = {
      bcid: state.currentSymbology,
      text: state.payload,
      scale: parseInt(state.scale, 10),
      height: parseInt(state.height, 10),
      rotate: state.rotation,
      barcolor: state.barColor.replace('#', ''),
      backgroundcolor: state.transparentBg ? undefined : state.bgColor.replace('#', ''),
      includetext: state.includeText,
      textxalign: 'center',
      textsize: parseInt(state.textSize, 10),
      paddingwidth: parseInt(state.padding, 10),
      paddingheight: parseInt(state.padding, 10)
    };

    if (!state.includeText) {
      options.alttext = '';
    }

    if (state.textPos === 'top') {
      options.textoption = 'top';
    }

    if (state.guardBars) {
      options.guarddescent = true;
    }

    // Try rendering with bwipjs
    try {
      if (typeof bwipjs === 'undefined') {
        throw new Error('bwip-js library not loaded yet');
      }

      bwipjs.toCanvas(barcodeCanvas, options);

      // Hide error alert & show canvas
      renderErrorAlert.classList.add('hidden');
      barcodeCanvas.style.display = 'block';
      validationStatus.className = 'meta-item status-valid';
      validationStatus.innerHTML = '<i class="ri-checkbox-circle-line"></i> Valid Payload';

      // Check Optical Scannability Contrast
      checkScannability(state.barColor, state.bgColor, state.transparentBg);

    } catch (err) {
      // Display clean user-friendly error message
      console.warn('BWIP-JS Render Warning:', err.message || err);
      barcodeCanvas.style.display = 'none';
      renderErrorAlert.classList.remove('hidden');
      errorText.textContent = err.message || 'Invalid barcode format or length for selected symbology';
      
      validationStatus.className = 'meta-item status-invalid';
      validationStatus.innerHTML = '<i class="ri-error-warning-line"></i> Invalid Payload';

      updateScannabilityDisplay('danger', 'Scannability: Render Error');
    }
  }

  // --- CONTRAST & SCANNABILITY CHECKER ---
  function checkScannability(barColorHexStr, bgColorHexStr, isTransparent) {
    if (isTransparent) {
      updateScannabilityDisplay('warning', 'Transparent Background (Depends on placement surface)');
      return;
    }

    const ratio = getContrastRatio(barColorHexStr, bgColorHexStr);

    if (ratio >= 7.0) {
      updateScannabilityDisplay('good', `Scannability: Excellent (${ratio.toFixed(1)}:1 Contrast)`);
    } else if (ratio >= 4.5) {
      updateScannabilityDisplay('warning', `Scannability: Fair (${ratio.toFixed(1)}:1 Contrast)`);
    } else {
      updateScannabilityDisplay('danger', `Warning: Poor Contrast (${ratio.toFixed(1)}:1 Ratio)`);
    }
  }

  function updateScannabilityDisplay(type, text) {
    const dot = scannabilityStatus.querySelector('.scannability-dot');
    dot.className = `scannability-dot dot-${type}`;
    scannabilityText.textContent = text;
  }

  function getContrastRatio(hex1, hex2) {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  function getLuminance(hex) {
    const rgb = hexToRgb(hex);
    const a = [rgb.r, rgb.g, rgb.b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    return {
      r: parseInt(hex.substring(0, 2), 16) || 0,
      g: parseInt(hex.substring(2, 4), 16) || 0,
      b: parseInt(hex.substring(4, 6), 16) || 0
    };
  }

  // --- BIND EVENT LISTENERS ---
  function bindEvents() {
    // Category & Symbology Filter
    categoryFilter.addEventListener('change', (e) => {
      initSymbologySelect(e.target.value);
      state.currentSymbology = barcodeTypeSelect.value;
      loadSymbologyDefaults();
      renderBarcode();
    });

    barcodeTypeSelect.addEventListener('change', (e) => {
      state.currentSymbology = e.target.value;
      loadSymbologyDefaults();
      renderBarcode();
    });

    // Input payload change
    barcodeInput.addEventListener('input', () => {
      renderBarcode();
    });

    // Load sample payload button
    sampleDataBtn.addEventListener('click', () => {
      const typeMeta = getBarcodeTypeById(state.currentSymbology);
      barcodeInput.value = typeMeta.sample;
      renderBarcode();
    });

    // Reset controls
    resetDefaultsBtn.addEventListener('click', () => {
      scaleInput.value = 3;
      scaleValue.textContent = '3x';
      state.scale = 3;

      heightInput.value = 15;
      heightValue.textContent = '15';
      state.height = 15;

      state.rotation = 'N';
      updateRotationToggleUI('N');

      barColorInput.value = '#000000';
      barColorHex.value = '#000000';
      state.barColor = '#000000';

      bgColorInput.value = '#FFFFFF';
      bgColorHex.value = '#FFFFFF';
      state.bgColor = '#FFFFFF';

      transparentBgCheck.checked = false;
      state.transparentBg = false;

      includeTextCheck.checked = true;
      state.includeText = true;

      const typeMeta = getBarcodeTypeById(state.currentSymbology);
      barcodeInput.value = typeMeta.sample;

      renderBarcode();
    });

    // Sliders
    scaleInput.addEventListener('input', (e) => {
      scaleValue.textContent = `${e.target.value}x`;
      state.scale = e.target.value;
      renderBarcode();
    });

    heightInput.addEventListener('input', (e) => {
      heightValue.textContent = e.target.value;
      state.height = e.target.value;
      renderBarcode();
    });

    textSizeInput.addEventListener('input', (e) => {
      textSizeValue.textContent = e.target.value;
      state.textSize = e.target.value;
      renderBarcode();
    });

    paddingInput.addEventListener('input', (e) => {
      paddingValue.textContent = `${e.target.value}px`;
      state.padding = e.target.value;
      renderBarcode();
    });

    // Rotation Toggle Buttons
    rotationGroup.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rotVal = btn.getAttribute('data-val');
        state.rotation = rotVal;
        updateRotationToggleUI(rotVal);
        renderBarcode();
      });
    });

    // Color Inputs
    barColorInput.addEventListener('input', (e) => {
      barColorHex.value = e.target.value.toUpperCase();
      state.barColor = e.target.value;
      renderBarcode();
    });

    barColorHex.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        barColorInput.value = e.target.value;
        state.barColor = e.target.value;
        renderBarcode();
      }
    });

    bgColorInput.addEventListener('input', (e) => {
      bgColorHex.value = e.target.value.toUpperCase();
      state.bgColor = e.target.value;
      renderBarcode();
    });

    bgColorHex.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        bgColorInput.value = e.target.value;
        state.bgColor = e.target.value;
        renderBarcode();
      }
    });

    transparentBgCheck.addEventListener('change', (e) => {
      state.transparentBg = e.target.checked;
      renderBarcode();
    });

    // Color Presets Buttons
    document.querySelectorAll('.color-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const bar = btn.getAttribute('data-bar');
        const bg = btn.getAttribute('data-bg');
        
        barColorInput.value = bar;
        barColorHex.value = bar.toUpperCase();
        state.barColor = bar;

        bgColorInput.value = bg;
        bgColorHex.value = bg.toUpperCase();
        state.bgColor = bg;

        transparentBgCheck.checked = false;
        state.transparentBg = false;

        renderBarcode();
      });
    });

    // Text & Checkbox toggles
    includeTextCheck.addEventListener('change', (e) => {
      state.includeText = e.target.checked;
      renderBarcode();
    });

    textPosSelect.addEventListener('change', (e) => {
      state.textPos = e.target.value;
      renderBarcode();
    });

    guardBarsCheck.addEventListener('change', (e) => {
      state.guardBars = e.target.checked;
      renderBarcode();
    });

    // Accordions
    document.querySelectorAll('.accordion-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        hdr.parentElement.classList.toggle('open');
      });
    });

    // Navigation Tabs
    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');

        navTabs.forEach(t => t.classList.remove('active'));
        tabPanes.forEach(p => p.classList.add('hidden'));

        tab.classList.add('active');
        document.getElementById(`tab-${targetTab}`).classList.remove('hidden');

        if (targetTab === 'history') renderHistoryGrid();
        if (targetTab === 'print') renderPrintSheet();
      });
    });

    // Downloads & Exports
    downloadPngBtn.addEventListener('click', exportPNG);
    downloadSvgBtn.addEventListener('click', exportSVG);
    copyClipboardBtn.addEventListener('click', copyImageToClipboard);
    copySvgBtn.addEventListener('click', copySvgCode);
    saveHistoryBtn.addEventListener('click', saveCurrentToHistory);
    openInPrintBtn.addEventListener('click', () => {
      document.querySelector('[data-tab="print"]').click();
    });

    // Preset Generators
    bindPresetEvents();

    // Batch Generator Events
    bindBatchEvents();

    // Print Sheet Events
    bindPrintEvents();

    // History Events
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

    // Theme Toggle
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

    // Help Modal
    document.getElementById('helpBtn').addEventListener('click', () => {
      document.getElementById('helpModal').classList.remove('hidden');
    });
    document.getElementById('closeHelpModalBtn').addEventListener('click', () => {
      document.getElementById('helpModal').classList.add('hidden');
    });
    document.getElementById('closeHelpModalBtn2').addEventListener('click', () => {
      document.getElementById('helpModal').classList.add('hidden');
    });
  }

  function updateRotationToggleUI(rotVal) {
    rotationGroup.querySelectorAll('.toggle-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-val') === rotVal);
    });
  }

  function loadSymbologyDefaults() {
    const typeMeta = getBarcodeTypeById(state.currentSymbology);
    barcodeInput.placeholder = typeMeta.placeholder;
    if (!barcodeInput.value || barcodeInput.value === getBarcodeTypeById(state.previousSymbology || 'code128').sample) {
      barcodeInput.value = typeMeta.sample;
    }
    state.previousSymbology = state.currentSymbology;
  }

  // --- PRESET GENERATOR HANDLERS ---
  function bindPresetEvents() {
    // WiFi Preset
    document.getElementById('generateWifiBtn').addEventListener('click', () => {
      const ssid = document.getElementById('wifiSsid').value.trim() || 'My_WiFi';
      const pass = document.getElementById('wifiPass').value.trim();
      const auth = document.getElementById('wifiAuth').value;

      const payload = `WIFI:S:${ssid};T:${auth};P:${pass};;`;
      switchToStudioWith('qrcode', payload);
    });

    // vCard Preset
    document.getElementById('generateVcardBtn').addEventListener('click', () => {
      const name = document.getElementById('vcardName').value.trim() || 'Jane Doe';
      const phone = document.getElementById('vcardPhone').value.trim();
      const email = document.getElementById('vcardEmail').value.trim();
      const org = document.getElementById('vcardOrg').value.trim();

      const payload = `BEGIN:VCARD\nVERSION:3.0\nN:${name};;;;\nFN:${name}\nTEL;TYPE=CELL:${phone}\nEMAIL:${email}\nORG:${org}\nEND:VCARD`;
      switchToStudioWith('qrcode', payload);
    });

    // URL Preset
    document.getElementById('generateUrlBtn').addEventListener('click', () => {
      const url = document.getElementById('urlPresetInput').value.trim() || 'https://example.com';
      switchToStudioWith('qrcode', url);
    });

    // EAN-13 Checksum Preset
    const ean12Input = document.getElementById('ean12Input');
    const eanChecksumDigit = document.getElementById('eanChecksumDigit');

    ean12Input.addEventListener('input', () => {
      const val = ean12Input.value.replace(/\D/g, '');
      ean12Input.value = val;
      if (val.length >= 12) {
        const check = calculateEan13Checksum(val.substring(0, 12));
        eanChecksumDigit.textContent = check;
      } else {
        eanChecksumDigit.textContent = '-';
      }
    });

    document.getElementById('generateEanBtn').addEventListener('click', () => {
      const val = ean12Input.value.replace(/\D/g, '');
      if (val.length < 12) {
        alert('Please enter at least 12 digits for EAN-13');
        return;
      }
      const fullEan = val.substring(0, 12) + calculateEan13Checksum(val.substring(0, 12));
      switchToStudioWith('ean13', fullEan);
    });

    // GS1 Logistics Preset
    document.getElementById('generateGs1Btn').addEventListener('click', () => {
      const gtin = document.getElementById('gs1Gtin').value.trim() || '00312345678906';
      const lot = document.getElementById('gs1Lot').value.trim() || 'BATCH9942';
      const exp = document.getElementById('gs1Exp').value.trim() || '271231';

      const payload = `(01)${gtin}(10)${lot}(17)${exp}`;
      switchToStudioWith('gs1-128', payload);
    });
  }

  function calculateEan13Checksum(digits12) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const num = parseInt(digits12[i], 10);
      sum += (i % 2 === 0) ? num : num * 3;
    }
    return (10 - (sum % 10)) % 10;
  }

  function switchToStudioWith(symbologyId, payloadText) {
    categoryFilter.value = 'all';
    initSymbologySelect('all');
    barcodeTypeSelect.value = symbologyId;
    state.currentSymbology = symbologyId;
    barcodeInput.value = payloadText;

    document.querySelector('[data-tab="studio"]').click();
    renderBarcode();
  }

  // --- BATCH GENERATOR HANDLERS ---
  function bindBatchEvents() {
    const batchProcessBtn = document.getElementById('batchProcessBtn');
    const batchTextInput = document.getElementById('batchTextInput');
    const batchSymbologySelect = document.getElementById('batchSymbologySelect');
    const batchGrid = document.getElementById('batchGrid');
    const batchCountNum = document.getElementById('batchCountNum');
    const batchLoadSampleBtn = document.getElementById('batchLoadSampleBtn');

    batchLoadSampleBtn.addEventListener('click', () => {
      batchTextInput.value = 'ITEM-2026-001\nITEM-2026-002\nITEM-2026-003\nITEM-2026-004\nITEM-2026-005\nITEM-2026-006\nITEM-2026-007\nITEM-2026-008';
    });

    batchProcessBtn.addEventListener('click', () => {
      const lines = batchTextInput.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) {
        alert('Please enter at least one barcode payload line.');
        return;
      }

      const selectedSym = batchSymbologySelect.value;
      batchGrid.innerHTML = '';
      state.batchItems = [];

      lines.forEach((line, idx) => {
        const offscreenCanvas = document.createElement('canvas');
        try {
          bwipjs.toCanvas(offscreenCanvas, {
            bcid: selectedSym,
            text: line,
            scale: 2,
            height: 12,
            includetext: true,
            textsize: 9
          });

          const dataUrl = offscreenCanvas.toDataURL('image/png');
          state.batchItems.push({ text: line, dataUrl });

          const card = document.createElement('div');
          card.className = 'batch-item-card';
          card.innerHTML = `
            <img src="${dataUrl}" alt="${line}">
            <span class="batch-item-text">${line}</span>
          `;
          batchGrid.appendChild(card);
        } catch (err) {
          const errCard = document.createElement('div');
          errCard.className = 'batch-item-card';
          errCard.style.borderColor = 'red';
          errCard.innerHTML = `<span style="color:red; font-size:11px;">Error encoding: ${line}</span>`;
          batchGrid.appendChild(errCard);
        }
      });

      batchCountNum.textContent = state.batchItems.length;
      document.getElementById('batchDownloadZipBtn').disabled = state.batchItems.length === 0;
    });
  }

  // --- PRINT SHEET HANDLERS ---
  function bindPrintEvents() {
    document.getElementById('triggerPrintBtn').addEventListener('click', () => {
      window.print();
    });

    ['printColsInput', 'printRowsInput', 'printRepeatInput'].forEach(id => {
      document.getElementById(id).addEventListener('input', renderPrintSheet);
    });
  }

  function renderPrintSheet() {
    const cols = parseInt(document.getElementById('printColsInput').value, 10) || 3;
    const count = parseInt(document.getElementById('printRepeatInput').value, 10) || 21;
    const grid = document.getElementById('printLabelsGrid');

    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.innerHTML = '';

    const imgDataUrl = barcodeCanvas.toDataURL('image/png');

    for (let i = 0; i < count; i++) {
      const cell = document.createElement('div');
      cell.className = 'print-label-cell';
      cell.innerHTML = `<img src="${imgDataUrl}" alt="Barcode">`;
      grid.appendChild(cell);
    }
  }

  // --- EXPORT FUNCTIONS ---
  function exportPNG() {
    const dataUrl = barcodeCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `barcode-${state.currentSymbology}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }

  function exportSVG() {
    try {
      const options = {
        bcid: state.currentSymbology,
        text: state.payload,
        scale: parseInt(state.scale, 10),
        height: parseInt(state.height, 10),
        rotate: state.rotation,
        barcolor: state.barColor.replace('#', ''),
        backgroundcolor: state.transparentBg ? undefined : state.bgColor.replace('#', ''),
        includetext: state.includeText,
        textxalign: 'center',
        textsize: parseInt(state.textSize, 10),
        paddingwidth: parseInt(state.padding, 10),
        paddingheight: parseInt(state.padding, 10)
      };

      const svgString = bwipjs.toSVG(options);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `barcode-${state.currentSymbology}-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate SVG: ' + err.message);
    }
  }

  function copyImageToClipboard() {
    barcodeCanvas.toBlob(blob => {
      if (!blob) return;
      try {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          showToast('Image copied to clipboard!');
        });
      } catch (e) {
        showToast('Clipboard copy failed. Downloading instead...');
        exportPNG();
      }
    });
  }

  function copySvgCode() {
    try {
      const svgString = bwipjs.toSVG({
        bcid: state.currentSymbology,
        text: state.payload,
        scale: state.scale,
        height: state.height,
        includetext: state.includeText
      });
      navigator.clipboard.writeText(svgString).then(() => {
        showToast('SVG Code copied to clipboard!');
      });
    } catch (e) {
      alert('Could not copy SVG string');
    }
  }

  // --- HISTORY MANAGEMENT ---
  function saveCurrentToHistory() {
    const item = {
      id: Date.now(),
      symbology: state.currentSymbology,
      symbologyName: getBarcodeTypeById(state.currentSymbology).name,
      payload: state.payload,
      dataUrl: barcodeCanvas.toDataURL('image/png'),
      timestamp: new Date().toLocaleTimeString()
    };

    state.history.unshift(item);
    if (state.history.length > 50) state.history.pop();

    localStorage.setItem('vibecode_history', JSON.stringify(state.history));
    updateHistoryBadge();
    showToast('Saved barcode to History!');
  }

  function renderHistoryGrid() {
    const grid = document.getElementById('historyGrid');
    if (state.history.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="ri-history-line"></i>
          <p>Your history is currently empty. Generate barcodes in the Studio to save them here automatically.</p>
        </div>`;
      return;
    }

    grid.innerHTML = state.history.map(item => `
      <div class="history-item-card">
        <img src="${item.dataUrl}" alt="${item.payload}">
        <span style="font-weight:700; font-size:12px;">${item.symbologyName}</span>
        <span class="batch-item-text">${item.payload}</span>
        <div style="display:flex; gap:6px; margin-top:6px;">
          <button class="btn btn-secondary btn-text-sm load-hist-btn" data-sym="${item.symbology}" data-text="${encodeURIComponent(item.payload)}">Load Studio</button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.load-hist-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sym = btn.getAttribute('data-sym');
        const text = decodeURIComponent(btn.getAttribute('data-text'));
        switchToStudioWith(sym, text);
      });
    });
  }

  function clearHistory() {
    if (confirm('Clear all saved barcode history?')) {
      state.history = [];
      localStorage.removeItem('vibecode_history');
      updateHistoryBadge();
      renderHistoryGrid();
    }
  }

  function updateHistoryBadge() {
    historyCountBadge.textContent = state.history.length;
  }

  // --- AAMVA DL BUILDER MODULE ---
  function initDLBuilder() {
    const dlStateSelect = document.getElementById('dlStateSelect');
    if (!dlStateSelect) return;

    // Populate Jurisdiction Options
    dlStateSelect.innerHTML = AAMVA_JURISDICTIONS.map(j => 
      `<option value="${j.code}" data-iin="${j.iin}" ${j.code === 'CA' ? 'selected' : ''}>${j.name} (${j.code})</option>`
    ).join('');

    // Height & Weight Unit Conversion Display Updates
    const dlHeightEl = document.getElementById('height') || document.getElementById('dlHeight');
    const heightUnitLabel = document.getElementById('heightUnit') || document.getElementById('heightCmLabel');
    function updateHeightCm() {
      if (!dlHeightEl || !heightUnitLabel) return;
      const inches = parseInt(dlHeightEl.value, 10);
      if (!isNaN(inches) && inches > 0) {
        const cm = Math.round(inches * 2.54);
        heightUnitLabel.textContent = `≈${cm} cm`;
      } else {
        heightUnitLabel.textContent = '≈-- cm';
      }
    }

    const dlWeightEl = document.getElementById('weight') || document.getElementById('dlWeight');
    const weightUnitLabel = document.getElementById('weightUnit') || document.getElementById('weightKgLabel');
    function updateWeightKg() {
      if (!dlWeightEl || !weightUnitLabel) return;
      const lbs = parseInt(dlWeightEl.value, 10);
      if (!isNaN(lbs) && lbs > 0) {
        const kg = Math.round(lbs * 0.45359237);
        weightUnitLabel.textContent = `≈${kg} kg`;
      } else {
        weightUnitLabel.textContent = '≈-- kg';
      }
    }

    if (dlHeightEl) dlHeightEl.addEventListener('input', updateHeightCm);
    if (dlWeightEl) dlWeightEl.addEventListener('input', updateWeightKg);
    updateHeightCm();
    updateWeightKg();

    // Form inputs change listener (User's Exact IDs)
    const dlInputs = [
      'dlVerSelect', 'dlNumber', 'firstName', 'lastName', 'middleName', 'suffix',
      'address', 'city', 'zip', 'dlClass', 'sex', 'donor', 'birthDate',
      'issueDate', 'expiryDate', 'height', 'weight', 'restrictions',
      'endorsement', 'dd', 'icn', 'limited', 'eyeDl', 'eyeAnsi',
      'hairDl', 'hairAnsi', 'dlRace', 'dlRealId', 'dlCountry'
    ];

    dlInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', renderDLBarcode);
    });

    // Calculator buttons randomizer listeners
    document.querySelectorAll('.pro-calc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-calc');
        if (type === 'dlNum') (document.getElementById('dlNumber') || document.getElementById('dlLicenseNum')).value = getRandomDLNum();
        if (type === 'firstName') (document.getElementById('firstName') || document.getElementById('dlFirstName')).value = getRandomFirstName();
        if (type === 'lastName') (document.getElementById('lastName') || document.getElementById('dlLastName')).value = getRandomLastName();
        if (type === 'middleName') (document.getElementById('middleName') || document.getElementById('dlMiddleName')).value = getRandomMiddleName();
        if (type === 'dob') (document.getElementById('birthDate') || document.getElementById('dlDob')).value = getRandomDOB();
        if (type === 'issueDate') (document.getElementById('issueDate') || document.getElementById('dlIssueDate')).value = getRandomIssueDate();
        if (type === 'expDate') (document.getElementById('expiryDate') || document.getElementById('dlExpDate')).value = getRandomExpDate((document.getElementById('birthDate') || document.getElementById('dlDob')).value);
        if (type === 'dd') (document.getElementById('dd') || document.getElementById('dlDiscriminator')).value = getRandomDD();
        if (type === 'icn') (document.getElementById('icn') || document.getElementById('dlInventory')).value = getRandomICN((document.getElementById('dlNumber') || document.getElementById('dlLicenseNum')).value);

        renderDLBarcode();
        showToast('Generated random field value!');
      });
    });

    // Action Buttons
    const createBtn = document.getElementById('dlCreateBtn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        renderDLBarcode();
        showToast('Driver Information Card Created!');
      });
    }

    const sampleBtn = document.getElementById('loadDlSampleBtn');
    if (sampleBtn) sampleBtn.addEventListener('click', loadSampleDlData);

    const randBtn = document.getElementById('randomizeAllDlBtn');
    if (randBtn) randBtn.addEventListener('click', randomizeAllDLFields);

    const clearBtn = document.getElementById('clearDlFormBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearDLForm);

    const copyRawBtn = document.getElementById('dlCopyRawBtn');
    if (copyRawBtn) copyRawBtn.addEventListener('click', copyRawAAMVA);

    const dlPngBtn = document.getElementById('dlDownloadPngBtn');
    if (dlPngBtn) dlPngBtn.addEventListener('click', downloadDLPng);

    const dlSvgBtn = document.getElementById('dlDownloadSvgBtn');
    if (dlSvgBtn) dlSvgBtn.addEventListener('click', downloadDLSvg);

    const dlCopyImgBtn = document.getElementById('dlCopyImageBtn');
    if (dlCopyImgBtn) dlCopyImgBtn.addEventListener('click', copyDLImageToClipboard);

    const parseBtn = document.getElementById('parseDlBtn');
    if (parseBtn) parseBtn.addEventListener('click', handleParseDL);

    // Initial DL render
    renderDLBarcode();
  }

  function loadSampleDlData() {
    const s = getSampleDLFormData();
    const stateSelect = document.getElementById('dlStateSelect');
    if (stateSelect) {
      stateSelect.value = s.state;
      const opt = stateSelect.options[stateSelect.selectedIndex];
      if (opt && document.getElementById('dlIinInput')) {
        document.getElementById('dlIinInput').value = opt.getAttribute('data-iin');
      }
    }

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

    setVal('dlNumber', s.licenseNum);
    setVal('firstName', s.firstName);
    setVal('lastName', s.lastName);
    setVal('middleName', s.middleName);
    setVal('address', s.street);
    setVal('city', s.city);
    setVal('zip', s.zip);
    setVal('dlClass', s.vehicleClass);
    setVal('sex', s.sex);
    setVal('donor', s.donor);
    setVal('birthDate', s.dob);
    setVal('issueDate', s.issueDate);
    setVal('expiryDate', s.expDate);
    setVal('dd', s.discriminator);
    setVal('icn', s.inventoryControl);
    setVal('restrictions', s.restrictions);
    setVal('endorsement', s.endorsements);
    setVal('height', s.heightInches);
    setVal('weight', s.weightLbs);
    setVal('suffix', s.suffix);
    setVal('limited', s.limitedTerm);
    setVal('eyeDl', s.eyeAsOnDl);
    setVal('eyeAnsi', s.eyeColor);
    setVal('hairDl', s.hairAsOnDl);
    setVal('hairAnsi', s.hairColor);

    (document.getElementById('height') || document.getElementById('dlHeight'))?.dispatchEvent(new Event('input'));
    (document.getElementById('weight') || document.getElementById('dlWeight'))?.dispatchEvent(new Event('input'));

    renderDLBarcode();
    showToast('Loaded sample Driver Information data!');
  }

  function getDLFormData() {
    const stateSelect = document.getElementById('dlStateSelect');
    const selectedJur = stateSelect ? stateSelect.value : 'CA';
    const iinVal = document.getElementById('dlIinInput') ? document.getElementById('dlIinInput').value : '636000';

    const getVal = (id, defaultVal = '') => {
      const el = document.getElementById(id);
      return el ? (el.value || '').trim() : defaultVal;
    };

    return {
      state: selectedJur,
      iin: iinVal || '636000',
      aamvaVer: getVal('dlVerSelect', '08'),
      subfileType: 'DL',
      licenseNum: getVal('dlNumber', getVal('dlLicenseNum', 'D1234567')),
      firstName: getVal('firstName', getVal('dlFirstName', 'John')),
      lastName: getVal('lastName', getVal('dlLastName', 'Doe')),
      middleName: getVal('middleName', getVal('dlMiddleName', '')),
      suffix: getVal('suffix', 'NONE'),
      dob: getVal('birthDate', getVal('dlDob', '01151970')),
      sex: getVal('sex', '1'),
      donor: getVal('donor', 'No'),
      race: getVal('dlRace', 'White'),
      heightInches: getVal('height', getVal('dlHeight', '69')),
      weightLbs: getVal('weight', getVal('dlWeight', '169')),
      limitedTerm: getVal('limited', 'No'),
      eyeAsOnDl: getVal('eyeDl', 'BRN'),
      eyeColor: getVal('eyeAnsi', getVal('dlEyeColor', 'BRO')),
      hairAsOnDl: getVal('hairDl', 'BRN'),
      hairColor: getVal('hairAnsi', getVal('dlHairColor', 'BRO')),
      issueDate: getVal('issueDate', getVal('dlIssueDate', '11262025')),
      expDate: getVal('expiryDate', getVal('dlExpDate', '01152030')),
      vehicleClass: getVal('dlClass', 'C'),
      restrictions: getVal('restrictions', 'NONE'),
      endorsements: getVal('endorsement', 'NONE'),
      realId: getVal('dlRealId', 'F'),
      discriminator: getVal('dd', getVal('dlDiscriminator', '08/25/202165508/AAFD/26')),
      inventoryControl: getVal('icn', getVal('dlInventory', '21237D12345670401')),
      street: getVal('address', getVal('dlStreet', '516 Anson Ct')),
      city: getVal('city', getVal('dlCity', 'Rohnert Park')),
      jurisdiction: selectedJur,
      zip: getVal('zip', getVal('dlZip', '875420000')),
      country: getVal('dlCountry', 'USA')
    };
  }

  function renderDLBarcode() {
    const formData = getDLFormData();
    const rawAamva = buildAAMVAString(formData);

    // Update Raw Inspector
    const dlRawText = document.getElementById('dlRawText');
    if (dlRawText) {
      dlRawText.value = rawAamva;
      const byteBadge = document.getElementById('aamvaByteCount');
      if (byteBadge) byteBadge.textContent = `${rawAamva.length} bytes`;
    }

    // Render Canvas with High Scale for Crisp Resolution
    const canvas = document.getElementById('dlBarcodeCanvas');
    if (canvas && typeof bwipjs !== 'undefined') {
      try {
        bwipjs.toCanvas(canvas, {
          bcid: 'pdf417',
          text: rawAamva,
          scale: 3,         // High-res crisp scaling factor!
          columns: 14,      // AAMVA DL optimal column count
          eclevel: 5,       // Error level 5
          paddingwidth: 12,
          paddingheight: 12
        });
      } catch (err) {
        console.warn('DL Barcode Render error:', err);
      }
    }

    // Update Mockup Card UI if present
    updateDLCardMockup(formData);
  }

  function updateDLCardMockup(f) {
    const stateObj = AAMVA_JURISDICTIONS.find(j => j.code === f.state);
    const cardStateName = document.getElementById('cardStateName');
    if (cardStateName) cardStateName.textContent = stateObj ? stateObj.name.toUpperCase() : f.state;

    const cardDlNo = document.getElementById('cardDlNo');
    if (cardDlNo) cardDlNo.textContent = f.licenseNum || '40460664';

    const cardExp = document.getElementById('cardExp');
    if (cardExp) cardExp.textContent = formatAamvaDate(f.expDate);

    const cardDob = document.getElementById('cardDob');
    if (cardDob) cardDob.textContent = formatAamvaDate(f.dob);

    const cardFullName = document.getElementById('cardFullName');
    if (cardFullName) cardFullName.textContent = `${f.lastName || 'MARTRELLI'}, ${f.firstName || 'DAVIS'} ${f.middleName || ''}`.trim();

    const cardAddress = document.getElementById('cardAddress');
    if (cardAddress) cardAddress.textContent = `${f.street}, ${f.city} ${f.state} ${f.zip}`.toUpperCase();

    const cardSex = document.getElementById('cardSex');
    if (cardSex) cardSex.textContent = f.sex === '1' ? 'M' : (f.sex === '2' ? 'F' : 'X');

    const cardClass = document.getElementById('cardClass');
    if (cardClass) cardClass.textContent = f.vehicleClass || 'C';
  }

  function formatAamvaDate(dStr) {
    if (!dStr || dStr.length !== 8) return dStr || '--/--/----';
    return `${dStr.substring(0,2)}/${dStr.substring(2,4)}/${dStr.substring(4)}`;
  }

  function randomizeAllDLFields() {
    document.getElementById('dlLicenseNum').value = getRandomDLNum();
    document.getElementById('dlFirstName').value = getRandomFirstName();
    document.getElementById('dlLastName').value = getRandomLastName();
    document.getElementById('dlMiddleName').value = getRandomMiddleName();
    document.getElementById('dlDob').value = getRandomDOB();
    document.getElementById('dlIssueDate').value = getRandomIssueDate();
    document.getElementById('dlExpDate').value = getRandomExpDate(document.getElementById('dlDob').value);
    document.getElementById('dlDiscriminator').value = getRandomDD();
    document.getElementById('dlInventory').value = getRandomICN(document.getElementById('dlLicenseNum').value);
    document.getElementById('dlHeight').value = Math.floor(60 + Math.random() * 18).toString();
    document.getElementById('dlWeight').value = Math.floor(120 + Math.random() * 100).toString();

    document.getElementById('dlHeight')?.dispatchEvent(new Event('input'));
    document.getElementById('dlWeight')?.dispatchEvent(new Event('input'));

    renderDLBarcode();
    showToast('Randomized all DL barcode fields!');
  }

  function clearDLForm() {
    ['dlLicenseNum', 'dlFirstName', 'dlLastName', 'dlMiddleName', 'dlStreet', 'dlCity', 'dlZip', 'dlDob', 'dlIssueDate', 'dlExpDate', 'dlHeight', 'dlWeight', 'dlRestrictions', 'dlEndorsements', 'dlDiscriminator', 'dlInventory'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    document.getElementById('dlHeight')?.dispatchEvent(new Event('input'));
    document.getElementById('dlWeight')?.dispatchEvent(new Event('input'));

    renderDLBarcode();
    showToast('Cleared form fields');
  }

  function copyRawAAMVA() {
    const text = document.getElementById('dlRawText').value;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Raw AAMVA string copied to clipboard!');
    });
  }

  function downloadDLPng() {
    const canvas = document.getElementById('dlBarcodeCanvas');
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `AAMVA-DL-PDF417-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    showToast('Downloaded High-Res PNG Barcode!');
  }

  function downloadDLSvg() {
    const formData = getDLFormData();
    const rawAamva = buildAAMVAString(formData);
    try {
      const svgString = bwipjs.toSVG({
        bcid: 'pdf417',
        text: rawAamva,
        scale: 3,
        columns: 14,
        eclevel: 5,
        paddingwidth: 12,
        paddingheight: 12
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `AAMVA-DL-PDF417-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded Vector SVG Barcode!');
    } catch (e) {
      alert('Failed to generate SVG: ' + e.message);
    }
  }

  function copyDLImageToClipboard() {
    const canvas = document.getElementById('dlBarcodeCanvas');
    canvas.toBlob(blob => {
      if (!blob) return;
      try {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          showToast('Copied Barcode Image to Clipboard!');
        });
      } catch (e) {
        downloadDLPng();
      }
    });
  }

  function handleParseDL() {
    const rawText = document.getElementById('parseInputText').value.trim();
    const outputDiv = document.getElementById('parsedFieldsOutput');

    if (!rawText) {
      alert('Please paste a raw AAMVA DL string into the decoder text box.');
      return;
    }

    const parsed = parseAAMVAString(rawText);
    if (!parsed.isValidAAMVA && Object.keys(parsed.fields).length === 0) {
      outputDiv.innerHTML = `<div style="color:red; font-weight:600;"><i class="ri-error-warning-line"></i> Could not identify valid AAMVA DL headers or fields.</div>`;
      outputDiv.classList.remove('hidden');
      return;
    }

    let html = `<div style="font-weight:700; color:var(--accent-secondary); margin-bottom:8px;"><i class="ri-checkbox-circle-line"></i> Successfully Parsed AAMVA Fields:</div>`;
    html += `<table class="parsed-table">`;
    html += `<tr><td><strong>IIN / State Issuer:</strong></td><td>${parsed.header.iin || 'Unknown'} (Ver: ${parsed.header.aamvaVer || '08'})</td></tr>`;

    Object.values(parsed.fields).forEach(f => {
      html += `<tr><td><strong>${f.label} (${f.code}):</strong></td><td>${f.value}</td></tr>`;
    });

    html += `</table>`;
    outputDiv.innerHTML = html;
    outputDiv.classList.remove('hidden');
  }

  // --- THEME & TOAST UTILS ---
  function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('theme-dark')) {
      body.classList.replace('theme-dark', 'theme-light');
    } else {
      body.classList.replace('theme-light', 'theme-dark');
    }
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px;
      background: #6366f1; color: #ffffff;
      padding: 12px 20px; border-radius: 8px;
      font-size: 13px; font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      z-index: 9999; animation: fadeIn 0.3s;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }
});


