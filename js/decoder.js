/**
 * VibeCode Studio – ZXing Barcode Decoder
 * Uses @zxing/library UMD → window.ZXing
 * Exports: initDecoder()
 */

(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────
  const DS = {
    cameraActive: false,
    codeReader: null,
    lastResult: null,
    history: []
  };

  let dom = {};

  // ── Format display map ─────────────────────────────────────────────────────
  const FMT = {
    QR_CODE:      { label: 'QR Code',           icon: 'ri-qr-code-line',        color: '#6366f1' },
    PDF_417:      { label: 'PDF417',             icon: 'ri-id-card-line',        color: '#0ea5e9' },
    DATA_MATRIX:  { label: 'Data Matrix',        icon: 'ri-grid-line',           color: '#10b981' },
    AZTEC:        { label: 'Aztec',              icon: 'ri-shape-line',          color: '#f59e0b' },
    CODE_128:     { label: 'Code 128',           icon: 'ri-barcode-line',        color: '#8b5cf6' },
    CODE_39:      { label: 'Code 39',            icon: 'ri-barcode-line',        color: '#ec4899' },
    CODE_93:      { label: 'Code 93',            icon: 'ri-barcode-line',        color: '#f43f5e' },
    EAN_13:       { label: 'EAN-13',             icon: 'ri-barcode-line',        color: '#14b8a6' },
    EAN_8:        { label: 'EAN-8',              icon: 'ri-barcode-line',        color: '#06b6d4' },
    UPC_A:        { label: 'UPC-A',              icon: 'ri-barcode-line',        color: '#84cc16' },
    UPC_E:        { label: 'UPC-E',              icon: 'ri-barcode-line',        color: '#a3e635' },
    ITF:          { label: 'ITF',                icon: 'ri-barcode-line',        color: '#fb923c' },
    CODABAR:      { label: 'Codabar',            icon: 'ri-barcode-line',        color: '#f97316' },
    RSS_14:       { label: 'GS1 DataBar',        icon: 'ri-barcode-line',        color: '#ef4444' },
    RSS_EXPANDED: { label: 'GS1 DataBar Expanded',icon: 'ri-barcode-line',      color: '#dc2626' },
    MAXICODE:     { label: 'MaxiCode',           icon: 'ri-hexagon-line',        color: '#7c3aed' },
  };

  function fmtMeta(fmt) {
    let key = 'UNKNOWN';
    if (fmt !== null && fmt !== undefined) {
      // If it's a number (BarcodeFormat enum), convert via ZXing
      if (typeof fmt === 'number' && window.ZXing && window.ZXing.BarcodeFormat) {
        const BF = window.ZXing.BarcodeFormat;
        for (const k of Object.keys(BF)) {
          if (BF[k] === fmt) { key = k; break; }
        }
      } else {
        key = String(fmt).replace(/-/g, '_').toUpperCase();
      }
    }
    return FMT[key] || { label: key.replace(/_/g, ' '), icon: 'ri-barcode-line', color: '#94a3b8' };
  }

  // ── AAMVA sniffer ──────────────────────────────────────────────────────────
  function tryParseAamva(text) {
    if (!text || !text.includes('@')) return null;
    const upper = text.toUpperCase();
    if (!upper.includes('ANSI') && !upper.includes('AAMVA')) return null;

    const FIELD_LABELS = {
      DAA:'Full Name', DCS:'Last Name', DCT:'First Name', DAC:'First Name',
      DAD:'Middle Name', DBB:'Birth Date', DBA:'Expiry Date', DBD:'Issue Date',
      DAG:'Address', DAI:'City', DAJ:'State', DAK:'ZIP', DAQ:'DL Number',
      DAR:'DL Class', DAS:'Restrictions', DAT:'Endorsements',
      DAU:'Height', DAW:'Weight', DAY:'Eye Color', DAZ:'Hair Color',
      DBC:'Sex', DBH:'Organ Donor', DCF:'Document Discriminator',
      DCG:'Country', DCK:'Inventory Control', DCI:'Place of Birth',
    };

    const fields = {};
    const lines = text.replace(/\r/g, '\n').split('\n');
    for (const line of lines) {
      const code = line.substring(0, 3);
      const val  = line.substring(3).trim();
      if (FIELD_LABELS[code] && val) fields[FIELD_LABELS[code]] = val;
    }
    return Object.keys(fields).length >= 3 ? fields : null;
  }

  // ── Content-type detection ─────────────────────────────────────────────────
  function detectContentType(text) {
    if (/^https?:\/\//i.test(text))       return { label: 'URL / Link',         icon: 'ri-links-line',        isUrl: true  };
    if (/^BEGIN:VCARD/i.test(text))       return { label: 'vCard Contact',       icon: 'ri-contacts-book-line',isUrl: false };
    if (/^WIFI:/i.test(text))             return { label: 'WiFi Config',         icon: 'ri-wifi-line',         isUrl: false };
    if (/^tel:/i.test(text))              return { label: 'Phone Number',        icon: 'ri-phone-line',        isUrl: false };
    if (/^smsto?:/i.test(text))           return { label: 'SMS Message',         icon: 'ri-message-line',      isUrl: false };
    if (/^geo:/i.test(text))              return { label: 'GPS Location',        icon: 'ri-map-pin-line',      isUrl: false };
    if (/^MATMSG:/i.test(text))           return { label: 'Email Message',       icon: 'ri-mail-line',         isUrl: false };
    if (/^@.*ANSI/is.test(text))          return { label: 'AAMVA Driver License',icon: 'ri-id-card-line',      isUrl: false };
    if (/^\d+$/.test(text.trim()))        return { label: 'Numeric Code',        icon: 'ri-hashtag',           isUrl: false };
    return                                       { label: 'Plain Text',          icon: 'ri-text',              isUrl: false };
  }

  // ── Image preprocessing helpers for screenshots & complex backgrounds ──────

  function drawToCanvas(source, sx, sy, sw, sh, dw, dh) {
    const canvas = document.createElement('canvas');
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, dw, dh);
    return { canvas, ctx };
  }

  function cloneCanvas(orig) {
    return drawToCanvas(orig, 0, 0, orig.width, orig.height, orig.width, orig.height);
  }

  // 1. Invert colors (Crucial for Dark Mode screenshots)
  function createInvertedCanvas(srcCanvas) {
    const { canvas, ctx } = cloneCanvas(srcCanvas);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i]     = 255 - d[i];
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  // 2. Grayscale & Dynamic Range Histogram Stretch (Normalizes against colored/gradient backgrounds)
  function createContrastCanvas(srcCanvas) {
    const { canvas, ctx } = cloneCanvas(srcCanvas);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const len = d.length;

    let minL = 255;
    let maxL = 0;
    const lums = new Uint8Array(len / 4);

    for (let i = 0, j = 0; i < len; i += 4, j++) {
      const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0;
      lums[j] = lum;
      if (lum < minL) minL = lum;
      if (lum > maxL) maxL = lum;
    }

    const range = maxL - minL || 1;
    for (let i = 0, j = 0; i < len; i += 4, j++) {
      const stretched = Math.min(255, Math.max(0, ((lums[j] - minL) / range) * 255)) | 0;
      d[i] = d[i + 1] = d[i + 2] = stretched;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  // 3. Adaptive Threshold (Binarization for textured/photo backgrounds)
  function createThresholdCanvas(srcCanvas) {
    const { canvas, ctx } = cloneCanvas(srcCanvas);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const len = d.length;

    let sum = 0;
    for (let i = 0; i < len; i += 4) {
      sum += (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    }
    const avg = sum / (len / 4);

    for (let i = 0; i < len; i += 4) {
      const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
      const val = lum > avg ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = val;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  // 4. Sharpen (Fixes blurry compression artifacts from screenshots & mobile cameras)
  function createSharpenedCanvas(srcCanvas) {
    const { canvas, ctx } = cloneCanvas(srcCanvas);
    const w = canvas.width;
    const h = canvas.height;
    if (w < 10 || h < 10) return canvas;

    const srcData = ctx.getImageData(0, 0, w, h);
    const dstData = ctx.createImageData(w, h);
    const src = srcData.data;
    const dst = dstData.data;

    // 3x3 unsharp convolution kernel
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const val = 5 * src[idx + c]
            - src[((y - 1) * w + x) * 4 + c]
            - src[((y + 1) * w + x) * 4 + c]
            - src[(y * w + (x - 1)) * 4 + c]
            - src[(y * w + (x + 1)) * 4 + c];
          dst[idx + c] = Math.min(255, Math.max(0, val));
        }
        dst[idx + 3] = src[idx + 3];
      }
    }

    ctx.putImageData(dstData, 0, 0);
    return canvas;
  }

  // 5. Downscale canvas to target max dimension
  function createScaledCanvas(srcImg, maxDim) {
    const w = srcImg.naturalWidth || srcImg.width;
    const h = srcImg.naturalHeight || srcImg.height;
    if (Math.max(w, h) <= maxDim) {
      return drawToCanvas(srcImg, 0, 0, w, h, w, h).canvas;
    }
    const scale = maxDim / Math.max(w, h);
    const dw = Math.round(w * scale);
    const dh = Math.round(h * scale);
    return drawToCanvas(srcImg, 0, 0, w, h, dw, dh).canvas;
  }

  // 6. Crop sub-regions (for screenshots where barcode is only in one portion)
  function getScreenshotCrops(img) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const crops = [];

    // Center 70%
    const c70w = Math.round(w * 0.70);
    const c70h = Math.round(h * 0.70);
    crops.push({ label: 'Center 70%', canvas: drawToCanvas(img, Math.round((w - c70w) / 2), Math.round((h - c70h) / 2), c70w, c70h, c70w, c70h).canvas });

    // Center 50%
    const c50w = Math.round(w * 0.50);
    const c50h = Math.round(h * 0.50);
    crops.push({ label: 'Center 50%', canvas: drawToCanvas(img, Math.round((w - c50w) / 2), Math.round((h - c50h) / 2), c50w, c50h, c50w, c50h).canvas });

    // Top half and Bottom half
    const halfH = Math.round(h * 0.55);
    crops.push({ label: 'Top Half', canvas: drawToCanvas(img, 0, 0, w, halfH, w, halfH).canvas });
    crops.push({ label: 'Bottom Half', canvas: drawToCanvas(img, 0, h - halfH, w, halfH, w, halfH).canvas });

    // 4 Quadrants
    const qW = Math.round(w * 0.60);
    const qH = Math.round(h * 0.60);
    crops.push({ label: 'Top-Left',     canvas: drawToCanvas(img, 0, 0, qW, qH, qW, qH).canvas });
    crops.push({ label: 'Top-Right',    canvas: drawToCanvas(img, w - qW, 0, qW, qH, qW, qH).canvas });
    crops.push({ label: 'Bottom-Left',  canvas: drawToCanvas(img, 0, h - qH, qW, qH, qW, qH).canvas });
    crops.push({ label: 'Bottom-Right', canvas: drawToCanvas(img, w - qW, h - qH, qW, qH, qW, qH).canvas });

    return crops;
  }

  // ── Rotation helper (Essential for Driver Licenses photographed or captured sideways) ─
  function createRotatedCanvas(srcCanvas, deg) {
    if (!deg || deg === 0) return srcCanvas;
    const canvas = document.createElement('canvas');
    const rad = (deg * Math.PI) / 180;
    if (deg === 90 || deg === 270) {
      canvas.width = srcCanvas.height;
      canvas.height = srcCanvas.width;
    } else {
      canvas.width = srcCanvas.width;
      canvas.height = srcCanvas.height;
    }
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.drawImage(srcCanvas, -srcCanvas.width / 2, -srcCanvas.height / 2);
    return canvas;
  }

  // ── Computer Vision: Barcode Line & Density Detector ─────────────────────────
  // Locates clusters of vertical zebra lines (PDF417 / 1D barcodes) in noisy screenshots
  function findBarcodeRegions(srcCanvas) {
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    if (w < 40 || h < 40) return [];

    const scale = Math.min(1, 600 / Math.max(w, h));
    const sw = Math.round(w * scale);
    const sh = Math.round(h * scale);

    const { canvas: thumb, ctx } = drawToCanvas(srcCanvas, 0, 0, w, h, sw, sh);
    const imgData = ctx.getImageData(0, 0, sw, sh);
    const d = imgData.data;

    // 1. Grayscale luminance
    const gray = new Uint8Array(sw * sh);
    for (let i = 0, j = 0; i < d.length; i += 4, j++) {
      gray[j] = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0;
    }

    // 2. Barcode gradient: strong horizontal transitions (vertical bars) minus vertical transitions
    const grad = new Float32Array(sw * sh);
    for (let y = 1; y < sh - 1; y++) {
      for (let x = 1; x < sw - 1; x++) {
        const idx = y * sw + x;
        const dx = Math.abs(gray[idx + 1] - gray[idx - 1]);
        const dy = Math.abs(gray[idx + sw] - gray[idx - sw]);
        grad[idx] = Math.max(0, dx - dy * 0.7);
      }
    }

    // 3. Horizontal morphological blur to fuse parallel bars into solid energy block
    const blurH = new Float32Array(sw * sh);
    const hRadius = Math.max(4, Math.round(sw * 0.04));
    for (let y = 0; y < sh; y++) {
      let sum = 0;
      const rowOffset = y * sw;
      for (let x = 0; x < Math.min(hRadius, sw); x++) sum += grad[rowOffset + x];
      for (let x = 0; x < sw; x++) {
        if (x + hRadius < sw) sum += grad[rowOffset + x + hRadius];
        if (x - hRadius >= 0) sum -= grad[rowOffset + x - hRadius];
        blurH[rowOffset + x] = sum;
      }
    }

    // Vertical blur
    const energy = new Float32Array(sw * sh);
    const vRadius = Math.max(2, Math.round(sh * 0.025));
    for (let x = 0; x < sw; x++) {
      let sum = 0;
      for (let y = 0; y < Math.min(vRadius, sh); y++) sum += blurH[y * sw + x];
      for (let y = 0; y < sh; y++) {
        if (y + vRadius < sh) sum += blurH[(y + vRadius) * sw + x];
        if (y - vRadius >= 0) sum -= blurH[(y - vRadius) * sw + x];
        energy[y * sw + x] = sum;
      }
    }

    let maxE = 0;
    for (let i = 0; i < energy.length; i++) {
      if (energy[i] > maxE) maxE = energy[i];
    }
    if (maxE === 0) return [];

    const threshold = maxE * 0.40;
    const binary = new Uint8Array(sw * sh);
    for (let i = 0; i < energy.length; i++) {
      binary[i] = energy[i] >= threshold ? 1 : 0;
    }

    const rowProj = new Int32Array(sh);
    for (let y = 0; y < sh; y++) {
      let cnt = 0;
      for (let x = 0; x < sw; x++) {
        if (binary[y * sw + x]) cnt++;
      }
      rowProj[y] = cnt;
    }

    const segments = [];
    let inSeg = false;
    let segStart = 0;
    const minRowDensity = sw * 0.12;

    for (let y = 0; y < sh; y++) {
      if (rowProj[y] >= minRowDensity) {
        if (!inSeg) { inSeg = true; segStart = y; }
      } else {
        if (inSeg) {
          inSeg = false;
          if (y - segStart >= 8) segments.push({ top: segStart, bottom: y });
        }
      }
    }
    if (inSeg && (sh - segStart >= 8)) segments.push({ top: segStart, bottom: sh });

    const candidates = [];
    const invScale = 1 / scale;

    for (const seg of segments) {
      let minX = sw, maxX = 0;
      for (let y = seg.top; y <= seg.bottom; y++) {
        for (let x = 0; x < sw; x++) {
          if (binary[y * sw + x]) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }
        }
      }

      if (maxX - minX >= sw * 0.15) {
        const padX = (maxX - minX) * 0.12;
        const padY = (seg.bottom - seg.top) * 0.15;

        const origX = Math.max(0, Math.round((minX - padX) * invScale));
        const origY = Math.max(0, Math.round((seg.top - padY) * invScale));
        const origW = Math.min(w - origX, Math.round((maxX - minX + padX * 2) * invScale));
        const origH = Math.min(h - origY, Math.round((seg.bottom - seg.top + padY * 2) * invScale));

        if (origW > 30 && origH > 20) {
          candidates.push({
            x: origX, y: origY, width: origW, height: origH,
            canvas: drawToCanvas(srcCanvas, origX, origY, origW, origH, origW, origH).canvas
          });
        }
      }
    }

    return candidates;
  }

  // Draw HUD target box over identified barcode lines on preview
  function drawDetectedBoxes(boxes, naturalWidth, naturalHeight) {
    if (!dom.overlayCanvas || !dom.previewImg) return;
    const canvas = dom.overlayCanvas;
    const rect = dom.previewImg.getBoundingClientRect();
    canvas.width = dom.previewImg.clientWidth || rect.width || naturalWidth;
    canvas.height = dom.previewImg.clientHeight || rect.height || naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!boxes || !boxes.length) return;

    const scaleX = canvas.width / naturalWidth;
    const scaleY = canvas.height / naturalHeight;

    for (const b of boxes) {
      const rx = b.x * scaleX;
      const ry = b.y * scaleY;
      const rw = b.width * scaleX;
      const rh = b.height * scaleY;

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.strokeRect(rx, ry, rw, rh);

      const len = Math.min(14, rw / 4, rh / 4);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rx, ry + len); ctx.lineTo(rx, ry); ctx.lineTo(rx + len, ry);
      ctx.moveTo(rx + rw - len, ry); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx + rw, ry + len);
      ctx.moveTo(rx, ry + rh - len); ctx.lineTo(rx, ry + rh); ctx.lineTo(rx + len, ry + rh);
      ctx.moveTo(rx + rw - len, ry + rh); ctx.lineTo(rx + rw, ry + rh); ctx.lineTo(rx + rw, ry + rh - len);
      ctx.stroke();

      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('DETECTED BARCODE LINES', rx + 4, Math.max(12, ry - 4));
    }
  }

  // ── Engine 0: Native Hardware-Accelerated ML BarcodeDetector ────────────────
  async function attemptNativeBarcodeDetector(source) {
    if (!('BarcodeDetector' in window)) return null;
    try {
      const detector = new window.BarcodeDetector({
        formats: [
          'pdf417', 'qr_code', 'code_128', 'data_matrix',
          'aztec', 'ean_13', 'upc_a', 'code_39', 'itf'
        ]
      });
      const results = await detector.detect(source);
      if (results && results.length > 0) {
        const pdf = results.find(r => r.format === 'pdf417') || results[0];
        if (pdf && pdf.rawValue) {
          return {
            getText: () => pdf.rawValue,
            getBarcodeFormat: () => (pdf.format || 'pdf417').toUpperCase().replace(/-/g, '_'),
            text: pdf.rawValue,
            format: (pdf.format || 'pdf417').toUpperCase(),
            boundingBox: pdf.boundingBox
          };
        }
      }
    } catch (_) {}
    return null;
  }

  // ── Engine 1: jsQR attempt (Specialized for QR in screenshots, dark mode, background noise) ──
  function attemptJsQR(canvas) {
    if (typeof window.jsQR !== 'function') return null;
    try {
      const ctx = canvas.getContext('2d');
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imgData.data, canvas.width, canvas.height, {
        inversionAttempts: 'attemptBoth'
      });
      if (code && code.data) {
        return {
          getText: () => code.data,
          getBarcodeFormat: () => 'QR_CODE',
          text: code.data,
          format: 'QR_CODE'
        };
      }
    } catch (_) {}
    return null;
  }

  // ── Engine 2: ZXing attempt (Dedicated PDF417 and Multi-Format) ────────────
  async function attemptZXing(canvas, reader) {
    if (!reader) return null;
    try {
      if (typeof reader.decodeFromCanvas === 'function') {
        let res = reader.decodeFromCanvas(canvas);
        if (res && typeof res.then === 'function') res = await res;
        if (res) return res;
      }
    } catch (_) {}

    try {
      const tempImg = new Image();
      await new Promise((res, rej) => {
        tempImg.onload = res;
        tempImg.onerror = rej;
        tempImg.src = canvas.toDataURL('image/png');
      });

      let res = null;
      if (typeof reader.decodeFromImageElement === 'function') {
        res = await reader.decodeFromImageElement(tempImg);
      } else if (typeof reader.decodeFromImage === 'function') {
        res = await reader.decodeFromImage(tempImg);
      }

      if (res && typeof res.then === 'function') res = await res;
      if (res) return res;
    } catch (_) {}

    return null;
  }

  // Try decoding a canvas with all available optical engines
  async function tryDecodeCandidate(canvas, multiReader, pdfReader, label) {
    // 0. Try Native Hardware-Accelerated ML BarcodeDetector
    const nativeRes = await attemptNativeBarcodeDetector(canvas);
    if (nativeRes) {
      nativeRes._enhancement = label ? `Native ML (${label})` : 'Native ML';
      return nativeRes;
    }

    // 1. Try Dedicated PDF417 Reader (Prioritizes Driver Licenses)
    if (pdfReader) {
      const pdfRes = await attemptZXing(canvas, pdfReader);
      if (pdfRes) {
        pdfRes._enhancement = label ? `PDF417 (${label})` : 'PDF417';
        return pdfRes;
      }
    }

    // 2. Try jsQR (super fast for QR codes)
    const qrRes = attemptJsQR(canvas);
    if (qrRes) {
      qrRes._enhancement = label ? `jsQR (${label})` : 'jsQR';
      return qrRes;
    }

    // 3. Try ZXing Multi-format
    const zxRes = await attemptZXing(canvas, multiReader);
    if (zxRes) {
      zxRes._enhancement = label ? `ZXing (${label})` : 'ZXing';
      return zxRes;
    }

    return null;
  }

  // ── Multi-pass decode from an image data URL ──────────────────────────────
  async function decodeFromImage(dataUrl) {
    showLoading(true, 'Analyzing image…');
    clearResult();

    try {
      // 1. Load source image
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = dataUrl;
      });

      const natW = img.naturalWidth || img.width;
      const natH = img.naturalHeight || img.height;

      // 2. Initialize ZXing readers
      let multiReader = null;
      let pdfReader = null;
      if (window.ZXing && window.ZXing.BrowserMultiFormatReader) {
        const hintsMulti = new Map();
        hintsMulti.set(window.ZXing.DecodeHintType.TRY_HARDER, true);
        multiReader = new window.ZXing.BrowserMultiFormatReader(hintsMulti);

        try {
          const hintsPdf = new Map();
          hintsPdf.set(window.ZXing.DecodeHintType.TRY_HARDER, true);
          if (window.ZXing.BarcodeFormat && window.ZXing.BarcodeFormat.PDF_417 !== undefined) {
            hintsPdf.set(window.ZXing.DecodeHintType.POSSIBLE_FORMATS, [window.ZXing.BarcodeFormat.PDF_417]);
          }
          pdfReader = new window.ZXing.BrowserMultiFormatReader(hintsPdf);
        } catch (_) {}
      }

      // Base canvas (capped at 1600px for speed)
      const baseCanvas = createScaledCanvas(img, 1600);

      // ── Step 1: Native ML direct scan on original element ──
      showLoading(true, 'Native ML scanning…');
      let result = await attemptNativeBarcodeDetector(img);
      if (result) {
        result._enhancement = 'Native ML';
        onDecodeSuccess(result);
        return;
      }

      // ── Step 2: Direct optical pass on full image ──
      showLoading(true, 'Scanning image…');
      result = await tryDecodeCandidate(baseCanvas, multiReader, pdfReader, 'Standard');
      if (result) { onDecodeSuccess(result); return; }

      // ── Step 3: Computer Vision: Identify Barcode Lines & Dense Zebra Stripe Regions ──
      showLoading(true, 'Detecting scannable barcode lines…');
      const regions = findBarcodeRegions(baseCanvas);
      if (regions && regions.length > 0) {
        drawDetectedBoxes(regions, baseCanvas.width, baseCanvas.height);
        for (let i = 0; i < regions.length; i++) {
          const reg = regions[i];
          showLoading(true, `Scanning detected barcode lines (${i + 1}/${regions.length})…`);
          
          // Test region at 0°, 90°, 270°, 180°
          const angles = [0, 90, 270, 180];
          for (const ang of angles) {
            const rot = createRotatedCanvas(reg.canvas, ang);
            result = await tryDecodeCandidate(rot, multiReader, pdfReader, `Line Finder (${ang}°${i > 0 ? ' #' + (i + 1) : ''})`);
            if (result) break;

            // Also try high-contrast on rotated region
            const contrast = createContrastCanvas(rot);
            result = await tryDecodeCandidate(contrast, multiReader, pdfReader, `Line Finder Enhanced (${ang}°)`);
            if (result) break;

            // Also try inverted on rotated region (for dark-mode licenses)
            const inv = createInvertedCanvas(rot);
            result = await tryDecodeCandidate(inv, multiReader, pdfReader, `Line Finder Inverted (${ang}°)`);
            if (result) break;
          }
          if (result) { onDecodeSuccess(result); return; }
        }
      }

      // ── Step 4: Multi-rotation scan on full image (0°, 90°, 270°, 180°) ──
      // Many phone screenshots of DL cards are captured vertically
      showLoading(true, 'Testing rotated orientations…');
      for (const ang of [90, 270, 180]) {
        const rotCanvas = createRotatedCanvas(baseCanvas, ang);
        result = await tryDecodeCandidate(rotCanvas, multiReader, pdfReader, `Rotated ${ang}°`);
        if (result) { onDecodeSuccess(result); return; }
      }

      // ── Step 5: Downscaled pass (Max 1000px — optimal for large desktop/mobile screenshots) ──
      if (baseCanvas.width > 900 || baseCanvas.height > 900) {
        showLoading(true, 'Optimizing screenshot resolution…');
        const downCanvas = createScaledCanvas(img, 1000);
        result = await tryDecodeCandidate(downCanvas, multiReader, pdfReader, 'Screenshot Scaled');
        if (result) { onDecodeSuccess(result); return; }
      }

      // ── Step 6: Inverted colors pass (Crucial for Dark Mode screenshots) ──
      showLoading(true, 'Analyzing dark mode / inverted colors…');
      const invCanvas = createInvertedCanvas(baseCanvas);
      result = await tryDecodeCandidate(invCanvas, multiReader, pdfReader, 'Dark Mode Inverted');
      if (result) { onDecodeSuccess(result); return; }

      // ── Step 7: Dynamic Contrast Stretch (Cleans textured/colored backgrounds) ──
      showLoading(true, 'Enhancing background contrast…');
      const contrastCanvas = createContrastCanvas(baseCanvas);
      result = await tryDecodeCandidate(contrastCanvas, multiReader, pdfReader, 'High Contrast');
      if (result) { onDecodeSuccess(result); return; }

      // ── Step 8: Sharpened pass (Fixes compression blur from screenshots) ──
      showLoading(true, 'Sharpening compressed barcode bars…');
      const sharpCanvas = createSharpenedCanvas(baseCanvas);
      result = await tryDecodeCandidate(sharpCanvas, multiReader, pdfReader, 'Sharpened');
      if (result) { onDecodeSuccess(result); return; }

      // ── Step 9: Screenshot Region Crops (Eliminates desktop/browser window chrome) ──
      if (baseCanvas.width > 300 || baseCanvas.height > 300) {
        showLoading(true, 'Scanning screenshot sub-regions…');
        const crops = getScreenshotCrops(img);
        for (const crop of crops) {
          result = await tryDecodeCandidate(crop.canvas, multiReader, pdfReader, `Region: ${crop.label}`);
          if (result) break;

          const invCrop = createInvertedCanvas(crop.canvas);
          result = await tryDecodeCandidate(invCrop, multiReader, pdfReader, `Region: ${crop.label} (Dark Mode)`);
          if (result) break;
        }
        if (result) { onDecodeSuccess(result); return; }
      }

      // ── Step 10: Adaptive Thresholding (For complex photos/wallpapers) ──
      showLoading(true, 'Applying adaptive binarization…');
      const threshCanvas = createThresholdCanvas(baseCanvas);
      result = await tryDecodeCandidate(threshCanvas, multiReader, pdfReader, 'Adaptive Threshold');
      if (result) { onDecodeSuccess(result); return; }

      // If all optical passes fail, display error with 1-click AI Vision prompt
      showErrorWithAiOption('Optical scanner could not read this barcode. Click "AI Vision Assist" above to analyze this screenshot with Free Gemini AI.');
    } catch (err) {
      showError('Decode error: ' + (err?.message || String(err)));
    } finally {
      showLoading(false);
    }
  }

  // ── Handle success ─────────────────────────────────────────────────────────
  function onDecodeSuccess(result) {
    const text   = typeof result.getText === 'function' ? result.getText() : String(result.text || result);
    const fmt    = typeof result.getBarcodeFormat === 'function' ? result.getBarcodeFormat() : (result.format ?? 'Unknown');
    const meta   = fmtMeta(fmt);
    const aamva  = tryParseAamva(text);
    const ts     = new Date().toLocaleTimeString();
    const enh    = result._enhancement || null;

    DS.lastResult = { text, meta, aamva, enhancement: enh };
    DS.history.unshift({ text, format: meta.label, ts, enhancement: enh });
    if (DS.history.length > 20) DS.history.pop();
    renderHistory();
    showResult(text, meta, aamva, enh);
  }

  // ── Render result panel ───────────────────────────────────────────────────
  function showResult(text, meta, aamva, enhancement) {
    dom.resultEmpty.classList.add('hidden');
    dom.decodeError.classList.add('hidden');
    dom.resultPanel.classList.remove('hidden');

    // Format badge
    dom.resultFormatBadge.innerHTML = `<i class="${meta.icon}"></i> ${meta.label}`;
    dom.resultFormatBadge.style.cssText = `
      background:${meta.color}22; color:${meta.color};
      border:1px solid ${meta.color}55;`;

    // Enhancement badge (Screenshot auto-tuning / Dark mode / Contrast)
    if (dom.enhanceBadge) {
      if (enhancement && enhancement !== 'Standard') {
        dom.enhanceBadge.innerHTML = `<i class="ri-magic-line"></i> ${enhancement}`;
        dom.enhanceBadge.classList.remove('hidden');
      } else {
        dom.enhanceBadge.classList.add('hidden');
      }
    }

    // Text
    dom.resultText.textContent = text;
    dom.resultCharCount.textContent = `${text.length} chars`;

    // Content type chip
    const ct = detectContentType(text);
    dom.resultTypeChip.innerHTML = `<i class="${ct.icon}"></i> ${ct.label}`;

    // URL link
    if (ct.isUrl) {
      dom.resultLink.href = text;
      dom.resultLink.classList.remove('hidden');
    } else {
      dom.resultLink.classList.add('hidden');
    }

    // AAMVA section
    if (aamva) {
      dom.aamvaSection.classList.remove('hidden');
      dom.aamvaGrid.innerHTML = Object.entries(aamva)
        .map(([k, v]) => `<div class="aamva-field-item"><span class="aamva-field-key">${k}</span><span class="aamva-field-val">${v}</span></div>`)
        .join('');
    } else {
      dom.aamvaSection.classList.add('hidden');
    }
  }

  // ── Camera scanner ─────────────────────────────────────────────────────────
  async function startCamera() {
    if (!window.ZXing) { showError('ZXing not loaded.'); return; }

    try {
      dom.cameraPlaceholder.classList.add('hidden');
      dom.cameraVideo.classList.remove('hidden');
      dom.startCamBtn.classList.add('hidden');
      dom.stopCamBtn.classList.remove('hidden');
      dom.camOverlay.classList.remove('hidden');
      dom.camChip.classList.add('hidden');

      const hints = new Map();
      hints.set(window.ZXing.DecodeHintType.TRY_HARDER, true);

      const reader = new window.ZXing.BrowserMultiFormatReader(hints);
      DS.codeReader = reader;
      DS.cameraActive = true;

      // Get rear camera if available
      let deviceId;
      try {
        const devices = await window.ZXing.BrowserMultiFormatReader.listVideoInputDevices();
        deviceId = devices.length > 1 ? devices[1].deviceId : devices[0]?.deviceId;
      } catch(_) { deviceId = undefined; }

      reader.decodeFromVideoDevice(deviceId, dom.cameraVideo, (result, err) => {
        if (result) {
          const text = typeof result.getText === 'function' ? result.getText() : String(result.text || result);
          const fmt  = typeof result.getBarcodeFormat === 'function' ? result.getBarcodeFormat() : 'Unknown';
          const meta = fmtMeta(fmt);
          dom.camChip.classList.remove('hidden');
          dom.camChip.innerHTML = `<i class="${meta.icon}"></i> <strong>${meta.label}</strong>: ${text.substring(0, 55)}${text.length > 55 ? '…' : ''}`;
          onDecodeSuccess(result);
        }
        // Errors in continuous mode are normal (no barcode visible) – ignore
      });
    } catch (err) {
      showError('Camera error: ' + (err?.message || String(err)));
      stopCamera();
    }
  }

  function stopCamera() {
    if (DS.codeReader) {
      try { DS.codeReader.reset(); } catch (_) {}
      DS.codeReader = null;
    }
    DS.cameraActive = false;
    dom.cameraVideo.classList.add('hidden');
    dom.cameraPlaceholder.classList.remove('hidden');
    dom.startCamBtn.classList.remove('hidden');
    dom.stopCamBtn.classList.add('hidden');
    dom.camOverlay.classList.add('hidden');
    dom.camChip.classList.add('hidden');
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────
  function showLoading(on, msg) {
    if (dom.spinner) {
      dom.spinner.style.display = on ? 'flex' : 'none';
      if (on && msg) {
        dom.spinner.innerHTML = `<span class="spinner-ring"></span> ${msg}`;
      } else if (on) {
        dom.spinner.innerHTML = `<span class="spinner-ring"></span> Decoding…`;
      }
    }
  }

  function clearResult() {
    dom.resultPanel.classList.add('hidden');
    dom.resultEmpty.classList.remove('hidden');
    dom.decodeError.classList.add('hidden');
  }

  let currentImageDataUrl = null;

  function showError(msg) {
    dom.decodeError.textContent = msg;
    dom.decodeError.classList.remove('hidden');
    dom.resultPanel.classList.add('hidden');
    dom.resultEmpty.classList.add('hidden');
    showLoading(false);
  }

  function showErrorWithAiOption(msg) {
    dom.decodeError.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px;">
          <i class="ri-error-warning-line" style="font-size:18px;color:#ef4444"></i>
          <span>${msg}</span>
        </div>
        <button id="errorAiScanTriggerBtn" class="btn btn-sm btn-primary" style="background:#f59e0b;border-color:#d97706;font-size:12px;padding:4px 12px;">
          <i class="ri-sparkling-fill"></i> Run AI Deep Scan
        </button>
      </div>
    `;
    dom.decodeError.classList.remove('hidden');
    dom.resultPanel.classList.add('hidden');
    dom.resultEmpty.classList.add('hidden');
    showLoading(false);

    document.getElementById('errorAiScanTriggerBtn')?.addEventListener('click', () => {
      openAiModal();
    });
  }

  // ── AI Vision Scanner (Google Gemini Flash Multimodal) ──────────────────────
  function openAiModal() {
    if (!dom.aiModal) return;
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    if (dom.apiKeyInput) dom.apiKeyInput.value = savedKey;
    dom.aiModal.classList.remove('hidden');
    if (dom.aiError) dom.aiError.classList.add('hidden');
    if (dom.aiProgress) dom.aiProgress.classList.add('hidden');
  }

  function closeAiModal() {
    if (!dom.aiModal) return;
    dom.aiModal.classList.add('hidden');
  }

  async function runGeminiAiScan() {
    const key = (dom.apiKeyInput?.value || '').trim();
    if (!key) {
      if (dom.aiError) {
        dom.aiError.textContent = 'Please paste a free Google Gemini API key to run AI Vision.';
        dom.aiError.classList.remove('hidden');
      }
      return;
    }

    if (!currentImageDataUrl) {
      if (dom.aiError) {
        dom.aiError.textContent = 'Please upload a screenshot or image first.';
        dom.aiError.classList.remove('hidden');
      }
      return;
    }

    localStorage.setItem('gemini_api_key', key);

    if (dom.aiError) dom.aiError.classList.add('hidden');
    if (dom.aiProgress) dom.aiProgress.classList.remove('hidden');
    if (dom.runAiScanBtn) dom.runAiScanBtn.disabled = true;

    try {
      const matches = currentImageDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) throw new Error('Invalid image data URL format.');
      const mimeType = matches[1];
      const base64Data = matches[2];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
      const payload = {
        contents: [
          {
            parts: [
              {
                text: "You are a specialized AAMVA PDF417 Driver License and Barcode decoder. Inspect this image, screenshot, or ID card. Find the PDF417 barcode or QR code. Extract the raw encoded payload text verbatim. If this is a driver's license (AAMVA), output the complete raw string starting with @ and ANSI with all field codes (DCS, DAC, DAD, DBB, DBA, DAG, DAI, DAJ, DAK, DAQ, etc.). Output ONLY the raw barcode text. Do not add markdown formatting, quotes, or conversational explanations."
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || `API error: ${response.status}`);
      }

      const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!textOutput) {
        throw new Error('AI Vision could not extract text from this image.');
      }

      closeAiModal();

      const isAamva = textOutput.includes('@') && (textOutput.includes('ANSI') || textOutput.includes('AAMVA'));
      const format = isAamva ? 'PDF_417' : 'UNKNOWN';

      onDecodeSuccess({
        getText: () => textOutput,
        getBarcodeFormat: () => format,
        text: textOutput,
        format,
        _enhancement: 'Gemini AI Vision'
      });
    } catch (err) {
      if (dom.aiError) {
        dom.aiError.textContent = 'AI Scan failed: ' + (err?.message || String(err));
        dom.aiError.classList.remove('hidden');
      }
    } finally {
      if (dom.aiProgress) dom.aiProgress.classList.add('hidden');
      if (dom.runAiScanBtn) dom.runAiScanBtn.disabled = false;
    }
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="ri-check-line"></i> Copied!';
      setTimeout(() => { btn.innerHTML = orig; }, 1800);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  }

  // ── History ────────────────────────────────────────────────────────────────
  function renderHistory() {
    if (!dom.histList) return;
    if (!DS.history.length) {
      dom.histList.innerHTML = '<p class="decode-hist-empty">No scans yet.</p>';
      return;
    }
    dom.histList.innerHTML = DS.history.map((item, i) => `
      <div class="decode-hist-item" data-i="${i}">
        <div class="decode-hist-label"><i class="ri-barcode-line"></i> ${item.format}</div>
        <div class="decode-hist-text">${item.text.substring(0, 80)}${item.text.length > 80 ? '…' : ''}</div>
        <div class="decode-hist-ts">${item.ts}</div>
      </div>`).join('');

    dom.histList.querySelectorAll('.decode-hist-item').forEach(el => {
      el.addEventListener('click', () => {
        const item = DS.history[+el.dataset.i];
        if (item) showResult(item.text, fmtMeta(item.format), tryParseAamva(item.text), item.enhancement);
      });
    });
  }

  // ── Drag-and-drop & File loading ───────────────────────────────────────────
  function setupDrop(zone) {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) loadFile(file);
    });
  }

  function loadFile(file) {
    const fr = new FileReader();
    fr.onload = e => {
      currentImageDataUrl = e.target.result;
      dom.previewImg.src = e.target.result;
      dom.previewWrap?.classList.remove('hidden');
      dom.dropPlaceholder?.classList.add('hidden');
      if (dom.overlayCanvas) {
        const ctx = dom.overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, dom.overlayCanvas.width, dom.overlayCanvas.height);
      }
      decodeFromImage(e.target.result);
    };
    fr.readAsDataURL(file);
  }

  // ── Clipboard paste ────────────────────────────────────────────────────────
  function setupPaste() {
    document.addEventListener('paste', e => {
      const tab = document.getElementById('tab-decoder');
      if (!tab || tab.classList.contains('hidden')) return;
      const items = e.clipboardData?.items || [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) { loadFile(f); break; }
        }
      }
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function initDecoder() {
    dom = {
      uploadZone:      document.getElementById('decodeUploadZone'),
      fileInput:       document.getElementById('decodeFileInput'),
      dropPlaceholder: document.getElementById('decodeUploadPlaceholder'),
      previewWrap:     document.getElementById('decodePreviewWrap'),
      previewImg:      document.getElementById('decodePreviewImg'),
      overlayCanvas:   document.getElementById('decodeOverlayCanvas'),
      clearImgBtn:     document.getElementById('decodeClearImageBtn'),
      aiScanBtn:       document.getElementById('decodeAiScanBtn'),

      aiModal:         document.getElementById('aiVisionModal'),
      closeAiModalBtn: document.getElementById('closeAiModalBtn'),
      cancelAiModalBtn:document.getElementById('cancelAiModalBtn'),
      runAiScanBtn:    document.getElementById('runAiScanBtn'),
      apiKeyInput:     document.getElementById('geminiApiKeyInput'),
      aiProgress:      document.getElementById('aiScanProgress'),
      aiError:         document.getElementById('aiScanError'),

      cameraPlaceholder: document.getElementById('decodeCameraPlaceholder'),
      cameraVideo:       document.getElementById('decodeCameraPreview'),
      startCamBtn:       document.getElementById('decodeStartCameraBtn'),
      stopCamBtn:        document.getElementById('decodeStopCameraBtn'),
      camOverlay:        document.getElementById('decodeCameraScanOverlay'),
      camChip:           document.getElementById('decodeCameraResultChip'),

      spinner:           document.getElementById('decodeLoadingSpinner'),
      decodeError:       document.getElementById('decodeError'),
      resultEmpty:       document.getElementById('decodeResultEmpty'),
      resultPanel:       document.getElementById('decodeResultPanel'),
      resultFormatBadge: document.getElementById('decodeFormatBadge'),
      enhanceBadge:      document.getElementById('decodeEnhanceBadge'),
      resultText:        document.getElementById('decodeResultText'),
      resultCharCount:   document.getElementById('decodeCharCount'),
      resultTypeChip:    document.getElementById('decodeTypeChip'),
      resultLink:        document.getElementById('decodeResultLink'),
      copyRawBtn:        document.getElementById('decodeCopyRawBtn'),
      aamvaSection:      document.getElementById('decodeAamvaSection'),
      aamvaGrid:         document.getElementById('decodeAamvaGrid'),

      histList:          document.getElementById('decodeHistoryList'),
      clearHistBtn:      document.getElementById('clearDecodeHistBtn'),
    };

    if (!dom.uploadZone) return;

    // File picker change listener (native label for="decodeFileInput" handles clicks)
    dom.fileInput?.addEventListener('change', e => {
      const f = e.target.files[0];
      if (f) loadFile(f);
      e.target.value = '';
    });

    // Clear image
    dom.clearImgBtn?.addEventListener('click', () => {
      currentImageDataUrl = null;
      dom.previewImg.src = '';
      dom.previewWrap?.classList.add('hidden');
      dom.dropPlaceholder?.classList.remove('hidden');
      if (dom.overlayCanvas) {
        const ctx = dom.overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, dom.overlayCanvas.width, dom.overlayCanvas.height);
      }
      clearResult();
      dom.fileInput.value = '';
    });

    // AI Vision Assist Modal
    dom.aiScanBtn?.addEventListener('click', openAiModal);
    dom.closeAiModalBtn?.addEventListener('click', closeAiModal);
    dom.cancelAiModalBtn?.addEventListener('click', closeAiModal);
    dom.runAiScanBtn?.addEventListener('click', runGeminiAiScan);

    setupDrop(dom.uploadZone);
    setupPaste();

    // Camera
    dom.startCamBtn?.addEventListener('click', startCamera);
    dom.stopCamBtn?.addEventListener('click', stopCamera);

    // Copy
    dom.copyRawBtn?.addEventListener('click', () => {
      if (DS.lastResult) copyText(DS.lastResult.text, dom.copyRawBtn);
    });

    // Clear history
    dom.clearHistBtn?.addEventListener('click', () => {
      DS.history = [];
      renderHistory();
    });

    renderHistory();
  }

  window.initDecoder = initDecoder;
})();
