/**
 * Catalog of supported bwip-js barcode symbologies with metadata,
 * categories, sample inputs, and character set rules.
 */

const BARCODE_TYPES = [
  // --- 2D & MATRIX BARCODES ---
  {
    id: 'qrcode',
    name: 'QR Code',
    category: '2d',
    desc: 'High-density 2D matrix code widely used for URLs, contact cards, WiFi credentials, payments, and general data.',
    sample: 'https://example.com/product/12345',
    placeholder: 'Enter website URL, text, or payment link...',
    rules: 'Supports full UTF-8, binary, numeric, and alphanumeric data up to ~7,000 characters.',
    presetType: 'url'
  },
  {
    id: 'datamatrix',
    name: 'Data Matrix',
    category: '2d',
    desc: 'Compact 2D matrix barcode popular in electronics manufacturing, aerospace, healthcare, and small component tagging.',
    sample: 'ID:9876543210-BATCH:A45',
    placeholder: 'Enter part number or serial data...',
    rules: 'High density, small footprint. Supports full ASCII text and binary.',
    presetType: 'text'
  },
  {
    id: 'pdf417',
    name: 'PDF417 Stacked',
    category: '2d',
    desc: 'Stacked linear 2D barcode standard for government IDs, driver licenses, boarding passes, and logistics shipping labels.',
    sample: 'ANSI 636000080002DL00390234DLDAQD12345678',
    placeholder: 'Enter identification or shipping manifest payload...',
    rules: 'Encodes large amounts of text, numbers, and binary data with built-in error correction.',
    presetType: 'text'
  },
  {
    id: 'azteccode',
    name: 'Aztec Code',
    category: '2d',
    desc: 'Square matrix 2D code with central bullseye target. Used extensively in railway e-ticketing and airline boarding passes.',
    sample: 'TICKET#98765-SEAT14B-EXPRESS',
    placeholder: 'Enter ticket or transit code...',
    rules: 'No quiet zone required around barcode. Supports full ASCII & binary.',
    presetType: 'text'
  },
  {
    id: 'microqrcode',
    name: 'Micro QR Code',
    category: '2d',
    desc: 'Ultra-compact variant of QR Code for tiny surface area applications like PCB components.',
    sample: 'ITEM-9941',
    placeholder: 'Enter short text or number...',
    rules: 'Max 35 numeral digits or 21 alphanumeric characters.',
    presetType: 'text'
  },
  {
    id: 'gs1datamatrix',
    name: 'GS1 DataMatrix',
    category: '2d',
    desc: 'GS1-standardized Data Matrix for pharmaceutical healthcare products and medical devices (UDI).',
    sample: '(01)00312345678906(17)251231(10)LOT1234',
    placeholder: '(01)GTIN(17)EXP(10)LOT...',
    rules: 'Must use standard GS1 Application Identifiers in parentheses.',
    presetType: 'gs1'
  },
  {
    id: 'micropdf417',
    name: 'MicroPDF417',
    category: '2d',
    desc: 'Truncated PDF417 variant designed for tight spaces.',
    sample: 'MICRO-550912',
    placeholder: 'Enter short text payload...',
    rules: 'Compact stacked format.',
    presetType: 'text'
  },
  {
    id: 'dotcode',
    name: 'DotCode (2D)',
    category: '2d',
    desc: '2D matrix composed of disconnected dots, optimized for high-speed industrial inkjet printing (tobacco & beverage).',
    sample: 'DOT-883019284',
    placeholder: 'Enter serial number...',
    rules: 'Supports high speed on-line product serialization.',
    presetType: 'text'
  },
  {
    id: 'hanxin',
    name: 'Han Xin Code',
    category: '2d',
    desc: 'Chinese national standard 2D barcode optimized for encoding Chinese characters and GB18030 text.',
    sample: 'CHN-99482710',
    placeholder: 'Enter text payload...',
    rules: 'Optimized for Chinese character sets and binary data.',
    presetType: 'text'
  },
  {
    id: 'maxicode',
    name: 'MaxiCode (2D)',
    category: '2d',
    desc: 'Fixed-size 2D matrix code featuring hexagonal grid and central bullseye, created by UPS for parcel sortation.',
    sample: '010080123456789012',
    placeholder: 'Enter package routing payload...',
    rules: 'Requires specific formatted parcel tracking string.',
    presetType: 'text'
  },

  // --- RETAIL & PRODUCT BARCODES ---
  {
    id: 'ean13',
    name: 'EAN-13 (GTIN-13)',
    category: 'retail',
    desc: 'Standard 13-digit barcode used internationally for consumer retail products at point-of-sale (POS).',
    sample: '5901234123457',
    placeholder: 'Enter 12 or 13 digits (e.g. 5901234123457)',
    rules: 'Requires 12 digits (13th checksum auto-computed if omitted) or exact 13 valid digits.',
    presetType: 'ean'
  },
  {
    id: 'upca',
    name: 'UPC-A (GTIN-12)',
    category: 'retail',
    desc: 'Standard 12-digit barcode dominant in North American retail markets for point-of-sale checkout.',
    sample: '012345678905',
    placeholder: 'Enter 11 or 12 digits (e.g. 012345678905)',
    rules: 'Requires 11 digits (12th checksum auto-computed) or exact 12 digits.',
    presetType: 'ean'
  },
  {
    id: 'ean8',
    name: 'EAN-8',
    category: 'retail',
    desc: 'Compact 8-digit retail barcode for small products where an EAN-13 barcode would take too much package space.',
    sample: '96385074',
    placeholder: 'Enter 7 or 8 digits (e.g. 96385074)',
    rules: 'Requires 7 numeric digits (8th checksum auto-computed) or exact 8 digits.',
    presetType: 'ean'
  },
  {
    id: 'upce',
    name: 'UPC-E',
    category: 'retail',
    desc: 'Zero-suppressed compact version of UPC-A for small retail items in North America.',
    sample: '01234565',
    placeholder: 'Enter 6, 7, or 8 digits starting with 0...',
    rules: 'Suppresses zeros from UPC-A. 6 to 8 digits.',
    presetType: 'ean'
  },
  {
    id: 'isbn',
    name: 'ISBN (Book Barcode)',
    category: 'retail',
    desc: 'International Standard Book Number barcode based on EAN-13 (prefixed with 978 or 979).',
    sample: '9783161484100',
    placeholder: 'Enter 13-digit ISBN (e.g. 9783161484100)',
    rules: 'Must start with 978 or 979 followed by book identifier digits.',
    presetType: 'ean'
  },
  {
    id: 'issn',
    name: 'ISSN (Periodicals)',
    category: 'retail',
    desc: 'International Standard Serial Number barcode for magazines, journals, and newspapers.',
    sample: '9772049363002',
    placeholder: 'Enter 13-digit ISSN (e.g. 9772049363002)',
    rules: 'Usually starts with 977 for serial publications.',
    presetType: 'ean'
  },
  {
    id: 'gs1-128',
    name: 'GS1-128 (UCC/EAN-128)',
    category: 'retail',
    desc: 'Standardized logistic barcode for global supply chains using Application Identifiers (AIs) for batch, exp, weight.',
    sample: '(01)00312345678906(10)BATCH99(17)261231',
    placeholder: '(01)GTIN(10)BATCH(17)YYMMDD',
    rules: 'Format data with GS1 Application Identifiers in parentheses.',
    presetType: 'gs1'
  },
  {
    id: 'itf14',
    name: 'ITF-14 (Carton / Master Case)',
    category: 'retail',
    desc: '14-digit GS1 barcode printed with heavy bearer bars, used on outer corrugated shipping cartons and master cases.',
    sample: '10012345678902',
    placeholder: 'Enter 13 or 14 digits (e.g. 10012345678902)',
    rules: 'Numeric only. Exactly 13 or 14 digits. Renders heavy surrounding frame.',
    presetType: 'ean'
  },
  {
    id: 'databaromni',
    name: 'GS1 DataBar Omnidirectional',
    category: 'retail',
    desc: 'Compact barcode for fresh produce labeling (loose fruit/veg) and small coupons.',
    sample: '00012345678905',
    placeholder: 'Enter 14-digit GTIN...',
    rules: 'Encodes 14 digits in a small footprint.',
    presetType: 'ean'
  },
  {
    id: 'databarexpanded',
    name: 'GS1 DataBar Expanded',
    category: 'retail',
    desc: 'Encodes GTIN plus additional attributes like weight, price, expiration date for variable measure items.',
    sample: '(01)90614141000015(3103)000500',
    placeholder: '(01)GTIN(3103)WEIGHT...',
    rules: 'Supports GS1 Application Identifiers.',
    presetType: 'gs1'
  },

  // --- 1D COMMON & INDUSTRIAL BARCODES ---
  {
    id: 'code128',
    name: 'Code 128 (High Density)',
    category: '1d',
    desc: 'Very popular high-density linear barcode supporting all 128 ASCII characters. Ideal for shipping, inventory, and asset tags.',
    sample: 'INV-2026-99481-B',
    placeholder: 'Enter any text, serial, or numbers...',
    rules: 'Supports all ASCII letters, numbers, and punctuation.',
    presetType: 'text'
  },
  {
    id: 'code39',
    name: 'Code 39 (USD-3)',
    category: '1d',
    desc: 'Variable length linear barcode widely used in automotive, defense, healthcare, and inventory systems.',
    sample: 'PART-A9942',
    placeholder: 'Enter uppercase letters, digits, and - . $ / + % space',
    rules: 'Supports UPPERCASE A-Z, 0-9, space, and symbols (- . $ / + %).',
    presetType: 'text'
  },
  {
    id: 'code39ext',
    name: 'Code 39 Extended',
    category: '1d',
    desc: 'Extension of Code 39 that encodes full 128 ASCII character set using two-character combinations.',
    sample: 'part_#9942/rev-b',
    placeholder: 'Enter any ASCII character string...',
    rules: 'Encodes full ASCII set including lowercase letters.',
    presetType: 'text'
  },
  {
    id: 'code93',
    name: 'Code 93',
    category: '1d',
    desc: 'More compact alternative to Code 39 providing higher data density and double check digits for reliability.',
    sample: 'PKG99428-C',
    placeholder: 'Enter uppercase text and digits...',
    rules: 'Supports A-Z, 0-9, space, and symbols.',
    presetType: 'text'
  },
  {
    id: 'code93ext',
    name: 'Code 93 Extended',
    category: '1d',
    desc: 'Full ASCII variant of Code 93.',
    sample: 'pkg_99428-c',
    placeholder: 'Enter full ASCII string...',
    rules: 'Full 128 ASCII character support.',
    presetType: 'text'
  },
  {
    id: 'codabar',
    name: 'Codabar (NW-7)',
    category: '1d',
    desc: 'Traditional numeric barcode used in blood banks, photo labs, libraries, and FedEx airbills.',
    sample: 'A123456789B',
    placeholder: 'Start and end with A, B, C, or D; digits inside (e.g. A12345B)',
    rules: 'Start & stop characters must be A, B, C, or D. Middle payload consists of digits 0-9 and - $: / + .',
    presetType: 'text'
  },
  {
    id: 'interleaved2of5',
    name: 'Interleaved 2 of 5 (ITF)',
    category: '1d',
    desc: 'Continuous two-width numeric barcode encoding pairs of digits. Commonly used on warehouse cartons and film processing.',
    sample: '9948271038',
    placeholder: 'Enter even number of numeric digits (e.g. 123456)',
    rules: 'NUMERIC ONLY. Data length MUST be an EVEN number of digits.',
    presetType: 'text'
  },
  {
    id: 'pharmacode',
    name: 'Pharmacode (One-Track)',
    category: '1d',
    desc: 'Pharmaceutical binary barcode used in packaging control to prevent mispackaging errors.',
    sample: '123456',
    placeholder: 'Enter number from 3 to 131070 (e.g. 123456)',
    rules: 'Numeric value between 3 and 131070.',
    presetType: 'text'
  },
  {
    id: 'pharmacode2',
    name: 'Pharmacode (Two-Track)',
    category: '1d',
    desc: 'Two-track variation of Pharmacode for small medicine packaging.',
    sample: '654321',
    placeholder: 'Enter number from 4 to 645700815...',
    rules: 'Two-track pharmaceutical binary code.',
    presetType: 'text'
  },
  {
    id: 'msi',
    name: 'MSI Plessey',
    category: '1d',
    desc: 'Numeric barcode primarily used for retail shelf marking, stock control, and warehouse inventory in USA.',
    sample: '99482710',
    placeholder: 'Enter numeric digits (e.g. 99482710)',
    rules: 'Numeric digits only 0-9.',
    presetType: 'text'
  },
  {
    id: 'code11',
    name: 'Code 11 (USD-8)',
    category: '1d',
    desc: 'High-density numeric barcode developed for telecommunication equipment labeling.',
    sample: '123-456-789',
    placeholder: 'Enter numbers and hyphen (e.g. 123-456)',
    rules: 'Digits 0-9 and hyphen (-).',
    presetType: 'text'
  },

  // --- POSTAL BARCODES ---
  {
    id: 'uspsintelligentmail',
    name: 'USPS Intelligent Mail (IMb)',
    category: 'postal',
    desc: '4-State postal barcode used by the United States Postal Service for mail tracking and automation sorting.',
    sample: '0123456709498765432101234567890',
    placeholder: 'Enter 20, 25, 29, or 31 digits...',
    rules: 'Encodes Routing ZIP, Mailer ID, Service Type ID, and Serial Number.',
    presetType: 'text'
  },
  {
    id: 'postnet',
    name: 'USPS POSTNET',
    category: 'postal',
    desc: 'Legacy 2-State postal height barcode used by USPS for automated mail delivery sorting.',
    sample: '902101431',
    placeholder: 'Enter 5, 9, or 11 numeric digits (e.g. 90210)',
    rules: 'Numeric ZIP code digits.',
    presetType: 'text'
  },
  {
    id: 'planet',
    name: 'USPS PLANET',
    category: 'postal',
    desc: 'Legacy USPS mail tracking barcode used alongside POSTNET.',
    sample: '401234567891',
    placeholder: 'Enter 11 or 13 digits...',
    rules: 'Numeric mail tracking digits.',
    presetType: 'text'
  },
  {
    id: 'royalmail',
    name: 'Royal Mail (RM4SCC / Mailmark)',
    category: 'postal',
    desc: 'UK Royal Mail 4-State Customer Code used for automated mail sorting across Great Britain.',
    sample: 'SN34RD1A',
    placeholder: 'Enter UK postcode & delivery point (e.g. SN34RD1A)',
    rules: 'Alphanumeric UK Postcode payload.',
    presetType: 'text'
  },
  {
    id: 'kix',
    name: 'Dutch KIX Code (Klantindex)',
    category: 'postal',
    desc: 'Dutch Post (PostNL) postal barcode for addressing and mail sorting in Netherlands.',
    sample: '1234AB12X34',
    placeholder: 'Enter Dutch postcode & house number...',
    rules: 'Alphanumeric Dutch postal data.',
    presetType: 'text'
  },
  {
    id: 'japanpost',
    name: 'Japan Post Barcode',
    category: 'postal',
    desc: '4-State customer barcode system used by Japan Post.',
    sample: '10000152-4-10',
    placeholder: 'Enter Japanese postal code payload...',
    rules: 'Japanese zip code & address number digits.',
    presetType: 'text'
  },
  {
    id: 'auspost',
    name: 'Australia Post Barcode',
    category: 'postal',
    desc: '4-State barcode used by Australia Post for domestic letter delivery sorting.',
    sample: '1139184756',
    placeholder: 'Enter Delivery Point ID digits...',
    rules: '8-digit DPID or customer format.',
    presetType: 'text'
  }
];

// Helper functions to query barcode types
function getBarcodeTypeById(id) {
  return BARCODE_TYPES.find(b => b.id === id) || BARCODE_TYPES[0];
}

function getBarcodeCategories() {
  return [
    { id: 'all', name: 'All Symbologies (30+)' },
    { id: '2d', name: '2D & Matrix (QR, Data Matrix, PDF417)' },
    { id: 'retail', name: 'Retail & POS (EAN, UPC, ISBN, GS1)' },
    { id: '1d', name: '1D Linear (Code 128, Code 39, ITF)' },
    { id: 'postal', name: 'Postal & Mail Tracking' }
  ];
}
