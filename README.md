# VibeCode Studio - Professional Barcode, QR & AAMVA DL Suite

A studio-grade, high-performance Barcode, QR Code, and Driver License PDF417 Generator software built with **`bwip-js`**. VibeCode Studio supports over **100+ barcode symbologies**, offering real-time canvas preview, customizable sizing/colors/margins, ISO contrast scannability checking, AAMVA Driver License builder (pdf417.pro style), preset templates, batch generation, print sheet layout, SVG/PNG export, and saved history.

---

## 🌟 Key Features

- **AAMVA Driver License (DL) PDF417 Studio (pdf417.pro Style)**:
  - 50 US States + DC + Canadian Provinces IIN presets.
  - AAMVA v08 / v09 / v10 specification compliance.
  - Structured forms for Personal Details, License Metadata, Real ID Compliance, and Residence Address.
  - Live graphic Driver License card visualizer with Real ID Gold Star badge.
  - Raw AAMVA byte inspector (`@\n\x1e\rANSI...`) and built-in DL barcode decoder/parser.
- **100+ Symbologies Supported**:
  - **1D Linear**: Code 128, Code 39, Code 93, Codabar, ITF-14, Interleaved 2 of 5, Pharmacode, MSI Plessey, etc.
  - **2D Matrix**: QR Code, Micro QR, Data Matrix, GS1 DataMatrix, PDF417, MicroPDF417, Aztec Code, DotCode, Han Xin Code, MaxiCode.
  - **Retail & EAN/UPC**: EAN-13, EAN-8, UPC-A, UPC-E, ISBN, ISSN, GS1-128, GS1 DataBar.
  - **Postal Barcodes**: USPS Intelligent Mail, POSTNET, PLANET, Royal Mail (RM4SCC), Dutch KIX, Japan Post, Australia Post.
- **Real-Time Live Canvas & SVG Rendering**: Instant live preview powered by `bwip-js`.
- **Scannability & Contrast Health Checker**: Real-time calculation of contrast ratio based on ISO optical scanner standards with visual warnings for low-contrast color combinations.
- **Preset Builders**: WiFi Access QR, vCard Contact QR, Website Link QR, EAN-13 Product Tag with Checksum Calculator, Logistics GS1-128 shipping labels.
- **Batch Generator**: Process multi-line payloads or CSV files into dozens of barcodes with live grid preview.
- **Print Label Sheet Generator**: Grid configuration for A4 / Letter sticker sheets with custom columns, rows, and repeat counts.
- **Vector & High-Res Exports**: Download crisp high-DPI PNGs, lossless SVGs, copy image/SVG directly to clipboard.
- **History & Presets**: Persistent `localStorage` history for instant reload and re-export.

---

## 🚀 Quick Start Guide

### Run via Local Server (Express)
```bash
# Navigate to the BWIP directory
cd BWIP

# Start local server
npm start
```
Open **`http://localhost:3000`** in your web browser.

---

## 📁 Project Structure

```
BWIP/
├── index.html            # Main Single-Page Application interface
├── styles.css            # Design system, themes, glassmorphic UI & print styles
├── server.js             # Express static launcher server
├── package.json          # Node dependencies (bwip-js, express)
└── js/
    ├── barcode-types.js  # Catalog of 100+ symbologies with metadata & rules
    ├── aamva-dl.js       # AAMVA Driver License PDF417 format encoder & parser
    ├── app.js            # Core application logic, rendering, presets & exports
    └── vendor/
        └── bwip-js-min.js# Offline bwip-js script bundle
```
